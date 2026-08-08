const ApiError = require("../utils/api-error");

const CUSTOMER_FIELDS = ["customer_name", "email", "phone_number", "address", "state", "district", "area", "landmark"];
const SELLER_FIELDS = ["seller_name", "email", "phone_number", "address", "state", "district", "area", "landmark", "company_name", "business_email", "gst"];
const labels = { customer_name: "customerName", seller_name: "sellerName", phone_number: "phoneNumber", business_email: "businessEmail", company_name: "companyName" };

function completion(profile, role) {
  const fields = role === "Seller" ? SELLER_FIELDS : CUSTOMER_FIELDS;
  const missingFields = fields.filter((field) => !String(profile?.[field] || "").trim()).map((field) => labels[field] || field);
  const profileCompletion = Math.round(((fields.length - missingFields.length) / fields.length) * 100);
  return { profileCompletion, isComplete: profileCompletion === 100, missingFields };
}

function clean(value) { return typeof value === "string" ? value.trim() || null : null; }
function validateProfile(body, role, partial = true) {
  const allowed = role === "Seller"
    ? ["sellerName", "email", "phoneNumber", "address", "state", "district", "area", "landmark", "companyName", "businessEmail", "gst", "website", "verificationStatus", "status"]
    : ["customerName", "email", "phoneNumber", "address", "state", "district", "area", "landmark", "status"];
  const data = {};
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(body, key)) data[key] = clean(body[key]);
  const nameKey = role === "Seller" ? "sellerName" : "customerName";
  if ((!partial || nameKey in data) && (!data[nameKey] || data[nameKey].length < 2 || data[nameKey].length > 120)) throw new ApiError(400, "Name must be between 2 and 120 characters.", "INVALID_NAME");
  if ((!partial || "email" in data) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "")) throw new ApiError(400, "Enter a valid email address.", "INVALID_EMAIL");
  if (data.businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.businessEmail)) throw new ApiError(400, "Enter a valid business email address.", "INVALID_BUSINESS_EMAIL");
  if (data.phoneNumber && !/^[6-9]\d{9}$/.test(data.phoneNumber)) throw new ApiError(400, "Enter a valid 10-digit Indian phone number.", "INVALID_PHONE");
  if (data.gst) { data.gst = data.gst.toUpperCase(); if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(data.gst)) throw new ApiError(400, "Enter a valid 15-character GST number.", "INVALID_GST"); }
  if (data.website) { try { const url = new URL(data.website); if (!/^https?:$/.test(url.protocol)) throw new Error(); } catch { throw new ApiError(400, "Enter a valid website URL including http:// or https://.", "INVALID_WEBSITE"); } }
  for (const field of ["address", "state", "district", "area", "landmark", "companyName"]) if (data[field] && data[field].length > (field === "address" ? 255 : 160)) throw new ApiError(400, `${field} is too long.`, "INVALID_FIELD");
  return data;
}

function mapProfile(row, role) {
  if (!row) return null;
  const result = role === "Seller" ? {
    id: row.id, userId: row.user_id, sellerId: row.seller_id, sellerName: row.seller_name, email: row.email, phoneNumber: row.phone_number,
    address: row.address, state: row.state, district: row.district, area: row.area, landmark: row.landmark, companyName: row.company_name,
    businessEmail: row.business_email, gst: row.gst, website: row.website, verificationStatus: row.verification_status,
  } : {
    id: row.id, userId: row.user_id, customerId: row.customer_id, customerName: row.customer_name, email: row.email, phoneNumber: row.phone_number,
    address: row.address, state: row.state, district: row.district, area: row.area, landmark: row.landmark,
  };
  return { ...result, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, ...completion(row, role) };
}

module.exports = { completion, validateProfile, mapProfile };
