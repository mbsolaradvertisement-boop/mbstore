const { pool } = require("../config/database");

const integer = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
};

exports.list = async (req, res) => {
  const page = integer(req.query.page, 1, 100000), limit = integer(req.query.limit, 20), offset = (page - 1) * limit;
  const where = ["p.status='active'"], params = [];
  if (req.query.categoryId) { where.push("p.category_id=?"); params.push(integer(req.query.categoryId, 0, Number.MAX_SAFE_INTEGER)); }
  const requestedBrand=req.query.brand||req.query.company;
  if (requestedBrand) { const values=String(requestedBrand).split(",").map(v=>v.trim()).filter(Boolean); if(values.length){where.push(`p.brand IN (${values.map(()=>"?").join(",")})`);params.push(...values);} }
  if (req.query.search?.trim()) { const value=`%${req.query.search.trim()}%`; where.push("(p.product_name LIKE ? OR p.brand LIKE ? OR p.product_code LIKE ? OR c.name LIKE ? OR sp.company_name LIKE ?)"); params.push(value,value,value,value,value); }
  const reserved=new Set(["page","limit","categoryId","brand","company","search","sort"]);
  for(const [key, raw] of Object.entries(req.query)) if(!reserved.has(key) && /^[a-zA-Z0-9_]{1,80}$/.test(key)) {
    const values=String(raw).split(",").map(v=>v.trim()).filter(Boolean); if(!values.length)continue;
    where.push(`EXISTS (SELECT 1 FROM product_attributes pa WHERE pa.product_id=p.id AND pa.field_key=? AND pa.field_value IN (${values.map(()=>"?").join(",")}))`); params.push(key,...values);
  }
  const clause=where.join(" AND "), orders={newest:"p.created_at DESC",oldest:"p.created_at ASC",az:"p.product_name ASC",za:"p.product_name DESC"}, order=orders[req.query.sort]||orders.newest;
  const from="FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN seller_profiles sp ON sp.user_id=p.seller_id LEFT JOIN companies co ON co.id=p.company_id";
  const [[count]]=await pool.execute(`SELECT COUNT(*) total ${from} WHERE ${clause}`,params);
  const [rows]=await pool.execute(`SELECT p.id,p.product_code AS productCode,p.product_name AS productName,p.brand,p.description,c.id AS categoryId,c.name AS categoryName,COALESCE(sp.company_name,'Seller') AS sellerCompany,CASE WHEN co.id IS NULL THEN NULL ELSE CONCAT('/companies/',co.id,'/logo') END AS companyLogoUrl,(SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,sort_order LIMIT 1) AS imageUrl ${from} WHERE ${clause} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`,params);
  const ids=rows.map(row=>row.id); let attributes=[];
  if(ids.length)[attributes]=await pool.execute(`SELECT product_id AS productId,field_key AS fieldKey,field_label AS fieldLabel,field_value AS fieldValue FROM product_attributes WHERE product_id IN (${ids.map(()=>"?").join(",")}) ORDER BY id`,ids);
  const byProduct=new Map(); for(const attribute of attributes){if(!byProduct.has(attribute.productId))byProduct.set(attribute.productId,[]);byProduct.get(attribute.productId).push(attribute);}
  const total=Number(count.total);
  res.json({products:rows.map(row=>({...row,attributes:byProduct.get(row.id)||[]})),pagination:{currentPage:page,totalPages:Math.max(1,Math.ceil(total/limit)),totalProducts:total,limit}});
};

exports.filters = async (req,res) => {
  const params=[], filter=req.query.categoryId?" AND p.category_id=?":""; if(req.query.categoryId)params.push(integer(req.query.categoryId,0,Number.MAX_SAFE_INTEGER));
  const [categories]=await pool.execute("SELECT id,name,slug FROM categories WHERE status='active' ORDER BY name");
  const [companies]=await pool.execute(`SELECT DISTINCT co.id,co.company_name AS companyName,CONCAT('/companies/',co.id,'/logo') AS logoUrl FROM products p JOIN companies co ON co.id=p.company_id WHERE p.status='active'${filter} ORDER BY co.company_name`,params);
  const attributes=req.query.categoryId?(await pool.execute(`SELECT pa.field_key AS fieldKey,MAX(pa.field_label) AS fieldLabel,pa.field_value AS fieldValue FROM product_attributes pa JOIN products p ON p.id=pa.product_id WHERE p.status='active'${filter} GROUP BY pa.field_key,pa.field_value ORDER BY fieldLabel,fieldValue`,params))[0]:[];
  const grouped={}; for(const item of attributes){grouped[item.fieldKey]??={label:item.fieldLabel,values:[]};grouped[item.fieldKey].values.push(item.fieldValue);}
  res.json({categories,brands:companies,attributes:grouped});
};
