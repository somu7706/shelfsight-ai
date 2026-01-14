import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  Trash2, 
  Loader2,
  AlertTriangle,
  UserCog,
  RefreshCw
} from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  roles: string[];
  created_at: string;
}

interface Shop {
  id: string;
  name: string;
  owner_id: string;
  owner_email?: string;
  is_archived: boolean;
  created_at: string;
}

interface Stats {
  users: number;
  shops: number;
  products: number;
  orders: number;
}

export default function Admin() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<Stats>({ users: 0, shops: 0, products: 0, orders: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (!loading && !isAdmin) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      return;
    }
    if (isAdmin) {
      fetchData();
    }
  }, [user, loading, isAdmin, navigate]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch stats
      const [profilesRes, shopsRes, productsRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("shops").select("id", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("orders").select("id", { count: "exact" }),
      ]);

      setStats({
        users: profilesRes.count || 0,
        shops: shopsRes.count || 0,
        products: productsRes.count || 0,
        orders: ordersRes.count || 0,
      });

      // Fetch users with roles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, created_at")
        .order("created_at", { ascending: false });

      if (profiles) {
        const usersWithRoles = await Promise.all(
          profiles.map(async (profile) => {
            const { data: roles } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", profile.user_id);
            
            return {
              id: profile.user_id,
              email: "", // Email not accessible via profiles for privacy
              full_name: profile.full_name,
              roles: roles?.map(r => r.role) || ["customer"],
              created_at: profile.created_at,
            };
          })
        );
        setUsers(usersWithRoles);
      }

      // Fetch shops
      const { data: shopsData } = await supabase
        .from("shops")
        .select("*")
        .order("created_at", { ascending: false });

      if (shopsData) {
        setShops(shopsData);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast({
        title: "Error",
        description: "Failed to load admin data.",
        variant: "destructive",
      });
    }
    setIsLoadingData(false);
  };

  const handleResetDatabase = async () => {
    if (resetConfirmText !== "RESET DATABASE") return;
    
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-database", {
        body: { confirmReset: true },
      });

      if (error) throw error;

      toast({
        title: "Database Reset",
        description: "All data has been cleared. Please log in again.",
      });
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Reset error:", error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset database. Check permissions.",
        variant: "destructive",
      });
    }
    setIsResetting(false);
    setResetConfirmText("");
  };

  const handleUpdateUserRole = async (userId: string, role: "admin" | "owner" | "staff" | "customer", action: "add" | "remove") => {
    try {
      if (action === "add") {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
        if (error) throw error;
      }
      
      toast({
        title: "Role Updated",
        description: `Successfully ${action === "add" ? "added" : "removed"} ${role} role.`,
      });
      fetchData();
    } catch (error) {
      console.error("Role update error:", error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteShop = async (shopId: string) => {
    try {
      const { error } = await supabase
        .from("shops")
        .delete()
        .eq("id", shopId);
      
      if (error) throw error;
      
      toast({
        title: "Shop Deleted",
        description: "The shop and all its data have been removed.",
      });
      fetchData();
    } catch (error) {
      console.error("Delete shop error:", error);
      toast({
        title: "Error",
        description: "Failed to delete shop.",
        variant: "destructive",
      });
    }
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">System Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              Exit Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.users}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <Store className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.shops}</p>
                  <p className="text-xs text-muted-foreground">Shops</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center">
                  <Package className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.products}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.orders}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="shops">
              <Store className="h-4 w-4 mr-2" />
              Shops
            </TabsTrigger>
            <TabsTrigger value="danger">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Danger Zone
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage user roles across the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <UserCog className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{u.full_name || "Unknown User"}</p>
                            <p className="text-xs text-muted-foreground">ID: {u.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.roles.map((role) => (
                            <Badge 
                              key={role} 
                              variant={role === "admin" ? "destructive" : role === "owner" ? "default" : "secondary"}
                              className="cursor-pointer"
                              onClick={() => {
                                if (role !== "customer" && u.id !== user?.id) {
                                  handleUpdateUserRole(u.id, role as "admin" | "owner" | "staff" | "customer", "remove");
                                }
                              }}
                            >
                              {role}
                              {role !== "customer" && u.id !== user?.id && " ×"}
                            </Badge>
                          ))}
                          {!u.roles.includes("admin") && u.id !== user?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateUserRole(u.id, "admin", "add")}
                            >
                              + Admin
                            </Button>
                          )}
                          {!u.roles.includes("owner") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateUserRole(u.id, "owner", "add")}
                            >
                              + Owner
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No users found.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shops Tab */}
          <TabsContent value="shops">
            <Card>
              <CardHeader>
                <CardTitle>Shop Management</CardTitle>
                <CardDescription>View and manage all shops on the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {shops.map((shop) => (
                      <div key={shop.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{shop.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Owner: {shop.owner_id.slice(0, 8)}... • 
                              Created: {new Date(shop.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {shop.is_archived && (
                            <Badge variant="secondary">Archived</Badge>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Shop?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{shop.name}" and all its products, orders, and data.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground"
                                  onClick={() => handleDeleteShop(shop.id)}
                                >
                                  Delete Shop
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                    {shops.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No shops found.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that affect the entire platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                  <h3 className="font-semibold text-destructive mb-2">Reset Entire Database</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will delete ALL users, shops, products, orders, and associated data.
                    The database will be completely cleared. This action is irreversible.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="reset-confirm">Type "RESET DATABASE" to confirm:</Label>
                      <Input
                        id="reset-confirm"
                        value={resetConfirmText}
                        onChange={(e) => setResetConfirmText(e.target.value)}
                        placeholder="RESET DATABASE"
                        className="mt-1"
                      />
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          disabled={resetConfirmText !== "RESET DATABASE" || isResetting}
                        >
                          {isResetting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Resetting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Reset Database
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-destructive">
                            ⚠️ Final Warning
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            You are about to PERMANENTLY DELETE all data in the database including:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              <li>All user accounts and profiles</li>
                              <li>All shops and their configurations</li>
                              <li>All products and inventory</li>
                              <li>All orders and transactions</li>
                              <li>All loyalty points and rewards</li>
                            </ul>
                            <p className="mt-3 font-semibold">
                              This action CANNOT be undone. Are you absolutely sure?
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground"
                            onClick={handleResetDatabase}
                          >
                            Yes, Reset Everything
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
