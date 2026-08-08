const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");
const { completion, validateProfile, mapProfile } = require("../services/profile.service");

function config(role) {
  return role === "Seller"
    ? { table: "seller_profiles", name: "seller_name", id: "seller_id", fields: { sellerName: "seller_name", email: "email", phoneNumber: "phone_number", address: "address", state: "state", district: "district", area: "area", landmark: "landmark", companyName: "company_name", businessEmail: "business_email", gst: "gst", website: "website", verificationStatus: "verification_status" } }
    : { table: "customer_profiles", name: "customer_name", id: "customer_id", fields: { customerName: "customer_name", email: "email", phoneNumber: "phone_number", address: "address", state: "state", district: "district", area: "area", landmark: "landmark" } };
}

async function getForUser(role, userId) {
  const c = config(role); const [rows] = await pool.execute(`SELECT p.*, u.status FROM ${c.table} p JOIN users u ON u.id=p.user_id WHERE p.user_id=? LIMIT 1`, [userId]);
  if (!rows[0]) throw new ApiError(404, `${role} profile not found.`, "PROFILE_NOT_FOUND");
  return rows[0];
}

exports.getCustomer = async (req, res) => res.json({ profile: mapProfile(await getForUser("Customer", req.user.id), "Customer") });
exports.getSeller = async (req, res) => res.json({ profile: mapProfile(await getForUser("Seller", req.user.id), "Seller") });

function updateSelf(role) { return async (req, res) => {
  const c = config(role); const data = validateProfile(req.body, role); delete data.verificationStatus; delete data.status;
  const entries = Object.entries(data).filter(([key]) => c.fields[key]);
  if (!entries.length) throw new ApiError(400, "No profile fields were provided.", "NO_CHANGES");
  const current = await getForUser(role, req.user.id); const merged = { ...current };
  for (const [key, value] of entries) merged[c.fields[key]] = value;
  const { profileCompletion } = completion(merged, role);
  const connection = await pool.getConnection();
  try { await connection.beginTransaction();
    const assignments = entries.map(([key]) => `${c.fields[key]}=?`); const values = entries.map(([, value]) => value);
    assignments.push("profile_completion=?"); values.push(profileCompletion, req.user.id);
    await connection.execute(`UPDATE ${c.table} SET ${assignments.join(", ")} WHERE user_id=?`, values);
    const nameValue = data[role === "Seller" ? "sellerName" : "customerName"]; const email = data.email;
    if (nameValue || email) { const sets=[]; const params=[]; if(nameValue){sets.push("name=?");params.push(nameValue);} if(email){sets.push("email=?");params.push(email);} params.push(req.user.id); await connection.execute(`UPDATE users SET ${sets.join(", ")} WHERE id=?`, params); }
    await connection.commit();
  } catch(error) { await connection.rollback(); if(error.code === "ER_DUP_ENTRY") throw new ApiError(409, "Email, phone, or GST is already in use.", "DUPLICATE_VALUE"); throw error; } finally { connection.release(); }
  res.json({ message: "Profile updated successfully.", profile: mapProfile(await getForUser(role, req.user.id), role) });
}; }
exports.updateCustomer = updateSelf("Customer"); exports.updateSeller = updateSelf("Seller");
