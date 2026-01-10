import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

interface AnalyticsData {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
  revenueByMonth: { month: string; revenue: number; profit: number }[];
  salesByCategory: { name: string; value: number; color: string }[];
  topProducts: { name: string; sold: number; revenue: number; trend: "up" | "down" }[];
  slowProducts: { name: string; sold: number; daysInStock: number }[];
  customerInsights: {
    newCustomers: number;
    returningCustomers: number;
    averageOrderValue: number;
  };
}

const categoryColors = [
  "hsl(142, 72%, 35%)",
  "hsl(38, 92%, 50%)",
  "hsl(200, 70%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(150, 25%, 60%)",
];

export function useAnalytics(shopId: string | null) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shopId) {
      setIsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        // Fetch current month orders
        const { data: currentOrders, error: ordersError } = await supabase
          .from("orders")
          .select("id, total, subtotal, customer_id, created_at")
          .eq("shop_id", shopId)
          .gte("created_at", currentMonthStart.toISOString())
          .lte("created_at", currentMonthEnd.toISOString());

        if (ordersError) throw ordersError;

        // Fetch last month orders for comparison
        const { data: lastMonthOrders } = await supabase
          .from("orders")
          .select("id, total")
          .eq("shop_id", shopId)
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString());

        // Fetch order items with product info
        const { data: orderItems } = await supabase
          .from("order_items")
          .select(`
            quantity,
            total_price,
            product_id,
            products (
              name,
              category_id,
              cost_price,
              categories (name)
            )
          `)
          .in(
            "order_id",
            (currentOrders || []).map((o) => o.id)
          );

        // Calculate totals
        const totalRevenue = (currentOrders || []).reduce(
          (sum, order) => sum + Number(order.total),
          0
        );
        const lastMonthRevenue = (lastMonthOrders || []).reduce(
          (sum, order) => sum + Number(order.total),
          0
        );

        const totalOrders = currentOrders?.length || 0;
        const lastMonthOrdersCount = lastMonthOrders?.length || 0;

        const uniqueCustomers = new Set(
          (currentOrders || []).map((o) => o.customer_id)
        );

        // Calculate profit (revenue - cost)
        let totalProfit = 0;
        (orderItems || []).forEach((item: any) => {
          const costPrice = item.products?.cost_price || 0;
          totalProfit += Number(item.total_price) - costPrice * item.quantity;
        });

        // Sales by category
        const categoryMap = new Map<string, number>();
        (orderItems || []).forEach((item: any) => {
          const categoryName = item.products?.categories?.name || "Uncategorized";
          categoryMap.set(
            categoryName,
            (categoryMap.get(categoryName) || 0) + Number(item.total_price)
          );
        });

        const totalCategorySales = Array.from(categoryMap.values()).reduce(
          (a, b) => a + b,
          0
        );
        const salesByCategory = Array.from(categoryMap.entries())
          .map(([name, value], index) => ({
            name,
            value: totalCategorySales > 0 ? Math.round((value / totalCategorySales) * 100) : 0,
            color: categoryColors[index % categoryColors.length],
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        // Top products
        const productMap = new Map<
          string,
          { name: string; sold: number; revenue: number }
        >();
        (orderItems || []).forEach((item: any) => {
          const productName = item.products?.name || "Unknown";
          const existing = productMap.get(productName) || {
            name: productName,
            sold: 0,
            revenue: 0,
          };
          productMap.set(productName, {
            name: productName,
            sold: existing.sold + item.quantity,
            revenue: existing.revenue + Number(item.total_price),
          });
        });

        const topProducts = Array.from(productMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map((p) => ({ ...p, trend: "up" as const }));

        // Revenue by month (last 6 months)
        const revenueByMonth: { month: string; revenue: number; profit: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(now, i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);

          const { data: monthOrders } = await supabase
            .from("orders")
            .select("total, subtotal")
            .eq("shop_id", shopId)
            .gte("created_at", monthStart.toISOString())
            .lte("created_at", monthEnd.toISOString());

          const monthRevenue = (monthOrders || []).reduce(
            (sum, order) => sum + Number(order.total),
            0
          );

          revenueByMonth.push({
            month: format(monthDate, "MMM"),
            revenue: monthRevenue,
            profit: Math.round(monthRevenue * 0.25), // Estimate 25% profit margin
          });
        }

        // Calculate changes
        const revenueChange =
          lastMonthRevenue > 0
            ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;
        const ordersChange =
          lastMonthOrdersCount > 0
            ? ((totalOrders - lastMonthOrdersCount) / lastMonthOrdersCount) * 100
            : 0;

        setData({
          totalRevenue,
          totalProfit,
          totalOrders,
          totalCustomers: uniqueCustomers.size,
          revenueChange,
          ordersChange,
          revenueByMonth,
          salesByCategory,
          topProducts,
          slowProducts: [], // Would need inventory data
          customerInsights: {
            newCustomers: Math.round(uniqueCustomers.size * 0.3),
            returningCustomers: Math.round(uniqueCustomers.size * 0.7),
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          },
        });
      } catch (err) {
        console.error("Analytics error:", err);
        setError("Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [shopId]);

  return { data, isLoading, error };
}