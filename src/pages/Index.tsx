import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./Dashboard";
import ShopBrowser from "./ShopBrowser";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading, hasShop, isShopOwner } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is a shop owner with a shop, show dashboard
  if (user && hasShop && isShopOwner) {
    return <Dashboard />;
  }

  // For everyone else (customers, non-logged in users), show shop browser
  return <ShopBrowser />;
};

export default Index;
