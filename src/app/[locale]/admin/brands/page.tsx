"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PlusIcon,
  Pencil,
  Trash2,
  ImageIcon,
  SearchIcon,
  Loader2,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";

interface Brand {
  id: number;
  name: string;
  image_url: string | null;
  created_at: string;
  product_count?: number;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit/Create state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandImage, setBrandImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

  const supabase = createClient();

  // Fetch brands data
  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch brands
      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .select("*")
        .order("name");

      if (brandError) throw brandError;

      // Count products for each brand
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("brand_id, id");

      if (productError) throw productError;

      // Count products by brand_id
      const brandCounts = new Map<number, number>();
      productData?.forEach((product) => {
        if (product.brand_id) {
          const count = brandCounts.get(product.brand_id) || 0;
          brandCounts.set(product.brand_id, count + 1);
        }
      });

      // Combine brand data with product counts
      const brandsWithCounts =
        brandData?.map((brand) => ({
          ...brand,
          product_count: brandCounts.get(brand.id) || 0,
        })) || [];

      setBrands(brandsWithCounts);
      setFilteredBrands(brandsWithCounts);
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Filter brands when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = brands.filter((brand) =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBrands(filtered);
    } else {
      setFilteredBrands(brands);
    }
  }, [searchQuery, brands]);

  // Handle add or edit brand
  const handleSaveBrand = async () => {
    if (!brandName.trim()) {
      alert("Brand name is required");
      return;
    }

    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("User not authenticated");
      }

      const brandData = {
        name: brandName.trim(),
        image_url: brandImage,
        user_uid: user.user.id,
      };

      if (isEditing && currentBrand) {
        // Update existing brand
        const { error } = await supabase
          .from("brands")
          .update(brandData)
          .eq("id", currentBrand.id);

        if (error) throw error;
      } else {
        // Create new brand
        const { error } = await supabase.from("brands").insert([brandData]);

        if (error) throw error;
      }

      // Refresh brands list
      fetchBrands();

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving brand:", error);
      alert(`Error saving brand: ${error.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete brand
  const handleDeleteBrand = async () => {
    if (!brandToDelete) return;

    try {
      const { error } = await supabase
        .from("brands")
        .delete()
        .eq("id", brandToDelete.id);

      if (error) throw error;

      // Refresh brands list
      fetchBrands();
      setIsDeleteDialogOpen(false);
      setBrandToDelete(null);
    } catch (error: any) {
      console.error("Error deleting brand:", error);
      alert(`Error deleting brand: ${error.message || "Unknown error"}`);
    }
  };

  // Open edit dialog with brand data
  const openEditDialog = (brand: Brand) => {
    setCurrentBrand(brand);
    setBrandName(brand.name);
    setBrandImage(brand.image_url);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Reset form fields
  const resetForm = () => {
    setCurrentBrand(null);
    setBrandName("");
    setBrandImage(null);
  };

  // Handle image upload
  const handleImageUpload = (url: string) => {
    setBrandImage(url);
  };

  if (loading) {
    return (
      <div className='flex h-[80vh] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold tracking-tight'>Brand Management</h1>

        <Button onClick={openCreateDialog}>
          <PlusIcon className='mr-2 h-4 w-4' />
          Add Brand
        </Button>
      </div>

      <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
        <div className='relative flex-1'>
          <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search brands...'
            className='pl-10'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Associated Products</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-center py-8 text-muted-foreground'
                  >
                    {searchQuery
                      ? "No brands found matching your search"
                      : "No brands added yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='h-10 w-10 rounded-md bg-muted flex items-center justify-center'>
                          {brand.image_url ? (
                            <img
                              src={brand.image_url}
                              alt={brand.name}
                              className='h-full w-full object-contain rounded-md'
                            />
                          ) : (
                            <ImageIcon className='h-5 w-5 text-muted-foreground' />
                          )}
                        </div>
                        <div className='font-medium'>{brand.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{brand.product_count || 0} products</TableCell>
                    <TableCell>
                      {new Date(brand.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => openEditDialog(brand)}
                        >
                          <Pencil className='h-4 w-4' />
                          <span className='sr-only'>Edit</span>
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-destructive hover:text-destructive'
                          onClick={() => {
                            setBrandToDelete(brand);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className='h-4 w-4' />
                          <span className='sr-only'>Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Brand" : "Add New Brand"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Make changes to the brand details"
                : "Create a new brand for products"}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='brand-name' className='text-right'>
                Brand Name
              </Label>
              <Input
                id='brand-name'
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder='Enter brand name'
                className='col-span-3'
              />
            </div>

            <div className='grid grid-cols-4 items-start gap-4'>
              <Label className='text-right pt-2'>Brand Logo</Label>
              <div className='col-span-3'>
                <ImageUploader
                  onImageUploaded={handleImageUpload}
                  existingImageUrl={brandImage || undefined}
                  folder='brands'
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBrand} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Brand"
              ) : (
                "Add Brand"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {brandToDelete?.product_count && brandToDelete.product_count > 0
                ? `This brand is associated with ${brandToDelete.product_count} products. 
                   Deleting it will remove the brand association from these products.`
                : "This action cannot be undone. The brand will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBrand}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
