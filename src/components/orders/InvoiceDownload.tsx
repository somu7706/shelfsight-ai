import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Loader2, FileText, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    name: string;
    sku: string | null;
  };
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  subtotal: number;
  tax: number | null;
  discount: number | null;
  total: number;
  status: string;
  payment_status: string;
  notes: string | null;
  customer_id: string;
  shop: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    gst_number: string | null;
  };
}

interface InvoiceDownloadProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDownload({ order, open, onOpenChange }: InvoiceDownloadProps) {
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerProfile, setCustomerProfile] = useState<{ full_name: string | null; phone: string | null; address: string | null } | null>(null);
  const { toast } = useToast();

  const fetchOrderDetails = async () => {
    if (!order) return;

    setLoading(true);
    try {
      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          id,
          quantity,
          unit_price,
          total_price,
          products:product_id (
            name,
            sku
          )
        `)
        .eq("order_id", order.id);

      if (itemsError) throw itemsError;

      const formattedItems = items?.map((item) => ({
        ...item,
        product: item.products as unknown as { name: string; sku: string | null },
      })) || [];

      setOrderItems(formattedItems);

      // Fetch customer profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, address")
        .eq("user_id", order.customer_id)
        .maybeSingle();

      setCustomerProfile(profile);
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when dialog opens
  useState(() => {
    if (open && order) {
      fetchOrderDetails();
    }
  });

  const generateInvoiceHTML = () => {
    if (!order) return "";

    const orderDate = new Date(order.created_at).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order.order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #333; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
    .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; color: #1f2937; margin-bottom: 5px; }
    .invoice-title p { color: #6b7280; }
    .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .info-block h3 { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; letter-spacing: 0.5px; }
    .info-block p { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .text-right { text-align: right; }
    .totals { width: 300px; margin-left: auto; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { font-size: 18px; font-weight: bold; color: #2563eb; border-top: 2px solid #2563eb; margin-top: 8px; padding-top: 16px; }
    .footer { margin-top: 60px; text-align: center; color: #6b7280; font-size: 14px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #059669; }
    .badge-warning { background: #fef3c7; color: #d97706; }
    .badge-danger { background: #fee2e2; color: #dc2626; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">${order.shop.name}</div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <p>${order.order_number}</p>
    </div>
  </div>

  <div class="info-section">
    <div class="info-block">
      <h3>From</h3>
      <p><strong>${order.shop.name}</strong></p>
      ${order.shop.address ? `<p>${order.shop.address}</p>` : ""}
      ${order.shop.phone ? `<p>Phone: ${order.shop.phone}</p>` : ""}
      ${order.shop.email ? `<p>Email: ${order.shop.email}</p>` : ""}
      ${order.shop.gst_number ? `<p>GST: ${order.shop.gst_number}</p>` : ""}
    </div>
    <div class="info-block" style="text-align: right;">
      <h3>Bill To</h3>
      <p><strong>${customerProfile?.full_name || "Customer"}</strong></p>
      ${customerProfile?.phone ? `<p>Phone: ${customerProfile.phone}</p>` : ""}
      ${customerProfile?.address ? `<p>${customerProfile.address}</p>` : ""}
    </div>
  </div>

  <div class="info-section">
    <div class="info-block">
      <h3>Invoice Date</h3>
      <p>${orderDate}</p>
    </div>
    <div class="info-block">
      <h3>Status</h3>
      <span class="badge ${order.status === "completed" ? "badge-success" : order.status === "cancelled" ? "badge-danger" : "badge-warning"}">
        ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
      </span>
    </div>
    <div class="info-block" style="text-align: right;">
      <h3>Payment Status</h3>
      <span class="badge ${order.payment_status === "paid" ? "badge-success" : order.payment_status === "failed" ? "badge-danger" : "badge-warning"}">
        ${order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
      </span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item</th>
        <th>SKU</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${orderItems.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.product?.name || "Product"}</td>
          <td>${item.product?.sku || "-"}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">₹${item.unit_price.toFixed(2)}</td>
          <td class="text-right">₹${item.total_price.toFixed(2)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>₹${order.subtotal.toFixed(2)}</span>
    </div>
    ${order.tax ? `
      <div class="totals-row">
        <span>Tax</span>
        <span>₹${order.tax.toFixed(2)}</span>
      </div>
    ` : ""}
    ${order.discount ? `
      <div class="totals-row">
        <span>Discount</span>
        <span>-₹${order.discount.toFixed(2)}</span>
      </div>
    ` : ""}
    <div class="totals-row total">
      <span>Total</span>
      <span>₹${order.total.toFixed(2)}</span>
    </div>
  </div>

  ${order.notes ? `
    <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px;">
      <strong>Notes:</strong> ${order.notes}
    </div>
  ` : ""}

  <div class="footer">
    <p>Thank you for your business!</p>
    <p style="margin-top: 5px;">${order.shop.name}</p>
  </div>
</body>
</html>
    `;
  };

  const handleDownload = () => {
    const html = generateInvoiceHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${order?.order_number || "order"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Invoice downloaded",
      description: "Open the file in a browser and print to PDF.",
    });
  };

  const handlePrint = () => {
    const html = generateInvoiceHTML();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // Effect to fetch when dialog opens
  if (open && order && orderItems.length === 0 && !loading) {
    fetchOrderDetails();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Invoice
          </DialogTitle>
          <DialogDescription>
            Download or print the invoice for order {order?.order_number}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Order Summary */}
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-mono font-medium">{order?.order_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span>{orderItems.length} products</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span>
                  {order?.created_at
                    ? new Date(order.created_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between font-medium text-lg pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">₹{order?.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={handleDownload}
                className="gradient-primary w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
