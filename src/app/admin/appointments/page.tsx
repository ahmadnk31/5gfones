"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  InfoIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: number;
  appointment_date: string;
  estimated_completion_date: string | null;
  actual_completion_date: string | null;
  problem_description: string;
  diagnosis: string | null;
  technician_notes: string | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  device_model: {
    id: number;
    name: string;
  };
  status: {
    id: number;
    name: string;
    color: string;
  };
  items: Array<{
    id: number;
    product: {
      id: number;
      name: string;
    };
    quantity: number;
    unit_price: number;
    is_service: boolean;
  }>;
  total_amount: number | null;
  created_at: string;
}

interface RepairStatus {
  id: number;
  name: string;
  description: string | null;
  color: string;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [repairStatuses, setRepairStatuses] = useState<RepairStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] =
    useState<Appointment | null>(null);
  const [editFormData, setEditFormData] = useState({
    status_id: "",
    diagnosis: "",
    technician_notes: "",
    estimated_completion_date: "",
    actual_completion_date: "",
  });
  const [statusFilter, setStatusFilter] = useState<number | "all">("all");

  const itemsPerPage = 10;

  const fetchAppointments = async (
    page = 1,
    statusId: number | "all" = "all"
  ) => {
    setIsLoading(true);
    try {
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;

      let query = supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          estimated_completion_date,
          actual_completion_date,
          problem_description,
          diagnosis,
          technician_notes,
          customer:customer_id(id, name, email, phone),
          device_model:device_model_id(id, name),
          status:status_id(id, name, color),
          total_amount,
          created_at,
          items:appointment_items(
            id,
            product:product_id(id, name),
            quantity,
            unit_price,
            is_service
          )
        `,
          { count: "exact" }
        )
        .order("appointment_date", { ascending: false });

      if (statusId !== "all") {
        query = query.eq("status_id", statusId);
      }

      if (searchQuery) {
        // Search in problem description, or customer name/email if available
        query = query.or(
          `problem_description.ilike.%${searchQuery}%,customer.name.ilike.%${searchQuery}%,customer.email.ilike.%${searchQuery}%,diagnosis.ilike.%${searchQuery}%`
        );
      }

      // Add pagination
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      setAppointments(data || []);
      if (count) {
        setTotalPages(Math.ceil(count / itemsPerPage));
      }
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRepairStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from("repair_statuses")
        .select("id, name, description, color")
        .order("id");

      if (error) {
        throw error;
      }

      setRepairStatuses(data || []);
    } catch (err: any) {
      console.error("Error fetching repair statuses:", err);
    }
  };

  useEffect(() => {
    fetchRepairStatuses();
    fetchAppointments(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAppointments(1, statusFilter);
  };

  const handleStatusFilterChange = (value: string) => {
    const newStatusFilter = value === "all" ? "all" : parseInt(value);
    setStatusFilter(newStatusFilter);
    setCurrentPage(1);
  };

  const openViewDialog = (appointment: Appointment) => {
    setCurrentAppointment(appointment);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (appointment: Appointment) => {
    setCurrentAppointment(appointment);
    setEditFormData({
      status_id: appointment.status.id.toString(),
      diagnosis: appointment.diagnosis || "",
      technician_notes: appointment.technician_notes || "",
      estimated_completion_date: appointment.estimated_completion_date || "",
      actual_completion_date: appointment.actual_completion_date || "",
    });
    setIsEditDialogOpen(true);
  };

  const calculateTotal = (appointment: Appointment) => {
    return appointment.items.reduce((sum, item) => {
      return sum + item.unit_price * item.quantity;
    }, 0);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAppointment) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status_id: parseInt(editFormData.status_id),
          diagnosis: editFormData.diagnosis,
          technician_notes: editFormData.technician_notes,
          estimated_completion_date:
            editFormData.estimated_completion_date || null,
          actual_completion_date: editFormData.actual_completion_date || null,
        })
        .eq("id", currentAppointment.id);

      if (error) {
        throw error;
      }

      // Refresh the appointments list
      await fetchAppointments(currentPage, statusFilter);
      setIsEditDialogOpen(false);
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      alert(`Failed to update appointment: ${err.message}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  const getStatusBadgeStyle = (color: string) => {
    return {
      backgroundColor: `${color}20`, // 20% opacity
      color: color,
    };
  };

  const getCustomerName = (appointment: Appointment) => {
    if (appointment.customer) {
      return appointment.customer.name;
    }

    // Try to extract guest info from diagnosis
    if (appointment.diagnosis && appointment.diagnosis.includes("Name:")) {
      const nameMatch = appointment.diagnosis.match(/Name: ([^,]+)/);
      if (nameMatch) {
        return `${nameMatch[1].trim()} (Guest)`;
      }
    }

    return "Guest Customer";
  };

  const getCustomerContact = (appointment: Appointment) => {
    if (appointment.customer) {
      return appointment.customer.email || appointment.customer.phone;
    }

    // Try to extract guest info from diagnosis
    if (appointment.diagnosis) {
      const emailMatch = appointment.diagnosis.match(/Email: ([^,]+)/);
      const phoneMatch = appointment.diagnosis.match(/Phone: ([^,]+)/);

      if (emailMatch) {
        return emailMatch[1].trim();
      } else if (phoneMatch) {
        return phoneMatch[1].trim();
      }
    }

    return "-";
  };

  return (
    <div>
      <Card>
        <CardHeader className='flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0'>
          <div>
            <CardTitle>Repair Appointments</CardTitle>
            <CardDescription>
              Manage and track repair appointments
            </CardDescription>
          </div>
          <div className='flex items-center space-x-2'>
            <form onSubmit={handleSearch} className='flex space-x-2'>
              <div className='relative'>
                <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  type='search'
                  placeholder='Search appointments...'
                  className='pl-8 w-[200px] sm:w-[300px]'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type='submit' variant='secondary' size='sm'>
                Search
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <div className='mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center'>
            <div className='mb-2 sm:mb-0'>
              <Select
                value={statusFilter === "all" ? "all" : statusFilter.toString()}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  {repairStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.id.toString()}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className='h-4 w-4' />
                <span className='sr-only'>Previous Page</span>
              </Button>
              <span className='text-sm'>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className='h-4 w-4' />
                <span className='sr-only'>Next Page</span>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className='flex justify-center py-8'>
              <Loader2Icon className='animate-spin h-6 w-6' />
            </div>
          ) : error ? (
            <div className='bg-red-50 text-red-800 p-4 rounded-md'>{error}</div>
          ) : appointments.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              No appointments found
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className='font-medium'>
                        #{appointment.id}
                      </TableCell>
                      <TableCell>
                        {formatDate(appointment.appointment_date)}
                      </TableCell>
                      <TableCell>
                        <div className='font-medium'>
                          {getCustomerName(appointment)}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {getCustomerContact(appointment)}
                        </div>
                      </TableCell>
                      <TableCell>{appointment.device_model.name}</TableCell>
                      <TableCell>
                        <div
                          className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
                          style={getStatusBadgeStyle(appointment.status.color)}
                        >
                          {appointment.status.name}
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <EllipsisVerticalIcon className='h-4 w-4' />
                              <span className='sr-only'>Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() => openViewDialog(appointment)}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(appointment)}
                            >
                              Update Status
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
      </Card>

      {/* View Appointment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Appointment #{currentAppointment?.id}</DialogTitle>
            <DialogDescription>
              Created on {formatDate(currentAppointment?.created_at || "")}
            </DialogDescription>
          </DialogHeader>

          {currentAppointment && (
            <div className='space-y-6'>
              <div className='grid gap-6 md:grid-cols-2'>
                <div>
                  <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                    Appointment Details
                  </h3>
                  <div className='bg-muted/50 p-4 rounded-md space-y-2'>
                    <div>
                      <span className='text-sm text-muted-foreground'>
                        Date:
                      </span>
                      <div>
                        {formatDate(currentAppointment.appointment_date)}
                      </div>
                    </div>
                    <div>
                      <span className='text-sm text-muted-foreground'>
                        Status:
                      </span>
                      <div>
                        <div
                          className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
                          style={getStatusBadgeStyle(
                            currentAppointment.status.color
                          )}
                        >
                          {currentAppointment.status.name}
                        </div>
                      </div>
                    </div>
                    {currentAppointment.estimated_completion_date && (
                      <div>
                        <span className='text-sm text-muted-foreground'>
                          Est. Completion:
                        </span>
                        <div>
                          {formatDate(
                            currentAppointment.estimated_completion_date
                          )}
                        </div>
                      </div>
                    )}
                    {currentAppointment.actual_completion_date && (
                      <div>
                        <span className='text-sm text-muted-foreground'>
                          Completed On:
                        </span>
                        <div>
                          {formatDate(
                            currentAppointment.actual_completion_date
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                    Customer Information
                  </h3>
                  <div className='bg-muted/50 p-4 rounded-md'>
                    <div className='font-medium'>
                      {getCustomerName(currentAppointment)}
                    </div>
                    {currentAppointment.customer ? (
                      <>
                        <div>{currentAppointment.customer.email}</div>
                        <div>{currentAppointment.customer.phone}</div>
                      </>
                    ) : currentAppointment.diagnosis ? (
                      <div className='text-sm text-muted-foreground'>
                        {currentAppointment.diagnosis.replace(
                          /Name:|Email:|Phone:/g,
                          (match) => `\n${match}`
                        )}
                      </div>
                    ) : (
                      <div className='text-sm text-muted-foreground'>
                        No customer information available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                  Device Information
                </h3>
                <div className='bg-muted/50 p-4 rounded-md'>
                  <div>
                    <span className='font-medium'>Model:</span>{" "}
                    {currentAppointment.device_model.name}
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                  Problem Description
                </h3>
                <div className='bg-muted/50 p-4 rounded-md whitespace-pre-wrap'>
                  {currentAppointment.problem_description}
                </div>
              </div>

              {currentAppointment.diagnosis && (
                <div>
                  <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                    Diagnosis
                  </h3>
                  <div className='bg-muted/50 p-4 rounded-md whitespace-pre-wrap'>
                    {currentAppointment.diagnosis}
                  </div>
                </div>
              )}

              {currentAppointment.technician_notes && (
                <div>
                  <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                    Technician Notes
                  </h3>
                  <div className='bg-muted/50 p-4 rounded-md whitespace-pre-wrap'>
                    {currentAppointment.technician_notes}
                  </div>
                </div>
              )}

              <div>
                <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                  Services & Parts
                </h3>
                {currentAppointment.items.length > 0 ? (
                  <div className='bg-muted/50 rounded-md overflow-hidden'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className='text-right'>Price</TableHead>
                          <TableHead className='text-center'>Qty</TableHead>
                          <TableHead className='text-right'>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentAppointment.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product.name}</TableCell>
                            <TableCell>
                              {item.is_service ? "Service" : "Part"}
                            </TableCell>
                            <TableCell className='text-right'>
                              ${item.unit_price.toFixed(2)}
                            </TableCell>
                            <TableCell className='text-center'>
                              {item.quantity}
                            </TableCell>
                            <TableCell className='text-right'>
                              ${(item.unit_price * item.quantity).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <tfoot>
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className='text-right font-medium'
                          >
                            Total
                          </TableCell>
                          <TableCell className='text-right font-medium'>
                            ${calculateTotal(currentAppointment).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </tfoot>
                    </Table>
                  </div>
                ) : (
                  <div className='bg-muted/50 p-4 rounded-md text-center text-muted-foreground'>
                    No services or parts added
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                if (currentAppointment) {
                  openEditDialog(currentAppointment);
                }
              }}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Appointment #{currentAppointment?.id}
            </DialogTitle>
            <DialogDescription>
              Update the status and details for this repair
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit}>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='status'>Repair Status</Label>
                <Select
                  value={editFormData.status_id}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, status_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    {repairStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='diagnosis'>Diagnosis</Label>
                <Textarea
                  id='diagnosis'
                  rows={3}
                  placeholder='Enter diagnosis details'
                  value={editFormData.diagnosis}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      diagnosis: e.target.value,
                    })
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='technician_notes'>Technician Notes</Label>
                <Textarea
                  id='technician_notes'
                  rows={3}
                  placeholder='Enter technician notes'
                  value={editFormData.technician_notes}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      technician_notes: e.target.value,
                    })
                  }
                />
              </div>

              <div className='grid gap-4 grid-cols-1 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='estimated_completion_date'>
                    Estimated Completion Date
                  </Label>
                  <Input
                    id='estimated_completion_date'
                    type='datetime-local'
                    value={editFormData.estimated_completion_date}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        estimated_completion_date: e.target.value,
                      })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='actual_completion_date'>
                    Actual Completion Date
                  </Label>
                  <Input
                    id='actual_completion_date'
                    type='datetime-local'
                    value={editFormData.actual_completion_date}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        actual_completion_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter className='mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
