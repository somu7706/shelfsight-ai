import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, Loader2, History, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface StockTransaction {
  id: string;
  transaction_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  notes: string | null;
  created_at: string;
}

interface StockAdjustmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    inventory?: {
      quantity: number;
    } | null;
  } | null;
  onSuccess: () => void;
}

export function StockAdjustment({ open, onOpenChange, product, onSuccess }: StockAdjustmentProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove" | "set">("add");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const currentStock = product?.inventory?.quantity ?? 0;

  useEffect(() => {
    if (open && product) {
      fetchTransactions();
      setQuantity("");
      setNotes("");
      setAdjustmentType("add");
    }
  }, [open, product]);

  const fetchTransactions = async () => {
    if (!product) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stock_transactions")
        .select("id, transaction_type, quantity_change, previous_quantity, new_quantity, notes, created_at")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNewQuantity = () => {
    const qty = parseInt(quantity) || 0;
    switch (adjustmentType) {
      case "add":
        return currentStock + qty;
      case "remove":
        return Math.max(0, currentStock - qty);
      case "set":
        return qty;
      default:
        return currentStock;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      });
      return;
    }

    const newQuantity = calculateNewQuantity();
    const quantityChange = newQuantity - currentStock;

    if (quantityChange === 0) {
      toast({
        title: "No change",
        description: "The quantity would remain the same.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Update inventory
      const { error: inventoryError } = await supabase
        .from("inventory")
        .update({ quantity: newQuantity })
        .eq("product_id", product.id);

      if (inventoryError) throw inventoryError;

      // Log transaction
      const transactionType = adjustmentType === "add" 
        ? "restock" 
        : adjustmentType === "remove" 
          ? "adjustment" 
          : "correction";

      const { error: transactionError } = await supabase
        .from("stock_transactions")
        .insert({
          product_id: product.id,
          transaction_type: transactionType,
          quantity_change: quantityChange,
          previous_quantity: currentStock,
          new_quantity: newQuantity,
          notes: notes.trim() || null,
          created_by: user.id,
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Stock updated",
        description: `${product.name} stock ${adjustmentType === "add" ? "increased" : adjustmentType === "remove" ? "decreased" : "set"} to ${newQuantity} units.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update stock.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getTransactionBadge = (type: string, change: number) => {
    if (change > 0) {
      return <Badge className="bg-success/10 text-success">+{change}</Badge>;
    }
    return <Badge className="bg-danger/10 text-danger">{change}</Badge>;
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "restock":
        return "Restock";
      case "sale":
        return "Sale";
      case "adjustment":
        return "Adjustment";
      case "correction":
        return "Correction";
      default:
        return type;
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Adjustment
          </DialogTitle>
          <DialogDescription>
            Adjust stock for <strong>{product.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="adjust" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="adjust">Adjust Stock</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="adjust" className="space-y-4 mt-4">
            {/* Current Stock Display */}
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-4xl font-bold text-foreground">{currentStock}</p>
              <p className="text-sm text-muted-foreground">units</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <Select
                  value={adjustmentType}
                  onValueChange={(v) => setAdjustmentType(v as "add" | "remove" | "set")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-success" />
                        Add Stock (Restock)
                      </div>
                    </SelectItem>
                    <SelectItem value="remove">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-danger" />
                        Remove Stock (Damage/Loss)
                      </div>
                    </SelectItem>
                    <SelectItem value="set">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        Set Exact Quantity
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">
                  {adjustmentType === "set" ? "New Quantity" : "Quantity to " + (adjustmentType === "add" ? "Add" : "Remove")}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </div>

              {quantity && parseInt(quantity) > 0 && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    <span className="text-muted-foreground">New stock will be: </span>
                    <span className="font-bold text-primary text-lg">{calculateNewQuantity()}</span>
                    <span className="text-muted-foreground"> units</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for adjustment..."
                  rows={2}
                  maxLength={255}
                />
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary"
                disabled={saving || !quantity || parseInt(quantity) < 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Stock"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No transaction history</p>
                <p className="text-sm">Stock adjustments will appear here.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(tx.created_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {getTransactionLabel(tx.transaction_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getTransactionBadge(tx.transaction_type, tx.quantity_change)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.previous_quantity} → {tx.new_quantity}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {tx.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
