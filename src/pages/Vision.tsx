import { MainLayout } from "@/components/layout/MainLayout";
import { VisionScanner } from "@/components/vision/VisionScanner";
import { Camera, Zap, Target, Shield } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "AI-Powered Recognition",
    description: "Instantly identify products using computer vision",
  },
  {
    icon: Zap,
    title: "Real-time Verification",
    description: "Verify stock levels against database instantly",
  },
  {
    icon: Target,
    title: "94% Accuracy",
    description: "High-precision product detection",
  },
  {
    icon: Shield,
    title: "Reduce Errors",
    description: "Minimize manual inventory counting mistakes",
  },
];

export default function Vision() {
  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
            <Camera className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Vision Scanner
            </h1>
            <p className="text-muted-foreground">
              AI-powered product recognition for instant stock verification
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="p-4 rounded-xl bg-card border border-border shadow-card animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Scanner */}
      <VisionScanner />
    </MainLayout>
  );
}
