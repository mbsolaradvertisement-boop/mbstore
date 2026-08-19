require("dotenv").config();
const bcrypt = require("bcryptjs");
const { migrate } = require("../src/config/migrate");
const { pool } = require("../src/config/database");
async function run(){await migrate();const [users]=await pool.execute("SELECT id,email,role,password_hash FROM users ORDER BY id");let migrated=0,skipped=0;for(const user of users){if(user.password_hash&&user.password_hash.startsWith("$2")){skipped+=1;continue;}const temporaryPassword=user.role==="Admin"?"Admin@123456":"Pass@123456";await pool.execute("UPDATE users SET password_hash=? WHERE id=? AND (password_hash IS NULL OR password_hash='')",[await bcrypt.hash(temporaryPassword,12),user.id]);console.log(`Migrated ${String(user.role).toLowerCase()}: ${user.email||`user #${user.id}`}`);migrated+=1;}console.log(`Password migration complete. Migrated: ${migrated}; skipped: ${skipped}.`);}
run().catch(error=>{console.error("Password migration failed:",error.message);process.exitCode=1;}).finally(()=>pool.end());
