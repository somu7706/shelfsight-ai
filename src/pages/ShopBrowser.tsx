import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Search,
  MapPin,
  Phone,
  ShoppingCart,
  User,
  LogOut,
  Loader2,
  ArrowRight,
  ClipboardList,
  Navigation,
  MapPinOff,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

interface Shop {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  is_open: boolean;
  latitude: number | null;
  longitude: number | null;
  distance?: number;
}

// Haversine formula to calculate distance between two points
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

export default function ShopBrowser() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    fetchShops();
    requestLocation();
  }, []);

  useEffect(() => {
    // Re-sort shops when user location changes
    if (userLocation && shops.length > 0) {
      sortShopsByDistance();
    }
  }, [userLocation]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location access denied. Enable location to see nearby shops.");
        } else {
          setLocationError("Unable to get your location");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, description, address, phone, logo_url, is_open, latitude, longitude")
        .eq("is_open", true)
        .order("name");

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortShopsByDistance = () => {
    if (!userLocation) return;

    const shopsWithDistance = shops.map((shop) => {
      if (shop.latitude && shop.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          shop.latitude,
          shop.longitude
        );
        return { ...shop, distance };
      }
      return { ...shop, distance: undefined };
    });

    // Sort: shops with distance first (by distance), then shops without location
    shopsWithDistance.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      if (a.distance !== undefined) return -1;
      if (b.distance !== undefined) return 1;
      return 0;
    });

    setShops(shopsWithDistance);
  };

  const filteredShops = shops.filter(
    (shop) =>
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b border-border">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container mx-auto px-4 py-6 relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                <Store className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl">LocalMart</h1>
                <p className="text-sm text-muted-foreground">
                  Shop from local stores
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link to="/my-orders">
                    <Button variant="ghost" size="icon">
                      <ClipboardList className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/cart">
                    <Button variant="outline" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {totalItems}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={signOut}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button className="gradient-primary">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Search Section */}
          <div className="max-w-2xl mx-auto text-center pb-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Discover Local Shops
            </h2>
            <p className="text-muted-foreground mb-6">
              Browse products from your favorite local stores and get them
              delivered fresh.
            </p>
            
            {/* Location Status */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {locationLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting your location...
                </div>
              ) : userLocation ? (
                <div className="flex items-center gap-2 text-sm text-success bg-success/10 px-3 py-1.5 rounded-full">
                  <Navigation className="h-4 w-4" />
                  Showing shops near you
                </div>
              ) : locationError ? (
                <button
                  onClick={requestLocation}
                  className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full hover:bg-amber-500/20 transition-colors"
                >
                  <MapPinOff className="h-4 w-4" />
                  {locationError}
                  <span className="underline ml-1">Retry</span>
                </button>
              ) : null}
            </div>

            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search shops by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base rounded-xl border-2 focus:border-primary"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Shops Grid */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-16">
            <Store className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No shops found</h3>
            <p className="text-muted-foreground">
              {shops.length === 0
                ? "No shops are currently open. Check back later!"
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {filteredShops.length} shop{filteredShops.length !== 1 ? "s" : ""}{" "}
                available
                {userLocation && " • Sorted by distance"}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map((shop, index) => (
                <Link key={shop.id} to={`/shop/${shop.id}`}>
                  <Card
                    className="group h-full overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          {shop.logo_url ? (
                            <img
                              src={shop.logo_url}
                              alt={shop.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Store className="h-8 w-8 text-primary" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                              {shop.name}
                            </h3>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className="bg-success/10 text-success border-success/20 flex-shrink-0">
                                Open
                              </Badge>
                              {shop.distance !== undefined && (
                                <span className="text-xs text-muted-foreground font-medium">
                                  {formatDistance(shop.distance)}
                                </span>
                              )}
                            </div>
                          </div>

                          {shop.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {shop.description}
                            </p>
                          )}

                          <div className="mt-3 space-y-1.5">
                            {shop.address && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="line-clamp-1">{shop.address}</span>
                              </div>
                            )}
                            {shop.phone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{shop.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Browse products
                          </span>
                          <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
