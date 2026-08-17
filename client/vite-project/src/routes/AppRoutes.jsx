import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PageLoader from "../components/Loader/PageLoader";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

const MINIMUM_TRANSITION_MS = 800;
const lazyPage = importer => lazy(() => Promise.all([importer(), new Promise(resolve => window.setTimeout(resolve, MINIMUM_TRANSITION_MS))]).then(([module]) => module));
const Home=lazyPage(()=>import("../pages/Home")), Catalogue=lazyPage(()=>import("../pages/Products/Catalogue")), Companies=lazyPage(()=>import("../pages/Company")), AuthPage=lazyPage(()=>import("../pages/Auth/AuthPage"));
const CustomerHome=lazyPage(()=>import("../pages/Dashboards/CustomerHome")), SellerLayout=lazyPage(()=>import("../pages/Dashboards/SellerLayout")), SellerPages=lazyPage(()=>import("../pages/Dashboards/SellerPages")), AdminDashboard=lazyPage(()=>import("../pages/Dashboards/AdminDashboard"));
const CustomerProfilePage=lazyPage(()=>import("../pages/Profiles/ProfilePage").then(m=>({default:m.CustomerProfilePage}))), SellerProfilePage=lazyPage(()=>import("../pages/Profiles/ProfilePage").then(m=>({default:m.SellerProfilePage}))), ProfileManagement=lazyPage(()=>import("../pages/Admin/ProfileManagement"));
const CustomerSettings=lazyPage(()=>import("../pages/Profiles/CustomerSettings"));
const CompanyManagement=lazyPage(()=>import("../pages/Admin/CompanyManagement"));
const Categories=lazyPage(()=>import("../pages/Admin/Categories"));
const ProductManagement=lazyPage(()=>import("../pages/Admin/ProductManagement"));
const AnalyticsPage=lazyPage(()=>import("../pages/Admin/AnalyticsPage"));
const SellerProducts=lazyPage(()=>import("../pages/Seller/Products"));
const ProductForm=lazyPage(()=>import("../pages/Seller/ProductForm"));
const CustomerQuotations=lazyPage(()=>import("../pages/Customer/Quotations"));
const SellerQuotations=lazyPage(()=>import("../pages/Seller/Quotations"));
const SellerNotifications=lazyPage(()=>import("../pages/Seller/Notifications"));
const CustomerNotifications=lazyPage(()=>import("../pages/Customer/Notifications"));
const CustomerWishlist=lazyPage(()=>import("../pages/Customer/Wishlist"));
const SupportManagement=lazyPage(()=>import("../pages/Admin/SupportManagement"));
const SupportLayout=lazyPage(()=>import("../pages/Support/SupportLayout"));
const SupportDashboard=lazyPage(()=>import("../pages/Support/SupportDashboard"));
const SupportProfile=lazyPage(()=>import("../pages/Support/SupportProfile"));
const SupportTickets=lazyPage(()=>import("../pages/Support/SupportTickets"));
const SupportDataPage=lazyPage(()=>import("../pages/Support/SupportDataPage"));
const SupportFollowUps=lazyPage(()=>import("../pages/Support/SupportFollowUps"));
const SupportNotifications=lazyPage(()=>import("../pages/Support/SupportNotifications"));
const CustomerSupportTickets=lazyPage(()=>import("../pages/Customer/SupportTickets"));
const MySupportTickets=lazyPage(()=>import("../pages/Support/MySupportTickets"));

const dashboardFor = role => role === "Admin" ? "/admin/dashboard" : role === "Seller" ? "/seller/dashboard" : role === "Support" ? "/support/dashboard" : "/customer/home";
function HomeEntry() { const {user,checking}=useAuth(); if(checking)return <PageLoader/>; return user?<Navigate to={dashboardFor(user.role)} replace/>:<Home/>; }
function GuestAuthPage({mode}) { const {user,checking}=useAuth(); if(checking)return <PageLoader/>; return user?<Navigate to={dashboardFor(user.role)} replace/>:<AuthPage mode={mode}/>; }

export default function AppRoutes() {
  return <Suspense fallback={<PageLoader/>}><Routes>
    <Route path="/" element={<HomeEntry/>}/><Route path="/catalogue" element={<Catalogue/>}/><Route path="/companies" element={<Companies/>}/><Route path="/login" element={<GuestAuthPage mode="login"/>}/><Route path="/register" element={<GuestAuthPage mode="register"/>}/>
    <Route element={<ProtectedRoute roles={["Customer"]}/>}> <Route path="/customer/home" element={<CustomerHome/>}/><Route path="/customer/profile" element={<CustomerProfilePage/>}/><Route path="/customer/settings" element={<CustomerSettings/>}/><Route path="/customer/quotations" element={<CustomerQuotations/>}/><Route path="/customer/notifications" element={<CustomerNotifications/>}/><Route path="/customer/wishlist" element={<CustomerWishlist/>}/><Route path="/customer/support" element={<CustomerSupportTickets/>}/></Route>
    <Route element={<ProtectedRoute roles={["Seller"]}/>}> <Route path="/seller" element={<SellerLayout/>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="profile" element={<SellerProfilePage/>}/><Route path="products" element={<SellerProducts/>}/><Route path="products/new" element={<ProductForm/>}/><Route path="products/:id/edit" element={<ProductForm/>}/><Route path="quotations" element={<SellerQuotations/>}/><Route path="notifications" element={<SellerNotifications/>}/><Route path="support" element={<MySupportTickets/>}/><Route path=":section" element={<SellerPages/>}/></Route></Route>
    <Route element={<ProtectedRoute roles={["Admin"]}/>}> <Route path="/admin/dashboard" element={<AdminDashboard/>}/><Route path="/admin/analytics" element={<AnalyticsPage/>}/><Route path="/admin/companies" element={<CompanyManagement/>}/><Route path="/admin/products" element={<ProductManagement/>}/><Route path="/admin/categories" element={<Categories/>}/><Route path="/admin/sellers" element={<ProfileManagement type="sellers"/>}/><Route path="/admin/customers" element={<ProfileManagement type="customers"/>}/><Route path="/admin/support" element={<SupportManagement/>}/></Route>
    <Route element={<ProtectedRoute roles={["Support"]}/>}> <Route path="/support" element={<SupportLayout/>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<SupportDashboard/>}/><Route path="tickets" element={<SupportTickets/>}/><Route path="tickets/my" element={<SupportTickets/>}/><Route path="tickets/unassigned" element={<SupportTickets/>}/><Route path="tickets/high-priority" element={<SupportTickets/>}/><Route path="tickets/resolved" element={<SupportTickets/>}/><Route path="customers" element={<SupportDataPage type="customers"/>}/><Route path="sellers" element={<SupportDataPage type="sellers"/>}/><Route path="quotations" element={<SupportDataPage type="quotations"/>}/><Route path="conversations" element={<SupportTickets/>}/><Route path="follow-ups" element={<SupportFollowUps/>}/><Route path="notifications" element={<SupportNotifications/>}/><Route path="profile" element={<SupportProfile/>}/></Route></Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Suspense>;
}
