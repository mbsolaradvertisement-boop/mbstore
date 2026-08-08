const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");

const initialTemplates = {
  "solar modules": [["origin","Origin","text"],["technology","Technology","text"],["power","Power (Wp)","number"]],
  "inverters": [["type","Type","text"],["phase","Phase","text"],["power","Power (kW)","number"]],
  "batteries": [["technology","Technology","text"],["capacity","Capacity (Ah)","number"]],
  "cables": [["type","Type","text"],["size","Size (mm²)","text"]],
  "solar bos": [["type","Type","text"]], "structures": [["type","Type","text"],["material","Material","text"]],
  "solar kits": [["type","Type","text"],["power","Power (kW)","number"],["phase","Phase","text"]],
  "electrical": [["type","Type","text"],["voltage","Voltage","number"],["current_rating","Current/Rating","text"],["phase","Phase","text"]],
  "automation": [["type","Type","text"],["voltage","Voltage","number"],["communication_control_type","Communication/Control Type","text"]],
  "motors": [["type","Type","text"],["power","Power (kW)","number"],["phase","Phase","text"]],
  "switchgear": [["type","Type","text"],["current_rating","Current Rating","text"],["voltage","Voltage","number"],["phase","Phase","text"]],
  "accessories": [["type","Type","text"],["material","Material","text"],["size_specification","Size/Specification","text"]],
};
function normalizeName(value) { const name=String(value||"").trim().replace(/\s+/g," "); if(name.length<2||name.length>120)throw new ApiError(400,"Category name must be between 2 and 120 characters.","INVALID_CATEGORY_NAME"); if(!/^[\p{L}\p{N}&/()\- ]+$/u.test(name))throw new ApiError(400,"Category name contains unsupported characters.","INVALID_CATEGORY_NAME"); return name; }
function slugify(value) { return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
async function fields(categoryId, connection=pool) { const [rows]=await connection.execute("SELECT id,field_key AS fieldKey,field_label AS fieldLabel,field_type AS fieldType,is_required AS required,sort_order AS sortOrder FROM category_field_templates WHERE category_id=? ORDER BY sort_order,id",[categoryId]); return rows.map(row=>({...row,required:Boolean(row.required)})); }
async function seedTemplate(connection,categoryId,name) { const template=initialTemplates[name.toLowerCase()]||[]; for(let index=0;index<template.length;index++){const [key,label,type]=template[index];await connection.execute("INSERT INTO category_field_templates (category_id,field_key,field_label,field_type,is_required,sort_order) VALUES (?,?,?,?,TRUE,?)",[categoryId,key,label,type,index+1]);} }
async function syncTemplate(connection,categoryId,name){await connection.execute("DELETE FROM category_field_templates WHERE category_id=?",[categoryId]);await seedTemplate(connection,categoryId,name);}
function validateFieldDefinitions(input){if(!Array.isArray(input)||input.length<1||input.length>5)throw new ApiError(400,"Add between 1 and 5 category attributes.","INVALID_CATEGORY_FIELDS");const supported=new Set(["text","number","select","textarea","boolean"]),keys=new Set();return input.map((field,index)=>{const fieldLabel=String(field.fieldLabel||"").trim().replace(/\s+/g," ");if(fieldLabel.length<2||fieldLabel.length>120)throw new ApiError(400,`Attribute ${index+1} must contain between 2 and 120 characters.`,"INVALID_FIELD_LABEL");const fieldKey=fieldLabel.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");if(!fieldKey||keys.has(fieldKey))throw new ApiError(400,"Category attribute names must be unique.","DUPLICATE_CATEGORY_FIELD");keys.add(fieldKey);const fieldType=field.fieldType||"text";if(!supported.has(fieldType))throw new ApiError(400,"Invalid category attribute type.","INVALID_FIELD_TYPE");return{fieldKey,fieldLabel,fieldType,required:field.required!==false,sortOrder:index+1}})}
async function saveFieldDefinitions(connection,categoryId,definitions){for(const field of definitions)await connection.execute("INSERT INTO category_field_templates (category_id,field_key,field_label,field_type,is_required,sort_order) VALUES (?,?,?,?,?,?)",[categoryId,field.fieldKey,field.fieldLabel,field.fieldType,field.required,field.sortOrder]);}
function configuredOptions(){return Object.entries(initialTemplates).map(([name,template])=>({name:name.replace(/\b\w/g,letter=>letter.toUpperCase()).replace("Bos","BOS"),attributes:template.map(([fieldKey,fieldLabel,fieldType])=>({fieldKey,fieldLabel,fieldType,required:true}))}));}
function assertConfigured(name){const option=configuredOptions().find(item=>item.name.toLowerCase()===name.toLowerCase());if(!option)throw new ApiError(400,"Select a valid main category.","INVALID_CATEGORY_OPTION");return option.name;}
module.exports={normalizeName,slugify,fields,seedTemplate,syncTemplate,validateFieldDefinitions,saveFieldDefinitions,configuredOptions,assertConfigured,initialTemplates};
