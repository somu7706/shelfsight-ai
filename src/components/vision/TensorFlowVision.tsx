import { useState, useRef, useEffect, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { Camera, Upload, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

interface TensorFlowVisionProps {
  onDetection?: (detections: Detection[]) => void;
}

export function TensorFlowVision({ onDetection }: TensorFlowVisionProps) {
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Load TensorFlow.js model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        await tf.ready();
        const loadedModel = await cocoSsd.load({
          base: "lite_mobilenet_v2",
        });
        setModel(loadedModel);
        setError(null);
      } catch (err) {
        console.error("Error loading model:", err);
        setError("Failed to load AI model. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
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

        videoRef.current.onloadeddata = () => {
          detectObjects();
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied. Please enable camera permissions.");
    }
  };

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setDetections([]);
  };

  const detectObjects = useCallback(async () => {
    if (!model || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== 4) {
      animationRef.current = requestAnimationFrame(detectObjects);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Run detection
    const predictions = await model.detect(video);

    // Clear canvas and draw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw bounding boxes
    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;

      // Draw box
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      const label = `${prediction.class} ${Math.round(prediction.score * 100)}%`;
      ctx.font = "bold 14px Inter";
      const textWidth = ctx.measureText(label).width;
      
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(x, y - 24, textWidth + 12, 24);

      // Draw label text
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, x + 6, y - 7);
    });

    // Update state with detections
    const newDetections = predictions.map((p) => ({
      class: p.class,
      score: p.score,
      bbox: p.bbox as [number, number, number, number],
    }));

    setDetections(newDetections);
    onDetection?.(newDetections);

    // Continue detection loop
    animationRef.current = requestAnimationFrame(detectObjects);
  }, [model, onDetection]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !model || !canvasRef.current) return;

    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const predictions = await model.detect(canvas);

      // Draw bounding boxes
      predictions.forEach((prediction) => {
        const [x, y, width, height] = prediction.bbox;

        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        const label = `${prediction.class} ${Math.round(prediction.score * 100)}%`;
        ctx.font = "bold 14px Inter";
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = "#22c55e";
        ctx.fillRect(x, y - 24, textWidth + 12, 24);

        ctx.fillStyle = "#ffffff";
        ctx.fillText(label, x + 6, y - 7);
      });

      const newDetections = predictions.map((p) => ({
        class: p.class,
        score: p.score,
        bbox: p.bbox as [number, number, number, number],
      }));

      setDetections(newDetections);
      onDetection?.(newDetections);
    };

    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Camera/Canvas View */}
      <div className="vision-scanner aspect-video relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn("absolute inset-0 w-full h-full object-cover", !isStreaming && "hidden")}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-sidebar/90">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-sidebar-foreground font-medium">Loading TensorFlow.js...</p>
              <p className="text-sidebar-foreground/60 text-sm">Initializing AI model</p>
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
        {!isLoading && !isStreaming && !error && detections.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-sidebar/90">
            <div className="text-center">
              <Camera className="h-16 w-16 text-sidebar-foreground/40 mx-auto mb-4" />
              <p className="text-sidebar-foreground/60 text-sm">
                Start camera or upload an image to detect products
              </p>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-3">
          {isStreaming ? (
            <Button
              onClick={stopCamera}
              className="flex-1 bg-danger hover:bg-danger/90 text-danger-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Stop Camera
            </Button>
          ) : (
            <Button
              onClick={startCamera}
              disabled={isLoading || !!error}
              className="flex-1 gradient-primary text-primary-foreground"
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
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
              Real-time Detection
            </h3>
            <p className="text-sm text-muted-foreground">
              TensorFlow.js COCO-SSD Model
            </p>
          </div>
          <Badge variant={isStreaming ? "default" : "secondary"}>
            {isStreaming ? "Live" : "Stopped"}
          </Badge>
        </div>

        {detections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No objects detected yet</p>
            <p className="text-sm">Point camera at objects to detect them</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {detections.map((detection, index) => (
              <div
                key={`${detection.class}-${index}`}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">
                      {detection.class.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground capitalize">
                      {detection.class}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Object detected
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
            <strong>Model:</strong> COCO-SSD (MobileNet v2) • 
            <strong> Objects:</strong> 80+ categories including bottles, cups, chairs, phones, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
