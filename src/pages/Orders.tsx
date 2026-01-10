import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  Package,
  XCircle,
  Eye,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  customer: string;
  phone: string;
  items: number;
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  paymentStatus: "paid" | "pending" | "failed";
  time: string;
  date: string;
}

const orders: Order[] = [
  { id: "ORD-2024-001", customer: "Priya Sharma", phone: "+91 98765 43210", items: 8, total: 1245, status: "completed", paymentStatus: "paid", time: "10:30 AM", date: "Today" },
  { id: "ORD-2024-002", customer: "Amit Kumar", phone: "+91 87654 32109", items: 12, total: 2890, status: "processing", paymentStatus: "paid", time: "11:15 AM", date: "Today" },
  { id: "ORD-2024-003", customer: "Sunita Devi", phone: "+91 76543 21098", items: 5, total: 678, status: "pending", paymentStatus: "pending", time: "12:00 PM", date: "Today" },
  { id: "ORD-2024-004", customer: "Ravi Patel", phone: "+91 65432 10987", items: 15, total: 3450, status: "completed", paymentStatus: "paid", time: "2:45 PM", date: "Today" },
  { id: "ORD-2024-005", customer: "Meera Singh", phone: "+91 54321 09876", items: 3, total: 420, status: "cancelled", paymentStatus: "failed", time: "3:30 PM", date: "Today" },
  { id: "ORD-2024-006", customer: "Vikash Gupta", phone: "+91 43210 98765", items: 9, total: 1875, status: "completed", paymentStatus: "paid", time: "9:15 AM", date: "Yesterday" },
  { id: "ORD-2024-007", customer: "Anjali Rao", phone: "+91 32109 87654", items: 6, total: 945, status: "completed", paymentStatus: "paid", time: "4:00 PM", date: "Yesterday" },
];

const statusConfig = {
  pending: { icon: Clock, className: "bg-warning/10 text-warning border-warning/20", label: "Pending" },
  processing: { icon: Package, className: "bg-primary/10 text-primary border-primary/20", label: "Processing" },
  completed: { icon: CheckCircle2, className: "bg-success/10 text-success border-success/20", label: "Completed" },
  cancelled: { icon: XCircle, className: "bg-danger/10 text-danger border-danger/20", label: "Cancelled" },
};

const paymentConfig = {
  paid: { className: "bg-success/10 text-success", label: "Paid" },
  pending: { className: "bg-warning/10 text-warning", label: "Pending" },
  failed: { className: "bg-danger/10 text-danger", label: "Failed" },
};

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "all" || order.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const filters = [
    { key: "all", label: "All Orders" },
    { key: "pending", label: "Pending" },
    { key: "processing", label: "Processing" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Orders & Billing
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage orders and process payments with instant stock updates
          </p>
        </div>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-bold font-display text-foreground">47</p>
          <p className="text-sm text-muted-foreground">Today's Orders</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-bold font-display text-success">₹24,580</p>
          <p className="text-sm text-muted-foreground">Today's Revenue</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-bold font-display text-warning">8</p>
          <p className="text-sm text-muted-foreground">Pending Orders</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-bold font-display text-foreground">₹520</p>
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
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order, index) => {
          const status = statusConfig[order.status];
          const payment = paymentConfig[order.paymentStatus];
          const StatusIcon = status.icon;

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
                    <p className="font-semibold text-foreground">{order.customer}</p>
                    <span className="text-xs text-muted-foreground font-mono">{order.id}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{order.phone}</span>
                    <span>•</span>
                    <span>{order.items} items</span>
                    <span>•</span>
                    <span>{order.time}, {order.date}</span>
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
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}
