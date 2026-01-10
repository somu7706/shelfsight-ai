import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, Search, Loader2, ScanLine, Flashlight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string | null;
  image_url: string | null;
  category_id: string | null;
}

interface BarcodeScannerProps {
  shopId: string;
  onProductFound?: (product: Product) => void;
}

export function BarcodeScanner({ shopId, onProductFound }: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  }, []);

  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setFoundProduct(null);
      setError(null);
      setManualBarcode("");
    }
  }, [isOpen, stopCamera]);

  const searchProductByBarcode = async (barcode: string) => {
    setIsSearching(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from("products")
        .select("id, name, price, barcode, image_url, category_id")
        .eq("shop_id", shopId)
        .eq("barcode", barcode)
        .eq("is_active", true)
        .single();

      if (dbError || !data) {
        setError(`No product found with barcode: ${barcode}`);
        setFoundProduct(null);
      } else {
        setFoundProduct(data);
        onProductFound?.(data);
        toast({
          title: "Product Found!",
          description: data.name,
        });
      }
    } catch (err) {
      setError("Error searching for product");
    } finally {
      setIsSearching(false);
    }
  };

  const startCamera = async () => {
    setError(null);
    setFoundProduct(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);

        // Start barcode detection
        if ("BarcodeDetector" in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
          });

          scanIntervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const barcode = barcodes[0].rawValue;
                  stopCamera();
                  searchProductByBarcode(barcode);
                }
              } catch (err) {
                console.error("Barcode detection error:", err);
              }
            }
          }, 200);
        } else {
          setError("Barcode scanning not supported in this browser. Please enter barcode manually.");
        }
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied. Please enable camera permissions or enter barcode manually.");
    }
  };

  const handleManualSearch = () => {
    if (manualBarcode.trim()) {
      searchProductByBarcode(manualBarcode.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ScanLine className="h-4 w-4" />
          Scan Barcode
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Barcode Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          <div className="relative aspect-video bg-sidebar rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "absolute inset-0 w-full h-full object-cover",
                !isScanning && "hidden"
              )}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-8 border-2 border-primary/50 rounded-lg">
                  <div className="absolute inset-0">
                    <div className="scanner-line" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="text-sm text-white bg-black/50 px-3 py-1 rounded-full">
                    Point camera at barcode
                  </span>
                </div>
              </div>
            )}

            {/* Idle State */}
            {!isScanning && !foundProduct && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Click "Start Camera" to scan
                  </p>
                </div>
              </div>
            )}

            {/* Searching State */}
            {isSearching && (
              <div className="absolute inset-0 flex items-center justify-center bg-sidebar/90">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Searching product...
                  </p>
                </div>
              </div>
            )}

            {/* Found Product */}
            {foundProduct && (
              <div className="absolute inset-0 flex items-center justify-center bg-success/10 border-2 border-success rounded-xl">
                <div className="text-center p-4">
                  {foundProduct.image_url && (
                    <img
                      src={foundProduct.image_url}
                      alt={foundProduct.name}
                      className="h-20 w-20 object-cover rounded-lg mx-auto mb-3"
                    />
                  )}
                  <p className="font-semibold text-foreground">
                    {foundProduct.name}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    ₹{foundProduct.price.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {/* Camera Controls */}
          <div className="flex gap-2">
            {isScanning ? (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={stopCamera}
              >
                <X className="h-4 w-4 mr-2" />
                Stop Camera
              </Button>
            ) : (
              <Button
                className="flex-1 gradient-primary text-primary-foreground"
                onClick={startCamera}
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            )}
          </div>

          {/* Manual Entry */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or enter manually
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter barcode number"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
            />
            <Button
              onClick={handleManualSearch}
              disabled={!manualBarcode.trim() || isSearching}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Add to Cart Button */}
          {foundProduct && (
            <Button
              className="w-full gradient-primary text-primary-foreground"
              onClick={() => {
                onProductFound?.(foundProduct);
                setIsOpen(false);
              }}
            >
              Add to Cart
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}