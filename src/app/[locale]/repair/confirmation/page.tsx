"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarIcon,
  ChevronRight,
  MapPinIcon,
  PhoneIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import RepairLayout from "@/components/repair-layout";
import { Link } from "@/i18n/navigation";

interface AppointmentData {
  id: number;
  device_model_id: number;
  problem_description: string;
  device_serial_number: string | null;
  device_password: string | null;
  appointment_date: string;
  status_id: number;
  created_at: string;
  device: {
    id: number;
    name: string;
    series: {
      name: string;
      device_type: {
        name: string;
        brand: {
          name: string;
        };
      };
    };
  };
  appointment_items: {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    is_service: boolean;
    service_description: string | null;
    product: {
      name: string;
      description: string | null;
      base_price: number;
    };
  }[];
}

export default function ConfirmationPage() {
  const t = useTranslations("repair.confirmation");
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("id");
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) {
        setError("No appointment ID provided");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            *,
            device:device_model_id (
              id, name,
              series:device_series_id (
                name,
                device_type:device_type_id (
                  name,
                  brand:brand_id (
                    name
                  )
                )
              )
            ),
            appointment_items (
              *,
              product:product_id (
                name, description, base_price
              )
            )
          `
          )
          .eq("id", appointmentId)
          .single();

        if (error) {
          throw error;
        }

        setAppointment(data as AppointmentData);
      } catch (error) {
        console.error("Error fetching appointment:", error);
        setError("Could not fetch appointment details");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalEstimate =
    appointment?.appointment_items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    ) || 0;

  const handleAddToCalendar = () => {
    if (!appointment) return;

    const appointmentDate = parseISO(appointment.appointment_date);
    const endTime = new Date(appointmentDate);
    endTime.setHours(endTime.getHours() + 1); // Add 1 hour for the appointment duration

    // Format dates for calendar URL
    const startDate = format(appointmentDate, "yyyyMMdd'T'HHmmss");
    const endDate = format(endTime, "yyyyMMdd'T'HHmmss");

    const deviceInfo = `${appointment.device.series.device_type.brand.name} ${appointment.device.name}`;
    const details = `Repair appointment for ${deviceInfo}. ${appointment.problem_description}`;

    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=Device Repair Appointment&dates=${startDate}/${endDate}&details=${encodeURIComponent(
      details
    )}&location=FinOpenPOS Repair Center&sf=true&output=xml`;

    window.open(calendarUrl, "_blank");
  };
  if (loading) {
    return (
      <RepairLayout>
        <div className='container mx-auto px-4 py-16 flex justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto'></div>
            <p className='mt-4 text-lg'>Loading appointment details...</p>
          </div>
        </div>
      </RepairLayout>
    );
  }

  if (error || !appointment) {
    return (
      <div className='container mx-auto px-4 py-16'>
        <Card className='max-w-2xl mx-auto'>
          <CardHeader className='bg-red-50 border-b border-red-100'>
            <CardTitle className='text-red-700'>Error</CardTitle>
            <CardDescription className='text-red-600'>
              {error || "Could not find appointment details"}
            </CardDescription>
          </CardHeader>
          <CardContent className='py-6'>
            <p className='mb-4'>
              There was an error retrieving your appointment details. Please try
              again or contact customer support.
            </p>
          </CardContent>
          <CardFooter className='flex justify-between'>
            <Button variant='outline' onClick={() => router.back()}>
              Go Back
            </Button>
            <Button onClick={() => router.push("/en/repair")}>
              Return to Repairs
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const appointmentDate = parseISO(appointment.appointment_date);
  return (
    <RepairLayout activeTab='schedule'>
      <div className='container mx-auto px-4 py-12 max-w-4xl'>
        {/* Success Message */}
        <div className='bg-green-50 border border-green-200 rounded-lg p-6 mb-8 flex items-center'>
          <div className='w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0'>
            <svg
              className='w-6 h-6 text-green-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          </div>
          <div className='ml-4'>
            <h3 className='text-green-800 font-semibold text-lg'>
              {t("title")}
            </h3>
            <p className='text-green-700'>{t("subtitle")}</p>
          </div>
        </div>
        {/* Appointment Details Card */}
        <Card className='mb-8'>
          <CardHeader className='bg-blue-50 border-b'>
            <CardTitle>
              {t("appointmentNumber")} {appointment.id}
            </CardTitle>
            <CardDescription>
              {format(appointmentDate, "PPPP")} at{" "}
              {format(appointmentDate, "h:mm a")}
            </CardDescription>
          </CardHeader>
          <CardContent className='py-6 space-y-6'>
            <div>
              <h3 className='text-sm text-gray-500 mb-1'>{t("device")}</h3>
              <p className='font-semibold'>
                {appointment.device.series.device_type.brand.name}{" "}
                {appointment.device.series.name} {appointment.device.name}
              </p>
            </div>

            <div>
              <h3 className='text-sm text-gray-500 mb-2'>{t("services")}</h3>
              <div className='space-y-2'>
                {appointment.appointment_items.map((item) => (
                  <div key={item.id} className='flex justify-between'>
                    <span>{item.product.name}</span>
                    <span className='font-medium'>
                      {formatCurrency(item.unit_price)}
                    </span>
                  </div>
                ))}
                <div className='flex justify-between border-t pt-2 mt-4 font-semibold'>
                  <span>{t("totalEstimate")}</span>
                  <span>{formatCurrency(totalEstimate)}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className='bg-gray-50 flex justify-between'>
            <Button variant='outline' onClick={handleAddToCalendar}>
              <CalendarIcon className='w-4 h-4 mr-2' />
              {t("addToCalendar")}
            </Button>
            <Button
              variant='outline'
              onClick={() =>
                router.push(`/en/repair/schedule?edit=${appointment.id}`)
              }
            >
              {t("changeAppointment")}
            </Button>
          </CardFooter>
        </Card>
        {/* What to Expect */}
        <h2 className='text-xl font-semibold mb-4'>{t("whatToExpect")}</h2>
        <div className='bg-white border rounded-lg p-6 mb-8'>
          <ol className='space-y-5'>
            <li className='flex'>
              <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3'>
                1
              </div>
              <div>
                <p>{t("expectation1")}</p>
              </div>
            </li>
            <li className='flex'>
              <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3'>
                2
              </div>
              <div>
                <p>{t("expectation2")}</p>
              </div>
            </li>
            <li className='flex'>
              <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3'>
                3
              </div>
              <div>
                <p>{t("expectation3")}</p>
              </div>
            </li>
            <li className='flex'>
              <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3'>
                4
              </div>
              <div>
                <p>{t("expectation4")}</p>
              </div>
            </li>
          </ol>
        </div>
        {/* Store Information */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
          <Card>
            <CardHeader>
              {" "}
              <CardTitle className='flex items-center'>
                <MapPinIcon className='w-5 h-5 mr-2 text-blue-600' />
                {t("storeLocation")}
              </CardTitle>
            </CardHeader>{" "}
            <CardContent>
              <p className='mb-2'>{t("storeAddress1")}</p>
              <p className='mb-2'>{t("storeAddress2")}</p>
              <p className='mb-4'>{t("storeCountry")}</p>{" "}
              <div>
                <Button variant='outline' className='w-full' size='sm' asChild>
                  <a
                    href='https://maps.app.goo.gl/xm92nq9NSTAYDTgeA'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {t("directions")}
                    <ChevronRight className='w-4 h-4 ml-1' />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <PhoneIcon className='w-5 h-5 mr-2 text-blue-600' />
                {t("contactInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {" "}
              <p className='mb-2'>
                <span className='font-medium'>{t("contactEmail")}</span>{" "}
                support@finopenpos.com
              </p>
              <p className='mb-2'>
                <span className='font-medium'>{t("contactPhone")}</span> (555)
                123-4567
              </p>
              <p className='mb-4'>
                <span className='font-medium'>{t("contactHours")}</span>{" "}
                {t("businessHours")}
              </p>
            </CardContent>
          </Card>
        </div>{" "}
        {/* Back to Home Button */}
        <div className='text-center'>
          <Button size='lg' asChild>
            <Link href='/'>{t("returnToHome")}</Link>
          </Button>
        </div>
      </div>
    </RepairLayout>
  );
}
