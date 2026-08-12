const {pool}=require("../config/database");
const ApiError=require("../utils/api-error");
const fields={emailNotifications:"email_notifications",enquiryNotifications:"enquiry_notifications"};
const map=row=>Object.fromEntries(Object.entries(fields).map(([key,column])=>[key,Boolean(row[column])]));
async function ensure(id){await pool.execute("INSERT IGNORE INTO customer_settings (customer_id) VALUES (?)",[id]);const [rows]=await pool.execute("SELECT * FROM customer_settings WHERE customer_id=? LIMIT 1",[id]);return rows[0]}
exports.get=async(req,res)=>res.json({settings:map(await ensure(req.user.id))});
exports.update=async(req,res)=>{const entries=Object.entries(fields).filter(([key])=>Object.prototype.hasOwnProperty.call(req.body,key));if(!entries.length)throw new ApiError(400,"No settings were provided.","NO_SETTINGS");if(entries.some(([key])=>typeof req.body[key]!=="boolean"))throw new ApiError(400,"Settings must be true or false.","INVALID_SETTING");await ensure(req.user.id);await pool.execute(`UPDATE customer_settings SET ${entries.map(([,column])=>`${column}=?`).join(",")} WHERE customer_id=?`,[...entries.map(([key])=>req.body[key]),req.user.id]);res.json({message:"Notification preferences saved.",settings:map(await ensure(req.user.id))})};
