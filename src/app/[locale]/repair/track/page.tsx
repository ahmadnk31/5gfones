'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { SearchIcon, Wrench, Package, Clock, Check, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import RepairLayout from '@/components/repair-layout';
import { createClient } from '@/lib/supabase/client';
import { AppointmentData, DeviceModel, RepairResult, RepairStatusMap } from '@/types/repair';

/**
 * Safely formats a date string, returning a formatted date or fallback text if the date is invalid
 */
const safeFormatDate = (dateStr: string | null | undefined, fallback: string = "N/A"): string => {
  if (!dateStr) return fallback;
  
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) ? date.toLocaleDateString() : fallback;
};

const StatusTracker = () => {
  const t = useTranslations('repair');
  const [orderId, setOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<RepairResult | null>(null);
  const [error, setError] = useState<string | null>(null);  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params?.locale?.toString() || 'en';
  const supabase = createClient();
  
  // Status mapping from database IDs to UI status
  const statusMap: RepairStatusMap = {
    1: 'pending',  // Awaiting Check-in
    2: 'pending',  // Checked In
    3: 'pending',  // Diagnosed
    4: 'pending',  // Approved
    5: 'in_progress', // In Progress
    6: 'completed', // Completed
    7: 'completed', // Delivered
    8: 'pending',  // Cancelled
  };  // No authentication or banner checks needed
  
  // Handle tracking status
  const handleTrackStatus = useCallback(async (id?: string) => {
    const trackId = id || orderId.trim();
    if (!trackId) return;

    setIsLoading(true);
    setError(null);

    try {
      const isNumeric = /^\d+$/.test(trackId);
        if (!isNumeric) {
        setError(t('enterValidAppointmentNumber'));
        return;
      }

      // Query the appointment details from database
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select(`
          id,
          status_id,
          appointment_date,
          actual_completion_date,
          estimated_completion_date,
          technician_notes,
          problem_description,
          device:device_model_id (
            id, 
            name,
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
            id,
            is_service,
            service_description,
            product:product_id (
              name,
              description
            )
          )
        `)
        .eq("id", parseInt(trackId))
        .single();
      
      if (appointmentError) {        if (appointmentError.code === "PGRST116") {
          setError(t('noRepairFoundWithId'));
        } else {
          console.error('Error fetching appointment:', appointmentError);
          setError(t('repairStatusCheckError'));
        }
        return;
      }

      if (!appointmentData) {
        setError(t('noRepairFoundWithId'));
        return;
      }

      // Get the status information for this appointment
      const { data: statusDetails, error: statusError } = await supabase
        .from("repair_statuses")
        .select("name, description")
        .eq('id', appointmentData.status_id)
        .single();

      if (statusError) {
        console.error('Error fetching status details:', statusError);
      }      // Find service description from appointment items (if any)
      const serviceItem = appointmentData.appointment_items.find(item => item.is_service);
      const serviceDescription = serviceItem ? 
        (serviceItem.service_description || (serviceItem.product && 'name' in serviceItem.product ? serviceItem.product.name : 'Repair Service')) : 
        'Repair Service';
        
      // Format device name
      let deviceName = 'Unknown Device';
      if (appointmentData.device) {
        // Since the device from the query might not match our interface exactly, convert to our known structure
        const device = appointmentData.device as unknown as DeviceModel;
        const parts: string[] = [];
        
        // Safely extract brand name if available
        const brandName = device.series?.device_type?.brand?.name;
        if (brandName) {
          parts.push(brandName);
        }
        
        // Safely extract device type name if available
        const typeName = device.series?.device_type?.name;
        if (typeName) {
          parts.push(typeName);
        }
        
        // Safely extract series name if available
        const seriesName = device.series?.name;
        if (seriesName) {
          parts.push(seriesName);
        }
        
        // Add device name if available
        if (device.name) {
          parts.push(device.name);
        }
        
        // Only update deviceName if we have at least one part
        if (parts.length > 0) {
          deviceName = parts.join(' ');
        }
      }

      // Map the status_id to a UI status ('pending', 'in_progress', or 'completed')
      const uiStatus = statusMap[appointmentData.status_id] || 'pending';

      // Set the result data
      setStatusResult({
        id: appointmentData.id.toString(),
        status: uiStatus,
        date: appointmentData.appointment_date,
        device: deviceName,
        service: serviceDescription,
        estimatedCompletion: appointmentData.estimated_completion_date,
        completionDate: appointmentData.actual_completion_date,
        technicianNotes: appointmentData.technician_notes
      });
        } catch (err) {
      console.error('Error fetching status:', err);
      setError(t('repairStatusCheckError'));
    } finally {
      setIsLoading(false);
    }
  }, [orderId, supabase, statusMap]);

  // Check if we have a status ID from URL parameters
  React.useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setOrderId(id);
      handleTrackStatus(id);
    }
  }, [searchParams, handleTrackStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrackStatus();
  };
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case 'in_progress':
        return <Wrench className="w-8 h-8 text-emerald-500" />;
      case 'completed':
        return <Check className="w-8 h-8 text-green-500" />;
      default:
        return <AlertCircle className="w-8 h-8 text-gray-500" />;
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return t('statusPending');
      case 'in_progress':
        return t('statusInProgress');
      case 'completed':
        return t('statusCompleted');
      default:
        return t('statusUnknown');
    }
  };return (
    <RepairLayout activeTab="track">      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{t('trackTitle')}</h1>
        
        {/* Repair ID Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('enterRepairId')}</CardTitle>
          <CardDescription>
            {t('enterRepairIdDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}                  placeholder={t('repairIdPlaceholder')}
                  className="pr-10"
                  disabled={isLoading}
                />
                <SearchIcon className="absolute top-3 right-3 text-gray-400 w-5 h-5" />
              </div>              <Button 
                type="submit"
                disabled={isLoading || !orderId.trim()} 
                className="min-w-[120px] bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? 
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('searching')}</> : 
                  t('trackRepair')}
              </Button>
            </div>
          </form>
        </CardContent>        <CardFooter className="bg-gray-50 text-sm text-gray-600 border-t">
          <p>
            {t('cantFindRepairId')}
          </p>
        </CardFooter>
      </Card>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-8">
          <div className="flex">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Status Result */}
      {statusResult && (
        <div className="space-y-6">
          <Card>            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b bg-gray-50">
              <div>                <CardTitle>{t('repairNumber', { id: statusResult.id })}</CardTitle>
                <CardDescription>
                  {safeFormatDate(statusResult.date)} - {statusResult.device}
                </CardDescription>
              </div>              <div className={`px-4 py-2 rounded-full 
                ${statusResult.status === 'completed' ? 'bg-green-100 text-green-800' : 
                 statusResult.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800' : 
                 'bg-yellow-100 text-yellow-800'}`}>
                {getStatusLabel(statusResult.status)}
              </div>
            </CardHeader>

            <CardContent className="py-6">
        {/* Repair Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{t('device')}</h3>
                  <p className="text-lg font-medium">{statusResult.device}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{t('service')}</h3>
                  <p className="text-lg font-medium">{statusResult.service}</p>
                </div>
              </div>{/* Additional Details */}
              {(statusResult.estimatedCompletion || statusResult.technicianNotes) && (
                <div className="border-t border-gray-200 pt-6 mt-6">                  {statusResult.estimatedCompletion && (                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{t('estimatedCompletion')}</h3>
                      <p className="text-lg font-medium">
                        {safeFormatDate(statusResult.estimatedCompletion)}
                      </p>
                    </div>
                  )}{statusResult.completionDate && statusResult.status === 'completed' && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{t('completionDate')}</h3>
                      <p className="text-lg font-medium">
                        {safeFormatDate(statusResult.completionDate)}
                      </p>
                    </div>
                  )}
                  {statusResult.technicianNotes && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{t('technicianNotes')}</h3>
                      <p className="bg-gray-50 p-3 rounded-lg text-gray-700">
                        {statusResult.technicianNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Status Timeline */}              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">{t('repairProgress')}</h3>
                <div className="relative">
                  <div className="absolute left-[15px] h-full w-0.5 bg-gray-200"></div>
                  <div className="space-y-8">
                    {/* Received */}
                    <div className="relative flex">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10`}>
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">{t('deviceReceived')}</h4>
                        <p className="text-sm text-gray-500">{t('deviceCheckedIn')}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {safeFormatDate(statusResult.date)}
                        </p>
                      </div>
                    </div>                    {/* Diagnosis */}
                    <div className="relative flex">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                        statusResult.status !== 'pending' ? 'bg-green-500' : 'bg-gray-300'
                      } flex items-center justify-center z-10`}>
                        <SearchIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">{t('diagnosisComplete')}</h4>
                        <p className="text-sm text-gray-500">{t('deviceInspected')}</p>
                        {statusResult.status !== 'pending' && (
                          <p className="text-xs text-gray-400 mt-1">                            {/* Use appointment date + 1 day as an estimate for diagnosis completion */}
                            {statusResult.date ? safeFormatDate(new Date(new Date(statusResult.date).getTime() + 24 * 60 * 60 * 1000).toISOString()) : "N/A"}
                          </p>
                        )}
                      </div>
                    </div>                    {/* Repair */}
                    <div className="relative flex">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                        statusResult.status === 'in_progress' || statusResult.status === 'completed' 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      } flex items-center justify-center z-10`}>
                        <Wrench className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">{t('repairInProgress')}</h4>
                        <p className="text-sm text-gray-500">{t('techniciansWorking')}</p>
                        {(statusResult.status === 'in_progress' || statusResult.status === 'completed') && (
                          <p className="text-xs text-gray-400 mt-1">
                            {/* Use estimated completion date if available, otherwise use appointment date + 2 days */}                            {statusResult.estimatedCompletion
                              ? safeFormatDate(statusResult.estimatedCompletion)
                              : statusResult.date 
                                ? safeFormatDate(new Date(new Date(statusResult.date).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString())
                                : "N/A"}
                          </p>
                        )}
                      </div>
                    </div>                    {/* Complete */}
                    <div className="relative flex">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                        statusResult.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      } flex items-center justify-center z-10`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">{t('repairCompleted')}</h4>
                        <p className="text-sm text-gray-500">{t('deviceReadyForPickup')}</p>
                        {statusResult.status === 'completed' && (
                          <p className="text-xs text-gray-400 mt-1">
                            {/* Use actual completion date if available, otherwise use appointment date + 3 days */}                            {statusResult.completionDate
                              ? safeFormatDate(statusResult.completionDate)
                              : statusResult.date
                                ? safeFormatDate(new Date(new Date(statusResult.date).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString())
                                : "N/A"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-gray-50 border-t justify-between">              <div>                <Button variant="outline" asChild>
                  <Link href={`/${locale}/repair`}>
                    {t('backToRepairServices')}
                  </Link>
                </Button>
              </div>              {statusResult.status === 'completed' && (
                <Button className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700">
                  {t('schedulePickup')} <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
        {/* FAQs */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">{t('faqTitle')}</h2>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-medium text-lg mb-2">{t('faqRepairTimeQuestion')}</h3>
            <p className="text-gray-600">
              {t('faqRepairTimeAnswer')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-medium text-lg mb-2">{t('faqDelayQuestion')}</h3>
            <p className="text-gray-600">
              {t('faqDelayAnswer')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-medium text-lg mb-2">{t('faqCompleteNotificationQuestion')}</h3>
            <p className="text-gray-600">
              {t('faqCompleteNotificationAnswer')}
            </p>
          </div>
        </div>
      </div>        {/* Contact Info */}      <div className="mt-8 bg-emerald-50 border border-emerald-100 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3">{t('needHelp')}</h2>
        <p className="mb-4">
          {t('contactSupportMessage')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center">
            <div className="bg-emerald-100 p-3 rounded-full mr-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>              <p className="text-sm text-gray-500">{t('phone')}</p>
              <p className="font-medium">{t('phoneNumber')}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-emerald-100 p-3 rounded-full mr-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>            <div>
              <p className="text-sm text-gray-500">{t('email')}</p>
              <p className="font-medium">{t('supportEmail')}</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </RepairLayout>
  );
};

export default StatusTracker;
