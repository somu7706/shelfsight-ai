import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag,
  Package,
  Loader2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice, loading } = useCart();
  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  const handlePlaceOrder = async () => {
    if (!user || items.length === 0) return;

    setIsPlacingOrder(true);

    try {
      // Get shop_id from first item
      const shopId = items[0].product.shop_id;
      const orderNumber = generateOrderNumber();

      // Calculate totals
      const subtotal = totalPrice;
      const tax = subtotal * 0.05; // 5% tax
      const total = subtotal + tax;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          shop_id: shopId,
          customer_id: user.id,
          subtotal,
          tax,
          total,
          notes,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await clearCart();

      toast({
        title: "Order placed successfully!",
        description: `Your order #${orderNumber} has been received.`,
      });

      navigate("/order-success", { state: { orderNumber } });
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Order failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view cart</h1>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to add items and place orders.
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
              <h1 className="font-display font-bold text-xl">Your Cart</h1>
              <p className="text-sm text-muted-foreground">{totalItems} items</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some products to get started.
            </p>
            <Button onClick={() => navigate(-1)} className="gradient-primary">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="h-20 w-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium line-clamp-2">{item.product.name}</h3>
                        <p className="text-primary font-bold text-lg">
                          ₹{item.product.price}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-danger hover:text-danger"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (5%)</span>
                      <span>₹{(totalPrice * 0.05).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">
                        ₹{(totalPrice * 1.05).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Order Notes (optional)</label>
                    <Textarea
                      placeholder="Any special instructions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  <Button
                    className="w-full gradient-primary h-12 text-base"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="mr-2 h-5 w-5" />
                        Place Order
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
