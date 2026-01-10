import { MainLayout } from "@/components/layout/MainLayout";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { Package, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const stats = [
  { label: "Total Products", value: "1,284", icon: Package, color: "bg-primary/10 text-primary" },
  { label: "In Stock", value: "1,156", icon: CheckCircle, color: "bg-success/10 text-success" },
  { label: "Low Stock", value: "89", icon: AlertTriangle, color: "bg-warning/10 text-warning" },
  { label: "Out of Stock", value: "39", icon: TrendingUp, color: "bg-danger/10 text-danger" },
];

export default function Inventory() {
  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Inventory Management
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track stock levels, manage products, and optimize inventory
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Table */}
      <InventoryTable />
    </MainLayout>
  );
}
