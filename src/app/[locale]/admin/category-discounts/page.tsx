"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format as formatDate } from "date-fns";

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  CalendarIcon,
  X,
  Filter,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Form validation schema
const formSchema = z.object({
  categoryId: z.string().nonempty("Category is required"),
  discountPercentage: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%"),
  isActive: z.boolean().default(true),
  startDate: z.date().default(() => new Date()),
  endDate: z.date().optional(),
  description: z.string().optional(),
});

type CategoryDiscount = {
  id: number;
  category_id: number;
  discount_percentage: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  category_name: string;
};

type Category = {
  id: number;
  name: string;
};

export default function CategoryDiscountsPage() {
  const t = useTranslations();
  const supabase = createClient();
  const [discounts, setDiscounts] = useState<CategoryDiscount[]>([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState<CategoryDiscount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<CategoryDiscount | null>(null);

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: "",
      discountPercentage: 0,
      isActive: true,
      startDate: new Date(),
      description: "",
    },
  });

  const fetchDiscountsAndCategories = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch discounts with category names
      const { data: discountsData, error: discountsError } = await supabase
        .from("category_discounts")
        .select(`
          *,
          category:category_id(name)
        `)
        .order("created_at", { ascending: false });

      if (discountsError) throw discountsError;

      const processedDiscounts = discountsData?.map((discount) => ({
        ...discount,
        category_name: discount.category?.name || "Unknown category",
      }));

      setDiscounts(processedDiscounts || []);
      setFilteredDiscounts(processedDiscounts || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDiscountsAndCategories();
  }, [fetchDiscountsAndCategories]);

  useEffect(() => {
    // Apply filters
    let results = [...discounts];

    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      results = results.filter(
        (discount) =>
          discount.category_name.toLowerCase().includes(lowercaseQuery) ||
          (discount.description &&
            discount.description.toLowerCase().includes(lowercaseQuery))
      );
    }

    if (showActiveOnly) {
      results = results.filter((discount) => discount.is_active);
    }

    setFilteredDiscounts(results);
  }, [discounts, searchQuery, showActiveOnly]);

  const handleOpenAddDialog = () => {
    form.reset({
      categoryId: "",
      discountPercentage: 0,
      isActive: true,
      startDate: new Date(),
      endDate: undefined,
      description: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (discount: CategoryDiscount) => {
    form.reset({
      categoryId: discount.category_id.toString(),
      discountPercentage: discount.discount_percentage,
      isActive: discount.is_active,
      startDate: new Date(discount.start_date),
      endDate: discount.end_date ? new Date(discount.end_date) : undefined,
      description: discount.description || "",
    });
    setSelectedDiscount(discount);
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (discount: CategoryDiscount) => {
    setSelectedDiscount(discount);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      if (!userId) {
        throw new Error("Not authenticated");
      }

      const discountData = {
        category_id: parseInt(values.categoryId),
        discount_percentage: values.discountPercentage,
        is_active: values.isActive,
        start_date: values.startDate.toISOString(),
        end_date: values.endDate ? values.endDate.toISOString() : null,
        description: values.description || null,
        user_uid: userId,
      };

      if (isEditDialogOpen && selectedDiscount) {
        // Update existing discount
        const { error } = await supabase
          .from("category_discounts")
          .update(discountData)
          .eq("id", selectedDiscount.id);

        if (error) throw error;
        toast.success("Discount updated successfully");
        setIsEditDialogOpen(false);
      } else {
        // Create new discount
        const { error } = await supabase
          .from("category_discounts")
          .insert([discountData]);

        if (error) throw error;
        toast.success("Discount created successfully");
        setIsAddDialogOpen(false);
      }

      // Refresh data
      fetchDiscountsAndCategories();
    } catch (error) {
      console.error("Error saving discount:", error);
      toast.error("Failed to save discount");
    }
  };

  const handleDelete = async () => {
    if (!selectedDiscount) return;

    try {
      const { error } = await supabase
        .from("category_discounts")
        .delete()
        .eq("id", selectedDiscount.id);

      if (error) throw error;

      toast.success("Discount deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchDiscountsAndCategories();
    } catch (error) {
      console.error("Error deleting discount:", error);
      toast.error("Failed to delete discount");
    }
  };

  const formatDateDisplay = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("Category Discounts")}</h1>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Discount
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Category Discounts</CardTitle>
          <CardDescription>
            Create and manage discount rates for product categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search by category or description..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="active-only"
                checked={showActiveOnly}
                onCheckedChange={(checked) =>
                  setShowActiveOnly(checked as boolean)
                }
              />
              <label htmlFor="active-only" className="text-sm">
                Active only
              </label>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiscounts.length > 0 ? (
                    filteredDiscounts.map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell className="font-medium">
                          {discount.category_name}
                        </TableCell>
                        <TableCell>{discount.discount_percentage}%</TableCell>
                        <TableCell>
                          {discount.is_active ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDateDisplay(discount.start_date)}
                        </TableCell>
                        <TableCell>
                          {formatDateDisplay(discount.end_date)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {discount.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditDialog(discount)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleOpenDeleteDialog(discount)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No discounts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Discount Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Discount" : "Add Discount"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the details of this category discount."
                : "Create a new discount for a product category."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Percentage</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(
                              isNaN(value) ? 0 : Math.min(100, Math.max(0, value))
                            );
                          }}
                          className="flex-1"
                        />
                        <span className="ml-2">%</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Whether this discount is currently active
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              {field.value ? (
                                formatDate(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => field.onChange(date || new Date())}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              {field.value ? (
                                formatDate(field.value, "PPP")
                              ) : (
                                <span>No end date</span>
                              )}
                              <div className="ml-auto flex items-center">
                                {field.value && (
                                  <X
                                    className="mr-2 h-4 w-4 opacity-50 hover:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      field.onChange(undefined);
                                    }}
                                  />
                                )}
                                <CalendarIcon className="h-4 w-4 opacity-50" />
                              </div>
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date <
                              new Date(
                                form.getValues("startDate") ||
                                  new Date().setHours(0, 0, 0, 0)
                              )
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter discount details or purpose"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setIsEditDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditDialogOpen ? "Save Changes" : "Create Discount"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => !open && setIsDeleteDialogOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the{" "}
              <span className="font-semibold">
                {selectedDiscount?.discount_percentage}%
              </span>{" "}
              discount for{" "}
              <span className="font-semibold">
                {selectedDiscount?.category_name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
