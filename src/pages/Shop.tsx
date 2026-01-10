import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BarcodeScanner } from "@/components/scanner/BarcodeScanner";
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Store, 
  Package,
  User,
  LogOut,
  ClipboardList,
  X,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  shop_id: string;
  inventory?: {
    quantity: number;
    min_stock_level: number;
  } | null;
  category?: {
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
}

interface Shop {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
}

export default function ShopPage() {
  const { shopId } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { items, addToCart, updateQuantity, totalItems, totalPrice } = useCart();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleBarcodeProduct = (product: { id: string; name: string; price: number }) => {
    if (shopId) {
      addToCart(product.id, shopId);
      toast({
        title: "Added to cart",
        description: product.name,
      });
    }
  };

  useEffect(() => {
    if (shopId) {
      fetchShopData();
    }
  }, [shopId]);

  const fetchShopData = async () => {
    try {
      // Fetch shop details
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("id, name, description, logo_url")
        .eq("id", shopId)
        .single();

      if (shopError) throw shopError;
      setShop(shopData);

      // Fetch categories for this shop
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("id, name")
        .eq("shop_id", shopId)
        .order("name");

      setCategories(categoriesData || []);

      // Fetch products with inventory and category
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          category_id,
          shop_id,
          inventory (
            quantity,
            min_stock_level
          ),
          categories:category_id (
            name
          )
        `)
        .eq("shop_id", shopId)
        .eq("is_active", true);

      if (productsError) throw productsError;

      const formattedProducts = productsData?.map((p) => ({
        ...p,
        category: p.categories as { name: string } | null,
      })) || [];

      setProducts(formattedProducts);
    } catch (error) {
      console.error("Error fetching shop data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCartQuantity = (productId: string) => {
    const item = items.find((i) => i.product_id === productId);
    return item?.quantity || 0;
  };

  const getStockStatus = (product: Product) => {
    const inv = product.inventory;
    const stock = inv?.quantity || 0;
    const minStock = inv?.min_stock_level || 10;

    if (stock === 0) return { label: "Out of Stock", className: "bg-danger/10 text-danger" };
    if (stock <= minStock) return { label: "Low Stock", className: "bg-warning/10 text-warning" };
    return { label: "In Stock", className: "bg-success/10 text-success" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Shop Not Found</h1>
          <p className="text-muted-foreground">This shop doesn't exist or is closed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg">{shop.name}</h1>
                <p className="text-xs text-muted-foreground">{shop.description || "Fresh groceries delivered"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/my-orders">
                    <Button variant="ghost" size="icon">
                      <ClipboardList className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/cart">
                    <Button variant="outline" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {totalItems}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={signOut}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search & Categories */}
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex gap-3 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          {shopId && (
            <BarcodeScanner 
              shopId={shopId} 
              onProductFound={handleBarcodeProduct}
            />
          )}
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "rounded-full",
                  selectedCategory === null && "gradient-primary"
                )}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "rounded-full",
                    selectedCategory === category.id && "gradient-primary"
                  )}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* Active Filter Badge */}
        {selectedCategory && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Showing:</span>
            <Badge variant="secondary" className="gap-1">
              {categories.find((c) => c.id === selectedCategory)?.name}
              <button
                onClick={() => setSelectedCategory(null)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 pb-24">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No products found</h2>
            <p className="text-muted-foreground">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product, index) => {
              const cartQuantity = getCartQuantity(product.id);
              const stockStatus = getStockStatus(product);
              const isOutOfStock = product.inventory?.quantity === 0;

              return (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-square relative bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge 
                      className={cn("absolute top-2 right-2 text-xs", stockStatus.className)}
                    >
                      {stockStatus.label}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                    <p className="text-primary font-bold text-lg mb-3">₹{product.price}</p>

                    {cartQuantity > 0 ? (
                      <div className="flex items-center justify-between bg-primary/10 rounded-lg p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const item = items.find((i) => i.product_id === product.id);
                            if (item) updateQuantity(item.id, cartQuantity - 1);
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold">{cartQuantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => addToCart(product.id, product.shop_id)}
                          disabled={isOutOfStock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full gradient-primary text-sm h-9"
                        onClick={() => addToCart(product.id, product.shop_id)}
                        disabled={isOutOfStock}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add to Cart
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Summary */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg">
          <div className="container mx-auto">
            <Link to="/cart">
              <Button className="w-full gradient-primary h-12 text-base">
                <ShoppingCart className="h-5 w-5 mr-2" />
                View Cart ({totalItems} items) - ₹{totalPrice.toFixed(2)}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
