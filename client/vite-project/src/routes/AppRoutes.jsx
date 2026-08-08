import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PageLoader from "../components/Loader/PageLoader";
import ProtectedRoute from "../components/ProtectedRoute";

const MINIMUM_TRANSITION_MS = 800;
const lazyPage = importer => lazy(() => Promise.all([importer(), new Promise(resolve => window.setTimeout(resolve, MINIMUM_TRANSITION_MS))]).then(([module]) => module));
const Home=lazyPage(()=>import("../pages/Home")), Catalogue=lazyPage(()=>import("../pages/Products/Catalogue")), Companies=lazyPage(()=>import("../pages/Company")), AuthPage=lazyPage(()=>import("../pages/Auth/AuthPage"));
const CustomerHome=lazyPage(()=>import("../pages/Dashboards/CustomerHome")), SellerLayout=lazyPage(()=>import("../pages/Dashboards/SellerLayout")), SellerPages=lazyPage(()=>import("../pages/Dashboards/SellerPages")), AdminDashboard=lazyPage(()=>import("../pages/Dashboards/AdminDashboard"));
const CustomerProfilePage=lazyPage(()=>import("../pages/Profiles/ProfilePage").then(m=>({default:m.CustomerProfilePage}))), SellerProfilePage=lazyPage(()=>import("../pages/Profiles/ProfilePage").then(m=>({default:m.SellerProfilePage}))), ProfileManagement=lazyPage(()=>import("../pages/Admin/ProfileManagement"));

export default function AppRoutes() {
  return <Suspense fallback={<PageLoader/>}><Routes>
    <Route path="/" element={<Home/>}/><Route path="/catalogue" element={<Catalogue/>}/><Route path="/companies" element={<Companies/>}/><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route element={<ProtectedRoute roles={["Customer"]}/>}> <Route path="/customer/home" element={<CustomerHome/>}/><Route path="/customer/profile" element={<CustomerProfilePage/>}/></Route>
    <Route element={<ProtectedRoute roles={["Seller"]}/>}> <Route path="/seller" element={<SellerLayout/>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="profile" element={<SellerProfilePage/>}/><Route path=":section" element={<SellerPages/>}/></Route></Route>
    <Route element={<ProtectedRoute roles={["Admin"]}/>}> <Route path="/admin/dashboard" element={<AdminDashboard/>}/><Route path="/admin/sellers" element={<ProfileManagement type="sellers"/>}/><Route path="/admin/customers" element={<ProfileManagement type="customers"/>}/></Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Suspense>;
}
