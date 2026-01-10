import { MainLayout } from "@/components/layout/MainLayout";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Package, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export default function Inventory() {
  return (
    <ProtectedRoute>
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

        {/* Inventory Table */}
        <InventoryTable />
      </MainLayout>
    </ProtectedRoute>
  );
}
