const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function dateValue(value, label) {
  if (!DATE_PATTERN.test(String(value || ""))) {
    throw new ApiError(400, `${label} must use YYYY-MM-DD format.`, "INVALID_REPORT_DATE");
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ApiError(400, `${label} is invalid.`, "INVALID_REPORT_DATE");
  }
  return date;
}

function reportRange(query) {
  const now = new Date();
  const defaultFrom = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const fromText = query.from || defaultFrom;
  const toText = query.to || defaultTo;
  const from = dateValue(fromText, "From date");
  const to = dateValue(toText, "To date");
  const days = Math.floor((to - from) / 86400000) + 1;
  if (days < 1) throw new ApiError(400, "From date must be before or equal to the to date.", "INVALID_REPORT_RANGE");
  if (days > 366) throw new ApiError(400, "Report range cannot exceed 366 days.", "REPORT_RANGE_TOO_LARGE");
  const toExclusive = new Date(to.getTime() + 86400000).toISOString().slice(0, 10);
  return { from, to, fromText, toText, toExclusive, days };
}

function filledSeries(rows, range, monthly) {
  if (!rows.some((row) => Number(row.value) > 0)) return [];
  const values = new Map(rows.map((row) => [row.bucket, Number(row.value || 0)]));
  const result = [];
  const cursor = new Date(range.from);
  while (cursor <= range.to) {
    const iso = cursor.toISOString().slice(0, 10);
    const bucket = monthly ? iso.slice(0, 7) : iso;
    const label = monthly
      ? new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }).format(cursor)
      : new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric", timeZone: "UTC" }).format(cursor);
    result.push({ label, value: values.get(bucket) || 0 });
    if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

