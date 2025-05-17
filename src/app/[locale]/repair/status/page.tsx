"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
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
import { format, parseISO } from "date-fns";
import {
  SearchIcon,
  PhoneIcon,
  FileTextIcon,
  ChevronRightIcon,
} from "lucide-react";
import Link from "next/link";
import RepairLayout from "@/components/repair-layout";

interface RepairStatusData {
  id: number;
  status_id: number;
  status: {
    name: string;
    description: string;
  };
  appointment_date: string;
  completed_date: string | null;
  estimated_completion_date: string | null;
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
    product: {
      name: string;
    };
  }[];
  notes: {
    id: number;
    note: string;
    created_at: string;
  }[];
}

export default function RepairStatusPage() {
  const t = useTranslations("repair");
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repairData, setRepairData] = useState<RepairStatusData | null>(null);

  // Status mapping
  const statusInfo = {
    1: { color: "blue", label: "Awaiting Check-In", icon: "📋" },
    2: { color: "yellow", label: "Diagnostic", icon: "🔍" },
    3: { color: "purple", label: "Awaiting Parts", icon: "⏳" },
    4: { color: "orange", label: "In Progress", icon: "🔧" },
    5: { color: "green", label: "Ready for Pickup", icon: "✅" },
    6: { color: "gray", label: "Completed", icon: "🏁" },
    7: { color: "red", label: "Cancelled", icon: "❌" },
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setRepairData(null);

    try {
      // Try to find by appointment ID
      const isNumber = /^\d+$/.test(searchQuery.trim());
      let query = supabase.from("appointments").select(`
          id,
          status_id,
          status:status_id (name, description),
          appointment_date,
          completed_date,
          estimated_completion_date,
          device:device_model_id (
            id, name,
            series:device_series_id (
              name,
              device_type:device_type_id (
                name,
                brand:brand_id (name)
              )
            )
          ),
          appointment_items (
            id,
            product:product_id (name)
          ),
          notes (
            id, note, created_at
          )
        `);

      if (isNumber) {
        query = query.eq("id", parseInt(searchQuery.trim()));
      } else {
        // This is a simplified example - in a real app you might check by email, phone, etc.
        setError("Please enter a valid appointment number");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await query.single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          setError("No repair found with that information");
        } else {
          console.error("Error fetching repair status:", fetchError);
          setError("An error occurred while fetching repair status");
        }
        return;
      }

      setRepairData(data as RepairStatusData);
    } catch (err) {
      console.error("Error in search:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (statusId: number) => {
    const status = statusId as keyof typeof statusInfo;
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      red: "bg-red-100 text-red-800 border-red-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return colorMap[statusInfo[status]?.color || "gray"];
  };
  return (
    <RepairLayout activeTab='status'>
      <div className='container mx-auto px-4 py-12 max-w-4xl'>
        <h1 className='text-3xl font-bold mb-2'>Check Repair Status</h1>
        <p className='text-gray-600 mb-8'>
          Enter your repair appointment number to check the status of your
          repair
        </p>

        {/* Search Form */}
        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>Find Your Repair</CardTitle>
            <CardDescription>
              Enter the appointment number provided when you scheduled your
              repair
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className='space-y-4'>
              <div className='flex flex-col sm:flex-row gap-3'>
                <div className='relative flex-grow'>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Enter your appointment number'
                    className='w-full px-4 py-3 border rounded-lg pr-10'
                  />
                  <SearchIcon className='absolute top-3 right-3 text-gray-400 w-5 h-5' />
                </div>
                <Button
                  type='submit'
                  disabled={loading || !searchQuery.trim()}
                  className='px-6'
                >
                  {loading ? "Searching..." : "Check Status"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className='bg-gray-50 border-t'>
            <div className='text-sm text-gray-500 flex items-center'>
              <PhoneIcon className='w-4 h-4 mr-2' />
              <span>You can also call us at (555) 123-4567 for assistance</span>
            </div>
          </CardFooter>
        </Card>

        {/* Error Message */}
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-8'>
            <div className='flex'>
              <svg
                className='w-5 h-5 mr-2'
                fill='currentColor'
                viewBox='0 0 20 20'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                ></path>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Repair Status Results */}
        {repairData && (
          <div className='space-y-6'>
            {/* Status Overview Card */}
            <Card>
              <CardHeader className='bg-gray-50 border-b'>
                <div className='flex justify-between items-center'>
                  <div>
                    <CardTitle>Repair #{repairData.id}</CardTitle>
                    <CardDescription>
                      {repairData.device.series.device_type.brand.name}{" "}
                      {repairData.device.name}
                    </CardDescription>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full border ${getStatusClass(
                      repairData.status_id
                    )}`}
                  >
                    <span>
                      {
                        statusInfo[
                          repairData.status_id as keyof typeof statusInfo
                        ]?.icon
                      }
                    </span>{" "}
                    {repairData.status.name}
                  </div>
                </div>
              </CardHeader>
              <CardContent className='py-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-3'>
                    <div>
                      <h3 className='text-sm font-medium text-gray-500'>
                        Appointment Date
                      </h3>
                      <p className='font-medium'>
                        {format(
                          parseISO(repairData.appointment_date),
                          "PPP, h:mm a"
                        )}
                      </p>
                    </div>

                    {repairData.estimated_completion_date && (
                      <div>
                        <h3 className='text-sm font-medium text-gray-500'>
                          Expected Completion
                        </h3>
                        <p className='font-medium'>
                          {format(
                            parseISO(repairData.estimated_completion_date),
                            "PPP"
                          )}
                        </p>
                      </div>
                    )}

                    {repairData.completed_date && (
                      <div>
                        <h3 className='text-sm font-medium text-gray-500'>
                          Completed Date
                        </h3>
                        <p className='font-medium'>
                          {format(parseISO(repairData.completed_date), "PPP")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className='space-y-3'>
                    <div>
                      <h3 className='text-sm font-medium text-gray-500'>
                        Device
                      </h3>
                      <p className='font-medium'>
                        {repairData.device.series.device_type.brand.name}{" "}
                        {repairData.device.series.name} {repairData.device.name}
                      </p>
                    </div>

                    <div>
                      <h3 className='text-sm font-medium text-gray-500'>
                        Services
                      </h3>
                      <ul className='list-disc ml-5'>
                        {repairData.appointment_items.map((item) => (
                          <li key={item.id}>{item.product.name}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Status Progress */}
                <div className='mt-8'>
                  <h3 className='text-lg font-medium mb-4'>Repair Progress</h3>
                  <div className='relative'>
                    <div className='absolute left-[15px] h-full w-0.5 bg-gray-200'></div>
                    <div className='space-y-8'>
                      {/* Repair stages - these would be dynamic based on the repair status */}
                      <div className='relative flex'>
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full ${
                            repairData.status_id >= 1
                              ? "bg-green-500"
                              : "bg-gray-200"
                          } flex items-center justify-center z-10`}
                        >
                          <svg
                            className='w-4 h-4 text-white'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                            xmlns='http://www.w3.org/2000/svg'
                          >
                            <path
                              fillRule='evenodd'
                              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                              clipRule='evenodd'
                            ></path>
                          </svg>
                        </div>
                        <div className='ml-4'>
                          <h4 className='font-medium'>Check-In</h4>
                          <p className='text-sm text-gray-500'>
                            Appointment scheduled
                          </p>
                          <p className='text-xs text-gray-400 mt-1'>
                            {format(
                              parseISO(repairData.appointment_date),
                              "PPP"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className='relative flex'>
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full ${
                            repairData.status_id >= 2
                              ? "bg-green-500"
                              : "bg-gray-200"
                          } flex items-center justify-center z-10`}
                        >
                          {repairData.status_id >= 2 ? (
                            <svg
                              className='w-4 h-4 text-white'
                              fill='currentColor'
                              viewBox='0 0 20 20'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <path
                                fillRule='evenodd'
                                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                clipRule='evenodd'
                              ></path>
                            </svg>
                          ) : (
                            <span className='text-sm text-white'>2</span>
                          )}
                        </div>
                        <div className='ml-4'>
                          <h4 className='font-medium'>Diagnostic</h4>
                          <p className='text-sm text-gray-500'>
                            Technician evaluating your device
                          </p>
                          {repairData.notes.length > 0 &&
                            repairData.status_id >= 2 && (
                              <p className='text-xs italic mt-1'>
                                {repairData.notes[0].note}
                              </p>
                            )}
                        </div>
                      </div>

                      <div className='relative flex'>
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full ${
                            repairData.status_id >= 4
                              ? "bg-green-500"
                              : "bg-gray-200"
                          } flex items-center justify-center z-10`}
                        >
                          {repairData.status_id >= 4 ? (
                            <svg
                              className='w-4 h-4 text-white'
                              fill='currentColor'
                              viewBox='0 0 20 20'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <path
                                fillRule='evenodd'
                                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                clipRule='evenodd'
                              ></path>
                            </svg>
                          ) : (
                            <span className='text-sm text-white'>3</span>
                          )}
                        </div>
                        <div className='ml-4'>
                          <h4 className='font-medium'>Repair in Progress</h4>
                          <p className='text-sm text-gray-500'>
                            Fixing your device
                          </p>
                          {repairData.status_id >= 4 && (
                            <p className='text-xs text-gray-400 mt-1'>
                              {repairData.estimated_completion_date &&
                                `Expected completion: ${format(
                                  parseISO(
                                    repairData.estimated_completion_date
                                  ),
                                  "PPP"
                                )}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className='relative flex'>
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full ${
                            repairData.status_id >= 5
                              ? "bg-green-500"
                              : "bg-gray-200"
                          } flex items-center justify-center z-10`}
                        >
                          {repairData.status_id >= 5 ? (
                            <svg
                              className='w-4 h-4 text-white'
                              fill='currentColor'
                              viewBox='0 0 20 20'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <path
                                fillRule='evenodd'
                                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                clipRule='evenodd'
                              ></path>
                            </svg>
                          ) : (
                            <span className='text-sm text-white'>4</span>
                          )}
                        </div>
                        <div className='ml-4'>
                          <h4 className='font-medium'>Ready for Pickup</h4>
                          <p className='text-sm text-gray-500'>
                            Your device is repaired and ready
                          </p>
                          {repairData.status_id >= 5 && (
                            <p className='text-xs text-gray-400 mt-1'>
                              {repairData.completed_date &&
                                `Completed on: ${format(
                                  parseISO(repairData.completed_date),
                                  "PPP"
                                )}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className='relative flex'>
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full ${
                            repairData.status_id >= 6
                              ? "bg-green-500"
                              : "bg-gray-200"
                          } flex items-center justify-center z-10`}
                        >
                          {repairData.status_id >= 6 ? (
                            <svg
                              className='w-4 h-4 text-white'
                              fill='currentColor'
                              viewBox='0 0 20 20'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <path
                                fillRule='evenodd'
                                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                clipRule='evenodd'
                              ></path>
                            </svg>
                          ) : (
                            <span className='text-sm text-white'>5</span>
                          )}
                        </div>
                        <div className='ml-4'>
                          <h4 className='font-medium'>Completed</h4>
                          <p className='text-sm text-gray-500'>
                            Repair completed and device picked up
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className='bg-gray-50 border-t'>
                <div className='w-full flex flex-col sm:flex-row justify-between gap-3'>
                  {" "}
                  <div>
                    <Button
                      variant='outline'
                      className='flex items-center'
                      asChild
                    >
                      <a href={`tel:+15551234567`}>
                        <PhoneIcon className='w-4 h-4 mr-2' />
                        Call for Support
                      </a>
                    </Button>
                  </div>{" "}
                  <div>
                    <Button className='flex items-center' asChild>
                      <Link href={`/en/repair/schedule?edit=${repairData.id}`}>
                        <FileTextIcon className='w-4 h-4 mr-2' />
                        Modify Appointment
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Need Help Section */}
        <div className='mt-12 bg-blue-50 border border-blue-100 rounded-lg p-6'>
          <h2 className='text-lg font-semibold mb-2'>Need Help?</h2>
          <p className='text-gray-700 mb-4'>
            If you&apos;re having trouble finding your repair status or have any
            questions, our support team is ready to help!
          </p>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex items-start'>
              <PhoneIcon className='w-5 h-5 mr-2 text-blue-600 mt-0.5' />
              <div>
                <p className='font-medium'>Call Us</p>
                <p className='text-sm text-gray-500'>(555) 123-4567</p>
              </div>
            </div>
            <div className='flex items-start'>
              <svg
                className='w-5 h-5 mr-2 text-blue-600 mt-0.5'
                fill='currentColor'
                viewBox='0 0 20 20'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
                <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
              </svg>
              <div>
                <p className='font-medium'>Email Us</p>
                <p className='text-sm text-gray-500'>support@finopenpos.com</p>
              </div>
            </div>
            <div className='flex items-start'>
              <svg
                className='w-5 h-5 mr-2 text-blue-600 mt-0.5'
                fill='currentColor'
                viewBox='0 0 20 20'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
                  clipRule='evenodd'
                />
              </svg>
              <div>
                <p className='font-medium'>Business Hours</p>
                <p className='text-sm text-gray-500'>
                  Mon-Fri: 9AM-6PM, Sat: 10AM-4PM
                </p>
              </div>{" "}
            </div>
          </div>
        </div>
      </div>{" "}
    </RepairLayout>
  );
}
