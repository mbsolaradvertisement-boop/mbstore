import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function ProfileCompletionPrompt({ role, onProfile }) {
  const [profile, setProfile] = useState(null); const [open, setOpen] = useState(false);
  const navigate = useNavigate(); const location = useLocation(); const lower = role.toLowerCase();
  useEffect(() => { let active = true; api.get(`/${lower}/profile`).then(({data}) => { if (!active) return; setProfile(data.profile); onProfile?.(data.profile); const key=`mb-profile-prompt-${lower}`; if (!data.profile.isComplete && location.pathname !== `/${lower}/profile` && !sessionStorage.getItem(key)) { sessionStorage.setItem(key,"shown"); setOpen(true); } }).catch(()=>{}); return()=>{active=false}; }, [lower, location.pathname, onProfile]);
  if (!open || !profile) return null;
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4"><motion.div initial={{opacity:0,scale:.96,y:12}} animate={{opacity:1,scale:1,y:0}} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><p className="text-xs font-black uppercase tracking-[.18em] text-teal-700">MB Store</p><h2 className="mt-2 text-2xl font-black">Complete Your Profile</h2><p className="mt-2 text-sm leading-6 text-slate-500">Please complete your profile to get full access to MB Store.</p><div className="mt-6 flex items-end justify-between"><span className="text-sm font-bold">Profile Completion</span><strong className="text-2xl text-teal-700">{profile.profileCompletion}%</strong></div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600 transition-all" style={{width:`${profile.profileCompletion}%`}}/></div><p className="mt-3 text-xs text-slate-400">Missing: {profile.missingFields.join(", ")}</p><div className="mt-7 flex gap-3"><button onClick={()=>navigate(`/${lower}/profile`)} className="flex-1 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white">Complete Profile</button><button onClick={()=>setOpen(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600">Later</button></div></motion.div></div>;
}
