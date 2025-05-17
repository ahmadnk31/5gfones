"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchDeviceBrands } from "@/lib/device-utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  HelpCircleIcon,
} from "lucide-react";
import { ShippingOptions } from "@/components/shipping-options";
import { StripeProvider } from "@/components/stripe-provider";
import { StripeAddressElement } from "@/components/stripe-address-element";
import {
  format,
  addDays,
  parseISO,
  startOfDay,
  endOfDay,
  differenceInDays,
} from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

interface DeviceBrand {
  id: number;
  name: string;
  image_url: string | null;
}

interface DeviceType {
  id: number;
  name: string;
  brand_id: number;
  image_url: string | null;
}

interface DeviceModel {
  id: number;
  name: string;
  device_series_id: number;
  image_url: string | null;
}

interface DeviceSeries {
  id: number;
  name: string;
  device_type_id: number;
  image_url: string | null;
}

interface RepairType {
  id: number;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
}

interface ProductVariant {
  id: number;
  product_id: number;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  stock: number;
  sku: string | null;
  image_url: string | null;
}

const RepairSchedulePage = () => {
  const t = useTranslations("repair");
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  const locale = pathname.split("/")[1];
  const shippingCost = 9.99; // Define shipping cost constant
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // Form data
  const [deviceBrands, setDeviceBrands] = useState<DeviceBrand[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [deviceSeries, setDeviceSeries] = useState<DeviceSeries[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [repairTypes, setRepairTypes] = useState<RepairType[]>([]);
  const [productVariants, setProductVariants] = useState<
    Record<number, ProductVariant[]>
  >({});
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [showStripePayment, setShowStripePayment] = useState(false);
  // Selected values
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [selectedRepairs, setSelectedRepairs] = useState<number[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<number, number>
  >({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<string>("pickup");
  const [shippingAddress, setShippingAddress] = useState<{
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    } | null;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    problem: "",
    devicePassword: "",
    serialNumber: "",
  }); // Fetch device brands on initial load
  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        // Get auth user first
        const { data: userData } = await supabase.auth.getUser();
        console.log(
          "Current user authentication status:",
          userData?.user ? "Authenticated" : "Not authenticated"
        );

        // First try device_brands table (the intended table)
        console.log("Attempting to fetch from device_brands table");
        const { data: deviceBrandsData, error: deviceBrandsError } =
          await supabase.from("device_brands").select("*").order("name");

        if (
          deviceBrandsError ||
          !deviceBrandsData ||
          deviceBrandsData.length === 0
        ) {
          console.log(
            "No results from device_brands, trying brands table as fallback"
          );

          // If device_brands fails or is empty, try the brands table
          const { data: brandsData, error: brandsError } = await supabase
            .from("brands")
            .select("*")
            .order("name");

          if (!brandsError && brandsData && brandsData.length > 0) {
            console.log(
              "Successfully fetched from brands table:",
              brandsData.length,
              "brands found"
            );

            // Map brands data to match DeviceBrand structure
            const mappedBrands = brandsData.map((brand) => ({
              id: brand.id,
              name: brand.name,
              image_url: brand.image_url,
              user_uid: brand.user_uid,
            }));

            setDeviceBrands(mappedBrands);
            setLoading(false);
            return;
          } else {
            console.log("No results from brands table either");
          }
        }

        console.log(
          `Device brands fetched from device_brands: ${
            deviceBrandsData?.length || 0
          } brands found`
        );
        setDeviceBrands(deviceBrandsData || []);
      } catch (err) {
        console.error("Error fetching device brands:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();

    // Also generate available dates (next 14 days)
    const dates = Array.from({ length: 14 }, (_, i) =>
      addDays(new Date(), i + 1)
    );
    setAvailableDates(dates);

    // Sample time slots
    const times = [
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
    ];
    setAvailableTimes(times);
  }, []);

  // When brand is selected, fetch device types
  useEffect(() => {
    if (selectedBrand) {
      const fetchDeviceTypes = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("device_types")
            .select("*")
            .eq("brand_id", selectedBrand)
            .order("name");

          if (error) throw error;
          setDeviceTypes(data || []);
          setSelectedType(null);
          setSelectedSeries(null);
          setSelectedModel(null);
        } catch (err) {
          console.error("Error fetching device types:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchDeviceTypes();
    } else {
      setDeviceTypes([]);
      setSelectedType(null);
    }
  }, [selectedBrand]);

  // When device type is selected, fetch series
  useEffect(() => {
    if (selectedType) {
      const fetchDeviceSeries = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("device_series")
            .select("*")
            .eq("device_type_id", selectedType)
            .order("name");

          if (error) throw error;
          setDeviceSeries(data || []);
          setSelectedSeries(null);
          setSelectedModel(null);
        } catch (err) {
          console.error("Error fetching device series:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchDeviceSeries();
    } else {
      setDeviceSeries([]);
      setSelectedSeries(null);
    }
  }, [selectedType]);

  // When series is selected, fetch models
  useEffect(() => {
    if (selectedSeries) {
      const fetchDeviceModels = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("device_models")
            .select("*")
            .eq("device_series_id", selectedSeries)
            .order("name");

          if (error) throw error;
          setDeviceModels(data || []);
          setSelectedModel(null);
        } catch (err) {
          console.error("Error fetching device models:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchDeviceModels();
    } else {
      setDeviceModels([]);
      setSelectedModel(null);
    }
  }, [selectedSeries]);

  // When model is selected, fetch repair types
  useEffect(() => {
    if (selectedModel) {
      const fetchRepairTypes = async () => {
        setLoading(true);
        try {
          // Fetch repair products for the selected model
          const { data, error } = await supabase
            .from("products")
            .select("id, name, description, base_price, image_url")
            .eq("is_repair_part", true)
            .eq("compatible_with_model_id", selectedModel)
            .order("base_price");

          if (error) throw error;

          // Store the repair types
          setRepairTypes(data || []);

          // For each repair product, fetch its variants
          if (data && data.length > 0) {
            const productIds = data.map((product) => product.id);

            // Fetch all variants for these products in a single query
            const { data: variantsData, error: variantsError } = await supabase
              .from("product_variants")
              .select("*")
              .in("product_id", productIds);

            if (variantsError) throw variantsError;

            // Group variants by product_id
            const variantsByProduct: Record<number, ProductVariant[]> = {};
            variantsData?.forEach((variant) => {
              if (!variantsByProduct[variant.product_id]) {
                variantsByProduct[variant.product_id] = [];
              }
              variantsByProduct[variant.product_id].push(variant);
            });

            setProductVariants(variantsByProduct);
          }
        } catch (err) {
          console.error("Error fetching repair types:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchRepairTypes();
    } else {
      setRepairTypes([]);
      setProductVariants({});
    }
  }, [selectedModel]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleRepair = (repairId: number) => {
    setSelectedRepairs((prev) => {
      if (prev.includes(repairId)) {
        return prev.filter((id) => id !== repairId);
      } else {
        return [...prev, repairId];
      }
    });
  };

  const selectVariant = (productId: number, variantId: number) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantId,
    }));
  };

  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((current) => current + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep((current) => current - 1);
    window.scrollTo(0, 0);
  };
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return selectedModel !== null;
      case 2:
        return selectedRepairs.length > 0;
      case 3:
        return selectedDate !== null && selectedTime !== null;
      case 4:
        return (
          formData.name.trim() !== "" &&
          formData.email.trim() !== "" &&
          formData.phone.trim() !== "" &&
          formData.problem.trim() !== ""
        );
      case 5:
        if (deliveryMethod === "shipping") {
          return (
            shippingAddress?.address?.line1 &&
            shippingAddress.address.city &&
            shippingAddress.address.postal_code
          );
        }
        return true;
      default:
        return true;
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create a datetime string by combining date and time
      const appointmentDateTime =
        selectedDate && selectedTime
          ? new Date(`${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00`)
          : null;

      if (!appointmentDateTime || !selectedModel) {
        throw new Error("Missing required appointment information");
      }

      // Set delivery method and shipping information
      const appointmentData = {
        device_model_id: selectedModel,
        problem_description: formData.problem,
        device_serial_number: formData.serialNumber || null,
        device_password: formData.devicePassword || null,
        appointment_date: appointmentDateTime.toISOString(),
        status_id: 1, // Assuming 1 is "Awaiting Check-In"
        customer_id: null, // Would be filled if user is logged in
        user_uid: null, // Will be filled on the server by RLS
        delivery_method: deliveryMethod,
      };

      // Add shipping details if shipping method is selected
      if (deliveryMethod === "shipping" && shippingAddress?.address) {
        Object.assign(appointmentData, {
          shipping_name: shippingAddress.name,
          shipping_address: shippingAddress.address.line1,
          shipping_address_line2: shippingAddress.address.line2,
          shipping_city: shippingAddress.address.city,
          shipping_state: shippingAddress.address.state,
          shipping_postal_code: shippingAddress.address.postal_code,
          shipping_country: shippingAddress.address.country,
          shipping_cost: 9.99, // Default shipping cost
        });
      }

      // Create the appointment in Supabase
      const { data: createdAppointment, error: appointmentError } =
        await supabase
          .from("appointments")
          .insert(appointmentData)
          .select("id")
          .single();
      if (appointmentError) throw appointmentError; // Add repair items to the appointment
      if (createdAppointment?.id && selectedRepairs.length > 0) {
        const appointmentItems = selectedRepairs.map((repairId) => {
          const repair = repairTypes.find((r) => r.id === repairId);
          const variant = selectedVariants[repairId]
            ? productVariants[repairId]?.find(
                (v) => v.id === selectedVariants[repairId]
              )
            : undefined;

          const price = repair
            ? variant
              ? repair.base_price + variant.price_adjustment
              : repair.base_price
            : 0;

          return {
            appointment_id: createdAppointment.id,
            product_id: repairId,
            product_variant_id: variant?.id || null,
            variant_name: variant
              ? `${variant.variant_name}: ${variant.variant_value}`
              : null,
            quantity: 1,
            unit_price: price,
            is_service: true,
            service_description: repair?.description || null,
            service_duration: 60, // Default 1 hour
          };
        });

        const { error: itemsError } = await supabase
          .from("appointment_items")
          .insert(appointmentItems);
        if (itemsError) throw itemsError;
      }

      // Redirect to confirmation page
      router.push(`/en/repair/confirmation?id=${createdAppointment?.id}`);
    } catch (error) {
      console.error("Error scheduling repair:", error);
      toast.error("Error scheduling repair. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className='container mx-auto px-4 py-12 max-w-4xl'>
      <h1 className='text-2xl md:text-3xl font-bold mb-6'>{t("schedule")}</h1>
      {/* Progress Steps */}
      <div className='mb-8'>
        <ol className='flex items-center w-full text-sm font-medium text-center text-gray-500 sm:text-base'>
          <li
            className={`flex md:w-full items-center ${
              currentStep >= 1 ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span
              className={`flex items-center justify-center w-8 h-8 mr-2 text-sm border rounded-full shrink-0 ${
                currentStep >= 1
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-500"
              }`}
            >
              1
            </span>
            <span className='hidden md:inline-flex'>{t("deviceTypes")}</span>
            <svg
              aria-hidden='true'
              className='w-4 h-4 ml-2 sm:ml-4 md:block hidden'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M13 5l7 7-7 7M5 5l7 7-7 7'
              ></path>
            </svg>
          </li>
          <li
            className={`flex md:w-full items-center ${
              currentStep >= 2 ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span
              className={`flex items-center justify-center w-8 h-8 mr-2 text-sm border rounded-full shrink-0 ${
                currentStep >= 2
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-500"
              }`}
            >
              2
            </span>
            <span className='hidden md:inline-flex'>{t("services")}</span>
            <svg
              aria-hidden='true'
              className='w-4 h-4 ml-2 sm:ml-4 md:block hidden'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M13 5l7 7-7 7M5 5l7 7-7 7'
              ></path>
            </svg>
          </li>
          <li
            className={`flex md:w-full items-center ${
              currentStep >= 3 ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span
              className={`flex items-center justify-center w-8 h-8 mr-2 text-sm border rounded-full shrink-0 ${
                currentStep >= 3
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-500"
              }`}
            >
              3
            </span>
            <span className='hidden md:inline-flex'>
              {t("confirmation.dateTime")}
            </span>
            <svg
              aria-hidden='true'
              className='w-4 h-4 ml-2 sm:ml-4 md:block hidden'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M13 5l7 7-7 7M5 5l7 7-7 7'
              ></path>
            </svg>{" "}
          </li>
          <li
            className={`flex md:w-full items-center ${
              currentStep >= 4 ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span
              className={`flex items-center justify-center w-8 h-8 mr-2 text-sm border rounded-full shrink-0 ${
                currentStep >= 4
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-500"
              }`}
            >
              4
            </span>
            <span className='hidden md:inline-flex'>
              {t("form.contactInfo")}
            </span>
            <svg
              aria-hidden='true'
              className='w-4 h-4 ml-2 sm:ml-4 md:block hidden'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M13 5l7 7-7 7M5 5l7 7-7 7'
              ></path>
            </svg>
          </li>
          <li
            className={`flex items-center ${
              currentStep >= 5 ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span
              className={`flex items-center justify-center w-8 h-8 mr-2 text-sm border rounded-full shrink-0 ${
                currentStep >= 5
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-500"
              }`}
            >
              5
            </span>
            <span className='hidden md:inline-flex'>
              {t("delivery.method")}
            </span>
          </li>{" "}
        </ol>
      </div>
      <form onSubmit={handleSubmit}>
        <Card className='mb-6'>
          {/* Step 1: Select Device */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle>{t("form.selectDevice")}</CardTitle>
                <CardDescription>
                  {t("deviceTypesPageDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Custom Device Request Link */}
                <div className='p-3 mb-6 bg-blue-50 border border-blue-100 rounded-md'>
                  <div className='flex items-start space-x-3'>
                    <HelpCircleIcon className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                    <div>
                      <p className='text-sm text-blue-700 mb-2'>
                        {t("cantFindDevice")}
                      </p>
                      <Link href={`/${locale}/repair/custom-request`}>
                        <Button
                          variant='outline'
                          size='sm'
                          className='text-blue-600 border-blue-300 hover:bg-blue-100'
                        >
                          {t("submitCustomRepairRequest")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className='space-y-6'>
                  {/* Device Brand */}
                  <div>
                    {" "}
                    <label className='block text-sm font-medium mb-2'>
                      {t("brands")}{" "}                      {deviceBrands.length > 0
                        ? `(${deviceBrands.length} ${t("brands")})`
                        : `(${t("brandsEmpty")})`}
                    </label>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                      {deviceBrands.length > 0 ? (
                        deviceBrands.map((brand) => (
                          <div
                            key={brand.id}
                            className={`p-3 border rounded-lg text-center cursor-pointer transition-all ${
                              selectedBrand === brand.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                            onClick={() => setSelectedBrand(brand.id)}
                          >
                            {" "}
                            <div className='h-12 flex items-center justify-center mb-2'>
                              {brand.image_url ? (
                                <div className='relative h-12 w-full'>
                                  <Image
                                    src={brand.image_url}
                                    alt={brand.name}
                                    fill
                                    sizes='100px'
                                    style={{ objectFit: "contain" }}
                                    onError={(e) => {
                                      // If image fails to load, replace with fallback
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.onerror = null;
                                      target.style.display = "none";
                                      const parent =
                                        target.parentElement?.parentElement;
                                      if (parent) {
                                        const fallback =
                                          document.createElement("div");
                                        fallback.className =
                                          "h-full w-full bg-gray-100 flex items-center justify-center";
                                        fallback.innerHTML = `<span class="text-lg font-medium text-gray-500">${brand.name[0]}</span>`;
                                        parent.appendChild(fallback);
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className='h-full w-full bg-gray-100 flex items-center justify-center'>
                                  <span className='text-lg font-medium text-gray-500'>
                                    {brand.name[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className='text-sm'>{brand.name}</span>
                          </div>
                        ))
                      ) : (                        <div className='col-span-full text-center p-4'>
                          {" "}
                          {t("brandsEmpty")}
                        </div>
                      )}
                      {loading && (
                        <div className='col-span-full text-center p-4'>
                          {t("common.loading")}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Device Type */}
                  {deviceTypes.length > 0 && (
                    <div>
                      {" "}
                      <label className='block text-sm font-medium mb-2'>
                        {t("filterByDeviceType")}
                      </label>
                      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                        {deviceTypes.map((type) => (
                          <div
                            key={type.id}
                            className={`p-3 border rounded-lg text-center cursor-pointer transition-all ${
                              selectedType === type.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                            onClick={() => setSelectedType(type.id)}
                          >
                            <div className='h-10 flex items-center justify-center mb-2'>
                              {type.image_url ? (
                                <div className='relative h-10 w-full'>
                                  <Image
                                    src={type.image_url}
                                    alt={type.name}
                                    fill
                                    sizes='80px'
                                    style={{ objectFit: "contain" }}
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.onerror = null;
                                      target.style.display = "none";
                                      const parent =
                                        target.parentElement?.parentElement;
                                      if (parent) {
                                        const fallback =
                                          document.createElement("div");
                                        fallback.className =
                                          "h-full w-full bg-gray-100 flex items-center justify-center";
                                        fallback.innerHTML = `<span class="text-sm text-gray-500">${type.name[0]}</span>`;
                                        parent.appendChild(fallback);
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className='h-full w-full bg-gray-100 flex items-center justify-center'>
                                  <span className='text-sm text-gray-500'>
                                    {type.name[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className='text-sm'>{type.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Device Series */}
                  {deviceSeries.length > 0 && (
                    <div>
                      {" "}
                      <label className='block text-sm font-medium mb-2'>
                        {t("filterBySeries")}
                      </label>
                      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                        {deviceSeries.map((series) => (
                          <div
                            key={series.id}
                            className={`p-3 border rounded-lg text-center cursor-pointer transition-all ${
                              selectedSeries === series.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                            onClick={() => setSelectedSeries(series.id)}
                          >
                            <div className='h-10 flex items-center justify-center mb-2'>
                              {series.image_url ? (
                                <div className='relative h-10 w-full'>
                                  <Image
                                    src={series.image_url}
                                    alt={series.name}
                                    fill
                                    sizes='80px'
                                    style={{ objectFit: "contain" }}
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.onerror = null;
                                      target.style.display = "none";
                                      const parent =
                                        target.parentElement?.parentElement;
                                      if (parent) {
                                        const fallback =
                                          document.createElement("div");
                                        fallback.className =
                                          "h-full w-full bg-gray-100 flex items-center justify-center";
                                        fallback.innerHTML = `<span class="text-sm text-gray-500">${series.name[0]}</span>`;
                                        parent.appendChild(fallback);
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className='h-full w-full bg-gray-100 flex items-center justify-center'>
                                  <span className='text-sm text-gray-500'>
                                    {series.name[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className='text-sm'>{series.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Device Model */}
                  {deviceModels.length > 0 && (
                    <div>
                      {" "}
                      <label className='block text-sm font-medium mb-2'>
                        {t("filterByModel")}
                      </label>
                      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                        {deviceModels.map((model) => (
                          <div
                            key={model.id}
                            className={`p-3 border rounded-lg text-center cursor-pointer transition-all ${
                              selectedModel === model.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                            onClick={() => setSelectedModel(model.id)}
                          >
                            <div className='h-10 flex items-center justify-center mb-2'>
                              {model.image_url ? (
                                <div className='relative h-10 w-full'>
                                  <Image
                                    src={model.image_url}
                                    alt={model.name}
                                    fill
                                    sizes='80px'
                                    style={{ objectFit: "contain" }}
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.onerror = null;
                                      target.style.display = "none";
                                      const parent =
                                        target.parentElement?.parentElement;
                                      if (parent) {
                                        const fallback =
                                          document.createElement("div");
                                        fallback.className =
                                          "h-full w-full bg-gray-100 flex items-center justify-center";
                                        fallback.innerHTML = `<span class="text-sm text-gray-500">${model.name[0]}</span>`;
                                        parent.appendChild(fallback);
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className='h-full w-full bg-gray-100 flex items-center justify-center'>
                                  <span className='text-sm text-gray-500'>
                                    {model.name[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className='text-sm'>{model.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}
          {/* Step 2: Select Repair Types */}
          {currentStep === 2 && (
            <>
              {" "}
              <CardHeader>
                <CardTitle>{t("form.selectServices")}</CardTitle>
                <CardDescription>{t("servicesDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {repairTypes.length > 0 ? (
                    repairTypes.map((repair) => (
                      <div
                        key={repair.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedRepairs.includes(repair.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => toggleRepair(repair.id)}
                      >
                        {" "}
                        <div className='flex items-center gap-4'>
                          {repair.image_url && (
                            <div className='shrink-0 relative h-16 w-16 bg-white rounded-md'>
                              <Image
                                src={repair.image_url}
                                alt={repair.name}
                                fill
                                sizes='64px'
                                style={{ objectFit: "contain" }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.style.display = "none";
                                }}
                              />
                            </div>
                          )}
                          <div className='flex-1'>
                            <h3 className='font-medium'>{repair.name}</h3>
                            {repair.description && (
                              <p className='text-sm text-gray-500 mt-1'>
                                {repair.description}
                              </p>
                            )}

                            {/* Show variants if available for this product */}
                            {productVariants[repair.id]?.length > 0 &&
                              selectedRepairs.includes(repair.id) && (
                                <div className='mt-3'>
                                  {" "}
                                  <label className='block text-xs font-medium mb-1 text-gray-600'>
                                    {t("chooseOptions")}
                                  </label>
                                  <div className='grid grid-cols-2 gap-2'>
                                    {productVariants[repair.id].map(
                                      (variant) => (
                                        <div
                                          key={variant.id}
                                          className={`p-2 border text-center cursor-pointer text-xs rounded ${
                                            selectedVariants[repair.id] ===
                                            variant.id
                                              ? "border-blue-500 bg-blue-50"
                                              : "border-gray-200 hover:border-blue-300"
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation(); // Prevent toggling the parent
                                            selectVariant(
                                              repair.id,
                                              variant.id
                                            );
                                          }}
                                        >
                                          <div className='flex flex-col'>
                                            <span>
                                              {variant.variant_name}:{" "}
                                              {variant.variant_value}
                                            </span>
                                            <span className='text-blue-600 font-medium mt-1'>
                                              {formatCurrency(
                                                repair.base_price +
                                                  variant.price_adjustment
                                              )}
                                            </span>
                                            {variant.image_url && (
                                              <div className='mx-auto relative h-8 w-8 mt-1'>
                                                <Image
                                                  src={variant.image_url}
                                                  alt={variant.variant_value}
                                                  fill
                                                  sizes='32px'
                                                  style={{
                                                    objectFit: "contain",
                                                  }}
                                                  onError={(e) => {
                                                    const target =
                                                      e.target as HTMLImageElement;
                                                    target.onerror = null;
                                                    target.style.display =
                                                      "none";
                                                  }}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                          <div className='text-right'>
                            <span className='font-bold text-blue-600'>
                              {formatCurrency(repair.base_price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='text-center py-8'>
                      {" "}
                      <p className='text-gray-500'>{t("noModelsForDevice")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}
          {/* Step 3: Select Date and Time */}
          {currentStep === 3 && (
            <>
              {" "}
              <CardHeader>
                <CardTitle>{t("form.selectDateTime")}</CardTitle>
                <CardDescription>
                  {t("processStep1Description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  {/* Date Selection */}
                  <div>
                    {" "}
                    <label className='block text-sm font-medium mb-2'>
                      {t("confirmation.dateTime")}
                    </label>
                    <div className='grid grid-cols-3 sm:grid-cols-7 gap-2'>
                      {availableDates.map((date, index) => (
                        <div
                          key={index}
                          className={`p-2 border rounded-md text-center cursor-pointer ${
                            selectedDate &&
                            differenceInDays(date, selectedDate) === 0
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                          onClick={() => setSelectedDate(date)}
                        >
                          <div className='text-xs text-gray-500'>
                            {format(date, "EEE")}
                          </div>
                          <div className='font-medium'>{format(date, "d")}</div>
                          <div className='text-xs'>{format(date, "MMM")}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div>
                      {" "}
                      <label className='block text-sm font-medium mb-2'>
                        {t("confirmation.dateTime")}
                      </label>
                      <div className='grid grid-cols-3 sm:grid-cols-5 gap-2'>
                        {availableTimes.map((time, index) => (
                          <div
                            key={index}
                            className={`p-2 border rounded-md text-center cursor-pointer ${
                              selectedTime === time
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                            onClick={() => setSelectedTime(time)}
                          >
                            <div className='font-medium'>{time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}
          {/* Step 4: Contact Information and Details */}
          {currentStep === 4 && (
            <>
              {" "}
              <CardHeader>
                <CardTitle>{t("form.contactInfo")}</CardTitle>
                <CardDescription>
                  {t("processStep2Description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label
                        htmlFor='name'
                        className='block text-sm font-medium mb-1'
                      >
                        {" "}
                        {t("checkout.firstName")} *
                      </label>
                      <input
                        type='text'
                        id='name'
                        name='name'
                        className='w-full px-3 py-2 border rounded-md'
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor='email'
                        className='block text-sm font-medium mb-1'
                      >
                        {" "}
                        {t("checkout.email")} *
                      </label>
                      <input
                        type='email'
                        id='email'
                        name='email'
                        className='w-full px-3 py-2 border rounded-md'
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor='phone'
                      className='block text-sm font-medium mb-1'
                    >
                      {" "}
                      {t("checkout.phone")} *
                    </label>
                    <input
                      type='tel'
                      id='phone'
                      name='phone'
                      className='w-full px-3 py-2 border rounded-md'
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='problem'
                      className='block text-sm font-medium mb-1'
                    >
                      {" "}
                      {t("form.problemDescription")} *
                    </label>
                    <textarea
                      id='problem'
                      name='problem'
                      rows={4}
                      className='w-full px-3 py-2 border rounded-md'
                      value={formData.problem}
                      onChange={handleInputChange}
                      placeholder={t("processStep2Description")}
                      required
                    ></textarea>
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label
                        htmlFor='serialNumber'
                        className='block text-sm font-medium mb-1'
                      >
                        {t("form.deviceSerialNumber")} (Optional)
                      </label>
                      <input
                        type='text'
                        id='serialNumber'
                        name='serialNumber'
                        className='w-full px-3 py-2 border rounded-md'
                        value={formData.serialNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor='devicePassword'
                        className='block text-sm font-medium mb-1'
                      >
                        {" "}
                        {t("form.devicePassword")} (Optional)
                      </label>
                      <input
                        type='text'
                        id='devicePassword'
                        name='devicePassword'
                        className='w-full px-3 py-2 border rounded-md'
                        value={formData.devicePassword}
                        onChange={handleInputChange}
                        placeholder={t("processStep2Description")}
                      />
                      <p className='text-xs text-gray-500 mt-1'>
                        {t("form.passwordDisclaimer")}
                      </p>{" "}
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}{" "}
          {/* Step 5: Delivery Options */}
          {currentStep === 5 && (
            <>
              <CardHeader>
                <CardTitle>{t("shipping.title")}</CardTitle>
                <CardDescription>
                  {t("processStep3Description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  <ShippingOptions
                    value={deliveryMethod}
                    onChange={setDeliveryMethod}
                    shippingCost={9.99}
                  />

                  {deliveryMethod === "shipping" && (
                    <div className='mt-6 border-t pt-4'>
                      <h3 className='text-base font-medium mb-2'>
                        {t("shipping.addressTitle")}
                      </h3>
                      <StripeProvider>
                        <StripeAddressElement onChange={setShippingAddress} />{" "}
                      </StripeProvider>
                      <p className='text-xs text-gray-500 mt-2'>
                        {" "}
                        {t("delivery.cost")} (${shippingCost.toFixed(2)})
                        {t("processStep3Description")}
                      </p>
                    </div>
                  )}
                </div>{" "}
              </CardContent>
            </>
          )}
          <CardFooter className='flex justify-between'>
            <div>
              {currentStep > 1 && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={goToPreviousStep}
                  disabled={loading}
                >
                  <ChevronLeft className='w-4 h-4 mr-2' />
                  {t("common.back")}
                </Button>
              )}
            </div>{" "}
            <div>
              {currentStep < 5 ? (
                <Button
                  type='button'
                  className='ml-auto'
                  onClick={goToNextStep}
                  disabled={!validateCurrentStep() || loading}
                >
                  {t("common.next")}
                  <ChevronRight className='w-4 h-4 ml-2' />
                </Button>
              ) : (
                <Button
                  type='submit'
                  className='ml-auto'
                  disabled={!validateCurrentStep() || loading}
                >
                  {loading
                    ? t("shipping.processing")
                    : t("repair.scheduleRepair")}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>{" "}
      </form>
      {/* Summary Card */}
      <div className='mt-8'>
        <h3 className='font-medium text-lg mb-3'>{t("summary")}</h3>{" "}
        <div className='bg-gray-50 p-4 rounded-lg border space-y-3'>
          {selectedBrand && (
            <div className='flex justify-between'>
              <span className='text-gray-600'>{t("brand")}:</span>
              <span className='font-medium'>
                {deviceBrands.find((b) => b.id === selectedBrand)?.name}
              </span>
            </div>
          )}
          {selectedModel && deviceModels.length > 0 && (
            <div className='flex justify-between'>
              <span className='text-gray-600'>{t("device")}:</span>
              <span className='font-medium'>
                {deviceModels.find((m) => m.id === selectedModel)?.name}
              </span>
            </div>
          )}
          {selectedDate && selectedTime && (
            <div className='flex justify-between'>
              <span className='text-gray-600'>{t("appointment")}:</span>
              <span className='font-medium'>
                {format(selectedDate, "MMMM d, yyyy")} at {selectedTime}
              </span>
            </div>
          )}
          {selectedRepairs.length > 0 && (
            <div>
              {" "}
              <div className='flex justify-between mb-2'>
                <span className='text-gray-600'>{t("servicesLabel")}:</span>
                <span className='font-medium'>
                  {selectedRepairs.length}{" "}
                  {selectedRepairs.length === 1 ? t("service") : t("services")}
                </span>
              </div>{" "}
              <div className='space-y-1 pl-2'>
                {selectedRepairs.map((repairId) => {
                  const repair = repairTypes.find((r) => r.id === repairId);
                  const variant = selectedVariants[repairId]
                    ? productVariants[repairId]?.find(
                        (v) => v.id === selectedVariants[repairId]
                      )
                    : undefined;

                  const price = repair
                    ? variant
                      ? repair.base_price + variant.price_adjustment
                      : repair.base_price
                    : 0;

                  return (
                    <div
                      key={repairId}
                      className='flex justify-between text-sm'
                    >
                      <span>
                        {repair?.name}
                        {variant && (
                          <span className='text-gray-500 text-xs ml-1'>
                            ({variant.variant_name}: {variant.variant_value})
                          </span>
                        )}
                      </span>
                      <span>{formatCurrency(price)}</span>{" "}
                    </div>
                  );
                })}
              </div>{" "}
              {/* Show shipping cost if applicable */}
              {deliveryMethod === "shipping" && (
                <div className='flex justify-between text-sm mt-1'>
                  <span>{t("shippingLabel")}</span>
                  <span>{formatCurrency(9.99)}</span>
                </div>
              )}{" "}
              <div className='border-t mt-3 pt-2 flex justify-between font-semibold'>
                <span>{t("estimatedTotal")}:</span>
                <span>
                  {" "}
                  {formatCurrency(
                    selectedRepairs.reduce(
                      (sum: number, repairId: number): number => {
                        const repair = repairTypes.find(
                          (r) => r.id === repairId
                        );
                        const variant = selectedVariants[repairId]
                          ? productVariants[repairId]?.find(
                              (v) => v.id === selectedVariants[repairId]
                            )
                          : undefined;

                        const price = repair
                          ? variant
                            ? repair.base_price + variant.price_adjustment
                            : repair.base_price
                          : 0;

                        return sum + price;
                      },
                      0
                    ) + (deliveryMethod === "shipping" ? 9.99 : 0)
                  )}
                </span>
              </div>
            </div>
          )}{" "}
          {currentStep === 1 && !selectedBrand && (
            <div className='text-gray-500 text-center p-2'>
              {t("selectDeviceInfo")}
            </div>
          )}
          {currentStep === 2 && selectedRepairs.length === 0 && (
            <div className='text-gray-500 text-center p-2'>
              {t("selectRepairService")}
            </div>
          )}{" "}
          {currentStep === 3 && (!selectedDate || !selectedTime) && (
            <div className='text-gray-500 text-center p-2'>
              {t("selectDateTime")}
            </div>
          )}{" "}
          {/* Display delivery method */}
          {deliveryMethod && (
            <div className='flex justify-between'>
              <span className='text-gray-600'>{t("deliveryMethod")}:</span>
              <span className='font-medium'>
                {deliveryMethod === "pickup" && t("customerPickup")}
                {deliveryMethod === "in_store" && t("inStore")}
                {deliveryMethod === "shipping" && t("shipToCustomer")}
              </span>
            </div>
          )}{" "}
          {/* Display shipping address if selected */}
          {deliveryMethod === "shipping" && shippingAddress?.address && (
            <div className='mt-2'>
              <div className='text-gray-600'>{t("shippingAddressLabel")}:</div>
              <div className='text-sm pl-2 mt-1'>
                <div>{shippingAddress.name}</div>
                <div>{shippingAddress.address.line1}</div>
                {shippingAddress.address.line2 && (
                  <div>{shippingAddress.address.line2}</div>
                )}
                <div>
                  {shippingAddress.address.city},{" "}
                  {shippingAddress.address.state}{" "}
                  {shippingAddress.address.postal_code}
                </div>
                <div>{shippingAddress.address.country}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Custom Repair Request Link */}
      <div className='mt-8 text-center'>
        <p className='text-gray-600 mb-3'>{t("deviceNotListed")}</p>
        <Link href={`/${locale}/repair/custom-request`}>
          <Button className='bg-blue-600 hover:bg-blue-700'>
            <HelpCircleIcon className='w-4 h-4 mr-2' />
            {t("customRepairRequest")}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RepairSchedulePage;
