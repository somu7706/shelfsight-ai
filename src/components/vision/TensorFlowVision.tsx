import { useState, useRef, useCallback } from "react";
import { pipeline, env } from "@huggingface/transformers";
import { Camera, Upload, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Configure transformers.js to not use local models
env.allowLocalModels = false;

interface Detection {
  label: string;
  score: number;
}

interface TensorFlowVisionProps {
  onDetection?: (detections: Detection[]) => void;
}

export function TensorFlowVision({ onDetection }: TensorFlowVisionProps) {
  const [classifier, setClassifier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadModel = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const imageClassifier = await pipeline(
        "image-classification",
        "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k",
        { device: "webgpu" }
      );
      
      setClassifier(imageClassifier);
      setIsModelLoaded(true);
    } catch (err) {
      console.error("Error loading model:", err);
      // Fallback to CPU if WebGPU not available
      try {
        const imageClassifier = await pipeline(
          "image-classification",
          "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k"
        );
        setClassifier(imageClassifier);
        setIsModelLoaded(true);
      } catch (fallbackErr) {
        setError("Failed to load AI model. Please refresh the page.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    if (!isModelLoaded) {
      await loadModel();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setError(null);
        setCapturedImage(null);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied. Please enable camera permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
  };

  const captureAndClassify = useCallback(async () => {
    if (!classifier || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== 4) return;

    // Set canvas size and capture frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Get image data URL
    const imageDataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(imageDataUrl);

    try {
      setIsLoading(true);
      const results = await classifier(imageDataUrl);
      
      const newDetections = results.slice(0, 5).map((r: any) => ({
        label: r.label,
        score: r.score,
      }));

      setDetections(newDetections);
      onDetection?.(newDetections);
    } catch (err) {
      console.error("Classification error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [classifier, onDetection]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isModelLoaded) {
      await loadModel();
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageDataUrl = event.target?.result as string;
      setCapturedImage(imageDataUrl);

      if (classifier) {
        try {
          setIsLoading(true);
          const results = await classifier(imageDataUrl);
          
          const newDetections = results.slice(0, 5).map((r: any) => ({
            label: r.label,
            score: r.score,
          }));

          setDetections(newDetections);
          onDetection?.(newDetections);
        } catch (err) {
          console.error("Classification error:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Camera/Canvas View */}
      <div className="vision-scanner aspect-video relative overflow-hidden rounded-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            (!isStreaming || capturedImage) && "hidden"
          )}
        />
        <canvas ref={canvasRef} className="hidden" />

        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="absolute inset-0 w-full h-full object-contain bg-sidebar"
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-sidebar/90 z-10">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-sidebar-foreground font-medium">
                {isModelLoaded ? "Analyzing image..." : "Loading AI model..."}
              </p>
              <p className="text-sidebar-foreground/60 text-sm">
                {isModelLoaded ? "Running classification" : "This may take a moment"}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-sidebar/90">
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
              <p className="text-sidebar-foreground font-medium mb-2">Error</p>
              <p className="text-sidebar-foreground/60 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Idle State */}
        {!isLoading && !isStreaming && !error && !capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-sidebar/90">
            <div className="text-center">
              <Camera className="h-16 w-16 text-sidebar-foreground/40 mx-auto mb-4" />
              <p className="text-sidebar-foreground/60 text-sm">
                Start camera or upload an image to classify
              </p>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-3 z-20">
          {isStreaming ? (
            <>
              <Button
                onClick={captureAndClassify}
                disabled={isLoading}
                className="flex-1 gradient-primary text-primary-foreground"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture & Classify
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={startCamera}
              disabled={isLoading}
              className="flex-1 gradient-primary text-primary-foreground"
            >
              <Camera className="h-4 w-4 mr-2" />
              {isModelLoaded ? "Start Camera" : "Load Model & Start"}
            </Button>
          )}

          <label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isLoading}
            />
            <Button
              variant="outline"
              className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent/80"
              asChild
              disabled={isLoading}
            >
              <span>
                <Upload className="h-4 w-4" />
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Detection Results */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Image Classification
            </h3>
            <p className="text-sm text-muted-foreground">
              Hugging Face Transformers (MobileNetV4)
            </p>
          </div>
          <Badge variant={isModelLoaded ? "default" : "secondary"}>
            {isModelLoaded ? "Model Ready" : "Not Loaded"}
          </Badge>
        </div>

        {detections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No classifications yet</p>
            <p className="text-sm">Capture or upload an image to classify</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {detections.map((detection, index) => (
              <div
                key={`${detection.label}-${index}`}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground capitalize">
                      {detection.label.split(",")[0]}
                    </p>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {detection.label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {Math.round(detection.score * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">confidence</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Model:</strong> MobileNetV4 (ONNX) • 
            <strong> Categories:</strong> 1000 ImageNet classes
          </p>
        </div>
      </div>
    </div>
  );
}
