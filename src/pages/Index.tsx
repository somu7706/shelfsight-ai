import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "./Dashboard";
import ShopBrowser from "./ShopBrowser";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading, hasShop, isShopOwner } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkOwnerWithoutShop = async () => {
      if (!user || loading) return;
      
      // If user is owner without shop, redirect to shop setup
      if (!hasShop) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        const isOwner = roleData?.some(r => r.role === "owner");
        if (isOwner) {
          navigate("/shop-setup");
        }
      }
    };
    
    checkOwnerWithoutShop();
  }, [user, loading, hasShop, navigate]);

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
