const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");

const initialTemplates = {
  "solar modules": [["origin","Origin","text"],["technology","Technology","text"],["power","Power","number"],["unit","Unit","text"]],
  "inverters": [["type","Type","text"],["phase","Phase","text"],["power","Power","number"],["unit","Unit","text"]],
  "batteries": [["technology","Technology","text"],["capacity","Capacity","number"],["unit","Unit","text"]],
  "cables": [["type","Type","text"],["size","Size","text"],["unit","Unit","text"]],
  "solar bos": [["type","Type","text"]], "structures": [["type","Type","text"],["material","Material","text"]],
  "solar kits": [["type","Type","text"],["power","Power","number"],["unit","Unit","text"],["phase","Phase","text"]],
  "electrical": [["type","Type","text"],["voltage","Voltage","number"],["current_rating","Current / Rating","text"],["phase","Phase","text"]],
  "automation": [["type","Type","text"],["voltage","Voltage","number"],["communication_control_type","Communication / Control Type","text"]],
  "motors": [["type","Type","text"],["power","Power","number"],["unit","Unit","text"],["phase","Phase","text"]],
  "switchgear": [["type","Type","text"],["current_rating","Current Rating","text"],["voltage","Voltage","number"],["phase","Phase","text"]],
  "accessories": [["type","Type","text"],["material","Material","text"],["size_specification","Size / Specification","text"]],
};
function normalizeName(value) { const name=String(value||"").trim().replace(/\s+/g," "); if(name.length<2||name.length>120)throw new ApiError(400,"Category name must be between 2 and 120 characters.","INVALID_CATEGORY_NAME"); if(!/^[\p{L}\p{N}&/()\- ]+$/u.test(name))throw new ApiError(400,"Category name contains unsupported characters.","INVALID_CATEGORY_NAME"); return name; }
function slugify(value) { return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
async function fields(categoryId, connection=pool) { const [rows]=await connection.execute("SELECT id,field_key AS fieldKey,field_label AS fieldLabel,field_type AS fieldType,is_required AS required,sort_order AS sortOrder FROM category_field_templates WHERE category_id=? ORDER BY sort_order,id",[categoryId]); return rows.map(row=>({...row,required:Boolean(row.required)})); }
async function seedTemplate(connection,categoryId,name) { const template=initialTemplates[name.toLowerCase()]||[]; for(let index=0;index<template.length;index++){const [key,label,type]=template[index];await connection.execute("INSERT INTO category_field_templates (category_id,field_key,field_label,field_type,is_required,sort_order) VALUES (?,?,?,?,TRUE,?)",[categoryId,key,label,type,index+1]);} }
module.exports={normalizeName,slugify,fields,seedTemplate};
