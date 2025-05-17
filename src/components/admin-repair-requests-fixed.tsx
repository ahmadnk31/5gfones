"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  RefreshCw,
  Clock,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// Define repair request type
interface RepairRequest {
  id: number;
  device_name: string;
  device_type: string | null;
  device_brand: string | null;
  device_color: string | null;
  problem_description: string;
  customer_email: string;
  customer_phone: string | null;
  status: "pending" | "approved" | "rejected" | "converted";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Main component for admin to view and manage repair requests
export function AdminRepairRequests() {
  const t = useTranslations("repair.admin");
  const statusT = useTranslations("repair.admin.status");

  // Function to render status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant='outline'
            className='bg-yellow-50 text-yellow-700 border-yellow-200'
          >
            <Clock className='h-3 w-3 mr-1' />
            {statusT("pending")}
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant='outline'
            className='bg-green-50 text-green-700 border-green-200'
          >
            <CheckCircle className='h-3 w-3 mr-1' />
            {statusT("approved")}
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant='outline'
            className='bg-red-50 text-red-700 border-red-200'
          >
            <XCircle className='h-3 w-3 mr-1' />
            {statusT("rejected")}
          </Badge>
        );
      case "converted":
        return (
          <Badge
            variant='outline'
            className='bg-blue-50 text-blue-700 border-blue-200'
          >
            <RefreshCw className='h-3 w-3 mr-1' />
            {statusT("converted")}
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };
  const supabase = createClient();
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(
    null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDetailDialog = (request: RepairRequest) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };

  const openStatusDialog = (request: RepairRequest, action: string) => {
    setSelectedRequest(request);
    setDialogAction(action);
    setAdminNotes(request.admin_notes || "");
    setIsStatusDialogOpen(true);
  };

