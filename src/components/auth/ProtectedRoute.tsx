import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireOwner?: boolean;
}

export function ProtectedRoute({ children, requireOwner = false }: ProtectedRouteProps) {
  const { user, loading, isShopOwner } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (requireOwner && !isShopOwner) {
        navigate("/");
      }
    }
  }, [user, loading, isShopOwner, requireOwner, navigate]);

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

  if (!user) {
    return null;
  }

  if (requireOwner && !isShopOwner) {
    return null;
  }

  return <>{children}</>;
}
