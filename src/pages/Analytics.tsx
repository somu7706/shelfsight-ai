import { MainLayout } from "@/components/layout/MainLayout";
import {
  BarChart,
  Bar,
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
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, AlertTriangle } from "lucide-react";

const revenueData = [
  { month: "Jan", revenue: 125000, profit: 28000 },
  { month: "Feb", revenue: 145000, profit: 35000 },
  { month: "Mar", revenue: 132000, profit: 29000 },
  { month: "Apr", revenue: 168000, profit: 42000 },
  { month: "May", revenue: 189000, profit: 51000 },
  { month: "Jun", revenue: 215000, profit: 62000 },
];

const categoryData = [
  { name: "Essentials", value: 35, color: "hsl(142, 72%, 35%)" },
  { name: "Dairy", value: 22, color: "hsl(38, 92%, 50%)" },
  { name: "Beverages", value: 18, color: "hsl(200, 70%, 50%)" },
  { name: "Grains", value: 15, color: "hsl(280, 60%, 50%)" },
  { name: "Others", value: 10, color: "hsl(150, 25%, 60%)" },
];

const topProducts = [
  { name: "Tata Salt (1kg)", sold: 456, revenue: 12768, trend: "up" },
  { name: "Amul Butter (500g)", sold: 234, revenue: 66690, trend: "up" },
  { name: "Maggi Noodles", sold: 389, revenue: 21784, trend: "down" },
  { name: "Aashirvaad Atta", sold: 198, revenue: 63360, trend: "up" },
  { name: "Fortune Oil (1L)", sold: 167, revenue: 30895, trend: "up" },
];

const slowProducts = [
  { name: "Exotic Spice Mix", sold: 12, daysInStock: 45 },
  { name: "Organic Honey", sold: 8, daysInStock: 60 },
  { name: "Premium Basmati", sold: 5, daysInStock: 38 },
];

export default function Analytics() {
  return (
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
            <span className="flex items-center text-sm text-success">
              <TrendingUp className="h-4 w-4 mr-1" />
              +18.2%
            </span>
          </div>
          <p className="text-2xl font-bold font-display text-foreground">₹2,15,000</p>
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
          <p className="text-2xl font-bold font-display text-foreground">₹62,000</p>
          <p className="text-sm text-muted-foreground">Net Profit</p>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-accent" />
            </div>
            <span className="flex items-center text-sm text-danger">
              <TrendingDown className="h-4 w-4 mr-1" />
              -2.3%
            </span>
          </div>
          <p className="text-2xl font-bold font-display text-foreground">₹8,450</p>
          <p className="text-sm text-muted-foreground">Stock Wastage</p>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-secondary-foreground" />
            </div>
            <span className="flex items-center text-sm text-success">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8%
            </span>
          </div>
          <p className="text-2xl font-bold font-display text-foreground">1,234</p>
          <p className="text-sm text-muted-foreground">Monthly Orders</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="p-6 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Top Selling Products
            </h3>
            <span className="text-sm text-muted-foreground">This Month</span>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {index + 1}
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

        {/* Slow Moving Products */}
        <div className="p-6 rounded-xl bg-card border border-warning/30 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-display text-lg font-semibold text-foreground">
              Slow Moving Products
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            These products may need promotions or price adjustments
          </p>
          <div className="space-y-4">
            {slowProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div>
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">Only {product.sold} sold</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-warning">{product.daysInStock} days</p>
                  <p className="text-xs text-muted-foreground">in stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
