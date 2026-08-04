import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PageLoader from "../components/Loader/PageLoader";
import ProtectedRoute from "../components/ProtectedRoute";

const MINIMUM_TRANSITION_MS = 800;
const lazyPage = (importer) => lazy(() => Promise.all([
  importer(),
  new Promise((resolve) => window.setTimeout(resolve, MINIMUM_TRANSITION_MS)),
]).then(([module]) => module));

const Home = lazyPage(() => import("../pages/Home"));
const Catalogue = lazyPage(() => import("../pages/Products/Catalogue"));
const Companies = lazyPage(() => import("../pages/Company"));
const AuthPage = lazyPage(() => import("../pages/Auth/AuthPage"));
const CustomerHome = lazyPage(() => import("../pages/Dashboards/CustomerHome"));
const SellerDashboard = lazyPage(() => import("../pages/Dashboards/SellerDashboard"));
const AdminDashboard = lazyPage(() => import("../pages/Dashboards/AdminDashboard"));

export default function AppRoutes() {
  return <Suspense fallback={<PageLoader />}><Routes><Route path="/" element={<Home />} /><Route path="/catalogue" element={<Catalogue />} /><Route path="/companies" element={<Companies />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route element={<ProtectedRoute roles={["Customer"]} />}><Route path="/customer/home" element={<CustomerHome />} /></Route><Route element={<ProtectedRoute roles={["Seller"]} />}><Route path="/seller/dashboard" element={<SellerDashboard />} /></Route><Route element={<ProtectedRoute roles={["Admin"]} />}><Route path="/admin/dashboard" element={<AdminDashboard />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense>;
}
