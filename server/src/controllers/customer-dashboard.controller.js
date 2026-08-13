const { pool } = require("../config/database");

const productFields = `p.id,p.product_name AS productName,p.brand,p.description,p.availability,
  c.name AS categoryName,COALESCE(sp.company_name,'Seller') AS sellerCompany,
  CASE WHEN co.id IS NULL THEN NULL ELSE CONCAT('/companies/',co.id,'/logo') END AS companyLogoUrl,
  (SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,sort_order LIMIT 1) AS imageUrl`;

exports.get = async (req, res) => {
  const customerId = req.user.id;
  const [views, quotations, featured, profile, stats] = await Promise.all([
    pool.execute(`SELECT ${productFields},v.view_count AS viewCount,v.last_viewed_at AS occurredAt
      FROM customer_product_views v JOIN products p ON p.id=v.product_id JOIN categories c ON c.id=p.category_id
      LEFT JOIN seller_profiles sp ON sp.user_id=p.seller_id LEFT JOIN seller_settings ss ON ss.seller_id=p.seller_id LEFT JOIN companies co ON co.id=p.company_id
      WHERE v.customer_id=? AND p.status='active' AND COALESCE(ss.show_products,TRUE)=TRUE ORDER BY v.last_viewed_at DESC`, [customerId]),
    pool.execute(`SELECT q.id,q.product_id AS productId,q.product_name_snapshot AS productName,q.seller_company_snapshot AS sellerCompany,
      q.quotation_number AS quotationNumber,q.status,q.created_at AS occurredAt
      FROM quotation_requests q WHERE q.customer_id=? ORDER BY q.created_at DESC`, [customerId]),
    pool.execute(`SELECT ${productFields},COUNT(q.id) AS quotationCount
      FROM products p JOIN categories c ON c.id=p.category_id JOIN quotation_requests q ON q.product_id=p.id
      LEFT JOIN seller_profiles sp ON sp.user_id=p.seller_id LEFT JOIN seller_settings ss ON ss.seller_id=p.seller_id LEFT JOIN companies co ON co.id=p.company_id
      WHERE p.status='active' AND COALESCE(ss.show_products,TRUE)=TRUE
      GROUP BY p.id,p.product_name,p.brand,p.description,p.availability,c.name,sp.company_name,co.id
      ORDER BY quotationCount DESC,p.views DESC,p.created_at DESC LIMIT 8`),
    pool.execute(`SELECT u.name,u.status,u.created_at AS memberSince,cp.customer_id AS customerCode,cp.profile_completion AS profileCompletion
      FROM users u LEFT JOIN customer_profiles cp ON cp.user_id=u.id WHERE u.id=? LIMIT 1`, [customerId]),
    pool.execute(`SELECT
      (SELECT COALESCE(SUM(view_count),0) FROM customer_product_views WHERE customer_id=?) AS productsViewed,
      (SELECT COUNT(*) FROM wishlists WHERE customer_id=?) AS favoriteProducts,
      (SELECT COUNT(*) FROM quotation_requests WHERE customer_id=? AND status='pending') AS pendingQuotations,
      (SELECT COUNT(*) FROM notifications WHERE user_id=? AND read_at IS NULL) AS unreadNotifications,
      (SELECT COUNT(*) FROM quotation_requests WHERE customer_id=?) AS totalQuotations`, [customerId,customerId,customerId,customerId,customerId])
  ]);
  const activity = [
    ...views[0].map(item => ({...item,type:"view"})),
    ...quotations[0].map(item => ({...item,type:"quotation"}))
  ].sort((a,b) => new Date(b.occurredAt)-new Date(a.occurredAt));
  const counts=stats[0][0]||{};
  res.json({
    customer:profile[0][0]||null,
    stats:Object.fromEntries(Object.entries(counts).map(([key,value])=>[key,Number(value||0)])),
    activity,
    featuredProducts:featured[0].map(item=>({...item,quotationCount:Number(item.quotationCount)}))
  });
};
