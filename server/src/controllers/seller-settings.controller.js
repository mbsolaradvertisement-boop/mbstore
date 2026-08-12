const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");

const fields = {
  notificationsEnabled: "notifications_enabled",
  quotationNotifications: "quotation_notifications",
  showProducts: "show_products",
  showAvailability: "show_availability",
  emailUpdates: "email_updates",
  weeklySummary: "weekly_summary",
};

const mapped = (row) => Object.fromEntries(Object.entries(fields).map(([key,column]) => [key, Boolean(row[column])]));

async function ensure(sellerId) {
  await pool.execute("INSERT IGNORE INTO seller_settings (seller_id) VALUES (?)", [sellerId]);
  const [rows] = await pool.execute("SELECT * FROM seller_settings WHERE seller_id=? LIMIT 1", [sellerId]);
  return rows[0];
}

exports.get = async (req,res) => res.json({ settings: mapped(await ensure(req.user.id)) });

exports.update = async (req,res) => {
  const entries = Object.entries(fields).filter(([key]) => Object.prototype.hasOwnProperty.call(req.body,key));
  if (!entries.length) throw new ApiError(400,"No settings were provided.","NO_SETTINGS");
  const invalid = entries.find(([key]) => typeof req.body[key] !== "boolean");
  if (invalid) throw new ApiError(400,`${invalid[0]} must be true or false.`,"INVALID_SETTING");
  await ensure(req.user.id);
  await pool.execute(`UPDATE seller_settings SET ${entries.map(([,column])=>`${column}=?`).join(",")} WHERE seller_id=?`, [...entries.map(([key])=>req.body[key]),req.user.id]);
  res.json({ message:"Settings saved successfully.", settings:mapped(await ensure(req.user.id)) });
};
