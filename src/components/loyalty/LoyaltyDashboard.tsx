import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  Star,
  Trophy,
  Crown,
  Sparkles,
  ArrowRight,
  Clock,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LoyaltyPoints {
  balance: number;
  lifetime_points: number;
  tier: string;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  discount_type: string;
  discount_value: number;
  expires_at: string | null;
}

interface Transaction {
  id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
}

interface LoyaltyDashboardProps {
  shopId: string;
}

const tierConfig = {
  bronze: { icon: Star, color: "text-amber-600", bg: "bg-amber-100", nextTier: "silver", nextPoints: 1000 },
  silver: { icon: Trophy, color: "text-gray-400", bg: "bg-gray-100", nextTier: "gold", nextPoints: 5000 },
  gold: { icon: Crown, color: "text-yellow-500", bg: "bg-yellow-100", nextTier: "platinum", nextPoints: 10000 },
  platinum: { icon: Sparkles, color: "text-purple-500", bg: "bg-purple-100", nextTier: null, nextPoints: null },
};

export function LoyaltyDashboard({ shopId }: LoyaltyDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [points, setPoints] = useState<LoyaltyPoints | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && shopId) {
      fetchLoyaltyData();
    }
  }, [user, shopId]);

  const fetchLoyaltyData = async () => {
    if (!user) return;

    try {
      // Fetch user's points
      const { data: pointsData } = await supabase
        .from("loyalty_points")
        .select("balance, lifetime_points, tier")
        .eq("user_id", user.id)
        .eq("shop_id", shopId)
        .single();

      setPoints(pointsData);

      // Fetch available rewards
      const { data: rewardsData } = await supabase
        .from("rewards")
        .select("*")
        .eq("shop_id", shopId)
        .eq("is_active", true)
        .order("points_required", { ascending: true });

      setRewards(rewardsData || []);

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from("points_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(10);

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const redeemReward = async (reward: Reward) => {
    if (!user || !points || points.balance < reward.points_required) return;

    setRedeemingId(reward.id);
    try {
      // Deduct points
      const { error: updateError } = await supabase
        .from("loyalty_points")
        .update({ balance: points.balance - reward.points_required })
        .eq("user_id", user.id)
        .eq("shop_id", shopId);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from("points_transactions")
        .insert({
          user_id: user.id,
          shop_id: shopId,
          type: "redeem",
          points: -reward.points_required,
          description: `Redeemed: ${reward.name}`,
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Reward Redeemed! 🎉",
        description: `You've redeemed ${reward.name}`,
      });

      fetchLoyaltyData();
    } catch (error) {
      console.error("Redeem error:", error);
      toast({
        title: "Redemption Failed",
        description: "Could not redeem reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRedeemingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentTier = points?.tier || "bronze";
  const tierInfo = tierConfig[currentTier as keyof typeof tierConfig];
  const TierIcon = tierInfo.icon;

  const progress = tierInfo.nextPoints
    ? ((points?.lifetime_points || 0) / tierInfo.nextPoints) * 100
    : 100;
  const pointsToNextTier = tierInfo.nextPoints
    ? Math.max(0, tierInfo.nextPoints - (points?.lifetime_points || 0))
    : 0;

  return (
    <div className="space-y-6">
      {/* Points Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", tierInfo.bg)}>
                <TierIcon className={cn("h-6 w-6", tierInfo.color)} />
              </div>
              <div>
                <p className="text-primary-foreground/80 text-sm">Current Tier</p>
                <p className="text-xl font-bold capitalize">{currentTier}</p>
              </div>
            </div>
            <Gift className="h-8 w-8 opacity-50" />
          </div>

          <div className="text-center py-4">
            <p className="text-5xl font-bold">{points?.balance || 0}</p>
            <p className="text-primary-foreground/80">Available Points</p>
          </div>

          {tierInfo.nextTier && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-primary-foreground/80">Progress to {tierInfo.nextTier}</span>
                <span>{pointsToNextTier} points to go</span>
              </div>
              <Progress value={progress} className="h-2 bg-primary-foreground/20" />
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Lifetime Points</span>
            <span className="font-semibold">{points?.lifetime_points || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <div>
        <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Available Rewards
        </h3>

        {rewards.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No rewards available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {rewards.map((reward) => {
              const canRedeem = (points?.balance || 0) >= reward.points_required;
              return (
                <Card
                  key={reward.id}
                  className={cn(
                    "transition-all",
                    canRedeem && "border-primary/30 hover:shadow-md"
                  )}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Gift className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{reward.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {reward.discount_type === "percentage"
                            ? `${reward.discount_value}% off`
                            : `₹${reward.discount_value} off`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" />
                        {reward.points_required}
                      </Badge>
                      <Button
                        size="sm"
                        disabled={!canRedeem || redeemingId === reward.id}
                        onClick={() => redeemReward(reward)}
                        className={cn(!canRedeem && "opacity-50")}
                      >
                        {redeemingId === reward.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Redeem"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Activity
        </h3>

        {transactions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No transactions yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      tx.type === "earn" ? "bg-success/10" : "bg-primary/10"
                    )}
                  >
                    {tx.type === "earn" ? (
                      <ArrowRight className="h-4 w-4 text-success rotate-[-45deg]" />
                    ) : (
                      <Gift className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "font-semibold",
                    tx.points > 0 ? "text-success" : "text-foreground"
                  )}
                >
                  {tx.points > 0 ? "+" : ""}
                  {tx.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}