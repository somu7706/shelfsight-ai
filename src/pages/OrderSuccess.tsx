import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";

export default function OrderSuccess() {
  const location = useLocation();
  const orderNumber = location.state?.orderNumber || "Unknown";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-6">
          <div className="relative mb-6">
            <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto animate-scale-in">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div className="absolute inset-0 h-20 w-20 rounded-full bg-success/20 mx-auto animate-ping" />
          </div>

          <h1 className="font-display text-2xl font-bold mb-2">Order Placed!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your order. We'll notify you when it's ready.
          </p>

          <div className="bg-muted rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-mono font-bold text-lg">{orderNumber}</p>
          </div>

          <div className="space-y-3">
            <Link to="/" className="block">
              <Button className="w-full gradient-primary">
                <Package className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
            <Link to="/" className="block">
              <Button variant="outline" className="w-full">
                Track Order
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
