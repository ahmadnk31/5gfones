"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  AlertCircle,
  Upload,
  Trash2,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

type DeviceBrand = {
  id: number;
  name: string;
};

type DeviceType = {
  id: number;
  name: string;
  brand_id: number;
};

type DeviceSeries = {
  id: number;
  name: string;
  device_type_id: number;
};

type DeviceModel = {
  id: number;
  name: string;
  device_series_id: number;
};

type PhoneCondition = {
  id: number;
  name: string;
  description: string;
  multiplier: number;
};

type ImageFile = {
  file: File;
  preview: string;
  uploading?: boolean;
  error?: boolean;
};

export default function SellPhonePage() {
  const t = useTranslations("tradeIn");
  const router = useRouter();
  const locale = useLocale();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [estimatedValue, setEstimatedValue] = useState<number | null>(null);

  // Device selection state
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [series, setSeries] = useState<DeviceSeries[]>([]);
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [conditions, setConditions] = useState<PhoneCondition[]>([]);

  // Form state
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedConditionId, setSelectedConditionId] = useState<number | null>(
    null
  );
  const [storageCapacity, setStorageCapacity] = useState("");
  const [color, setColor] = useState("");
  const [description, setDescription] = useState("");
  const [hasCharger, setHasCharger] = useState(false);
  const [hasBox, setHasBox] = useState(false);
  const [hasAccessories, setHasAccessories] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);

  // Filtered lists based on selections
  const filteredTypes = deviceTypes.filter(
    (type) => selectedBrandId === null || type.brand_id === selectedBrandId
  );

  const filteredSeries = series.filter(
    (s) => selectedTypeId === null || s.device_type_id === selectedTypeId
  );

  const filteredModels = models.filter(
    (model) =>
      selectedSeriesId === null || model.device_series_id === selectedSeriesId
  );

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const supabase = createClient();

      try {
        // Fetch device brands
        const { data: brandsData, error: brandsError } = await supabase
          .from("device_brands")
          .select("id, name")
          .order("name", { ascending: true });

        if (brandsError) throw brandsError;
        setBrands(brandsData || []);

        // Fetch device types
        const { data: typesData, error: typesError } = await supabase
          .from("device_types")
          .select("id, name, brand_id")
          .order("name", { ascending: true });

        if (typesError) throw typesError;
        setDeviceTypes(typesData || []);

        // Fetch device series
        const { data: seriesData, error: seriesError } = await supabase
          .from("device_series")
          .select("id, name, device_type_id")
          .order("name", { ascending: true });

        if (seriesError) throw seriesError;
        setSeries(seriesData || []);

        // Fetch device models
        const { data: modelsData, error: modelsError } = await supabase
          .from("device_models")
          .select("id, name, device_series_id")
          .order("name", { ascending: true });

        if (modelsError) throw modelsError;
        setModels(modelsData || []);

        // Fetch conditions
        const { data: conditionsData, error: conditionsError } = await supabase
          .from("phone_conditions")
          .select("id, name, description, multiplier")
          .order("multiplier", { ascending: false });

        if (conditionsError) throw conditionsError;
        setConditions(conditionsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [t, toast]);

  // Handle file changes for phone images
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    if (images.length + newFiles.length > 6) {
      toast.info(t("tooManyImages"));
      return;
    }

    setImages((prev) => [...prev, ...newFiles]);
  };

  // Remove an image
  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Get estimated value
  const calculateEstimate = async () => {
    if (!selectedModelId || !selectedConditionId) {
      toast.error(t("missingInformation"));
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      // First try to use traditional calculation method to ensure backward compatibility
      // Get the selected condition
      const condition = conditions.find((c) => c.id === selectedConditionId);
      if (!condition) throw new Error("Selected condition not found");

      // Try to get a price for this specific model
      const { data: priceData, error: priceError } = await supabase
        .from("trade_in_prices")
        .select("base_price")
        .eq("device_model_id", selectedModelId)
        .maybeSingle();

      if (priceError) throw priceError;

      let basePrice = 0;

      if (priceData) {
        basePrice = priceData.base_price;
      } else {
        // If no specific price, use a default price based on the brand
        const defaultPrices = {
          Apple: 300,
          Samsung: 250,
          Google: 200,
          OnePlus: 180,
          LG: 150,
          Motorola: 120,
          Default: 100,
        };

        const brand = brands.find((b) => b.id === selectedBrandId);
        const brandName = brand ? brand.name : "Default";

        basePrice =
          defaultPrices[brandName as keyof typeof defaultPrices] ||
          defaultPrices.Default;
      }

      // Calculate the estimated value with traditional method
      let estimatedValue = basePrice * condition.multiplier;

      // Bonus for accessories
      if (hasCharger) estimatedValue += 10;
      if (hasBox) estimatedValue += 15;
      if (hasAccessories) estimatedValue += 20;

      // Try to use our advanced prediction function if available
      try {
        const { data: advancedEstimate, error: rpcError } = await supabase.rpc(
          "calculate_trade_in_price",
          {
            p_device_model_id: selectedModelId,
            p_condition_id: selectedConditionId,
            p_storage_capacity: storageCapacity,
            p_color: color,
            p_has_charger: hasCharger,
            p_has_box: hasBox,
            p_has_accessories: hasAccessories,
          }
        );

        // If RPC call succeeds, use that value instead
        if (advancedEstimate !== null && !rpcError) {
          estimatedValue = advancedEstimate;
        }
      } catch (rpcError) {
        // Just log the error but continue with traditional estimate
        console.error("RPC error:", rpcError);
      }

      setEstimatedValue(estimatedValue);
      setStep(3); // Move to review step
    } catch (error) {
      console.error("Error calculating estimate:", error);
      toast.error(t("estimateError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit phone for trade-in
  const submitTradeIn = async () => {
    if (!selectedModelId || !selectedConditionId) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      // 1. Upload images to storage
      const uploadedImageUrls: string[] = [];

      for (const image of images) {
        const fileName = `${Date.now()}-${image.file.name}`;
        const filePath = `trade-ins/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, image.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);

        uploadedImageUrls.push(urlData.publicUrl);
      }

      // 2. Create the trade-in record
      const { data, error } = await supabase
        .from("phone_trade_ins")
        .insert({
          device_model_id: selectedModelId,
          condition_id: selectedConditionId,
          storage_capacity: storageCapacity,
          color,
          description,
          has_charger: hasCharger,
          has_box: hasBox,
          has_accessories: hasAccessories,
          estimated_value: estimatedValue,
          images: uploadedImageUrls,
        })
        .select()
        .single();

      if (error) throw error; // Success - show toast and redirect
      toast.success(t("tradeInSuccess"));

      // Redirect to my-devices page with locale
      router.push(`/${locale}/my-devices`);
    } catch (error) {
      console.error("Error submitting trade-in:", error);
      toast.error(t("tradeInError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className='container mx-auto py-8 max-w-3xl'>
      <h1 className='text-3xl font-bold mb-6'>{t("title")}</h1>

      <div className='mb-8'>
        <div className='flex items-center justify-between mb-2'>
          {[1, 2, 3].map((stepNumber) => (
            <div
              key={stepNumber}
              className={cn(
                "flex-1 h-2 rounded-full transition-all duration-300",
                stepNumber === 1 ? "rounded-l-full" : "",
                stepNumber === 3 ? "rounded-r-full" : "",
                step >= stepNumber ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <div className='flex justify-between text-sm'>
          <span
            className={step >= 1 ? "text-primary" : "text-muted-foreground"}
          >
            {t("deviceDetails")}
          </span>
          <span
            className={step >= 2 ? "text-primary" : "text-muted-foreground"}
          >
            {t("deviceCondition")}
          </span>
          <span
            className={step >= 3 ? "text-primary" : "text-muted-foreground"}
          >
            {t("review")}
          </span>
        </div>
      </div>

      {/* Step 1: Select Device */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("selectYourDevice")}</CardTitle>
            <CardDescription>{t("selectDeviceDescription")}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='brand'>{t("brand")}</Label>
              <Select
                value={selectedBrandId?.toString() || ""}
                onValueChange={(value) => {
                  setSelectedBrandId(Number(value));
                  setSelectedTypeId(null);
                  setSelectedSeriesId(null);
                  setSelectedModelId(null);
                }}
              >
                <SelectTrigger id='brand'>
                  <SelectValue placeholder={t("selectBrand")} />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='type'>{t("phoneType")}</Label>
              <Select
                value={selectedTypeId?.toString() || ""}
                onValueChange={(value) => {
                  setSelectedTypeId(Number(value));
                  setSelectedSeriesId(null);
                  setSelectedModelId(null);
                }}
                disabled={!selectedBrandId || filteredTypes.length === 0}
              >
                <SelectTrigger id='type'>
                  <SelectValue placeholder={t("selectPhoneType")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='series'>{t("phoneSeries")}</Label>
              <Select
                value={selectedSeriesId?.toString() || ""}
                onValueChange={(value) => {
                  setSelectedSeriesId(Number(value));
                  setSelectedModelId(null);
                }}
                disabled={!selectedTypeId || filteredSeries.length === 0}
              >
                <SelectTrigger id='series'>
                  <SelectValue placeholder={t("selectPhoneSeries")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSeries.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='model'>{t("phoneModel")}</Label>
              <Select
                value={selectedModelId?.toString() || ""}
                onValueChange={(value) => setSelectedModelId(Number(value))}
                disabled={!selectedSeriesId || filteredModels.length === 0}
              >
                <SelectTrigger id='model'>
                  <SelectValue placeholder={t("selectPhoneModel")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredModels.map((model) => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='storage'>{t("storageCapacity")}</Label>
              <Select
                value={storageCapacity || ""}
                onValueChange={setStorageCapacity}
                disabled={!selectedModelId}
              >
                <SelectTrigger id='storage'>
                  <SelectValue placeholder={t("selectStorage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='16GB'>16GB</SelectItem>
                  <SelectItem value='32GB'>32GB</SelectItem>
                  <SelectItem value='64GB'>64GB</SelectItem>
                  <SelectItem value='128GB'>128GB</SelectItem>
                  <SelectItem value='256GB'>256GB</SelectItem>
                  <SelectItem value='512GB'>512GB</SelectItem>
                  <SelectItem value='1TB'>1TB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='color'>{t("phoneColor")}</Label>
              <Input
                id='color'
                placeholder={t("enterPhoneColor")}
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className='ml-auto'
              onClick={() => setStep(2)}
              disabled={!selectedModelId || !storageCapacity}
            >
              {t("next")}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Phone Condition */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("phoneCondition")}</CardTitle>
            <CardDescription>{t("phoneConditionDescription")}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-3'>
              <Label>{t("selectCondition")}</Label>
              {conditions.map((condition) => (
                <div
                  key={condition.id}
                  className={cn(
                    "flex items-start space-x-3 p-3 border rounded-md cursor-pointer hover:border-primary transition-colors",
                    selectedConditionId === condition.id
                      ? "border-primary bg-primary/5"
                      : ""
                  )}
                  onClick={() => setSelectedConditionId(condition.id)}
                >
                  <div className='mt-0.5'>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        selectedConditionId === condition.id
                          ? "border-primary"
                          : "border-muted"
                      )}
                    >
                      {selectedConditionId === condition.id && (
                        <div className='w-3 h-3 rounded-full bg-primary' />
                      )}
                    </div>
                  </div>
                  <div className='space-y-0.5'>
                    <div className='font-medium'>
                      {condition.name}
                      <Badge className='ml-2' variant='outline'>
                        {Math.round(condition.multiplier * 100)}%
                      </Badge>
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {condition.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-medium'>{t("accessories")}</h3>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='has-charger'
                  checked={hasCharger}
                  onCheckedChange={(checked) => setHasCharger(checked === true)}
                />
                <label
                  htmlFor='has-charger'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                >
                  {t("includesCharger")}
                </label>
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='has-box'
                  checked={hasBox}
                  onCheckedChange={(checked) => setHasBox(checked === true)}
                />
                <label
                  htmlFor='has-box'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                >
                  {t("includesOriginalBox")}
                </label>
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='has-accessories'
                  checked={hasAccessories}
                  onCheckedChange={(checked) =>
                    setHasAccessories(checked === true)
                  }
                />
                <label
                  htmlFor='has-accessories'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                >
                  {t("includesAdditionalAccessories")}
                </label>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>{t("additionalDetails")}</Label>
              <Textarea
                id='description'
                placeholder={t("describeAnyIssues")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='min-h-[100px]'
              />
            </div>

            <div className='space-y-3'>
              <Label>{t("uploadPhotos")}</Label>
              <div className='grid grid-cols-3 gap-3'>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className='relative border rounded-md overflow-hidden aspect-square'
                  >
                    <Image
                      src={image.preview}
                      alt='Phone photo'
                      fill
                      className='object-cover'
                    />
                    <button
                      type='button'
                      onClick={() => removeImage(index)}
                      className='absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1'
                    >
                      <Trash2 className='w-4 h-4 text-white' />
                    </button>
                  </div>
                ))}

                {images.length < 6 && (
                  <label className='border border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer aspect-square hover:bg-muted/50 transition-colors'>
                    <ImageIcon className='w-8 h-8 text-muted-foreground mb-2' />
                    <span className='text-xs text-muted-foreground'>
                      {t("addPhoto")}
                    </span>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleFileChange}
                      className='hidden'
                    />
                  </label>
                )}
              </div>
              <p className='text-sm text-muted-foreground'>
                {t("uploadPhotoDescription")}
              </p>
            </div>
          </CardContent>
          <CardFooter className='flex justify-between'>
            <Button variant='outline' onClick={goToPreviousStep}>
              {t("back")}
            </Button>
            <Button
              onClick={calculateEstimate}
              disabled={!selectedConditionId || isLoading}
            >
              {isLoading ? (
                <>
                  <span className='mr-2'>{t("calculating")}</span>
                  <span className='animate-spin'>⌛</span>
                </>
              ) : (
                t("getEstimate")
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("reviewAndSubmit")}</CardTitle>
            <CardDescription>{t("reviewDescription")}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='border rounded-md p-6 bg-muted/30'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(estimatedValue || 0)}
                </div>
                <p className='text-sm text-muted-foreground'>
                  {t("estimatedValue")}
                </p>
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='font-medium'>{t("deviceSummary")}</h3>

              <div className='grid grid-cols-2 gap-2'>
                <div className='text-sm text-muted-foreground'>
                  {t("brand")}:
                </div>
                <div className='text-sm font-medium'>
                  {brands.find((b) => b.id === selectedBrandId)?.name || ""}
                </div>

                <div className='text-sm text-muted-foreground'>
                  {t("model")}:
                </div>
                <div className='text-sm font-medium'>
                  {models.find((m) => m.id === selectedModelId)?.name || ""}
                </div>

                <div className='text-sm text-muted-foreground'>
                  {t("storage")}:
                </div>
                <div className='text-sm font-medium'>{storageCapacity}</div>

                <div className='text-sm text-muted-foreground'>
                  {t("color")}:
                </div>
                <div className='text-sm font-medium'>{color || "-"}</div>

                <div className='text-sm text-muted-foreground'>
                  {t("condition.name")}:
                </div>
                <div className='text-sm font-medium'>
                  {conditions.find((c) => c.id === selectedConditionId)?.name ||
                    ""}
                </div>
              </div>

              <div className='text-sm'>
                <div className='font-medium mb-1'>{t("accessories")}:</div>
                <ul className='list-disc list-inside text-muted-foreground pl-2 space-y-1'>
                  {hasCharger && <li>{t("includesCharger")}</li>}
                  {hasBox && <li>{t("includesOriginalBox")}</li>}
                  {hasAccessories && (
                    <li>{t("includesAdditionalAccessories")}</li>
                  )}
                  {!hasCharger && !hasBox && !hasAccessories && (
                    <li>{t("noAccessories")}</li>
                  )}
                </ul>
              </div>

              {description && (
                <div className='text-sm'>
                  <div className='font-medium mb-1'>
                    {t("additionalDetails")}:
                  </div>
                  <p className='text-muted-foreground whitespace-pre-wrap'>
                    {description}
                  </p>
                </div>
              )}

              {images.length > 0 && (
                <div className='space-y-2'>
                  <div className='font-medium text-sm'>
                    {t("uploadedPhotos")}:
                  </div>
                  <div className='grid grid-cols-4 gap-2'>
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className='relative border rounded-md overflow-hidden aspect-square'
                      >
                        <Image
                          src={image.preview}
                          alt='Phone photo'
                          fill
                          className='object-cover'
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4 flex gap-3 text-yellow-800'>
              <AlertCircle className='h-5 w-5 flex-shrink-0' />
              <div className='text-sm'>
                <p className='font-medium'>{t("importantNote")}</p>
                <p className='mt-1'>{t("estimateDisclaimer")}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-between'>
            <Button variant='outline' onClick={goToPreviousStep}>
              {t("back")}
            </Button>
            <Button onClick={submitTradeIn} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className='mr-2'>{t("submitting")}</span>
                  <span className='animate-spin'>⌛</span>
                </>
              ) : (
                t("submitTradeIn")
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
