import {
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SalesChart } from "@/components/dashboard/SalesChart";

export default function Dashboard() {
  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome back, Rajesh! 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              Here's what's happening with your store today.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex h-2 w-2 rounded-full bg-success pulse-dot" />
            Store is open
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Revenue"
          value="₹24,580"
          change="+12.5%"
          changeType="positive"
          description="vs yesterday"
          icon={IndianRupee}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Orders"
          value="47"
          change="+8 orders"
          changeType="positive"
          description="today"
          icon={ShoppingCart}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Products"
          value="1,284"
          change="4 low stock"
          changeType="negative"
          description="needs attention"
          icon={Package}
          iconColor="bg-accent/10 text-accent"
        />
        <StatCard
          title="Customers"
          value="892"
          change="+23"
          changeType="positive"
          description="this week"
          icon={Users}
          iconColor="bg-secondary text-secondary-foreground"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart */}
        <div className="lg:col-span-2 space-y-6">
          <SalesChart />
          <RecentOrders />
        </div>

        {/* Right Column - Alerts & Actions */}
        <div className="space-y-6">
          <QuickActions />
          <LowStockAlert />
        </div>
      </div>
    </MainLayout>
  );
}
