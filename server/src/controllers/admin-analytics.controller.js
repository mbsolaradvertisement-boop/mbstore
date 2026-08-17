const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const int = (value) => { const parsed = Number.parseInt(value, 10); return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null; };
const iso = (date) => date.toISOString().slice(0, 10);
const addDays = (date, amount) => { const result = new Date(date); result.setUTCDate(result.getUTCDate() + amount); return result; };

function dateRange(query) {
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const period = String(query.period || "last_30_days");
  let from; let to;
  if (period === "custom") {
    if (!DATE.test(query.startDate || "") || !DATE.test(query.endDate || "")) throw new ApiError(400, "Select valid From and To dates.", "INVALID_ANALYTICS_RANGE");
    from = new Date(`${query.startDate}T00:00:00Z`); to = new Date(`${query.endDate}T00:00:00Z`);
  } else if (period === "today") from = to = today;
  else if (period === "yesterday") from = to = addDays(today, -1);
  else if (period === "last_7_days") { from = addDays(today, -6); to = today; }
  else if (period === "this_month") { from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)); to = today; }
  else if (period === "last_month") { from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)); to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)); }
  else if (period === "this_year") { from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1)); to = today; }
  else { from = addDays(today, -29); to = today; }
  if (from > to || to > today || (to - from) / 86400000 > 731) throw new ApiError(400, "Analytics range must be valid, not in the future, and no longer than two years.", "INVALID_ANALYTICS_RANGE");
  const days = Math.floor((to - from) / 86400000) + 1;
  const grouping = ["daily", "weekly", "monthly"].includes(query.grouping) ? query.grouping : days <= 31 ? "daily" : days <= 120 ? "weekly" : "monthly";
  return { from: iso(from), to: iso(to), toExclusive: iso(addDays(to, 1)), days, grouping, period };
}

function dimensions(query, productAlias = "p") {
  const clauses = []; const params = [];
  for (const [key, column] of [["sellerId", "seller_id"], ["companyId", "company_id"], ["categoryId", "category_id"], ["productId", "id"]]) {
    const value = int(query[key]); if (value) { clauses.push(`${productAlias}.${column}=?`); params.push(value); }
  }
  if (query.brand?.trim()) { clauses.push(`${productAlias}.brand=?`); params.push(query.brand.trim()); }
  return { clauses, params };
}
function locationDimensions(query, customerAlias = "cp") {
  const clauses = []; const params = [];
  if (query.state?.trim()) { clauses.push(`${customerAlias}.state=?`); params.push(query.state.trim()); }
  if (query.district?.trim()) { clauses.push(`${customerAlias}.district=?`); params.push(query.district.trim()); }
  return { clauses, params };
}
function where(parts) { return parts.length ? `WHERE ${parts.join(" AND ")}` : ""; }
function bucket(column, grouping) {
  if (grouping === "monthly") return `DATE_FORMAT(${column},'%Y-%m')`;
  if (grouping === "weekly") return `DATE_FORMAT(DATE_SUB(DATE(${column}),INTERVAL WEEKDAY(${column}) DAY),'%Y-%m-%d')`;
  return `DATE_FORMAT(${column},'%Y-%m-%d')`;
}
const numbers = (row = {}) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === "number" ? value : Number(value || 0)]));
const numberedRows = (rows, keys) => rows.map((row) => ({ ...row, ...Object.fromEntries(keys.map((key) => [key, Number(row[key] || 0)])) }));

