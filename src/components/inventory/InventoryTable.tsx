import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { Search, Filter, Plus, Edit2, Trash2, Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductForm } from "./ProductForm";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  cost_price: number | null;
  category_id: string | null;
  is_active: boolean;
  category?: {
    name: string;
  } | null;
  inventory?: {
    quantity: number;
    min_stock_level: number;
  } | null;
}

const statusConfig = {
  "in-stock": { className: "bg-success/10 text-success border-success/20", label: "In Stock" },
  "low-stock": { className: "bg-warning/10 text-warning border-warning/20", label: "Low Stock" },
  "out-of-stock": { className: "bg-danger/10 text-danger border-danger/20", label: "Out of Stock" },
};

export function InventoryTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const { shopId } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (shopId) {
      fetchProducts();
    }
  }, [shopId]);

  const fetchProducts = async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          sku,
          barcode,
          price,
          cost_price,
          category_id,
          is_active,
          categories:category_id (name),
          inventory (quantity, min_stock_level)
        `)
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedProducts = data?.map((p) => ({
        ...p,
        category: p.categories as { name: string } | null,
        inventory: Array.isArray(p.inventory) ? p.inventory[0] : p.inventory,
      })) || [];

      setProducts(formattedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    try {
      // Delete inventory first
      await supabase
        .from("inventory")
        .delete()
        .eq("product_id", deleteProduct.id);

      // Then delete product
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", deleteProduct.id);

      if (error) throw error;

      toast({
        title: "Product deleted",
        description: "The product has been removed from your inventory.",
      });

      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete product.",
        variant: "destructive",
      });
    } finally {
      setDeleteProduct(null);
    }
  };

  const getStatus = (product: Product): "in-stock" | "low-stock" | "out-of-stock" => {
    const stock = product.inventory?.quantity || 0;
    const minStock = product.inventory?.min_stock_level || 10;

    if (stock === 0) return "out-of-stock";
    if (stock <= minStock) return "low-stock";
    return "in-stock";
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-card">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-border">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Product Inventory
            </h3>
            <p className="text-sm text-muted-foreground">
              {products.length} products • {products.filter(p => getStatus(p) === "low-stock").length} low stock
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
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={() => {
                setEditProduct(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Table */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-1">No products found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {products.length === 0
                ? "Start by adding your first product."
                : "Try a different search term."}
            </p>
            {products.length === 0 && (
              <Button
                className="gradient-primary"
                onClick={() => setIsFormOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>
        ) : (
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
                  const status = getStatus(product);
                  const statusStyle = statusConfig[status];
                  const cost = product.cost_price || 0;
                  const margin = product.price > 0 
                    ? ((product.price - cost) / product.price * 100).toFixed(1) 
                    : "0";

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
                        {product.sku || "-"}
                      </TableCell>
                      <TableCell>
                        {product.category?.name ? (
                          <Badge variant="secondary" className="font-normal">
                            {product.category.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ₹{cost}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        ₹{product.price}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-semibold",
                        status === "low-stock" && "text-warning",
                        status === "out-of-stock" && "text-danger"
                      )}>
                        {product.inventory?.quantity ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyle.className}>
                          {statusStyle.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditProduct(product);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-danger hover:text-danger"
                            onClick={() => setDeleteProduct(product)}
                          >
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
        )}
      </div>

      <ProductForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchProducts}
        editProduct={editProduct}
      />

      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-danger text-danger-foreground hover:bg-danger/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
