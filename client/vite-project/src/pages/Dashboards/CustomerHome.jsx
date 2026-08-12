import CustomerLayout from "../../layout/customer/CustomerLayout";

import WelcomeCard from "../../components/customer/WelcomeCard";
import StatsCards from "../../components/customer/StatsCards";
import QuickActions from "../../components/customer/QuickActions";
import RecentActivity from "../../components/customer/RecentActivity";
import FeaturedProducts from "../../components/customer/FeaturedProducts";

export default function CustomerHome() {
  return (
    <CustomerLayout title="Dashboard">
      <div className="space-y-6">
        <WelcomeCard />

        <StatsCards />

        <QuickActions />

        <RecentActivity />

        <FeaturedProducts />

      </div>
    </CustomerLayout>
  );
}
