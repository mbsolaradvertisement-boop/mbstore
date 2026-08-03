import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
const Home=lazy(()=>import("../pages/Home"));
const Catalogue=lazy(()=>import("../pages/Products/Catalogue"));
const Companies=lazy(()=>import("../pages/Company"));
const Loading=()=> <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" aria-label="Loading page"/></div>;
export default function AppRoutes(){return <Suspense fallback={<Loading/>}><Routes><Route path="/" element={<Home/>}/><Route path="/catalogue" element={<Catalogue/>}/><Route path="/companies" element={<Companies/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Suspense>}
