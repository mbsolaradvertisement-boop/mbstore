const {pool}=require("../config/database");
const ApiError=require("../utils/api-error");

const DATE=/^\d{4}-\d{2}-\d{2}$/;
function range(query){
  const now=new Date(),month=`${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`;
  const from=String(query.from||`${month}-01`),to=String(query.to||now.toISOString().slice(0,10));
  if(!DATE.test(from)||!DATE.test(to)||from>to)throw new ApiError(400,"Select a valid dashboard date range.","INVALID_DASHBOARD_RANGE");
  const fromDate=new Date(`${from}T00:00:00Z`),toDate=new Date(`${to}T00:00:00Z`),days=Math.floor((toDate-fromDate)/86400000)+1;
  if(days<1||days>366)throw new ApiError(400,"Dashboard range must be between 1 and 366 days.","INVALID_DASHBOARD_RANGE");
  return{from,to,toExclusive:new Date(toDate.getTime()+86400000).toISOString().slice(0,10),fromDate,toDate,days};
}
function fill(rows,r,grouping,keys){
  const map=new Map(rows.map(row=>[row.bucket,row])),result=[],cursor=new Date(r.fromDate);
  while(cursor<=r.toDate){
    const iso=cursor.toISOString().slice(0,10),bucket=grouping==="month"?iso.slice(0,7):iso;
    const label=new Intl.DateTimeFormat("en-IN",grouping==="month"?{month:"short",year:"2-digit",timeZone:"UTC"}:{day:"numeric",month:"short",timeZone:"UTC"}).format(cursor),row=map.get(bucket)||{};
    result.push({label,...Object.fromEntries(keys.map(key=>[key,Number(row[key]||0)]))});
    grouping==="month"?cursor.setUTCMonth(cursor.getUTCMonth()+1,1):cursor.setUTCDate(cursor.getUTCDate()+1);
  }
  return result;
}

exports.get=async(req,res)=>{
  const r=range(req.query),grouping=req.query.grouping==="month"||r.days>62?"month":"day",bucket=grouping==="month"?"DATE_FORMAT(q.created_at,'%Y-%m')":"DATE_FORMAT(q.created_at,'%Y-%m-%d')",common=[req.user.id,r.from,r.toExclusive];
  const [graphResult,pipelineResult,activeResult,productsResult,locationsResult,recentResult]=await Promise.all([
    pool.execute(`SELECT ${bucket} bucket,COUNT(*) productRequests,COUNT(DISTINCT q.customer_id) customers,COUNT(qr.id) quotations FROM quotation_requests q LEFT JOIN quotation_responses qr ON qr.quotation_request_id=q.id WHERE q.seller_id=? AND q.created_at>=? AND q.created_at<? GROUP BY bucket ORDER BY bucket`,common),
    pool.execute(`SELECT COUNT(*) totalLeads,COUNT(*) enquiries,COUNT(qr.id) quotations,SUM(q.status='accepted') converted FROM quotation_requests q LEFT JOIN quotation_responses qr ON qr.quotation_request_id=q.id WHERE q.seller_id=? AND q.created_at>=? AND q.created_at<?`,common),
    pool.execute("SELECT COUNT(*) activeProducts FROM products WHERE seller_id=? AND status='active'",[req.user.id]),
    pool.execute(`SELECT p.id,p.product_name productName,c.name categoryName,p.brand,p.views,p.enquiries,p.status,(SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,sort_order LIMIT 1) imageUrl FROM products p JOIN categories c ON c.id=p.category_id WHERE p.seller_id=? AND p.status<>'deleted' ORDER BY p.enquiries DESC,p.views DESC,p.created_at DESC LIMIT 8`,[req.user.id]),
    pool.execute(`SELECT COALESCE(NULLIF(cp.district,''),NULLIF(cp.state,''),'Location unavailable') location,COUNT(*) total FROM quotation_requests q LEFT JOIN customer_profiles cp ON cp.user_id=q.customer_id WHERE q.seller_id=? AND q.created_at>=? AND q.created_at<? GROUP BY location ORDER BY total DESC,location LIMIT 20`,common),
    pool.execute(`SELECT q.id,q.quotation_number quotationNumber,u.name customer,q.product_name_snapshot product,q.quantity,q.status,q.created_at createdAt,COALESCE(NULLIF(cp.district,''),NULLIF(cp.state,''),'Location unavailable') location FROM quotation_requests q JOIN users u ON u.id=q.customer_id LEFT JOIN customer_profiles cp ON cp.user_id=q.customer_id WHERE q.seller_id=? AND q.created_at>=? AND q.created_at<? ORDER BY q.created_at DESC LIMIT 10`,common),
  ]);
  const pipeline=pipelineResult[0][0],total=Number(pipeline.totalLeads||0),converted=Number(pipeline.converted||0);
  res.json({updatedAt:new Date().toISOString(),filters:{from:r.from,to:r.to,grouping},graph:fill(graphResult[0],r,grouping,["customers","productRequests","quotations"]),pipeline:{totalLeads:total,enquiries:Number(pipeline.enquiries||0),quotations:Number(pipeline.quotations||0),converted,activeProducts:Number(activeResult[0][0].activeProducts||0),conversionRate:total?Number(((converted/total)*100).toFixed(1)):0},products:productsResult[0],locations:locationsResult[0].map(x=>({...x,total:Number(x.total)})),recentEnquiries:recentResult[0]});
};
