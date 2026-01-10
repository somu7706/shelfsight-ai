import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Store, Bell, Shield, CreditCard, Globe, Save, Trash2, AlertTriangle, Archive, RotateCcw } from "lucide-react";

export default function Settings() {
  const { shopId, isShopOwner, signOut, refreshShopStatus } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isShopArchived, setIsShopArchived] = useState(false);

  // Check if shop is archived
  useEffect(() => {
    const checkArchivedStatus = async () => {
      if (!shopId) return;
      const { data } = await supabase
        .from("shops")
        .select("is_archived")
        .eq("id", shopId)
        .maybeSingle();
      if (data) {
        setIsShopArchived(data.is_archived || false);
      }
    };
    checkArchivedStatus();
  }, [shopId]);

  const handleArchiveShop = async () => {
    if (!shopId || !isShopOwner) return;
    
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({ is_archived: true, is_open: false })
        .eq("id", shopId);

      if (error) throw error;

      setIsShopArchived(true);
      toast({
        title: "Shop deactivated",
        description: "Your shop has been deactivated. Customers can no longer see it.",
      });
    } catch (error: any) {
      toast({
        title: "Error deactivating shop",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleReactivateShop = async () => {
    if (!shopId || !isShopOwner) return;
    
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({ is_archived: false, is_open: true })
        .eq("id", shopId);

      if (error) throw error;

      setIsShopArchived(false);
      toast({
        title: "Shop reactivated",
        description: "Your shop is now visible to customers again.",
      });
    } catch (error: any) {
      toast({
        title: "Error reactivating shop",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteShop = async () => {
    if (!shopId || !isShopOwner) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("shops")
        .delete()
        .eq("id", shopId);

      if (error) throw error;

      toast({
        title: "Shop deleted",
        description: "Your shop has been permanently deleted.",
      });

      await refreshShopStatus();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error deleting shop",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setConfirmText("");
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your store preferences and configurations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store Information */}
            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Store Information
                  </h3>
                  <p className="text-sm text-muted-foreground">Basic store details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" defaultValue="Rajesh General Store" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+91 98765 43210" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" defaultValue="123, Market Street, Sector 15, Gurugram" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst">GST Number</Label>
                  <Input id="gst" defaultValue="07AABCU9603R1ZM" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="rajesh.store@email.com" />
                </div>
              </div>
            </div>

            {/* Push Notifications */}
            <NotificationSettings />

            {/* In-App Notifications */}
            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    In-App Notifications
                  </h3>
                  <p className="text-sm text-muted-foreground">Alert preferences</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when stock falls below threshold</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">New Order Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive alerts for new customer orders</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Daily Reports</p>
                    <p className="text-sm text-muted-foreground">Receive daily summary via email</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            {isShopOwner && shopId && (
              <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-destructive">
                      Danger Zone
                    </h3>
                    <p className="text-sm text-muted-foreground">Shop management actions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Soft Delete / Archive Option */}
                  <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground flex items-center gap-2">
                          {isShopArchived ? (
                            <>
                              <RotateCcw className="h-4 w-4 text-green-600" />
                              Reactivate Shop
                            </>
                          ) : (
                            <>
                              <Archive className="h-4 w-4 text-amber-600" />
                              Deactivate Shop
                            </>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isShopArchived 
                            ? "Your shop is currently deactivated and hidden from customers. Reactivate to make it visible again."
                            : "Temporarily hide your shop from customers. Your data will be preserved and you can reactivate anytime."
                          }
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant={isShopArchived ? "default" : "outline"} 
                            size="sm"
                            className={isShopArchived ? "bg-green-600 hover:bg-green-700" : "border-amber-500 text-amber-700 hover:bg-amber-50"}
                          >
                            {isShopArchived ? (
                              <>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reactivate
                              </>
                            ) : (
                              <>
                                <Archive className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              {isShopArchived ? (
                                <>
                                  <RotateCcw className="h-5 w-5 text-green-600" />
                                  Reactivate Your Shop?
                                </>
                              ) : (
                                <>
                                  <Archive className="h-5 w-5 text-amber-600" />
                                  Deactivate Your Shop?
                                </>
                              )}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {isShopArchived ? (
                                <p>Your shop will become visible to customers again. All your products and data are still intact.</p>
                              ) : (
                                <div className="space-y-3">
                                  <p>This will temporarily hide your shop from customers:</p>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    <li>Customers won't be able to find or access your shop</li>
                                    <li>All your data (products, orders, etc.) will be preserved</li>
                                    <li>You can reactivate your shop anytime</li>
                                  </ul>
                                </div>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={isShopArchived ? handleReactivateShop : handleArchiveShop}
                              disabled={isArchiving}
                              className={isShopArchived ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
                            >
                              {isArchiving 
                                ? "Processing..." 
                                : isShopArchived 
                                  ? "Reactivate Shop" 
                                  : "Deactivate Shop"
                              }
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Permanent Delete Option */}
                  <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground flex items-center gap-2">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          Delete Shop Permanently
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Permanently delete your shop and all associated data including products, 
                          orders, and customer information. This action cannot be undone.
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                              <AlertTriangle className="h-5 w-5" />
                              Delete Shop Permanently?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-3">
                              <p>
                                This will permanently delete your shop and all associated data:
                              </p>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                <li>All products and inventory</li>
                                <li>All orders and order history</li>
                                <li>All customer data and loyalty points</li>
                                <li>All categories and settings</li>
                              </ul>
                              <p className="font-medium text-foreground">
                                Type "DELETE" to confirm:
                              </p>
                              <Input 
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type DELETE to confirm"
                                className="mt-2"
                              />
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setConfirmText("")}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteShop}
                              disabled={confirmText !== "DELETE" || isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting ? "Deleting..." : "Delete Shop Forever"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-3" />
                  Security Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="h-4 w-4 mr-3" />
                  Payment Methods
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-3" />
                  Language & Region
                </Button>
              </div>
            </div>

            {/* Subscription */}
            <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">✨</span>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Premium Plan
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                You're on the Premium plan with full access to all features including Vision AI.
              </p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold font-display text-foreground">₹999</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <Button variant="outline" className="w-full">
                Manage Subscription
              </Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button className="gradient-primary text-primary-foreground">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
