import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryForecast } from "@/components/inventory/InventoryForecast";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Brain } from "lucide-react";

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

        {/* Tabs */}
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2">
              <Brain className="h-4 w-4" />
              AI Forecast
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <InventoryTable />
          </TabsContent>

          <TabsContent value="forecast">
            <InventoryForecast />
          </TabsContent>
        </Tabs>
      </MainLayout>
    </ProtectedRoute>
  );
}
