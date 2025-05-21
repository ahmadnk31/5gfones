'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Filter, Search, ChevronsUpDown, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function RefundRequestsPage() {
  const t = useTranslations('admin');
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  // Function to format dates
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Fetch refund requests on component mount
  useEffect(() => {
    fetchRefundRequests();
  }, [filterStatus]);

  // Function to fetch refund requests from database
  const fetchRefundRequests = async () => {
    setLoading(true);
    try {
      // First, check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Unauthorized access');
        setLoading(false);
        return;
      }

      // Build the query
      const query = supabase
        .from('refund_requests')
        .select(`
          *,
          order:order_id (
            id,
            total_amount,
            payment_status,
            created_at,
            payment_id,
            payment_details
          ),
          customer:user_uid (
            email,
            id
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filter if not set to "all"
      if (filterStatus !== 'all') {
        query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setRefundRequests(data || []);
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      toast.error('Failed to fetch refund requests');
    } finally {
      setLoading(false);
    }
  };

  // Function to view refund request details
  const viewRequest = (request: any) => {
    setSelectedRequest(request);
    setRefundAmount(request.order?.total_amount || '0');
    setAdminNotes('');
    setDialogOpen(true);
  };

  // Function to process a refund
  const processRefund = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      // For approved refunds, process the actual refund through Stripe
      if (status === 'approved') {
        const paymentId = 
          selectedRequest.order?.payment_id || 
          (selectedRequest.order?.payment_details && 
            typeof selectedRequest.order.payment_details === 'string'
              ? JSON.parse(selectedRequest.order.payment_details)?.id
              : selectedRequest.order?.payment_details?.id);
              
        if (!paymentId) {
          throw new Error('Payment ID not found for this order');
        }

        // Call refund API
        const response = await fetch('/api/refund', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentId,
            amount: Math.round(parseFloat(refundAmount) * 100), // Convert to cents
            reason: `Refund request #${selectedRequest.id}: ${selectedRequest.reason}`,
            orderId: selectedRequest.order_id,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to process refund');
        }
      }

      // Update the refund request status in database
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('refund_requests')
        .update({
          status,
          admin_notes: adminNotes,
          processed_at: new Date().toISOString(),
          processed_by: userData?.user?.id,
        })
        .eq('id', selectedRequest.id);

      if (error) {
        throw error;
      }

      // Update the order refund status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          refund_status: status,
          ...(status === 'approved' ? {
            payment_status: parseFloat(refundAmount) >= parseFloat(selectedRequest.order?.total_amount || '0') 
              ? 'refunded' 
              : 'partially_refunded',
          } : {}),
        })
        .eq('id', selectedRequest.order_id);

      if (orderError) {
        throw orderError;
      }

      toast.success(`Refund request ${status}`);
      setDialogOpen(false);
      fetchRefundRequests();
    } catch (error: any) {
      console.error(`Error ${status} refund:`, error);
      toast.error(error.message || `Failed to ${status} refund`);
    } finally {
      setProcessing(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Refund Requests</h1>
        <p className="text-gray-500">Manage customer refund requests</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Refund Requests</CardTitle>
            <CardDescription>
              View and manage customer refund requests
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => fetchRefundRequests()}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
              <p>Loading refund requests...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date Requested</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No refund requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    refundRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>#{request.id}</TableCell>
                        <TableCell>
                          <a 
                            href={`/admin/orders/${request.order_id}`} 
                            className="text-blue-600 hover:underline"
                          >
                            #{request.order_id}
                          </a>
                        </TableCell>
                        <TableCell>
                          {request.customer?.email || 'Customer'}
                        </TableCell>
                        <TableCell>{formatDate(request.created_at)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {request.reason}
                        </TableCell>
                        <TableCell>
                          {request.order ? formatCurrency(parseFloat(request.order.total_amount)) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewRequest(request)}
                            disabled={request.status !== 'pending'}
                          >
                            {request.status === 'pending' ? 'Process' : 'View'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Refund Request #{selectedRequest?.id}</DialogTitle>
            <DialogDescription>
              Review and process this refund request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium">#{selectedRequest.order_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Requested On</p>
                  <p className="font-medium">{formatDate(selectedRequest.created_at)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{selectedRequest.customer?.email || 'Customer'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Refund Reason</p>
                <p className="font-medium">{selectedRequest.reason}</p>
              </div>
              
              {selectedRequest.additional_info && (
                <div>
                  <p className="text-sm text-gray-500">Additional Information</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedRequest.additional_info}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500">Refund Amount</p>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="pl-7"
                    disabled={selectedRequest.status !== 'pending'}
                    max={selectedRequest.order?.total_amount || 0}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Max: {selectedRequest.order ? formatCurrency(parseFloat(selectedRequest.order.total_amount)) : 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Admin Notes</p>
                <Textarea
                  placeholder="Enter notes about this refund (optional)"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={selectedRequest.status !== 'pending'}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            {selectedRequest?.status === 'pending' ? (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => processRefund('rejected')}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Reject
                </Button>
                <Button 
                  onClick={() => processRefund('approved')}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Approve & Refund
                </Button>
              </>
            ) : (
              <Button onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