  const handleSubmitStatusChange = async () => {
    if (!selectedRequest || !dialogAction) return;

    setIsSubmitting(true);
    try {
      await handleStatusChange(selectedRequest.id, dialogAction, adminNotes);
      setIsStatusDialogOpen(false);
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle search input changes with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Fetch repair requests (wrapped in useCallback to avoid dependency issues)
  const fetchRepairRequests = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("repair_requests")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply status filter if selected
      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      // Apply search filter if there's a search term
      if (searchTerm) {
        query = query.or(
          `device_name.ilike.%${searchTerm}%,device_brand.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,problem_description.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setRepairRequests(data as RepairRequest[]);
    } catch (error) {
      console.error("Error fetching repair requests:", error);
      toast.error(t("fetchError"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, supabase, t]);

  // Handle status change
  const handleStatusChange = async (
    id: number,
    status: string,
    notes?: string
  ) => {
    try {
      const updateData: any = { status };
      if (notes) {
        updateData.admin_notes = notes;
        updateData.updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("repair_requests")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success(t("statusUpdated"));
      fetchRepairRequests();
    } catch (error) {
      console.error("Error updating repair request:", error);
      toast.error(t("updateError"));
      throw error;
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRepairRequests();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [fetchRepairRequests]);

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </div>

          <div className='flex flex-col md:flex-row items-end md:items-center gap-2 w-full md:w-auto'>
            {/* Search input */}
            <div className='relative w-full md:w-[250px]'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder={t("search.placeholder")}
                value={searchTerm}
                onChange={handleSearchChange}
                className='pl-8'
              />
            </div>

            <div className='flex items-center gap-2'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='text-sm'>
                    {statusFilter
                      ? t(`filters.${statusFilter}`)
                      : t("filters.all")}
                    <ChevronDown className='ml-2 h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                    {t("filters.all")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                    {t("filters.pending")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("approved")}>
                    {t("filters.approved")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>
                    {t("filters.rejected")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("converted")}
                  >
                    {t("filters.converted")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant='outline'
                size='icon'
                onClick={() => {
                  setSearchTerm("");
                  fetchRepairRequests();
                }}
              >
                <RefreshCw className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='flex justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
          </div>
        ) : repairRequests.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            {searchTerm
              ? t("search.noResults", { term: searchTerm })
              : statusFilter
              ? t("noRequests")
              : t("noRequests")}
          </div>
        ) : (
          <div className='w-full overflow-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[80px]'>{t("table.id")}</TableHead>
                  <TableHead>{t("table.device")}</TableHead>
                  <TableHead>{t("table.customer")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.created")}</TableHead>
                  <TableHead className='w-[100px] text-right'>
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className='font-medium'>{request.id}</TableCell>
                    <TableCell>
                      <div>
                        <span className='font-medium'>
                          {request.device_name}
                        </span>
                        {request.device_brand && (
                          <div className='text-sm text-muted-foreground'>
                            {request.device_brand}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className='font-medium'>
                          {request.customer_email}
                        </span>
                        {request.customer_phone && (
                          <div className='text-sm text-muted-foreground'>
                            {request.customer_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon'>
                            <MoreHorizontal className='h-4 w-4' />
                            <span className='sr-only'>Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => openDetailDialog(request)}
                          >
                            {t("viewDetails")}
                          </DropdownMenuItem>
                          {request.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  openStatusDialog(request, "approved")
                                }
                              >
                                <CheckCircle className='mr-2 h-4 w-4 text-green-600' />
                                {t("updateStatus")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  openStatusDialog(request, "rejected")
                                }
                              >
                                <XCircle className='mr-2 h-4 w-4 text-red-600' />
                                {t("updateStatus")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  openStatusDialog(request, "converted")
                                }
                              >
                                <RefreshCw className='mr-2 h-4 w-4 text-blue-600' />
                                {t("convertToAppointment")}
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => openStatusDialog(request, "notes")}
                          >
                            <MessageSquare className='mr-2 h-4 w-4' />
                            {t("addNotes")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Request Details #{selectedRequest.id}</DialogTitle>
              <DialogDescription>
                Created{" "}
                {formatDistanceToNow(new Date(selectedRequest.created_at), {
                  addSuffix: true,
                })}
              </DialogDescription>
            </DialogHeader>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 py-4'>
              <div className='space-y-3'>
                <div>
                  <h4 className='text-sm font-medium text-gray-500'>
                    Device Information
                  </h4>
                  <div className='text-sm bg-gray-50 p-3 rounded-md mt-1'>
                    <p>
                      <span className='font-medium'>Device:</span>{" "}
                      {selectedRequest.device_name}
                    </p>
                    {selectedRequest.device_brand && (
                      <p>
                        <span className='font-medium'>Brand:</span>{" "}
                        {selectedRequest.device_brand}
                      </p>
                    )}
                    {selectedRequest.device_type && (
                      <p>
                        <span className='font-medium'>Type:</span>{" "}
                        {selectedRequest.device_type}
                      </p>
                    )}
                    {selectedRequest.device_color && (
                      <p>
                        <span className='font-medium'>Color:</span>{" "}
                        {selectedRequest.device_color}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className='text-sm font-medium text-gray-500'>
                    Customer Information
                  </h4>
                  <div className='text-sm bg-gray-50 p-3 rounded-md mt-1'>
                    <p>
                      <span className='font-medium'>Email:</span>{" "}
                      {selectedRequest.customer_email}
                    </p>
                    {selectedRequest.customer_phone && (
                      <p>
                        <span className='font-medium'>Phone:</span>{" "}
                        {selectedRequest.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <div>
                  <h4 className='text-sm font-medium text-gray-500'>
                    Problem Description
                  </h4>
                  <div className='text-sm bg-gray-50 p-3 rounded-md mt-1 whitespace-pre-wrap'>
                    {selectedRequest.problem_description}
                  </div>
                </div>

                {selectedRequest.admin_notes && (
                  <div>
                    <h4 className='text-sm font-medium text-gray-500'>
                      Admin Notes
                    </h4>
                    <div className='text-sm bg-blue-50 p-3 rounded-md mt-1 whitespace-pre-wrap'>
                      {selectedRequest.admin_notes}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className='text-sm font-medium text-gray-500'>Status</h4>
                  <div className='mt-1'>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsDetailDialogOpen(false)}
              >
                Close
              </Button>
              {selectedRequest.status === "pending" && (
                <>
                  <Button
                    variant='default'
                    className='bg-green-600 hover:bg-green-700'
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      openStatusDialog(selectedRequest, "approved");
                    }}
                  >
                    <CheckCircle className='h-4 w-4 mr-2' />
                    {t("updateStatus")}
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      openStatusDialog(selectedRequest, "rejected");
                    }}
                  >
                    <XCircle className='h-4 w-4 mr-2' />
                    {t("updateStatus")}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Status Update Dialog */}
      {selectedRequest && (
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogAction === "approved" && "Approve Request"}
                {dialogAction === "rejected" && "Reject Request"}
                {dialogAction === "converted" && "Convert to Appointment"}
                {dialogAction === "notes" && t("addNotes")}
              </DialogTitle>
              <DialogDescription>
                {dialogAction === "approved" &&
                  "Approve this repair request and add any notes."}
                {dialogAction === "rejected" &&
                  "Reject this repair request and provide a reason."}
                {dialogAction === "converted" &&
                  "Convert this repair request to a standard appointment."}
                {dialogAction === "notes" &&
                  "Add notes to this repair request."}
              </DialogDescription>
            </DialogHeader>

            <div className='py-2'>
              <Textarea
                placeholder={t("notesPlaceholder")}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className='min-h-[100px]'
              />
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsStatusDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitStatusChange}
                disabled={isSubmitting}
                variant={
                  dialogAction === "rejected" ? "destructive" : "default"
                }
              >
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                {dialogAction === "approved" && "Approve"}
                {dialogAction === "rejected" && "Reject"}
                {dialogAction === "converted" && "Convert"}
                {dialogAction === "notes" && t("saveChanges")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
