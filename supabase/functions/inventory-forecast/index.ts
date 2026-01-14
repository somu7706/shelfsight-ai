import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shopId } = await req.json();
    
    if (!shopId) {
      return new Response(JSON.stringify({ error: "Shop ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized - missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's auth token for verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the JWT and get user ID
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("JWT verification failed:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized - invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId, "requesting forecast for shop:", shopId);

    // Use service role client for authorization check (to bypass RLS and check ownership)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user can manage this shop (is owner or staff)
    const { data: shopOwner } = await supabaseAdmin
      .from("shops")
      .select("owner_id")
      .eq("id", shopId)
      .maybeSingle();

    const { data: isStaff } = await supabaseAdmin
      .from("shop_staff")
      .select("id")
      .eq("shop_id", shopId)
      .eq("user_id", userId)
      .maybeSingle();

    const { data: isAdmin } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const canAccess = shopOwner?.owner_id === userId || !!isStaff || !!isAdmin;

    if (!canAccess) {
      console.warn("Access denied: user", userId, "cannot manage shop", shopId);
      return new Response(JSON.stringify({ error: "Forbidden - you don't have permission to access this shop's forecasts" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authorization verified for user:", userId);

    // Use service role client for data operations
    const supabase = supabaseAdmin;

    // Fetch products with inventory
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        price,
        inventory (
          quantity,
          min_stock_level
        )
      `)
      .eq("shop_id", shopId)
      .eq("is_active", true);

    if (productsError) throw productsError;

    // Fetch sales data from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select(`
        product_id,
        quantity,
        orders!inner (
          shop_id,
          status,
          created_at
        )
      `)
      .eq("orders.shop_id", shopId)
      .eq("orders.status", "completed")
      .gte("orders.created_at", thirtyDaysAgo.toISOString());

    if (orderItemsError) throw orderItemsError;

    // Calculate sales data per product
    const salesByProduct = new Map<string, number[]>();
    
    (orderItems || []).forEach((item: any) => {
      const productId = item.product_id;
      if (!salesByProduct.has(productId)) {
        salesByProduct.set(productId, []);
      }
      salesByProduct.get(productId)!.push(item.quantity);
    });

    // Prepare data for AI analysis
    const productsData = (products || []).map((product: any) => {
      const sales = salesByProduct.get(product.id) || [];
      const totalSales = sales.reduce((a, b) => a + b, 0);
      const avgDailySales = totalSales / 30;
      const currentStock = product.inventory?.quantity || 0;
      const minStock = product.inventory?.min_stock_level || 10;

      return {
        id: product.id,
        name: product.name,
        currentStock,
        minStock,
        totalSales30Days: totalSales,
        avgDailySales: avgDailySales.toFixed(2),
        daysUntilStockout: avgDailySales > 0 ? Math.floor(currentStock / avgDailySales) : null,
      };
    });

    // Call Lovable AI for intelligent forecasting
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an inventory forecasting AI for a grocery store. Analyze sales patterns and provide predictions.
            
For each product, provide:
1. Risk level (critical, warning, healthy)
2. Predicted stockout date
3. Recommended reorder quantity
4. Confidence score (0-100)
5. Brief recommendation

Consider seasonal patterns, sales velocity, and current stock levels. Be concise and actionable.`
          },
          {
            role: "user",
            content: `Analyze these products and provide forecasts:\n\n${JSON.stringify(productsData, null, 2)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_forecasts",
              description: "Generate inventory forecasts for products",
              parameters: {
                type: "object",
                properties: {
                  forecasts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        productId: { type: "string" },
                        productName: { type: "string" },
                        riskLevel: { type: "string", enum: ["critical", "warning", "healthy"] },
                        daysUntilStockout: { type: "number" },
                        predictedStockoutDate: { type: "string" },
                        reorderQuantity: { type: "number" },
                        confidenceScore: { type: "number" },
                        recommendation: { type: "string" }
                      },
                      required: ["productId", "productName", "riskLevel", "confidenceScore", "recommendation"]
                    }
                  }
                },
                required: ["forecasts"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_forecasts" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let forecasts = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      forecasts = parsed.forecasts || [];
    }

    // Store forecasts in database
    for (const forecast of forecasts) {
      const product = productsData.find((p: any) => p.id === forecast.productId);
      if (!product) continue;

      await supabase
        .from("inventory_forecasts")
        .upsert({
          product_id: forecast.productId,
          shop_id: shopId,
          current_stock: product.currentStock,
          daily_sales_avg: parseFloat(product.avgDailySales),
          days_until_stockout: forecast.daysUntilStockout,
          predicted_stockout_date: forecast.predictedStockoutDate,
          confidence_score: forecast.confidenceScore,
          recommendation: forecast.recommendation,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "product_id,shop_id",
        });
    }

    return new Response(JSON.stringify({ forecasts, productsData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Forecast error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});