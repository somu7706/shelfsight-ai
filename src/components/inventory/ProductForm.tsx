import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  cost_price: z.coerce.number().min(0, "Cost must be positive").optional(),
  category_id: z.string().optional(),
  initial_stock: z.coerce.number().min(0, "Stock must be positive").optional(),
  min_stock_level: z.coerce.number().min(0, "Min stock must be positive").optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editProduct?: {
    id: string;
    name: string;
    description: string | null;
    sku: string | null;
    barcode: string | null;
    price: number;
    cost_price: number | null;
    category_id: string | null;
    image_url?: string | null;
  } | null;
}

export function ProductForm({ open, onOpenChange, onSuccess, editProduct }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { shopId } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      price: 0,
      cost_price: 0,
      category_id: "",
      initial_stock: 0,
      min_stock_level: 10,
    },
  });

  useEffect(() => {
    if (shopId) {
      fetchCategories();
    }
  }, [shopId]);

  useEffect(() => {
    if (editProduct) {
      reset({
        name: editProduct.name,
        description: editProduct.description || "",
        sku: editProduct.sku || "",
        barcode: editProduct.barcode || "",
        price: editProduct.price,
        cost_price: editProduct.cost_price || 0,
        category_id: editProduct.category_id || "",
      });
      setImagePreview(editProduct.image_url || null);
      setImageFile(null);
    } else {
      reset({
        name: "",
        description: "",
        sku: "",
        barcode: "",
        price: 0,
        cost_price: 0,
        category_id: "",
        initial_stock: 0,
        min_stock_level: 10,
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [editProduct, reset, open]);

  const fetchCategories = async () => {
    if (!shopId) return;
    
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("shop_id", shopId);
    
    setCategories(data || []);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (productId: string): Promise<string | null> => {
    if (!imageFile) return editProduct?.image_url || null;

    setIsUploading(true);
    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${productId}-${Date.now()}.${fileExt}`;
      const filePath = `${shopId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!shopId) {
      toast({
        title: "Error",
        description: "No shop found. Please create a shop first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (editProduct) {
        // Upload new image if selected
        let imageUrl = editProduct.image_url;
        if (imageFile) {
          imageUrl = await uploadImage(editProduct.id);
        } else if (!imagePreview) {
          imageUrl = null; // Image was removed
        }

        // Update existing product
        const { error } = await supabase
          .from("products")
          .update({
            name: data.name,
            description: data.description || null,
            sku: data.sku || null,
            barcode: data.barcode || null,
            price: data.price,
            cost_price: data.cost_price || null,
            category_id: data.category_id || null,
            image_url: imageUrl,
          })
          .eq("id", editProduct.id);

        if (error) throw error;

        toast({
          title: "Product updated",
          description: "The product has been updated successfully.",
        });
      } else {
        // Create new product
        const { data: product, error: productError } = await supabase
          .from("products")
          .insert({
            shop_id: shopId,
            name: data.name,
            description: data.description || null,
            sku: data.sku || null,
            barcode: data.barcode || null,
            price: data.price,
            cost_price: data.cost_price || null,
            category_id: data.category_id || null,
            is_active: true,
          })
          .select()
          .single();

        if (productError) throw productError;

        // Upload image if selected
        if (imageFile && product) {
          const imageUrl = await uploadImage(product.id);
          await supabase
            .from("products")
            .update({ image_url: imageUrl })
            .eq("id", product.id);
        }

        // Create inventory record
        const { error: inventoryError } = await supabase
          .from("inventory")
          .insert({
            product_id: product.id,
            quantity: data.initial_stock || 0,
            min_stock_level: data.min_stock_level || 10,
          });

        if (inventoryError) throw inventoryError;

        toast({
          title: "Product created",
          description: "The product has been added to your inventory.",
        });
      }

      onSuccess();
      onOpenChange(false);
      reset();
      setImageFile(null);
      setImagePreview(null);
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {editProduct
              ? "Update the product details below."
              : "Fill in the product details to add it to your inventory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-border">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-danger text-danger-foreground flex items-center justify-center hover:bg-danger/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add image</span>
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {imagePreview ? "Change Image" : "Upload Image"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 5MB. JPG, PNG, or WebP.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Tata Salt (1kg)"
              className={errors.name ? "border-danger" : ""}
            />
            {errors.name && (
              <p className="text-xs text-danger">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Product description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                {...register("sku")}
                placeholder="SKU001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                {...register("barcode")}
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price (₹)</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                {...register("cost_price")}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price")}
                placeholder="0.00"
                className={errors.price ? "border-danger" : ""}
              />
              {errors.price && (
                <p className="text-xs text-danger">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              onValueChange={(value) => setValue("category_id", value)}
              defaultValue={editProduct?.category_id || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!editProduct && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initial_stock">Initial Stock</Label>
                <Input
                  id="initial_stock"
                  type="number"
                  {...register("initial_stock")}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock_level">Min Stock Level</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  {...register("min_stock_level")}
                  placeholder="10"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="gradient-primary"
              disabled={isLoading || isUploading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editProduct ? (
                "Update Product"
              ) : (
                "Add Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
