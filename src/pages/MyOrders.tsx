import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ShoppingBag,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    name: string;
    image_url: string | null;
  };
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  subtotal: number;
  tax: number | null;
  total: number;
  status: string;
  payment_status: string;
  shop: {
    id: string;
    name: string;
  };
}

const statusConfig: Record<string, { icon: any; className: string; label: string }> = {
  pending: { icon: Clock, className: "bg-warning/10 text-warning border-warning/20", label: "Pending" },
  processing: { icon: Package, className: "bg-primary/10 text-primary border-primary/20", label: "Processing" },
  completed: { icon: CheckCircle2, className: "bg-success/10 text-success border-success/20", label: "Completed" },
  cancelled: { icon: XCircle, className: "bg-danger/10 text-danger border-danger/20", label: "Cancelled" },
};

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

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
          total,
          status,
          payment_status,
          shops:shop_id (
            id,
            name
          )
        `)
        .eq("customer_id", user.id)
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

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return; // Already fetched

    setLoadingItems(orderId);
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          id,
          quantity,
          unit_price,
          total_price,
          products:product_id (
            name,
            image_url
          )
        `)
        .eq("order_id", orderId);

      if (error) throw error;

      const formattedItems = data?.map((item) => ({
        ...item,
        product: item.products as unknown as OrderItem["product"],
      })) || [];

      setOrderItems((prev) => ({ ...prev, [orderId]: formattedItems }));
    } catch (error) {
      console.error("Error fetching order items:", error);
    } finally {
      setLoadingItems(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view orders</h1>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to view your order history.
          </p>
          <Link to="/auth">
            <Button className="gradient-primary">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-xl">My Orders</h1>
              <p className="text-sm text-muted-foreground">{orders.length} orders</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here.
            </p>
            <Link to="/">
              <Button className="gradient-primary">Browse Shops</Button>
            </Link>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {orders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const items = orderItems[order.id];

              return (
                <AccordionItem
                  key={order.id}
                  value={order.id}
                  className="border border-border rounded-xl bg-card overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <AccordionTrigger
                    className="px-5 py-4 hover:no-underline hover:bg-muted/50"
                    onClick={() => fetchOrderItems(order.id)}
                  >
                    <div className="flex items-center gap-4 w-full text-left">
                      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0", status.className)}>
                        <StatusIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">
                            {order.order_number}
                          </span>
                          <Badge variant="outline" className={status.className}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Store className="h-3.5 w-3.5" />
                          <span>{order.shop?.name || "Shop"}</span>
                          <span>•</span>
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-primary">₹{order.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    {loadingItems === order.id ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : items ? (
                      <div className="space-y-4">
                        {/* Order Items */}
                        <div className="space-y-3">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                            >
                              <div className="h-12 w-12 rounded-lg bg-background overflow-hidden flex-shrink-0">
                                {item.product?.image_url ? (
                                  <img
                                    src={item.product.image_url}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm line-clamp-1">
                                  {item.product?.name || "Product"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ₹{item.unit_price} × {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold">₹{item.total_price.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>

                        {/* Order Summary */}
                        <div className="border-t border-border pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{order.subtotal.toFixed(2)}</span>
                          </div>
                          {order.tax && order.tax > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Tax</span>
                              <span>₹{order.tax.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-primary">₹{order.total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Reorder Button */}
                        {order.shop && (
                          <Link to={`/shop/${order.shop.id}`}>
                            <Button variant="outline" className="w-full">
                              <Store className="h-4 w-4 mr-2" />
                              Order Again from {order.shop.name}
                            </Button>
                          </Link>
                        )}
                      </div>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}
