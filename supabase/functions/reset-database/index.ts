import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claims?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;

    // Check if user has admin role using service role
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: roles, error: rolesError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");

    if (rolesError || !roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    if (!body.confirmReset) {
      return new Response(
        JSON.stringify({ error: "Confirmation required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete all data in correct order (respecting foreign keys)
    // Using service role client for full access
    
    console.log("Starting database reset...");

    // Delete dependent tables first
    await adminClient.from("points_transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("loyalty_points").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("stock_transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("inventory_forecasts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("inventory").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("cart_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("vision_detections").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("rewards").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("shop_staff").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("shops").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("push_subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("user_roles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Note: We don't delete auth.users as that would require different handling
    // Admin accounts remain so the system can be accessed after reset

    console.log("Database reset completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Database reset completed. All shops, products, orders, and user data have been cleared." 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Reset database error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
