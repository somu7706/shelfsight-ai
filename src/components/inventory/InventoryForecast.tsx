import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Brain,
  RefreshCw,
  Calendar,
  Package,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Forecast {
  productId: string;
  productName: string;
  riskLevel: "critical" | "warning" | "healthy";
  daysUntilStockout: number | null;
  predictedStockoutDate: string | null;
  reorderQuantity: number | null;
  confidenceScore: number;
  recommendation: string;
  currentStock?: number;
  dailySalesAvg?: number;
}

export function InventoryForecast() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shopId, setShopId] = useState<string | null>(null);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (data) setShopId(data.id);
    };
    fetchShop();
  }, [user]);

  const generateForecast = async () => {
    if (!shopId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/inventory-forecast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ shopId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate forecast");
      }

      const data = await response.json();
      
      // Merge AI forecasts with product data
      const mergedForecasts = data.forecasts.map((forecast: Forecast) => {
        const productData = data.productsData?.find(
          (p: any) => p.id === forecast.productId
        );
        return {
          ...forecast,
          currentStock: productData?.currentStock,
          dailySalesAvg: parseFloat(productData?.avgDailySales || "0"),
        };
      });

      setForecasts(mergedForecasts);
      setLastUpdated(new Date());
      toast({
        title: "Forecast Updated",
        description: `Generated predictions for ${mergedForecasts.length} products`,
      });
    } catch (error: any) {
      console.error("Forecast error:", error);
      toast({
        title: "Forecast Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-danger" />;
      case "warning":
        return <TrendingDown className="h-5 w-5 text-warning" />;
      default:
        return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getRiskBadge = (level: string) => {
    const styles = {
      critical: "bg-danger/10 text-danger border-danger/20",
      warning: "bg-warning/10 text-warning border-warning/20",
      healthy: "bg-success/10 text-success border-success/20",
    };
    return styles[level as keyof typeof styles] || styles.healthy;
  };

  const criticalCount = forecasts.filter((f) => f.riskLevel === "critical").length;
  const warningCount = forecasts.filter((f) => f.riskLevel === "warning").length;
  const healthyCount = forecasts.filter((f) => f.riskLevel === "healthy").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              AI Inventory Forecast
            </h2>
            <p className="text-sm text-muted-foreground">
              Predict stock levels and prevent stockouts
            </p>
          </div>
        </div>
        <Button
          onClick={generateForecast}
          disabled={isLoading || !shopId}
          className="gradient-primary"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Forecast
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      {forecasts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-danger/20 bg-danger/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{criticalCount}</p>
                <p className="text-sm text-muted-foreground">Critical Items</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{warningCount}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{healthyCount}</p>
                <p className="text-sm text-muted-foreground">Healthy Stock</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forecasts List */}
      {forecasts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Forecasts Yet</h3>
            <p className="text-muted-foreground mb-4">
              Click "Generate Forecast" to analyze your inventory using AI
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}

          <div className="grid gap-4">
            {forecasts
              .sort((a, b) => {
                const order = { critical: 0, warning: 1, healthy: 2 };
                return order[a.riskLevel] - order[b.riskLevel];
              })
              .map((forecast, index) => (
                <Card
                  key={forecast.productId}
                  className={cn(
                    "transition-all hover:shadow-md animate-fade-in",
                    forecast.riskLevel === "critical" && "border-danger/30",
                    forecast.riskLevel === "warning" && "border-warning/30"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {getRiskIcon(forecast.riskLevel)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">
                              {forecast.productName}
                            </h4>
                            <Badge
                              variant="outline"
                              className={getRiskBadge(forecast.riskLevel)}
                            >
                              {forecast.riskLevel}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {forecast.recommendation}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Current Stock</p>
                              <p className="font-semibold flex items-center gap-1">
                                <Package className="h-4 w-4" />
                                {forecast.currentStock ?? "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Daily Sales Avg</p>
                              <p className="font-semibold">
                                {forecast.dailySalesAvg?.toFixed(1) ?? "N/A"}/day
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Days Until Stockout</p>
                              <p
                                className={cn(
                                  "font-semibold flex items-center gap-1",
                                  forecast.daysUntilStockout !== null &&
                                    forecast.daysUntilStockout <= 7 &&
                                    "text-danger"
                                )}
                              >
                                <Calendar className="h-4 w-4" />
                                {forecast.daysUntilStockout ?? "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Reorder Qty</p>
                              <p className="font-semibold">
                                {forecast.reorderQuantity ?? "N/A"}
                              </p>
                            </div>
                          </div>

                          {/* Confidence Score */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">AI Confidence</span>
                              <span className="font-medium">{forecast.confidenceScore}%</span>
                            </div>
                            <Progress value={forecast.confidenceScore} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}