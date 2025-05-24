"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ui/image-uploader";
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PlusCircle,
  Trash,
  PencilIcon,
  ImageIcon,
  LinkIcon,
  CalendarIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from "next/image";

// Form schema for banner validation
const bannerFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  subtitle: z.string().optional(),
  image_url: z.string().url({
    message: "Please enter a valid URL for the image.",
  }).refine(value => value.trim() !== '', {
    message: "Banner image is required",
  }),
  link_url: z.string().optional(),
  button_text: z.string().optional(),
  is_active: z.boolean().default(true),
  start_date: z.string().min(1, {
    message: "Please select a start date.",
  }),  end_date: z.string().min(1, {
    message: "Please select an end date.",
  }),
  display_order: z.number().int().min(0).default(0),
  target_page: z.string().optional(),
}).refine(data => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  return endDate > startDate;
}, {
  message: "End date must be after start date",
  path: ["end_date"], // Show this error on the end date field
});

// Banner type definition based on the schema
type Banner = {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  button_text: string | null;
  is_active: boolean;
  start_date: string;
  end_date: string;
  display_order: number;
  target_page: string | null;
  created_at: string;
  updated_at: string;
};

export default function BannersPage() {
  const t = useTranslations("admin");
  const supabase = createClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form initialization
  const form = useForm<z.infer<typeof bannerFormSchema>>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "",
      button_text: "",
      is_active: true,
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      display_order: 0,
      target_page: "home",
    },
  });

  // Fetch banners from the database
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  // Load banners on component mount
  useEffect(() => {
    fetchBanners();
  }, []);

  // Handle form submission for creating/editing banners
  const onSubmit = async (values: z.infer<typeof bannerFormSchema>) => {
    const {data:{user}}=await supabase.auth.getUser();
    const user_uid = user?.id || null;
    try {
      const { 
        title, 
        subtitle, 
        image_url, 
        link_url, 
        button_text, 
        is_active, 
        start_date, 
        end_date, 
        display_order, 
        target_page 
      } = values;

      const bannerData = {
        title,
        subtitle: subtitle || null,
        image_url,
        link_url: link_url || null,
        button_text: button_text || null,
        is_active,
        start_date: new Date(start_date).toISOString(),
        end_date: new Date(end_date).toISOString(),
        display_order,
        target_page: target_page || null,
        user_uid
      };

      let result;

      if (editingBanner) {
        // Update existing banner
        result = await supabase
          .from("banners")
          .update(bannerData)
          .eq("id", editingBanner.id);
        
        if (result.error) throw result.error;
        toast.success("Banner updated successfully");
      } else {
        // Create new banner
        result = await supabase
          .from("banners")
          .insert([bannerData]);
        
        if (result.error) throw result.error;
        toast.success("Banner created successfully");
      }

      // Reset form and close dialog
      resetForm();
      fetchBanners();
    } catch (error) {
      console.error("Error saving banner:", error);
      toast.error("Failed to save banner");
    }
  };

  // Reset form and dialog state
  const resetForm = () => {
    form.reset({
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "",
      button_text: "",
      is_active: true,
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      display_order: 0,
      target_page: "home",
    });
    setEditingBanner(null);
    setIsDialogOpen(false);
    setImagePreview(null);
  };

  // Set up form for editing
  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    form.reset({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      button_text: banner.button_text || "",
      is_active: banner.is_active,
      start_date: banner.start_date.substring(0, 10),
      end_date: banner.end_date.substring(0, 10),
      display_order: banner.display_order,
      target_page: banner.target_page || "home",
    });
    setImagePreview(banner.image_url);
    setIsDialogOpen(true);
  };
  // Handle banner deletion
  const handleDelete = async (id: number) => {
    if (confirm(t("confirmDelete"))) {
      try {
        const { error } = await supabase.from("banners").delete().eq("id", id);
        if (error) throw error;
        toast.success("Banner deleted successfully");
        fetchBanners();
      } catch (error) {
        console.error("Error deleting banner:", error);
        toast.error("Failed to delete banner");
      }
    }
  };
  
  // Handle banner preview
  const handlePreview = (banner: Banner) => {
    setPreviewBanner(banner);
    setIsPreviewDialogOpen(true);
  };
  // Preview the image when URL changes
  const handleImageUrlChange = (value: string) => {
    if (value) {
      setImagePreview(value);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <div>
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("banners")}</CardTitle>
              <CardDescription>{t("manageBannersDesc")}</CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("addBanner")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
              <p>{t("noBannersFound")}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {t("addBanner")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">{t("id")}</TableHead>
                    <TableHead className="w-[250px]">{t("title")}</TableHead>
                    <TableHead>{t("image")}</TableHead>
                    <TableHead>{t("dateRange")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="w-[100px]">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((banner) => (
                    <TableRow key={banner.id}>                      <TableCell className="whitespace-nowrap">{banner.id}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <div className="font-medium">{banner.title}</div>
                          {banner.subtitle && (
                            <div className="text-sm text-gray-500">{banner.subtitle}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="relative h-16 w-32 overflow-hidden rounded">
                          <Image
                            src={banner.image_url}
                            alt={banner.title}
                            fill
                            className="object-cover"
                            sizes="128px"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">
                          <div>{new Date(banner.start_date).toLocaleDateString()}</div>
                          <div>to</div>
                          <div>{new Date(banner.end_date).toLocaleDateString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant={banner.is_active ? "success" : "secondary"} 
                          className="capitalize"
                        >
                          {banner.is_active ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePreview(banner)}
                            title={t("preview")}
                          >
                            <EyeIcon className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(banner)}
                            title={t("edit")}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleDelete(banner.id)}
                            title={t("delete")}
                          >
                            <Trash className="h-4 w-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? t("editBanner") : t("addBanner")}
            </DialogTitle>
            <DialogDescription>
              {editingBanner ? t("editBannerDesc") : t("addBannerDesc")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("title")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("bannerTitlePlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("subtitle")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("bannerSubtitlePlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("bannerImage")}</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {!field.value ? (
                              <ImageUploader 
                                existingImageUrl={field.value}
                                onImageUploaded={(url) => {
                                  field.onChange(url);
                                  setImagePreview(url);
                                }}
                                folder="banners"
                              />
                            ) : (
                              <div className="border rounded-md overflow-hidden relative">
                                <div className="relative h-40 w-full">
                                  <Image 
                                    src={field.value} 
                                    alt="Banner preview"
                                    fill
                                    className="object-cover" 
                                    sizes="(max-width: 768px) 100vw, 600px"
                                  />
                                </div>
                                
                                <div className="bg-black/10 backdrop-blur-sm p-3 flex justify-between items-center absolute bottom-0 left-0 right-0">
                                  <div className="text-xs truncate max-w-[80%] text-white">{field.value}</div>
                                  <div className="flex gap-2">
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm"
                                      className="h-8 bg-white hover:bg-white/90"
                                      onClick={() => {
                                        field.onChange("");
                                        setImagePreview(null);
                                      }}
                                    >
                                      <Trash className="h-4 w-4 text-red-500" />
                                    </Button>
                                    <Button
                                      type="button" 
                                      variant="outline" 
                                      size="sm"
                                      className="h-8 bg-white hover:bg-white/90"
                                      onClick={() => {
                                        // Allow re-uploading an image
                                        setImagePreview(null);
                                      }}
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                              {!field.value ? (
                              <div className="flex items-center space-x-2">
                                <div className="h-px flex-1 bg-gray-200"></div>
                                <span className="text-xs text-gray-400">{t("or")}</span>
                                <div className="h-px flex-1 bg-gray-200"></div>
                              </div>
                            ) : null}
                            
                            {!field.value ? (
                              <>
                                <div className="flex space-x-2">
                                  <Input 
                                    placeholder="Enter image URL manually"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        field.onChange(e.target.value);
                                        handleImageUrlChange(e.target.value);
                                      }
                                    }}
                                    className="flex-1"
                                  />
                                  <Button 
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                      const url = prompt("Please enter image URL");
                                      if (url) {
                                        field.onChange(url);
                                        handleImageUrlChange(url);
                                      }
                                    }}
                                  >
                                    <LinkIcon className="h-4 w-4 mr-2" />
                                    {t("pasteUrl")}
                                  </Button>
                                </div>

                                {/* Image Preview for manual URL entry */}
                                {imagePreview && (
                                  <div className="mt-4 border rounded-md overflow-hidden">
                                    <div className="relative h-40 w-full">
                                      <Image 
                                        src={imagePreview} 
                                        alt="Banner preview"
                                        fill
                                        className="object-cover" 
                                        sizes="(max-width: 768px) 100vw, 600px"
                                      />
                                    </div>
                                    <div className="bg-black/10 backdrop-blur-sm p-3 flex justify-between items-center">
                                      <div className="text-xs truncate max-w-[80%]">{imagePreview}</div>
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        className="h-8"
                                        onClick={() => {
                                          field.onChange("");
                                          setImagePreview(null);
                                        }}
                                      >
                                        <Trash className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : null}
                          </div>
                        </FormControl>
                        <FormDescription>
                          {t("bannerImageDesc")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="link_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("linkUrl")}</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/page" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="button_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("buttonText")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("shopNow")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="target_page"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("targetPage")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectTargetPage")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="home">{t("homePage")}</SelectItem>
                            <SelectItem value="shop">{t("shopPage")}</SelectItem>
                            <SelectItem value="repair">{t("repairPage")}</SelectItem>
                            <SelectItem value="trade-in">{t("tradeInPage")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("startDate")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("endDate")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="display_order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("displayOrder")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-end space-x-3 space-y-0 mt-8">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t("isActive")}
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit">
                  {editingBanner ? t("updateBanner") : t("createBanner")}
                </Button>
              </DialogFooter>
            </form>          </Form>
        </DialogContent>
      </Dialog>

      {/* Banner Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{t("previewBanner")}</DialogTitle>
            <DialogDescription>
              {previewBanner?.subtitle || t("previewBannerDesc")}
            </DialogDescription>
          </DialogHeader>
          
          {previewBanner && (
            <div className="space-y-4">
              {/* Banner Preview */}
              <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden">
                <Image
                  src={previewBanner.image_url}
                  alt={previewBanner.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                  <div className="p-8 max-w-md space-y-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">{previewBanner.title}</h2>
                    {previewBanner.subtitle && (
                      <p className="text-white/80">{previewBanner.subtitle}</p>
                    )}
                    {previewBanner.link_url && previewBanner.button_text && (
                      <Button>
                        {previewBanner.button_text}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner Details */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">                <div>
                  <p className="font-medium">{t("bannerDetails")}</p>
                  <p className="text-gray-500">{t("targetPage")}: {previewBanner.target_page || "home"}</p>
                  <div className="text-gray-500 flex items-center">
                    {t("active")}: {previewBanner.is_active ? 
                      <Badge variant="success" className="ml-1">{t("yes")}</Badge> : 
                      <Badge variant="secondary" className="ml-1">{t("no")}</Badge>}
                  </div>
                </div>
                <div>
                  <p className="font-medium">{t("dateRange")}</p>
                  <p className="text-gray-500">{new Date(previewBanner.start_date).toLocaleDateString()} - {new Date(previewBanner.end_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
