const auth=require("../services/auth.service");
const ACCESS_COOKIE="accessToken",REFRESH_COOKIE="refreshToken",LEGACY_COOKIE="mb_session";
const ACCESS_MS=15*60*1000,SEVEN_DAYS_MS=7*24*60*60*1000;
const isProduction=process.env.NODE_ENV==="production";
// The Vercel client and Render API are cross-site, so production cookies must
// explicitly opt in to cross-site credentialed requests.
const sameSite=process.env.COOKIE_SAME_SITE||(isProduction?"none":"lax");
const baseCookie={httpOnly:true,secure:isProduction||sameSite==="none",sameSite};
const metadata=req=>({device:req.get("user-agent"),ip:req.ip});
const clearOptions=path=>({...baseCookie,path});
function setSession(res,result,status=200){const refreshMaxAge=Math.max(0,Math.min(SEVEN_DAYS_MS,result.expiresAt.getTime()-Date.now()));return res.status(status).clearCookie(LEGACY_COOKIE,clearOptions("/")).cookie(ACCESS_COOKIE,result.accessToken,{...baseCookie,maxAge:ACCESS_MS,path:"/"}).cookie(REFRESH_COOKIE,result.refreshToken,{...baseCookie,maxAge:refreshMaxAge,expires:result.expiresAt,path:"/api/auth"}).json({success:true,user:result.user});}
function clearSessionCookies(res){return res.clearCookie(ACCESS_COOKIE,clearOptions("/")).clearCookie(REFRESH_COOKIE,clearOptions("/api/auth")).clearCookie(LEGACY_COOKIE,clearOptions("/"));}
exports.register=async(req,res)=>req.body.role==="seller"?res.status(201).json({user:await auth.registerSeller(req.body)}):setSession(res,await auth.registerCustomer(req.body,metadata(req)),201);
exports.registerSeller=async(req,res)=>res.status(201).json({user:await auth.registerSeller(req.body)});
exports.login=async(req,res)=>setSession(res,await auth.login(req.body.email,req.body.password,metadata(req)));
exports.refresh=async(req,res)=>{try{return setSession(res,await auth.refreshSession(req.cookies[REFRESH_COOKIE],metadata(req)));}catch(error){clearSessionCookies(res);throw error;}};
exports.forgotPassword=async(req,res)=>res.json(await auth.forgotPassword(req.body.email));
exports.resetPassword=async(req,res)=>res.json(await auth.resetPassword(req.body.token,req.body.password));
exports.logout=async(req,res)=>{await auth.logout(req.cookies[REFRESH_COOKIE],req.cookies[ACCESS_COOKIE]||req.cookies[LEGACY_COOKIE]);clearSessionCookies(res).status(204).end();};
exports.me=async(req,res)=>res.json(req.user?{authenticated:true,user:auth.publicUser(req.user)}:{authenticated:false,user:null});
