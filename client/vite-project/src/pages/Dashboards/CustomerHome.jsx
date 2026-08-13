import CustomerLayout from "../../layout/customer/CustomerLayout";

import WelcomeCard from "../../components/customer/WelcomeCard";
import StatsCards from "../../components/customer/StatsCards";
import QuickActions from "../../components/customer/QuickActions";
import RecentActivity from "../../components/customer/RecentActivity";
import FeaturedProducts from "../../components/customer/FeaturedProducts";
import {useEffect,useState} from "react";
import {getCustomerDashboard} from "../../services/customerDashboardService";

export default function CustomerHome() {
  const [data,setData]=useState({customer:null,stats:{},activity:[],featuredProducts:[]});
  const [loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;getCustomerDashboard().then(({data:response})=>active&&setData(response)).catch(()=>{}).finally(()=>active&&setLoading(false));return()=>{active=false}},[]);
  return (
    <CustomerLayout title="Dashboard">
      <div className="space-y-6">
        <WelcomeCard customer={data.customer} loading={loading} />

        <StatsCards stats={data.stats} loading={loading} />

        <QuickActions stats={data.stats} />

        <RecentActivity activities={data.activity} loading={loading} />

        <FeaturedProducts products={data.featuredProducts} loading={loading} />

      </div>
    </CustomerLayout>
  );
}
