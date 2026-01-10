import { useState } from "react";
import { Camera, Upload, Search, CheckCircle2, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DetectedProduct {
  name: string;
  stock: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  confidence: number;
  category: string;
  price: string;
}

const mockDetections: DetectedProduct[] = [
  { name: "Tata Salt (1kg)", stock: 45, status: "in-stock", confidence: 94, category: "Essentials", price: "₹28" },
  { name: "Amul Butter (500g)", stock: 3, status: "low-stock", confidence: 89, category: "Dairy", price: "₹285" },
  { name: "Maggi Noodles", stock: 0, status: "out-of-stock", confidence: 92, category: "Instant Food", price: "₹14" },
];

export function VisionScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [detections, setDetections] = useState<DetectedProduct[]>([]);

  const handleScan = () => {
    setIsScanning(true);
    setScanComplete(false);
    setDetections([]);

    // Simulate scanning delay
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      setDetections(mockDetections);
    }, 3000);
  };

  const getStatusConfig = (status: DetectedProduct["status"]) => {
    switch (status) {
      case "in-stock":
        return { icon: CheckCircle2, className: "text-success bg-success/10", label: "In Stock" };
      case "low-stock":
        return { icon: AlertTriangle, className: "text-warning bg-warning/10", label: "Low Stock" };
      case "out-of-stock":
        return { icon: Package, className: "text-danger bg-danger/10", label: "Out of Stock" };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Scanner View */}
      <div className="vision-scanner aspect-video relative">
        {/* Simulated camera view */}
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar/90 to-sidebar flex items-center justify-center">
          {!isScanning && !scanComplete && (
            <div className="text-center">
              <Camera className="h-16 w-16 text-sidebar-foreground/40 mx-auto mb-4" />
              <p className="text-sidebar-foreground/60 text-sm">
                Point camera at shelf to scan
              </p>
            </div>
          )}

          {isScanning && (
            <>
              {/* Scanner animation */}
              <div className="scanner-line" />
              <div className="absolute inset-4 border-2 border-primary/50 rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
              </div>
              <div className="text-center z-10">
                <div className="h-12 w-12 mx-auto mb-3 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <p className="text-sidebar-foreground font-medium">Scanning products...</p>
                <p className="text-sidebar-foreground/60 text-sm">AI detecting items</p>
              </div>
            </>
          )}

          {scanComplete && (
            <div className="text-center z-10">
              <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4 animate-scale-in" />
              <p className="text-sidebar-foreground font-medium">Scan Complete</p>
              <p className="text-sidebar-foreground/60 text-sm">
                {detections.length} products detected
              </p>
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-3">
          <Button
            onClick={handleScan}
            disabled={isScanning}
            className="flex-1 gradient-primary text-primary-foreground"
          >
            <Camera className="h-4 w-4 mr-2" />
            {isScanning ? "Scanning..." : "Scan Shelf"}
          </Button>
          <Button variant="outline" className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent/80">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detection Results */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Detection Results
            </h3>
            <p className="text-sm text-muted-foreground">
              AI-powered product recognition
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {detections.length} items found
            </span>
          </div>
        </div>

        {detections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No products detected yet</p>
            <p className="text-sm">Scan a shelf to identify products</p>
          </div>
        ) : (
          <div className="space-y-3">
            {detections.map((product, index) => {
              const statusConfig = getStatusConfig(product.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={product.name}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        statusConfig.className
                      )}
                    >
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{product.category}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-primary font-medium">{product.price}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{product.stock} units</p>
                    <p className="text-xs text-muted-foreground">
                      {product.confidence}% confidence
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
