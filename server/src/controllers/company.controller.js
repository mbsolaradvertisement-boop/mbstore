const path = require("path");
const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");

const MAX_LOGO_BYTES = 200 * 1024;
const allowedMimes = new Set(["image/png", "image/jpeg", "image/webp"]);
function positiveInt(value, fallback, maximum) { const parsed=Number.parseInt(value,10); return Number.isFinite(parsed)&&parsed>0?Math.min(parsed,maximum):fallback; }
function validSignature(buffer,mime) { if(mime==="image/png")return buffer.subarray(0,4).toString("hex")==="89504e47"; if(mime==="image/jpeg")return buffer.subarray(0,3).toString("hex")==="ffd8ff"; return buffer.subarray(0,4).toString()==="RIFF"&&buffer.subarray(8,12).toString()==="WEBP"; }
function parseLogo(logoData,logoName) {
  if(typeof logoData!=="string")throw new ApiError(400,"Company logo is required.","LOGO_REQUIRED");
  const match=logoData.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if(!match||!allowedMimes.has(match[1]))throw new ApiError(400,"Logo must be a PNG, JPEG, or WebP image.","INVALID_LOGO_TYPE");
  const data=Buffer.from(match[2],"base64");
  if(!data.length||data.length>=MAX_LOGO_BYTES)throw new ApiError(400,"Company logo must be less than 200 KB.","LOGO_TOO_LARGE");
  if(!validSignature(data,match[1]))throw new ApiError(400,"The uploaded logo file is invalid.","INVALID_LOGO");
  const name=path.basename(String(logoName||"").trim());
  if(!name||name.length>255)throw new ApiError(400,"A valid logo filename is required.","INVALID_LOGO_NAME");
  return {data,mime:match[1],name};
}
function companyName(value) { const name=String(value||"").trim().replace(/\s+/g," "); if(name.length<2||name.length>160)throw new ApiError(400,"Company name must be between 2 and 160 characters.","INVALID_COMPANY_NAME"); if(!/^[\p{L}\p{N}&.,'()\- ]+$/u.test(name))throw new ApiError(400,"Company name contains unsupported characters.","INVALID_COMPANY_NAME"); return name; }

function listCompanies(logoBase) { return async (req,res) => { const page=positiveInt(req.query.page,1,100000), limit=positiveInt(req.query.limit,20,100), offset=(page-1)*limit, search=String(req.query.search||"").trim(); const where=search?"WHERE company_name LIKE ? OR company_id LIKE ?":""; const params=search?[`%${search}%`,`%${search}%`]:[]; const [counts]=await pool.execute(`SELECT COUNT(*) total FROM companies ${where}`,params); const [rows]=await pool.execute(`SELECT id,company_id AS companyId,company_name AS companyName,logo_name AS logoName,created_at AS createdAt,updated_at AS updatedAt FROM companies ${where} ORDER BY company_name ASC LIMIT ${limit} OFFSET ${offset}`,params); const totalRecords=Number(counts[0].total); res.json({data:rows.map(row=>({...row,logoUrl:`${logoBase}/${row.id}/logo`})),totalRecords,currentPage:page,totalPages:Math.max(1,Math.ceil(totalRecords/limit)),limit}); }; }
exports.list = listCompanies("/admin/companies");
exports.publicList = listCompanies("/companies");
exports.create = async (req,res) => { const name=companyName(req.body.companyName), logo=parseLogo(req.body.logoData,req.body.logoName); const connection=await pool.getConnection(); try { await connection.beginTransaction(); const placeholder=`TMP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; const [result]=await connection.execute("INSERT INTO companies (company_id,company_name,logo_name,logo_mime,logo_data,created_by) VALUES (?,?,?,?,?,?)",[placeholder,name,logo.name,logo.mime,logo.data,req.user.id]); const companyId=`MBSCO-${String(result.insertId).padStart(2,"0")}`; await connection.execute("UPDATE companies SET company_id=? WHERE id=?",[companyId,result.insertId]); await connection.commit(); res.status(201).json({message:"Company added successfully.",company:{id:result.insertId,companyId,companyName:name,logoName:logo.name,logoUrl:`/admin/companies/${result.insertId}/logo`}}); } catch(error) { await connection.rollback(); if(error.code==="ER_DUP_ENTRY")throw new ApiError(409,"A company with this name already exists.","DUPLICATE_COMPANY"); throw error; } finally { connection.release(); } };
exports.logo = async (req,res) => { const [rows]=await pool.execute("SELECT logo_name,logo_mime,logo_data,updated_at FROM companies WHERE id=? LIMIT 1",[req.params.id]); if(!rows[0])throw new ApiError(404,"Company logo not found.","COMPANY_NOT_FOUND"); res.set({"Content-Type":rows[0].logo_mime,"Content-Disposition":`inline; filename=\"${rows[0].logo_name.replace(/[\"\r\n]/g,"")}\"`,"Cache-Control":"private, max-age=3600","Cross-Origin-Resource-Policy":"cross-origin","Last-Modified":new Date(rows[0].updated_at).toUTCString()}).send(rows[0].logo_data); };
exports.remove = async (req,res) => { const [result]=await pool.execute("DELETE FROM companies WHERE id=?",[req.params.id]); if(!result.affectedRows)throw new ApiError(404,"Company not found.","COMPANY_NOT_FOUND"); res.json({message:"Company deleted successfully."}); };
