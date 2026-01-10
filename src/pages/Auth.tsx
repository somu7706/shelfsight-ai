import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Eye, EyeOff, Loader2, ShoppingBag, User as UserIcon } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

type UserRole = "customer" | "owner";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  
  const { user, hasShop, isShopOwner, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !loading) {
      // Route based on user's shop status
      if (hasShop && isShopOwner) {
        navigate("/dashboard");
      } else {
        // Check if user has owner role but no shop yet
        checkUserRoleAndRedirect();
      }
    }
  }, [user, loading, hasShop, isShopOwner, navigate]);

  const checkUserRoleAndRedirect = async () => {
    if (!user) return;
    
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const isOwner = roleData?.some(r => r.role === "owner");
    
    if (isOwner && !hasShop) {
      navigate("/shop-setup");
    } else {
      navigate("/");
    }
  };

  const validateForm = (isSignUp: boolean) => {
    const newErrors: { email?: string; password?: string; name?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (isSignUp) {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast({
        title: "Select a role",
        description: "Please select whether you're a customer or shop owner.",
        variant: "destructive",
      });
      return;
    }
    if (!validateForm(true)) return;

    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      setIsLoading(false);
      if (error.message.includes("already registered")) {
        toast({
          title: "Account exists",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }

    // If owner role selected, add owner role to user_roles table
    // This will be done after the user is created via trigger, but we need to add owner role
    if (selectedRole === "owner") {
      // Wait a moment for the user to be created
      setTimeout(async () => {
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          await supabase.from("user_roles").insert({
            user_id: newUser.id,
            role: "owner" as const,
          });
        }
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  };

  // Role Selection Screen for Sign Up
  const RoleSelection = () => (
    <div className="space-y-4">
      <p className="text-sm text-center text-muted-foreground mb-4">
        How would you like to use GrocerVision?
      </p>
      
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => setSelectedRole("customer")}
          className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-4 ${
            selectedRole === "customer"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            selectedRole === "customer" ? "bg-primary/20" : "bg-muted"
          }`}>
            <ShoppingBag className={`h-6 w-6 ${selectedRole === "customer" ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">I'm a Customer</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Browse nearby shops, order products, and track deliveries
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRole("owner")}
          className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-4 ${
            selectedRole === "owner"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            selectedRole === "owner" ? "bg-primary/20" : "bg-muted"
          }`}>
            <Store className={`h-6 w-6 ${selectedRole === "owner" ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">I'm a Shop Owner</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create your shop, manage inventory, and receive orders
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 gradient-hero opacity-10" />
      
      <Card className="w-full max-w-md relative z-10 shadow-xl border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
            <Store className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">GrocerVision</CardTitle>
          <CardDescription>Smart retail management & ordering</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={errors.password ? "border-destructive pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>
                
                <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <RoleSelection />
                
                {selectedRole && (
                  <>
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">Full Name</Label>
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className={errors.name ? "border-destructive" : ""}
                          />
                          {errors.name && (
                            <p className="text-xs text-destructive">{errors.name}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={errors.email ? "border-destructive" : ""}
                          />
                          {errors.email && (
                            <p className="text-xs text-destructive">{errors.email}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative">
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className={errors.password ? "border-destructive pr-10" : "pr-10"}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="text-xs text-destructive">{errors.password}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        selectedRole === "owner" ? "Create Shop Owner Account" : "Create Customer Account"
                      )}
                    </Button>
                  </>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
