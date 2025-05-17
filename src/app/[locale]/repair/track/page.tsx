'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { SearchIcon, Wrench, Package, Clock, Check, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import RepairLayout from '@/components/repair-layout';

const StatusTracker = () => {
  const t = useTranslations('repair');
  const [orderId, setOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<null | {
    id: string;
    status: 'in_progress' | 'completed' | 'pending';
    date: string;
    device: string;
    service: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  // Handle tracking status
  const handleTrackStatus = useCallback(async (id?: string) => {
    const trackId = id || orderId.trim();
    if (!trackId) return;

    setIsLoading(true);
    setError(null);

    try {
      // This would normally be an API call to check status
      // Mocking the response for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate different statuses based on the ID
      if (trackId === '12345') {
        setStatusResult({
          id: trackId,
          status: 'in_progress',
          date: new Date().toISOString(),
          device: 'iPhone 12 Pro',
          service: 'Screen Replacement'
        });
      } else if (trackId === '54321') {
        setStatusResult({
          id: trackId,
          status: 'completed',
          date: new Date().toISOString(),
          device: 'Samsung Galaxy S21',
          service: 'Battery Replacement'
        });
      } else if (trackId === '11111') {
        setStatusResult({
          id: trackId,
          status: 'pending',
          date: new Date().toISOString(),
          device: 'Google Pixel 6',
          service: 'Charging Port Repair'
        });
      } else {
        setError('No repair found with that ID. Please check and try again.');
      }
    } catch (err) {
      console.error('Error fetching status:', err);
      setError('There was a problem checking your repair status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

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
        return <Wrench className="w-8 h-8 text-blue-500" />;
      case 'completed':
        return <Check className="w-8 h-8 text-green-500" />;
      default:
        return <AlertCircle className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Awaiting Service';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown Status';
    }
  };
  return (
    <RepairLayout activeTab="track">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Track Your Repair</h1>
        
        {/* Repair ID Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enter Repair ID</CardTitle>
          <CardDescription>
            Enter your repair ID to check the status of your repair
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter your repair ID"
                  className="pr-10"
                  disabled={isLoading}
                />
                <SearchIcon className="absolute top-3 right-3 text-gray-400 w-5 h-5" />
              </div>
              <Button 
                type="submit"
                disabled={isLoading || !orderId.trim()} 
                className="min-w-[120px]"
              >
                {isLoading ? "Searching..." : "Track Repair"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-gray-50 text-sm text-gray-600 border-t">
          <p>
            Can't find your repair ID? Please contact our customer service team.
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
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b bg-gray-50">
              <div>
                <CardTitle>Repair #{statusResult.id}</CardTitle>
                <CardDescription>
                  {new Date(statusResult.date).toLocaleDateString()} - {statusResult.device}
                </CardDescription>
              </div>
              <div className={`px-4 py-2 rounded-full 
                ${statusResult.status === 'completed' ? 'bg-green-100 text-green-800' : 
                 statusResult.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                 'bg-yellow-100 text-yellow-800'}`}>
                {getStatusLabel(statusResult.status)}
              </div>
            </CardHeader>

            <CardContent className="py-6">
              {/* Repair Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Device</h3>
                  <p className="text-lg font-medium">{statusResult.device}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Service</h3>
                  <p className="text-lg font-medium">{statusResult.service}</p>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Repair Progress</h3>
                <div className="relative">
                  <div className="absolute left-[15px] h-full w-0.5 bg-gray-200"></div>
                  <div className="space-y-8">
                    {/* Received */}
                    <div className="relative flex">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10`}>
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Device Received</h4>
                        <p className="text-sm text-gray-500">Your device has been checked in</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(statusResult.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Diagnosis */}
                    <div className="relative flex">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                        statusResult.status !== 'pending' ? 'bg-green-500' : 'bg-gray-300'
                      } flex items-center justify-center z-10`}>
                        <SearchIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Diagnosis Complete</h4>
                        <p className="text-sm text-gray-500">Device has been inspected and issue confirmed</p>
                        {statusResult.status !== 'pending' && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(new Date(statusResult.date).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Repair */}
                    <div className="relative flex">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                        statusResult.status === 'in_progress' || statusResult.status === 'completed' 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      } flex items-center justify-center z-10`}>
                        <Wrench className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Repair in Progress</h4>
                        <p className="text-sm text-gray-500">Technicians are working on your device</p>
                        {(statusResult.status === 'in_progress' || statusResult.status === 'completed') && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(new Date(statusResult.date).getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Complete */}
                    <div className="relative flex">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                        statusResult.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      } flex items-center justify-center z-10`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Repair Completed</h4>
                        <p className="text-sm text-gray-500">Your device is repaired and ready for pickup</p>
                        {statusResult.status === 'completed' && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(new Date(statusResult.date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-gray-50 border-t justify-between">              <div>
                <Button variant="outline" asChild>
                  <Link href="/en/repair">
                    Back to Repair Services
                  </Link>
                </Button>
              </div>
              {statusResult.status === 'completed' && (
                <Button className="flex items-center gap-1">
                  Schedule Pickup <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* FAQs */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-medium text-lg mb-2">How long does a typical repair take?</h3>
            <p className="text-gray-600">
              Most repairs are completed within 24-48 hours depending on parts availability and the complexity of the repair. 
              Some common repairs like screen replacements can often be completed same-day.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-medium text-lg mb-2">What if my repair is taking longer than expected?</h3>
            <p className="text-gray-600">
              If your repair requires special parts or faces unexpected complications, it may take longer. 
              We'll always notify you if there's a delay and provide an updated timeline.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-medium text-lg mb-2">How will I know when my repair is complete?</h3>
            <p className="text-gray-600">
              We'll notify you via email and text message when your repair is complete. 
              You can also check the status anytime on this page using your repair ID.
            </p>
          </div>
        </div>
      </div>
        {/* Contact Info */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3">Need Help?</h2>
        <p className="mb-4">
          If you need assistance with your repair or have questions about our services, 
          please contact our customer support team.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">(555) 123-4567</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">support@finopenpos.com</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </RepairLayout>
  );
};

export default StatusTracker;
