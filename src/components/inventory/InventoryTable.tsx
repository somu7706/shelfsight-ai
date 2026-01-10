import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  sku: string;
}

const products: Product[] = [
  { id: "1", name: "Tata Salt (1kg)", category: "Essentials", price: 28, cost: 22, stock: 45, minStock: 20, status: "in-stock", sku: "SKU001" },
  { id: "2", name: "Amul Butter (500g)", category: "Dairy", price: 285, cost: 250, stock: 3, minStock: 15, status: "low-stock", sku: "SKU002" },
  { id: "3", name: "Maggi Noodles (Pack of 4)", category: "Instant Food", price: 56, cost: 45, stock: 0, minStock: 25, status: "out-of-stock", sku: "SKU003" },
  { id: "4", name: "Aashirvaad Atta (5kg)", category: "Grains", price: 320, cost: 280, stock: 28, minStock: 10, status: "in-stock", sku: "SKU004" },
  { id: "5", name: "Fortune Oil (1L)", category: "Oils", price: 185, cost: 160, stock: 18, minStock: 12, status: "in-stock", sku: "SKU005" },
  { id: "6", name: "Sugar (1kg)", category: "Essentials", price: 48, cost: 40, stock: 8, minStock: 15, status: "low-stock", sku: "SKU006" },
  { id: "7", name: "Red Label Tea (500g)", category: "Beverages", price: 245, cost: 210, stock: 22, minStock: 10, status: "in-stock", sku: "SKU007" },
  { id: "8", name: "Nescafe Classic (200g)", category: "Beverages", price: 475, cost: 400, stock: 12, minStock: 8, status: "in-stock", sku: "SKU008" },
];

const statusConfig = {
  "in-stock": { className: "bg-success/10 text-success border-success/20", label: "In Stock" },
  "low-stock": { className: "bg-warning/10 text-warning border-warning/20", label: "Low Stock" },
  "out-of-stock": { className: "bg-danger/10 text-danger border-danger/20", label: "Out of Stock" },
};

export function InventoryTable() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-border">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Product Inventory
          </h3>
          <p className="text-sm text-muted-foreground">
            {products.length} products • {products.filter(p => p.status === "low-stock").length} low stock
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button className="gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Product</TableHead>
              <TableHead className="font-semibold">SKU</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold text-right">Cost</TableHead>
              <TableHead className="font-semibold text-right">Price</TableHead>
              <TableHead className="font-semibold text-right">Stock</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product, index) => {
              const status = statusConfig[product.status];
              const margin = ((product.price - product.cost) / product.price * 100).toFixed(1);

              return (
                <TableRow
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <span className="text-xs font-semibold text-secondary-foreground">
                          {product.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{margin}% margin</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {product.sku}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ₹{product.cost}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    ₹{product.price}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold",
                    product.stock <= product.minStock && "text-warning",
                    product.stock === 0 && "text-danger"
                  )}>
                    {product.stock}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
