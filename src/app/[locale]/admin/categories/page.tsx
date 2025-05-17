"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  EditIcon,
  TrashIcon,
  FolderIcon,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";

// Types
type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  parent_name: string | null;
  image_url: string | null;
  created_at: string;
  product_count: number;
};

type CategoryFormData = {
  name: string;
  parent_id: string;
  image_url: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // Form state
  const [newCategory, setNewCategory] = useState<CategoryFormData>({
    name: "",
    parent_id: "",
    image_url: "",
  });

  const supabase = createClient();

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);

    try {
      // Fetch categories with hierarchical info
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select(
          `
          id, 
          name, 
          parent_id,
          image_url,
          created_at,
          parent:parent_id(name)
        `
        )
        .order("name");

      if (categoriesError) throw categoriesError;

      // Get product counts for each category
      const { data: productCountsData, error: productCountsError } =
        await supabase.from("products").select("category_id, id");

      if (productCountsError) throw productCountsError;

      // Count products per category
      const productCounts = new Map();
      productCountsData?.forEach((product) => {
        if (product.category_id) {
          const count = productCounts.get(product.category_id) || 0;
          productCounts.set(product.category_id, count + 1);
        }
      });

      const formattedCategories =
        categoriesData?.map((category) => ({
          id: category.id,
          name: category.name,
          parent_id: category.parent_id,
          parent_name: category.parent?.name || null,
          image_url: category.image_url,
          created_at: category.created_at,
          product_count: productCounts.get(category.id) || 0,
        })) || [];

      setCategories(formattedCategories);
      setFilteredCategories(formattedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter categories when search changes
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const results = categories.filter(
        (category) =>
          category.name.toLowerCase().includes(query) ||
          (category.parent_name &&
            category.parent_name.toLowerCase().includes(query))
      );
      setFilteredCategories(results);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert("Category name is required");
      return;
    }

    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("categories")
        .insert([
          {
            name: newCategory.name.trim(),
            parent_id:
              newCategory.parent_id && newCategory.parent_id !== "null"
                ? parseInt(newCategory.parent_id)
                : null,
            image_url: newCategory.image_url || null,
            user_uid: userId, // Add the user ID to comply with RLS policy
          },
        ])
        .select();

      if (error) throw error;

      // Reset form and close dialog
      setNewCategory({
        name: "",
        parent_id: "",
        image_url: "",
      });
      setIsAddDialogOpen(false);

      // Refresh categories
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Error creating category. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !newCategory.name.trim()) {
      alert("Category name is required");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("categories")
        .update({
          name: newCategory.name.trim(),
          parent_id:
            newCategory.parent_id && newCategory.parent_id !== "null"
              ? parseInt(newCategory.parent_id)
              : null,
          image_url: newCategory.image_url || null,
        })
        .eq("id", selectedCategory.id);

      if (error) throw error;

      // Reset form and close dialog
      setNewCategory({
        name: "",
        parent_id: "",
        image_url: "",
      });
      setIsEditDialogOpen(false);
      setSelectedCategory(null);

      // Refresh categories
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Error updating category. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    setSubmitting(true);

    try {
      // Check if this category has children
      const { data: children, error: childrenError } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", selectedCategory.id);

      if (childrenError) throw childrenError;

      if (children && children.length > 0) {
        alert(
          "Cannot delete a category that has subcategories. Please remove or reassign the subcategories first."
        );
        setIsDeleteDialogOpen(false);
        setSelectedCategory(null);
        setSubmitting(false);
        return;
      }

      // Check if products are using this category
      if (selectedCategory.product_count > 0) {
        alert(
          `Cannot delete a category that is used by ${selectedCategory.product_count} products. Please reassign these products to another category first.`
        );
        setIsDeleteDialogOpen(false);
        setSelectedCategory(null);
        setSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", selectedCategory.id);

      if (error) throw error;

      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);

      // Refresh categories
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Error deleting category. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setNewCategory({
      name: category.name,
      parent_id: category.parent_id?.toString() || "",
      image_url: category.image_url || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Function to get eligible parent categories (excluding self and descendants)
  const getEligibleParents = (editingCategoryId?: number) => {
    // When editing, we need to exclude the category itself and its descendants
    if (editingCategoryId) {
      // First find all descendant IDs recursively
      const findDescendants = (parentId: number): number[] => {
        const directChildren = categories
          .filter((c) => c.parent_id === parentId)
          .map((c) => c.id);

        let allDescendants = [...directChildren];

        for (const childId of directChildren) {
          allDescendants = [...allDescendants, ...findDescendants(childId)];
        }

        return allDescendants;
      };

      const ineligibleIds = [
        editingCategoryId,
        ...findDescendants(editingCategoryId),
      ];

      return categories.filter((c) => !ineligibleIds.includes(c.id));
    }

    // For new categories, all categories are eligible as parents
    return categories;
  };

  return (
    <div className='space-y-6 p-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Categories</h2>
          <p className='text-muted-foreground'>
            Manage product categories for accessories
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className='mr-2 h-4 w-4' />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new product category for accessories
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div>
                <Label htmlFor='name'>Category Name*</Label>
                <Input
                  id='name'
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  placeholder='e.g., Screen Protectors'
                />
              </div>
              <div>
                <Label htmlFor='parent'>Parent Category (Optional)</Label>
                <Select
                  value={newCategory.parent_id}
                  onValueChange={(value) =>
                    setNewCategory({ ...newCategory, parent_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a parent category (optional)' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='null'>None (Top Level)</SelectItem>
                    {getEligibleParents().map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='image'>Category Image (Optional)</Label>
                <div className='mt-2'>
                  <ImageUploader
                    onImageUploaded={(url) =>
                      setNewCategory({ ...newCategory, image_url: url })
                    }
                    existingImageUrl={newCategory.image_url}
                    folder='categories'
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsAddDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCategory} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                    Creating...
                  </>
                ) : (
                  <>Create Category</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Categories</CardTitle>
          <CardDescription>
            Categories help organize your accessories inventory
          </CardDescription>
          <div className='flex w-full max-w-sm items-center space-x-2 mt-2'>
            <Input
              placeholder='Search categories...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='h-9'
            />
            <Button variant='outline' className='h-9 px-3' disabled>
              <SearchIcon className='h-4 w-4' />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex justify-center items-center h-40'>
              <Loader2Icon className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-40 text-center'>
              <FolderIcon className='h-12 w-12 text-muted-foreground mb-2' />
              <p className='text-muted-foreground'>
                {searchQuery
                  ? "No categories matched your search."
                  : "No categories found. Add your first category!"}
              </p>
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Parent Category</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className='font-medium'>
                        {category.name}
                      </TableCell>
                      <TableCell>{category.parent_name || "None"}</TableCell>
                      <TableCell>{category.product_count}</TableCell>
                      <TableCell>
                        {category.image_url ? (
                          <div className='w-10 h-10 rounded-md overflow-hidden'>
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className='w-full h-full object-cover'
                            />
                          </div>
                        ) : (
                          "No image"
                        )}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => openEditDialog(category)}
                          >
                            <EditIcon className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => openDeleteDialog(category)}
                          >
                            <TrashIcon className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the details of this category
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div>
              <Label htmlFor='edit-name'>Category Name*</Label>
              <Input
                id='edit-name'
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                placeholder='e.g., Screen Protectors'
              />
            </div>
            <div>
              <Label htmlFor='edit-parent'>Parent Category</Label>
              <Select
                value={newCategory.parent_id}
                onValueChange={(value) =>
                  setNewCategory({ ...newCategory, parent_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a parent category (optional)' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='null'>None (Top Level)</SelectItem>
                  {getEligibleParents(selectedCategory?.id).map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='edit-image'>Category Image</Label>
              <div className='mt-2'>
                <ImageUploader
                  onImageUploaded={(url) =>
                    setNewCategory({ ...newCategory, image_url: url })
                  }
                  existingImageUrl={newCategory.image_url}
                  folder='categories'
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditCategory} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                  Updating...
                </>
              ) : (
                <>Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category?
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <p>
              You are about to delete the category{" "}
              <strong>{selectedCategory?.name}</strong>.
            </p>
            {selectedCategory?.product_count > 0 && (
              <p className='text-red-500 mt-2'>
                Warning: This category contains {selectedCategory.product_count}{" "}
                products. Deleting it will remove category assignments from
                these products.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteCategory}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                <>Delete Category</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
