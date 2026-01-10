import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Loader2, Phone, Mail, MapPin, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const shopSchema = z.object({
  name: z.string().trim().min(2, "Shop name must be at least 2 characters").max(100, "Shop name must be less than 100 characters"),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional(),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  address: z.string().trim().max(300, "Address must be less than 300 characters").optional(),
  gst_number: z.string().trim().max(20, "GST number must be less than 20 characters").optional(),
});

type ShopFormData = z.infer<typeof shopSchema>;

export default function ShopSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { user, refreshShopStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: "",
      description: "",
      phone: "",
      email: user?.email || "",
      address: "",
      gst_number: "",
    },
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsGettingLocation(false);
        toast({
          title: "Location captured",
          description: "Your shop location has been saved.",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Location error",
          description: error.message || "Failed to get location. Please try again.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (data: ShopFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to create a shop.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create the shop
      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .insert({
          owner_id: user.id,
          name: data.name,
          description: data.description || null,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          gst_number: data.gst_number || null,
          is_open: true,
          latitude: location?.lat || null,
          longitude: location?.lng || null,
        })
        .select()
        .single();

      if (shopError) throw shopError;

      toast({
        title: "Shop created!",
        description: "Your shop is ready. Start adding products now.",
      });

      // Refresh auth context to update shopId and hasShop
      await refreshShopStatus();
      
      // Clear any cached queries
      queryClient.clear();

      // Navigate to inventory to add products
      navigate("/inventory");
    } catch (error: any) {
      console.error("Error creating shop:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create shop. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 gradient-hero opacity-10" />

      <Card className="w-full max-w-lg relative z-10 shadow-xl border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
            <Store className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">Create Your Shop</CardTitle>
          <CardDescription>
            Set up your shop details to start selling products
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Rajesh Grocery Store"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Tell customers about your shop..."
                rows={3}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-3 w-3 inline mr-1" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+91 98765 43210"
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-3 w-3 inline mr-1" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="shop@example.com"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                <MapPin className="h-3 w-3 inline mr-1" />
                Address
              </Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="Shop address..."
                rows={2}
                className={errors.address ? "border-destructive" : ""}
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address.message}</p>
              )}
            </div>

            {/* Location Capture */}
            <div className="space-y-2">
              <Label>Shop Location (for nearby customers)</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getLocation}
                  disabled={isGettingLocation}
                  className="flex-1"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <Navigation className="mr-2 h-4 w-4" />
                      {location ? "Update Location" : "Use Current Location"}
                    </>
                  )}
                </Button>
                {location && (
                  <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                    📍 Location saved
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                This helps customers find your shop based on their location
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number (optional)</Label>
              <Input
                id="gst_number"
                {...register("gst_number")}
                placeholder="e.g., 22AAAAA0000A1Z5"
                className={errors.gst_number ? "border-destructive" : ""}
              />
              {errors.gst_number && (
                <p className="text-xs text-destructive">{errors.gst_number.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary h-12 text-base mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Shop...
                </>
              ) : (
                <>
                  <Store className="mr-2 h-5 w-5" />
                  Create Shop & Add Products
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
