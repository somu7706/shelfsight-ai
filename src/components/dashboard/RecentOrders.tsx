import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Package, XCircle } from "lucide-react";

const orders = [
  {
    id: "ORD-001",
    customer: "Priya Sharma",
    items: 8,
    total: "₹1,245",
    status: "completed",
    time: "10 min ago",
  },
  {
    id: "ORD-002",
    customer: "Amit Kumar",
    items: 12,
    total: "₹2,890",
    status: "processing",
    time: "25 min ago",
  },
  {
    id: "ORD-003",
    customer: "Sunita Devi",
    items: 5,
    total: "₹678",
    status: "pending",
    time: "1 hour ago",
  },
  {
    id: "ORD-004",
    customer: "Ravi Patel",
    items: 15,
    total: "₹3,450",
    status: "completed",
    time: "2 hours ago",
  },
  {
    id: "ORD-005",
    customer: "Meera Singh",
    items: 3,
    total: "₹420",
    status: "cancelled",
    time: "3 hours ago",
  },
];

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
    label: "Completed",
  },
  processing: {
    icon: Package,
    className: "bg-primary/10 text-primary border-primary/20",
    label: "Processing",
  },
  pending: {
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/20",
    label: "Pending",
  },
  cancelled: {
    icon: XCircle,
    className: "bg-danger/10 text-danger border-danger/20",
    label: "Cancelled",
  },
};

export function RecentOrders() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Recent Orders
          </h3>
          <p className="text-sm text-muted-foreground">Today's order activity</p>
        </div>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {orders.map((order, index) => {
          const status = statusConfig[order.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;

          return (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-sm font-semibold text-secondary-foreground">
                    {order.customer.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{order.customer}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.items} items • {order.time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-foreground">{order.total}</span>
                <Badge
                  variant="outline"
                  className={status.className}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
