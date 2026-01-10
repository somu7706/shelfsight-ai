import { Plus, Camera, FileText, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  {
    icon: Plus,
    label: "Add Product",
    description: "Add new inventory item",
    path: "/inventory",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  {
    icon: Camera,
    label: "Scan Stock",
    description: "Vision-based verification",
    path: "/vision",
    color: "bg-accent/10 text-accent hover:bg-accent/20",
  },
  {
    icon: FileText,
    label: "New Order",
    description: "Create customer order",
    path: "/orders",
    color: "bg-success/10 text-success hover:bg-success/20",
  },
  {
    icon: TrendingUp,
    label: "View Reports",
    description: "Analytics & insights",
    path: "/analytics",
    color: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Link
            key={action.label}
            to={action.path}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 ${action.color} animate-scale-in`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <action.icon className="h-6 w-6 mb-2" />
            <span className="font-medium text-sm">{action.label}</span>
            <span className="text-xs opacity-70 text-center mt-1">
              {action.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