exports.get = async (req, res) => {
  const range = dateRange(req.query);
  const dim = dimensions(req.query); const loc = locationDimensions(req.query);
  const productBase = ["p.status<>'deleted'", ...dim.clauses];
  const datedProducts = [...productBase, "p.created_at>=?", "p.created_at<?"];
  const quoteBase = [...dim.clauses, ...loc.clauses, "q.created_at>=?", "q.created_at<?"];
  const quoteParams = [...dim.params, ...loc.params, range.from, range.toExclusive];
  const productDateParams = [...dim.params, range.from, range.toExclusive];
  const productJoin = "FROM products p JOIN categories c ON c.id=p.category_id JOIN users su ON su.id=p.seller_id LEFT JOIN seller_profiles sp ON sp.user_id=p.seller_id LEFT JOIN companies co ON co.id=p.company_id";
  const quoteJoin = `${productJoin} JOIN quotation_requests q ON q.product_id=p.id JOIN users cu ON cu.id=q.customer_id LEFT JOIN customer_profiles cp ON cp.user_id=q.customer_id LEFT JOIN quotation_responses qr ON qr.quotation_request_id=q.id`;
  const previousFrom = iso(addDays(new Date(`${range.from}T00:00:00Z`), -range.days));

  const results = await Promise.all([
    pool.execute(`SELECT
      (SELECT COUNT(*) FROM companies) totalCompanies,
      (SELECT COUNT(*) FROM users WHERE role='Seller') totalSellers,
      (SELECT COUNT(*) FROM users WHERE role='Customer') totalCustomers,
      (SELECT COUNT(*) FROM products WHERE status<>'deleted') totalProducts,
      (SELECT COUNT(*) FROM products WHERE status='active') activeProducts,
      (SELECT COUNT(*) FROM products WHERE status='suspended') suspendedProducts,
      (SELECT COUNT(*) FROM quotation_requests) totalQuotations,
      (SELECT COUNT(*) FROM quotation_requests WHERE status='pending') pendingQuotations,
      (SELECT COUNT(*) FROM quotation_requests) totalEnquiries,
      (SELECT COUNT(*) FROM quotation_requests WHERE status='pending') openEnquiries,
      (SELECT COUNT(*) FROM quotation_requests WHERE status<>'pending') resolvedEnquiries,
      (SELECT COUNT(*) FROM users WHERE role='Seller' AND status='Verified') activeSellers,
      (SELECT COUNT(*) FROM seller_verifications WHERE verification_status='Pending') pendingSellerApprovals`),
    pool.execute(`SELECT COUNT(*) newCustomers FROM users WHERE role='Customer' AND created_at>=? AND created_at<?`, [range.from, range.toExclusive]),
    pool.execute(`SELECT COUNT(*) totalProducts,SUM(p.status='active') activeProducts,SUM(p.status='suspended') suspendedProducts,
      SUM(DATE(p.created_at)=CURDATE()) productsAddedToday,SUM(p.created_at>=DATE_FORMAT(CURDATE(),'%Y-%m-01')) productsAddedThisMonth,
      SUM(p.created_at>=DATE_FORMAT(DATE_SUB(CURDATE(),INTERVAL 1 MONTH),'%Y-%m-01') AND p.created_at<DATE_FORMAT(CURDATE(),'%Y-%m-01')) productsAddedLastMonth
      FROM products p ${where(productBase)}`, dim.params),
    pool.execute(`SELECT COUNT(*) selectedCount FROM products p ${where(datedProducts)}`, productDateParams),
    pool.execute(`SELECT COUNT(*) previousCount FROM products p ${where([...productBase,"p.created_at>=?","p.created_at<?"])}`, [...dim.params, previousFrom, range.from]),
    pool.execute(`SELECT ${bucket("p.created_at", range.grouping)} date,COUNT(*) productCount FROM products p ${where(datedProducts)} GROUP BY date ORDER BY date`, productDateParams),
    pool.execute(`SELECT c.name category,COUNT(*) productCount ${productJoin} ${where(datedProducts)} GROUP BY c.id,c.name ORDER BY productCount DESC LIMIT 12`, productDateParams),
    pool.execute(`SELECT p.brand,COUNT(*) productCount FROM products p ${where(datedProducts)} GROUP BY p.brand ORDER BY productCount DESC LIMIT 12`, productDateParams),
    pool.execute(`SELECT COUNT(*) totalQuotations,SUM(q.status='pending') pendingQuotations,SUM(q.responded_at IS NOT NULL) sellerResponded,
      SUM(q.status IN ('accepted','declined')) customerResponded,SUM(q.status='accepted') accepted,SUM(q.status='rejected') rejected,
      SUM(q.status='declined') declined,SUM(q.status='quoted') quoted ${quoteJoin} ${where(quoteBase)}`, quoteParams),
    pool.execute(`SELECT ${bucket("q.created_at", range.grouping)} date,COUNT(*) quotationCount ${quoteJoin} ${where(quoteBase)} GROUP BY date ORDER BY date`, quoteParams),
    pool.execute(`SELECT p.id productId,p.product_name productName,p.brand,c.name category,su.name seller,COALESCE(NULLIF(sp.company_name,''),su.name) company,
      COUNT(q.id) quotationCount,SUM(q.quantity) totalRequestedUnits ${quoteJoin} ${where(quoteBase)} GROUP BY p.id,p.product_name,p.brand,c.name,su.name,sp.company_name ORDER BY quotationCount DESC,totalRequestedUnits DESC LIMIT 20`, quoteParams),
    pool.execute(`SELECT p.brand,COUNT(q.id) quotationCount,SUM(q.quantity) requestedUnits ${quoteJoin} ${where(quoteBase)} GROUP BY p.brand ORDER BY quotationCount DESC LIMIT 12`, quoteParams),
    pool.execute(`SELECT c.id categoryId,c.name category,COUNT(q.id) quotationCount,SUM(q.quantity) requestedUnits ${quoteJoin} ${where(quoteBase)} GROUP BY c.id,c.name ORDER BY quotationCount DESC LIMIT 12`, quoteParams),
    pool.execute(`SELECT COUNT(*) totalSellers,SUM(status='Verified') activeSellers,SUM(status='Inactive') inactiveSellers,SUM(status='Pending') pendingApproval,
      SUM(created_at>=? AND created_at<?) newSellers FROM users WHERE role='Seller'`, [range.from, range.toExclusive]),
    pool.execute(`SELECT su.id sellerId,su.name seller,COALESCE(NULLIF(sp.company_name,''),su.name) company,COUNT(DISTINCT q.id) quotationCount,COUNT(DISTINCT p.id) productCount ${quoteJoin} ${where(quoteBase)} GROUP BY su.id,su.name,sp.company_name ORDER BY quotationCount DESC LIMIT 15`, quoteParams),
    pool.execute(`SELECT COUNT(q.id) totalRequests,SUM(q.responded_at IS NOT NULL) respondedRequests,
      AVG(CASE WHEN q.responded_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE,q.created_at,q.responded_at) END) averageResponseMinutes ${quoteJoin} ${where(quoteBase)}`, quoteParams),
    pool.execute(`SELECT COUNT(*) totalCustomers,SUM(status='Verified') activeCustomers,SUM(status='Inactive') inactiveCustomers,
      SUM(created_at>=? AND created_at<?) newCustomers FROM users WHERE role='Customer'`, [range.from, range.toExclusive]),
    pool.execute(`SELECT COUNT(DISTINCT q.customer_id) customersWithEnquiries,COUNT(DISTINCT CASE WHEN qr.id IS NOT NULL THEN q.customer_id END) customersWithQuotations ${quoteJoin} ${where(quoteBase)}`, quoteParams),
    pool.execute(`SELECT ${bucket("u.created_at", range.grouping)} date,COUNT(*) customerCount FROM users u WHERE u.role='Customer' AND u.created_at>=? AND u.created_at<? GROUP BY date ORDER BY date`, [range.from, range.toExclusive]),
    pool.execute(`SELECT cu.id customerUserId,COALESCE(cp.customer_id,CONCAT('CUS-',cu.id)) customerId,cu.name customer,
      COUNT(DISTINCT qr.id) quotationCount,COUNT(DISTINCT q.id) enquiryCount ${quoteJoin} ${where(quoteBase)} GROUP BY cu.id,cp.customer_id,cu.name ORDER BY enquiryCount DESC LIMIT 15`, quoteParams),
    pool.execute(`SELECT COALESCE(NULLIF(cp.state,''),'Not provided') state,COUNT(DISTINCT cu.id) customerCount FROM users cu LEFT JOIN customer_profiles cp ON cp.user_id=cu.id WHERE cu.role='Customer' GROUP BY state ORDER BY customerCount DESC LIMIT 20`),
    pool.execute(`SELECT COALESCE(NULLIF(cp.state,''),'Not provided') state,COUNT(q.id) quotationCount ${quoteJoin} ${where(quoteBase)} GROUP BY state ORDER BY quotationCount DESC LIMIT 20`, quoteParams),
    pool.execute(`SELECT COALESCE(NULLIF(cp.district,''),'Not provided') district,COALESCE(NULLIF(cp.state,''),'Not provided') state,COUNT(q.id) quotationCount ${quoteJoin} ${where(quoteBase)} GROUP BY district,state ORDER BY quotationCount DESC LIMIT 20`, quoteParams),
    pool.execute(`SELECT co.id companyId,COALESCE(co.company_name,p.brand) company,COUNT(DISTINCT p.seller_id) sellerCount,COUNT(DISTINCT p.id) productCount,
      COUNT(DISTINCT qr.id) quotationCount,COUNT(DISTINCT q.id) enquiryCount ${quoteJoin} ${where(quoteBase)} GROUP BY co.id,co.company_name,p.brand ORDER BY quotationCount DESC,productCount DESC LIMIT 20`, quoteParams),
    pool.execute(`SELECT COUNT(*) totalRequests,SUM(q.responded_at IS NOT NULL) sellerResponded,SUM(q.status IN ('accepted','declined')) customerResponded,SUM(q.status='accepted') accepted ${quoteJoin} ${where(quoteBase)}`, quoteParams),
    pool.execute("SELECT u.id,u.name,COALESCE(NULLIF(sp.company_name,''),u.name) sellerCompany FROM users u LEFT JOIN seller_profiles sp ON sp.user_id=u.id WHERE u.role='Seller' ORDER BY sellerCompany"),
    pool.execute("SELECT id,company_name companyName FROM companies ORDER BY company_name"),
    pool.execute("SELECT id,name FROM categories ORDER BY name"),
    pool.execute("SELECT DISTINCT brand FROM products WHERE status<>'deleted' ORDER BY brand"),
    pool.execute("SELECT id,product_name productName FROM products WHERE status<>'deleted' ORDER BY product_name"),
    pool.execute("SELECT DISTINCT state FROM customer_profiles WHERE state IS NOT NULL AND state<>'' ORDER BY state"),
    pool.execute("SELECT DISTINCT state,district FROM customer_profiles WHERE district IS NOT NULL AND district<>'' ORDER BY state,district"),
  ]);

  let i = 0;
  const liveOverview = numbers(results[i++][0][0]); const newCustomers = Number(results[i++][0][0].newCustomers || 0);
  const productMetrics = numbers(results[i++][0][0]); const selected = Number(results[i++][0][0].selectedCount || 0); const previous = Number(results[i++][0][0].previousCount || 0);
  productMetrics.productGrowthPercentage = previous ? Number((((selected - previous) / previous) * 100).toFixed(1)) : selected ? 100 : 0;
  const productTrend = numberedRows(results[i++][0], ["productCount"]); const productsByCategory = numberedRows(results[i++][0], ["productCount"]); const productsByBrand = numberedRows(results[i++][0], ["productCount"]);
  const quotationMetrics = numbers(results[i++][0][0]); const quotationTrend = numberedRows(results[i++][0], ["quotationCount"]); const mostQuotedProducts = numberedRows(results[i++][0], ["quotationCount","totalRequestedUnits"]); const mostQuotedBrands = numberedRows(results[i++][0], ["quotationCount","requestedUnits"]); const mostQuotedCategories = numberedRows(results[i++][0], ["quotationCount","requestedUnits"]);
  const sellerMetrics = numbers(results[i++][0][0]); const topSellers = numberedRows(results[i++][0], ["quotationCount","productCount"]); const response = numbers(results[i++][0][0]); response.responseRate = response.totalRequests ? Number(((response.respondedRequests / response.totalRequests) * 100).toFixed(1)) : 0;
  const customerMetrics = numbers(results[i++][0][0]); Object.assign(customerMetrics, numbers(results[i++][0][0])); const customerGrowth = numberedRows(results[i++][0], ["customerCount"]); const topCustomers = numberedRows(results[i++][0], ["quotationCount","enquiryCount"]);
  const customersByState = numberedRows(results[i++][0], ["customerCount"]); const demandByState = numberedRows(results[i++][0], ["quotationCount"]); const demandByDistrict = numberedRows(results[i++][0], ["quotationCount"]); const companyPerformance = numberedRows(results[i++][0], ["sellerCount","productCount","quotationCount","enquiryCount"]); const funnel = numbers(results[i++][0][0]);
  const sellers = results[i++][0], companies = results[i++][0], categories = results[i++][0], brands = results[i++][0].map((x) => x.brand), products = results[i++][0], states = results[i++][0].map((x) => x.state), districts = results[i++][0];

  res.json({
    updatedAt: new Date().toISOString(), appliedFilters: { ...range, sellerId: int(req.query.sellerId), companyId: int(req.query.companyId), categoryId: int(req.query.categoryId), productId: int(req.query.productId), brand: req.query.brand || null, state: req.query.state || null, district: req.query.district || null },
    filterOptions: { sellers, companies, categories, brands, products, states, districts },
    overview: { ...liveOverview, newCustomers },
    productAnalytics: { metrics: productMetrics, trend: productTrend, byCategory: productsByCategory, byBrand: productsByBrand },
    quotationAnalytics: { metrics: quotationMetrics, trend: quotationTrend, mostQuotedProducts, mostQuotedBrands, mostQuotedCategories, funnel },
    sellerAnalytics: { metrics: sellerMetrics, topSellers, response },
    customerAnalytics: { metrics: customerMetrics, growth: customerGrowth, topCustomers },
    demandAnalytics: { mostRequestedProducts: mostQuotedProducts, mostRequestedBrands: mostQuotedBrands, mostRequestedCategories: mostQuotedCategories },
    locationAnalytics: { customersByState, demandByState, demandByDistrict },
    companyAnalytics: { performance: companyPerformance, topByQuotations: [...companyPerformance].sort((a,b)=>b.quotationCount-a.quotationCount).slice(0,10), topByProducts: [...companyPerformance].sort((a,b)=>b.productCount-a.productCount).slice(0,10) },
  });
};
