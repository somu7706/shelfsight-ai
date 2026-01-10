import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, AlertTriangle, Users, Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Analytics() {
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (data) setShopId(data.id);
    };
    fetchShop();
  }, [user]);

  const { data, isLoading, error } = useAnalytics(shopId);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  // Fallback data for demo
  const revenueData = data?.revenueByMonth || [
    { month: "Jan", revenue: 125000, profit: 28000 },
    { month: "Feb", revenue: 145000, profit: 35000 },
    { month: "Mar", revenue: 132000, profit: 29000 },
    { month: "Apr", revenue: 168000, profit: 42000 },
    { month: "May", revenue: 189000, profit: 51000 },
    { month: "Jun", revenue: 215000, profit: 62000 },
  ];

  const categoryData = data?.salesByCategory.length ? data.salesByCategory : [
    { name: "Essentials", value: 35, color: "hsl(142, 72%, 35%)" },
    { name: "Dairy", value: 22, color: "hsl(38, 92%, 50%)" },
    { name: "Beverages", value: 18, color: "hsl(200, 70%, 50%)" },
    { name: "Grains", value: 15, color: "hsl(280, 60%, 50%)" },
    { name: "Others", value: 10, color: "hsl(150, 25%, 60%)" },
  ];

  const topProducts = data?.topProducts.length ? data.topProducts : [
    { name: "Tata Salt (1kg)", sold: 456, revenue: 12768, trend: "up" as const },
    { name: "Amul Butter (500g)", sold: 234, revenue: 66690, trend: "up" as const },
    { name: "Maggi Noodles", sold: 389, revenue: 21784, trend: "down" as const },
    { name: "Aashirvaad Atta", sold: 198, revenue: 63360, trend: "up" as const },
    { name: "Fortune Oil (1L)", sold: 167, revenue: 30895, trend: "up" as const },
  ];

  const totalRevenue = data?.totalRevenue || 215000;
  const totalProfit = data?.totalProfit || 62000;
  const totalOrders = data?.totalOrders || 1234;
  const revenueChange = data?.revenueChange || 18.2;
  const ordersChange = data?.ordersChange || 8;
  const customerInsights = data?.customerInsights || {
    newCustomers: 45,
    returningCustomers: 123,
    averageOrderValue: 850,
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Analytics & Insights
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track performance, identify trends, and optimize your business
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-xl bg-card border border-border shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <span className={`flex items-center text-sm ${revenueChange >= 0 ? "text-success" : "text-danger"}`}>
                {revenueChange >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}%
              </span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="flex items-center text-sm text-success">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12.5%
              </span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">₹{totalProfit.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Net Profit</p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <span className="flex items-center text-sm text-success">
                <TrendingUp className="h-4 w-4 mr-1" />
                +{customerInsights.newCustomers}
              </span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{customerInsights.returningCustomers + customerInsights.newCustomers}</p>
            <p className="text-sm text-muted-foreground">Total Customers</p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-secondary-foreground" />
              </div>
              <span className={`flex items-center text-sm ${ordersChange >= 0 ? "text-success" : "text-danger"}`}>
                {ordersChange >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {ordersChange >= 0 ? "+" : ""}{ordersChange.toFixed(0)}%
              </span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{totalOrders.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Monthly Orders</p>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">New Customers</p>
            <p className="text-2xl font-bold text-foreground">{customerInsights.newCustomers}</p>
          </div>
          <div className="p-5 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
            <p className="text-sm text-muted-foreground mb-1">Returning Customers</p>
            <p className="text-2xl font-bold text-foreground">{customerInsights.returningCustomers}</p>
          </div>
          <div className="p-5 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
            <p className="text-sm text-muted-foreground mb-1">Avg. Order Value</p>
            <p className="text-2xl font-bold text-foreground">₹{customerInsights.averageOrderValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="p-6 rounded-xl bg-card border border-border shadow-card">
            <h3 className="font-display text-lg font-semibold text-foreground mb-6">
              Revenue & Profit Trend
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 15%, 88%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(150, 10%, 45%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(150, 10%, 45%)", fontSize: 12 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(140, 15%, 88%)",
                      borderRadius: "12px",
                    }}
                    formatter={(value: number) => `₹${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(142, 72%, 35%)" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="profit" stroke="hsl(38, 92%, 50%)" strokeWidth={2} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="p-6 rounded-xl bg-card border border-border shadow-card">
            <h3 className="font-display text-lg font-semibold text-foreground mb-6">
              Sales by Category
            </h3>
            <div className="h-[300px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="p-6 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Top Selling Products
            </h3>
            <span className="text-sm text-muted-foreground">This Month</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary text-sm font-bold">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sold} units sold</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">₹{product.revenue.toLocaleString()}</span>
                  {product.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-danger" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
