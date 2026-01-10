import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceDownload } from "@/components/orders/InvoiceDownload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  Package,
  XCircle,
  Eye,
  FileText,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  subtotal: number;
  tax: number | null;
  discount: number | null;
  total: number;
  status: string;
  payment_status: string;
  notes: string | null;
  customer_id: string;
  shop: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    gst_number: string | null;
  };
  order_items: { count: number }[];
}

const statusConfig: Record<string, { icon: any; className: string; label: string }> = {
  pending: { icon: Clock, className: "bg-warning/10 text-warning border-warning/20", label: "Pending" },
  processing: { icon: Package, className: "bg-primary/10 text-primary border-primary/20", label: "Processing" },
  completed: { icon: CheckCircle2, className: "bg-success/10 text-success border-success/20", label: "Completed" },
  cancelled: { icon: XCircle, className: "bg-danger/10 text-danger border-danger/20", label: "Cancelled" },
};

const paymentConfig: Record<string, { className: string; label: string }> = {
  paid: { className: "bg-success/10 text-success", label: "Paid" },
  pending: { className: "bg-warning/10 text-warning", label: "Pending" },
  failed: { className: "bg-danger/10 text-danger", label: "Failed" },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const { shopId } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (shopId) {
      fetchOrders();
    }
  }, [shopId]);

  const fetchOrders = async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          created_at,
          subtotal,
          tax,
          discount,
          total,
          status,
          payment_status,
          notes,
          customer_id,
          shops:shop_id (
            name,
            address,
            phone,
            email,
            gst_number
          ),
          order_items (count)
        `)
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedOrders = data?.map((order) => ({
        ...order,
        shop: order.shops as unknown as Order["shop"],
      })) || [];

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}.`,
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order.",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "all" || order.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const filters = [
    { key: "all", label: "All Orders" },
    { key: "pending", label: "Pending" },
    { key: "processing", label: "Processing" },
    { key: "completed", label: "Completed" },
  ];

  // Stats calculations
  const todayOrders = orders.filter((o) => {
    const orderDate = new Date(o.created_at).toDateString();
    return orderDate === new Date().toDateString();
  });

  const todayRevenue = todayOrders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const avgOrderValue = orders.length > 0
    ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length
    : 0;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const orderDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (orderDate.toDateString() === today.toDateString()) return "Today";
    if (orderDate.toDateString() === yesterday.toDateString()) return "Yesterday";
    return orderDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Orders & Billing
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage orders, update status, and download invoices
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-card border border-border shadow-card">
            <p className="text-2xl font-bold font-display text-foreground">{todayOrders.length}</p>
            <p className="text-sm text-muted-foreground">Today's Orders</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border shadow-card">
            <p className="text-2xl font-bold font-display text-success">₹{todayRevenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Today's Revenue</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border shadow-card">
            <p className="text-2xl font-bold font-display text-warning">{pendingOrders}</p>
            <p className="text-sm text-muted-foreground">Pending Orders</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border shadow-card">
            <p className="text-2xl font-bold font-display text-foreground">₹{avgOrderValue.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Avg. Order Value</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  activeFilter === filter.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-1">No orders found</h3>
            <p className="text-sm text-muted-foreground">
              {orders.length === 0
                ? "Orders will appear here when customers make purchases."
                : "Try a different search term or filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const payment = paymentConfig[order.payment_status] || paymentConfig.pending;
              const StatusIcon = status.icon;
              const itemCount = order.order_items?.[0]?.count || 0;

              return (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-shadow animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", status.className)}>
                      <StatusIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground font-mono">{order.order_number}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{itemCount} items</span>
                        <span>•</span>
                        <span>{formatTime(order.created_at)}, {formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-xl font-bold font-display text-foreground">₹{order.total.toLocaleString()}</p>
                      <Badge variant="outline" className={payment.className}>
                        {payment.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className={cn("w-32", status.className)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => {
                          setSelectedOrder(order);
                          setInvoiceOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <InvoiceDownload
          order={selectedOrder}
          open={invoiceOpen}
          onOpenChange={setInvoiceOpen}
        />
      </MainLayout>
    </ProtectedRoute>
  );
}
