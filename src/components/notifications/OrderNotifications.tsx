import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface OrderNotification {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  read: boolean;
}

interface OrderNotificationsProps {
  shopId: string;
}

export function OrderNotifications({ shopId }: OrderNotificationsProps) {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!shopId) return;

    // Fetch initial orders from last 24 hours
    const fetchRecentOrders = async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, status, created_at")
        .eq("shop_id", shopId)
        .gte("created_at", yesterday.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(
          data.map((order) => ({
            ...order,
            read: false,
          }))
        );
        setUnreadCount(data.length);
      }
    };

    fetchRecentOrders();

    // Subscribe to real-time order updates
    const channel = supabase
      .channel(`orders-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          const newOrder = payload.new as any;
          
          // Show toast notification
          toast({
            title: "🛒 New Order Received!",
            description: `Order #${newOrder.order_number} - ₹${newOrder.total.toLocaleString()}`,
          });

          // Add to notifications list
          setNotifications((prev) => [
            {
              id: newOrder.id,
              order_number: newOrder.order_number,
              total: newOrder.total,
              status: newOrder.status,
              created_at: newOrder.created_at,
              read: false,
            },
            ...prev.slice(0, 9),
          ]);
          setUnreadCount((prev) => prev + 1);

          // Play notification sound
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          const updatedOrder = payload.new as any;
          
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedOrder.id
                ? { ...n, status: updatedOrder.status }
                : n
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, toast]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success";
      case "pending":
        return "bg-warning/10 text-warning";
      case "cancelled":
        return "bg-danger/10 text-danger";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-danger text-danger-foreground text-xs flex items-center justify-center font-bold animate-scale-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="font-semibold text-foreground">Order Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={markAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors",
                  !notification.read && "bg-primary/5"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm">
                      Order #{notification.order_number}
                    </p>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ₹{notification.total.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", getStatusColor(notification.status))}
                    >
                      {notification.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => removeNotification(notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 border-t border-border">
            <Button
              variant="ghost"
              className="w-full text-sm text-primary"
              onClick={() => setIsOpen(false)}
            >
              View All Orders
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}