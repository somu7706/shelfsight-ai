import { AlertTriangle, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const lowStockItems = [
  { name: "Tata Salt (1kg)", current: 5, threshold: 20, category: "Essentials" },
  { name: "Amul Butter (500g)", current: 3, threshold: 15, category: "Dairy" },
  { name: "Maggi Noodles (Pack)", current: 8, threshold: 25, category: "Instant Food" },
  { name: "Aashirvaad Atta (5kg)", current: 2, threshold: 10, category: "Grains" },
];

export function LowStockAlert() {
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Low Stock Alert
          </h3>
          <p className="text-sm text-muted-foreground">
            {lowStockItems.length} items need restocking
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {lowStockItems.map((item, index) => {
          const percentage = (item.current / item.threshold) * 100;
          return (
            <div
              key={item.name}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-foreground text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <span className="text-sm font-semibold text-danger">
                  {item.current} left
                </span>
              </div>
              <Progress
                value={percentage}
                className="h-2 bg-muted"
              />
            </div>
          );
        })}
      </div>

      <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-warning/20 py-2.5 text-sm font-medium text-warning hover:bg-warning/30 transition-colors">
        Restock Now
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