async function buildSellerReport(sellerId, query) {
  const range = reportRange(query);
  const monthly = range.days > 62;
  const bucket = monthly ? "DATE_FORMAT(q.created_at,'%Y-%m')" : "DATE_FORMAT(q.created_at,'%Y-%m-%d')";
  const mode = query.groupBy === "product" ? "product" : "brand";
  const productGroup = mode === "product" ? "q.product_name_snapshot" : "q.brand_snapshot";
  const common = [sellerId, range.fromText, range.toExclusive];

  const [leadResult, conversionResult, productResult, locationResult] = await Promise.all([
    pool.execute(`SELECT ${bucket} bucket,COUNT(*) value FROM quotation_requests q WHERE q.seller_id=? AND q.created_at>=? AND q.created_at<? GROUP BY bucket ORDER BY bucket`, common),
    pool.execute(`SELECT ${bucket} bucket,COUNT(*) value FROM quotation_requests q WHERE q.seller_id=? AND q.created_at>=? AND q.created_at<? AND q.status='accepted' GROUP BY bucket ORDER BY bucket`, common),
    pool.execute(`SELECT ${productGroup} name,COUNT(*) value FROM quotation_requests q JOIN products p ON p.id=q.product_id AND p.seller_id=q.seller_id WHERE q.seller_id=? AND q.created_at>=? AND q.created_at<? GROUP BY ${productGroup} ORDER BY value DESC,name ASC LIMIT 10`, common),
    pool.execute(`SELECT COALESCE(NULLIF(cp.district,''),NULLIF(cp.state,'')) name,COUNT(*) value FROM quotation_requests q JOIN customer_profiles cp ON cp.user_id=q.customer_id WHERE q.seller_id=? AND q.created_at>=? AND q.created_at<? AND COALESCE(NULLIF(cp.district,''),NULLIF(cp.state,'')) IS NOT NULL GROUP BY name ORDER BY value DESC,name ASC LIMIT 8`, common),
  ]);

  const previousFrom = new Date(range.from.getTime() - range.days * 86400000).toISOString().slice(0, 10);
  const [overviewResult, activeResult, statusResult, performanceResult, activityResult, sellerResult, previousResult] = await Promise.all([
    pool.execute(`SELECT COUNT(*) totalLeads,COUNT(*) totalEnquiries,COUNT(DISTINCT q.customer_id) customersEnquired,SUM(q.status='accepted') convertedLeads,COUNT(r.id) totalQuotations FROM quotation_requests q LEFT JOIN quotation_responses r ON r.quotation_request_id=q.id WHERE q.seller_id=? AND q.created_at>=? AND q.created_at<?`, common),
    pool.execute("SELECT COUNT(*) activeProducts FROM products WHERE seller_id=? AND status='active'", [sellerId]),
    pool.execute(`SELECT q.status,COUNT(*) value FROM quotation_requests q WHERE q.seller_id=? AND q.created_at>=? AND q.created_at<? GROUP BY q.status`, common),
    pool.execute(`SELECT q.product_name_snapshot product,q.brand_snapshot brand,COUNT(*) enquiries,SUM(q.status='accepted') conversions FROM quotation_requests q JOIN products p ON p.id=q.product_id AND p.seller_id=q.seller_id WHERE q.seller_id=? AND q.created_at>=? AND q.created_at<? GROUP BY q.product_name_snapshot,q.brand_snapshot ORDER BY enquiries DESC,product ASC LIMIT 10`, common),
    pool.execute(`SELECT q.created_at date,q.product_name_snapshot product,q.status,COALESCE(NULLIF(cp.district,''),NULLIF(cp.state,''),'Location unavailable') location FROM quotation_requests q LEFT JOIN customer_profiles cp ON cp.user_id=q.customer_id WHERE q.seller_id=? AND q.created_at>=? AND q.created_at<? ORDER BY q.created_at DESC LIMIT 10`, common),
    pool.execute(`SELECT sp.company_name companyName,sp.seller_name sellerName,sp.business_email businessEmail,sp.phone_number phone,sp.website,sp.gst FROM seller_profiles sp WHERE sp.user_id=? LIMIT 1`, [sellerId]),
    pool.execute(`SELECT COUNT(*) totalLeads,SUM(status='accepted') convertedLeads FROM quotation_requests WHERE seller_id=? AND created_at>=? AND created_at<?`, [sellerId, previousFrom, range.fromText]),
  ]);
  const overview = overviewResult[0][0];
  const totalLeads = Number(overview.totalLeads || 0);
  const convertedLeads = Number(overview.convertedLeads || 0);
  const previous = previousResult[0][0];
  const previousLeads = Number(previous.totalLeads || 0);
  const previousConverted = Number(previous.convertedLeads || 0);
  const percent = (current, before) => before > 0 ? Number((((current - before) / before) * 100).toFixed(1)) : null;
  const topProduct = productResult[0][0];
  const topLocation = locationResult[0][0];
  const insights = [];
  if (topProduct) insights.push(`${topProduct.name} generated the highest number of enquiries during this period.`);
  if (topLocation) insights.push(`${topLocation.name} generated the highest customer demand during this period.`);
  if (previousLeads > 0) insights.push(`Lead volume ${totalLeads >= previousLeads ? "increased" : "decreased"} by ${Math.abs(percent(totalLeads, previousLeads))}% compared with the previous equivalent period.`);
  else insights.push("Not enough previous-period data to generate a lead trend insight.");

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    filters: { from: range.fromText, to: range.toText, grouping: monthly ? "month" : "day", productGrouping: mode },
    seller: sellerResult[0][0] || {},
    overview: {
      totalLeads,
      totalEnquiries: Number(overview.totalEnquiries || 0),
      totalQuotations: Number(overview.totalQuotations || 0),
      convertedLeads,
      activeProducts: Number(activeResult[0][0].activeProducts || 0),
      customersEnquired: Number(overview.customersEnquired || 0),
      conversionRate: totalLeads ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0,
    },
    comparison: {
      available: previousLeads > 0,
      previousFrom,
      previousTo: new Date(range.from.getTime() - 86400000).toISOString().slice(0, 10),
      leads: { current: totalLeads, previous: previousLeads, changePercent: percent(totalLeads, previousLeads) },
      conversions: { current: convertedLeads, previous: previousConverted, changePercent: percent(convertedLeads, previousConverted) },
    },
    monthlyLeads: filledSeries(leadResult[0], range, monthly),
    leadConversion: filledSeries(conversionResult[0], range, monthly),
    mostEnquiredProducts: productResult[0].map((row) => ({ name: row.name, value: Number(row.value) })),
    customerLocations: locationResult[0].map((row) => ({ name: row.name, value: Number(row.value) })),
    quotationSummary: Object.fromEntries(statusResult[0].map((row) => [row.status, Number(row.value)])),
    productPerformance: performanceResult[0].map((row) => ({ product: row.product, brand: row.brand, enquiries: Number(row.enquiries), conversions: Number(row.conversions || 0) })),
    recentActivity: activityResult[0],
    insights,
  };
}

exports.sellerReport = async (req, res) => res.json(await buildSellerReport(req.user.id, req.query));
exports.buildSellerReport = buildSellerReport;
