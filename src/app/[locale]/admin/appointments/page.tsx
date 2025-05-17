"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  ClipboardListIcon,
  PrinterIcon,
  PhoneIcon,
  SmartphoneIcon,
  FilterIcon,
  XIcon,
  CheckIcon,
  EditIcon,
  CalendarDaysIcon,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, isToday, isYesterday, addDays } from "date-fns";

type AppointmentData = {
  id: number;
  customer_name: string;
  device_name: string;
  problem_description: string;
  appointment_date: string;
  estimated_completion_date: string | null;
  status_name: string;
  status_color: string;
  phone: string;
  notes?: string;
  created_at: string;
};

type StatusOption = {
  id: number;
  name: string;
  color: string;
};

type DeviceOption = {
  id: number;
  name: string;
  series_name: string;
  type_name: string;
  brand_name: string;
};

type CustomerOption = {
  id: number;
  name: string;
  phone: string;
  email?: string;
};

export default function RepairAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    AppointmentData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [deviceOptions, setDeviceOptions] = useState<DeviceOption[]>([]);
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [selectedTab, setSelectedTab] = useState("all");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editAppointment, setEditAppointment] =
    useState<AppointmentData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // New appointment form state
  const [newAppointment, setNewAppointment] = useState({
    customer_id: "",
    device_id: "",
    problem_description: "",
    appointment_date: new Date().toISOString(),
    status_id: "",
    estimated_completion_date: addDays(new Date(), 3).toISOString(),
    notes: "",
  });
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isSearchCustomerOpen, setIsSearchCustomerOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  const supabase = createClient();

  // Fetch appointments and options data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch appointments
        const { data: appointmentsData, error: appointmentsError } =
          await supabase
            .from("repair_appointments")
            .select(
              `
            id,
            problem_description,
            appointment_date,
            estimated_completion_date,
            notes,
            created_at,
            customers (id, name, phone),
            devices (id, name, device_series(series_name), device_types(type_name), brands(brand_name)),
            repair_status (id, name, color)
          `
            )
            .order("appointment_date", { ascending: false });

        if (appointmentsError) throw appointmentsError;

        const formattedAppointments = appointmentsData.map((appointment) => ({
          id: appointment.id,
          customer_name: appointment.customers?.name || "Unknown customer",
          phone: appointment.customers?.phone || "No phone",
          device_name: `${appointment.devices?.brands?.brand_name || ""} ${
            appointment.devices?.name || "Unknown device"
          }`,
          problem_description: appointment.problem_description || "",
          appointment_date: appointment.appointment_date,
          estimated_completion_date: appointment.estimated_completion_date,
          status_name: appointment.repair_status?.name || "Unknown",
          status_color: appointment.repair_status?.color || "#999",
          notes: appointment.notes,
          created_at: appointment.created_at,
        }));

        setAppointments(formattedAppointments);
        setFilteredAppointments(formattedAppointments);

        // Fetch status options
        const { data: statusData } = await supabase
          .from("repair_status")
          .select("id, name, color");

        if (statusData) setStatusOptions(statusData);

        // Fetch device options
        const { data: deviceData } = await supabase
          .from("devices")
          .select(
            "id, name, device_series(series_name), device_types(type_name), brands(brand_name)"
          )
          .order("name");

        if (deviceData) {
          const formattedDevices = deviceData.map((device) => ({
            id: device.id,
            name: device.name,
            series_name: device.device_series?.series_name || "",
            type_name: device.device_types?.type_name || "",
            brand_name: device.brands?.brand_name || "",
          }));
          setDeviceOptions(formattedDevices);
        }

        // Fetch customer options
        const { data: customerData } = await supabase
          .from("customers")
          .select("id, name, phone, email")
          .order("name");

        if (customerData) setCustomerOptions(customerData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter appointments based on search query and selected tab/status
  useEffect(() => {
    let filtered = [...appointments];

    // Filter by tab
    if (selectedTab === "today") {
      filtered = filtered.filter((app) =>
        isToday(parseISO(app.appointment_date))
      );
    } else if (selectedTab === "upcoming") {
      filtered = filtered.filter(
        (app) =>
          parseISO(app.appointment_date) > new Date() &&
          !isToday(parseISO(app.appointment_date))
      );
    } else if (selectedTab === "past") {
      filtered = filtered.filter(
        (app) =>
          parseISO(app.appointment_date) < new Date() &&
          !isToday(parseISO(app.appointment_date))
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (app) => app.status_name.toLowerCase() === selectedStatus
      );
    }

    // Filter by search term
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.customer_name.toLowerCase().includes(query) ||
          app.device_name.toLowerCase().includes(query) ||
          app.problem_description.toLowerCase().includes(query) ||
          app.phone.toLowerCase().includes(query)
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchQuery, selectedStatus, selectedTab]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);

    if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a");
    }
  };

  // Handle status change
  const handleStatusChange = async (
    appointmentId: number,
    newStatusId: string
  ) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("repair_appointments")
        .update({ status_id: newStatusId })
        .eq("id", appointmentId);

      if (error) throw error;

      // Refresh appointment data
      const { data } = await supabase
        .from("repair_appointments")
        .select("*, customers(*), devices(*), repair_status(*)")
        .eq("id", appointmentId)
        .single();

      if (data) {
        // Update the appointments state
        setAppointments((prev) =>
          prev.map((app) =>
            app.id === appointmentId
              ? {
                  ...app,
                  status_name: data.repair_status?.name || app.status_name,
                  status_color: data.repair_status?.color || app.status_color,
                }
              : app
          )
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle adding a new appointment
  const handleAddAppointment = async () => {
    setIsUpdating(true);
    try {
      const { data, error } = await supabase
        .from("repair_appointments")
        .insert({
          customer_id: parseInt(newAppointment.customer_id),
          device_id: parseInt(newAppointment.device_id),
          problem_description: newAppointment.problem_description,
          appointment_date: newAppointment.appointment_date,
          status_id: parseInt(newAppointment.status_id),
          estimated_completion_date: newAppointment.estimated_completion_date,
          notes: newAppointment.notes,
        })
        .select();

      if (error) throw error;

      // Add the new appointment to the state
      if (data && data.length > 0) {
        const newAppointmentData = data[0];

        // Fetch the related data
        const { data: relatedData } = await supabase
          .from("repair_appointments")
          .select(
            `
            id,
            problem_description,
            appointment_date,
            estimated_completion_date,
            notes,
            created_at,
            customers (id, name, phone),
            devices (id, name, device_series(series_name), device_types(type_name), brands(brand_name)),
            repair_status (id, name, color)
          `
          )
          .eq("id", newAppointmentData.id)
          .single();

        if (relatedData) {
          const formattedAppointment = {
            id: relatedData.id,
            customer_name: relatedData.customers?.name || "Unknown customer",
            phone: relatedData.customers?.phone || "No phone",
            device_name: `${relatedData.devices?.brands?.brand_name || ""} ${
              relatedData.devices?.name || "Unknown device"
            }`,
            problem_description: relatedData.problem_description || "",
            appointment_date: relatedData.appointment_date,
            estimated_completion_date: relatedData.estimated_completion_date,
            status_name: relatedData.repair_status?.name || "Unknown",
            status_color: relatedData.repair_status?.color || "#999",
            notes: relatedData.notes,
            created_at: relatedData.created_at,
          };

          setAppointments((prev) => [formattedAppointment, ...prev]);
        }
      }

      // Reset form and close dialog
      setNewAppointment({
        customer_id: "",
        device_id: "",
        problem_description: "",
        appointment_date: new Date().toISOString(),
        status_id: "",
        estimated_completion_date: addDays(new Date(), 3).toISOString(),
        notes: "",
      });
      setIsNewDialogOpen(false);
    } catch (error) {
      console.error("Error adding appointment:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle adding new customer
  const handleAddCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        // Add to customer options
        const newCustomerData = {
          id: data[0].id,
          name: data[0].name,
          phone: data[0].phone,
          email: data[0].email,
        };

        setCustomerOptions((prev) => [...prev, newCustomerData]);

        // Set as selected customer
        setNewAppointment((prev) => ({
          ...prev,
          customer_id: String(data[0].id),
        }));

        // Reset and close
        setNewCustomer({ name: "", phone: "", email: "" });
        setShowNewCustomerForm(false);
      }
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  };

  // Handle updating an appointment
  const handleUpdateAppointment = async () => {
    if (!editAppointment) return;

    setIsUpdating(true);
    try {
      // Find the original appointment to get needed IDs
      const appointmentToUpdate = appointments.find(
        (app) => app.id === editAppointment.id
      );
      if (!appointmentToUpdate) throw new Error("Appointment not found");

      // Get the status ID
      const statusId = statusOptions.find(
        (status) => status.name === editAppointment.status_name
      )?.id;

      const { error } = await supabase
        .from("repair_appointments")
        .update({
          problem_description: editAppointment.problem_description,
          appointment_date: editAppointment.appointment_date,
          estimated_completion_date: editAppointment.estimated_completion_date,
          status_id: statusId,
          notes: editAppointment.notes,
        })
        .eq("id", editAppointment.id);

      if (error) throw error;

      // Update in local state
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === editAppointment.id ? editAppointment : app
        )
      );

      setIsEditDialogOpen(false);
      setEditAppointment(null);
    } catch (error) {
      console.error("Error updating appointment:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter customers for search
  const filteredCustomers = useCallback(() => {
    if (!customerSearchTerm) return customerOptions.slice(0, 10);

    return customerOptions
      .filter(
        (customer) =>
          customer.name
            .toLowerCase()
            .includes(customerSearchTerm.toLowerCase()) ||
          customer.phone.includes(customerSearchTerm)
      )
      .slice(0, 10);
  }, [customerOptions, customerSearchTerm]);

  return (
    <div className='container mx-auto p-4'>
      <Card>
        <CardHeader>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
            <div>
              <CardTitle className='text-2xl'>Repair Appointments</CardTitle>
              <CardDescription>
                Manage repair appointments and track progress
              </CardDescription>
            </div>

            <div className='flex flex-col sm:flex-row gap-2 w-full md:w-auto'>
              <div className='relative w-full sm:w-64'>
                <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-500' />
                <Input
                  placeholder='Search appointments...'
                  className='pl-8'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button onClick={() => setIsNewDialogOpen(true)}>
                <PlusIcon className='h-4 w-4 mr-1' />
                New Appointment
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className='space-y-4'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <Tabs
                value={selectedTab}
                onValueChange={setSelectedTab}
                className='w-full sm:w-auto'
              >
                <TabsList>
                  <TabsTrigger value='all'>All</TabsTrigger>
                  <TabsTrigger value='today'>Today</TabsTrigger>
                  <TabsTrigger value='upcoming'>Upcoming</TabsTrigger>
                  <TabsTrigger value='past'>Past</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className='flex items-center gap-2 w-full sm:w-auto'>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className='w-full sm:w-40'>
                    <SelectValue placeholder='Filter by status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Statuses</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem
                        key={status.id}
                        value={status.name.toLowerCase()}
                      >
                        <div className='flex items-center'>
                          <div
                            className='w-3 h-3 rounded-full mr-2'
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className='flex justify-center items-center py-12'>
                <Loader2Icon className='h-8 w-8 animate-spin text-gray-400' />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className='text-center py-12'>
                <ClipboardListIcon className='mx-auto h-12 w-12 text-gray-300' />
                <h3 className='mt-4 text-lg font-medium'>
                  No appointments found
                </h3>
                <p className='mt-2 text-sm text-gray-500'>
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className='rounded-md border overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className='font-medium'>
                            {appointment.customer_name}
                          </div>
                          <div className='text-sm text-gray-500 flex items-center'>
                            <PhoneIcon className='h-3 w-3 mr-1' />
                            {appointment.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center'>
                            <SmartphoneIcon className='h-4 w-4 mr-2 text-gray-400' />
                            <span>{appointment.device_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='max-w-xs truncate'>
                            {appointment.problem_description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={statusOptions
                              .find(
                                (status) =>
                                  status.name === appointment.status_name
                              )
                              ?.id.toString()}
                            onValueChange={(value) =>
                              handleStatusChange(appointment.id, value)
                            }
                            disabled={isUpdating}
                          >
                            <SelectTrigger className='w-32'>
                              <SelectValue>
                                <div className='flex items-center gap-2'>
                                  <div
                                    className='w-2 h-2 rounded-full'
                                    style={{
                                      backgroundColor: appointment.status_color,
                                    }}
                                  ></div>
                                  <span>{appointment.status_name}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem
                                  key={status.id}
                                  value={status.id.toString()}
                                >
                                  <div className='flex items-center gap-2'>
                                    <div
                                      className='w-2 h-2 rounded-full'
                                      style={{ backgroundColor: status.color }}
                                    ></div>
                                    <span>{status.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-col'>
                            <span className='text-sm'>
                              {formatDate(appointment.appointment_date)}
                            </span>
                            {appointment.estimated_completion_date && (
                              <span className='text-xs text-gray-500'>
                                Est. completion:{" "}
                                {format(
                                  parseISO(
                                    appointment.estimated_completion_date
                                  ),
                                  "MMM d"
                                )}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditAppointment(appointment);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <EditIcon className='h-4 w-4 mr-2' />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <PrinterIcon className='h-4 w-4 mr-2' />
                                Print Receipt
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className='text-red-600'>
                                <XIcon className='h-4 w-4 mr-2' />
                                Cancel
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
          </div>
        </CardContent>
      </Card>

      {/* New Appointment Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new repair appointment for a customer
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='customer'>Customer</Label>
                {showNewCustomerForm ? (
                  <div className='space-y-2'>
                    <Input
                      id='new-customer-name'
                      placeholder='Customer name'
                      value={newCustomer.name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, name: e.target.value })
                      }
                    />
                    <Input
                      id='new-customer-phone'
                      placeholder='Phone number'
                      value={newCustomer.phone}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          phone: e.target.value,
                        })
                      }
                    />
                    <Input
                      id='new-customer-email'
                      placeholder='Email address (optional)'
                      value={newCustomer.email}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          email: e.target.value,
                        })
                      }
                    />
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        onClick={handleAddCustomer}
                        disabled={!newCustomer.name || !newCustomer.phone}
                      >
                        Save Customer
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setShowNewCustomerForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center gap-2'>
                    <Popover
                      open={isSearchCustomerOpen}
                      onOpenChange={setIsSearchCustomerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant='outline'
                          className='justify-between w-full'
                          disabled={showNewCustomerForm}
                        >
                          {newAppointment.customer_id
                            ? customerOptions.find(
                                (c) =>
                                  c.id.toString() === newAppointment.customer_id
                              )?.name
                            : "Select customer"}
                          <SearchIcon className='ml-2 h-4 w-4 text-gray-400' />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='p-0 w-80'>
                        <div className='p-2'>
                          <Input
                            placeholder='Search customer by name or phone...'
                            value={customerSearchTerm}
                            onChange={(e) =>
                              setCustomerSearchTerm(e.target.value)
                            }
                          />
                        </div>
                        <div className='max-h-64 overflow-auto'>
                          {filteredCustomers().map((customer) => (
                            <button
                              key={customer.id}
                              className='w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center'
                              onClick={() => {
                                setNewAppointment({
                                  ...newAppointment,
                                  customer_id: customer.id.toString(),
                                });
                                setIsSearchCustomerOpen(false);
                              }}
                            >
                              <div>
                                <div>{customer.name}</div>
                                <div className='text-sm text-gray-500'>
                                  {customer.phone}
                                </div>
                              </div>
                              {newAppointment.customer_id ===
                                customer.id.toString() && (
                                <CheckIcon className='h-4 w-4 text-green-500' />
                              )}
                            </button>
                          ))}
                          {filteredCustomers().length === 0 && (
                            <div className='p-4 text-center text-gray-500'>
                              No customers found
                            </div>
                          )}
                        </div>
                        <div className='p-2 border-t'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='w-full'
                            onClick={() => {
                              setShowNewCustomerForm(true);
                              setIsSearchCustomerOpen(false);
                            }}
                          >
                            <PlusIcon className='h-4 w-4 mr-1' />
                            Add New Customer
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor='device'>Device</Label>
                <Select
                  value={newAppointment.device_id}
                  onValueChange={(value) =>
                    setNewAppointment({ ...newAppointment, device_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select device' />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceOptions.map((device) => (
                      <SelectItem key={device.id} value={device.id.toString()}>
                        {device.brand_name} {device.name}
                        {device.series_name && `(${device.series_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='appointment-date'>Appointment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-full justify-start text-left font-normal'
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {newAppointment.appointment_date
                        ? format(
                            parseISO(newAppointment.appointment_date),
                            "PPP p"
                          )
                        : "Select date and time"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={parseISO(newAppointment.appointment_date)}
                      onSelect={(date) => {
                        if (date) {
                          const currentDate = parseISO(
                            newAppointment.appointment_date
                          );
                          const newDate = new Date(date);
                          newDate.setHours(currentDate.getHours());
                          newDate.setMinutes(currentDate.getMinutes());

                          setNewAppointment({
                            ...newAppointment,
                            appointment_date: newDate.toISOString(),
                          });
                        }
                      }}
                      initialFocus
                    />
                    <div className='p-3 border-t'>
                      <div className='flex items-center justify-between'>
                        <Label>Time</Label>
                        <div className='flex items-center space-x-2'>
                          <Select
                            value={parseISO(newAppointment.appointment_date)
                              .getHours()
                              .toString()}
                            onValueChange={(hour) => {
                              const date = parseISO(
                                newAppointment.appointment_date
                              );
                              date.setHours(parseInt(hour));
                              setNewAppointment({
                                ...newAppointment,
                                appointment_date: date.toISOString(),
                              });
                            }}
                          >
                            <SelectTrigger className='w-16'>
                              <SelectValue placeholder='Hour' />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }).map((_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i.toString().padStart(2, "0")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span>:</span>
                          <Select
                            value={parseISO(newAppointment.appointment_date)
                              .getMinutes()
                              .toString()}
                            onValueChange={(minute) => {
                              const date = parseISO(
                                newAppointment.appointment_date
                              );
                              date.setMinutes(parseInt(minute));
                              setNewAppointment({
                                ...newAppointment,
                                appointment_date: date.toISOString(),
                              });
                            }}
                          >
                            <SelectTrigger className='w-16'>
                              <SelectValue placeholder='Min' />
                            </SelectTrigger>
                            <SelectContent>
                              {[0, 15, 30, 45].map((i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i.toString().padStart(2, "0")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor='status'>Status</Label>
                <Select
                  value={newAppointment.status_id}
                  onValueChange={(value) =>
                    setNewAppointment({ ...newAppointment, status_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        <div className='flex items-center gap-2'>
                          <div
                            className='w-2 h-2 rounded-full'
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor='problem'>Problem Description</Label>
              <Textarea
                id='problem'
                placeholder='Describe the issue with the device...'
                value={newAppointment.problem_description}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    problem_description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor='notes'>Additional Notes</Label>
              <Textarea
                id='notes'
                placeholder='Any additional notes or instructions...'
                value={newAppointment.notes}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    notes: e.target.value,
                  })
                }
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsNewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAppointment}
              disabled={
                !newAppointment.customer_id ||
                !newAppointment.device_id ||
                !newAppointment.problem_description ||
                !newAppointment.status_id ||
                isUpdating
              }
            >
              {isUpdating && (
                <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
              )}
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Update the details of this repair appointment
            </DialogDescription>
          </DialogHeader>

          {editAppointment && (
            <div className='grid gap-4 py-4'>
              <div className='flex flex-col gap-1'>
                <div className='text-sm font-medium'>Customer</div>
                <div className='text-base'>{editAppointment.customer_name}</div>
                <div className='text-sm text-gray-500'>
                  {editAppointment.phone}
                </div>
              </div>

              <div className='flex flex-col gap-1'>
                <div className='text-sm font-medium'>Device</div>
                <div className='text-base'>{editAppointment.device_name}</div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='edit-status'>Status</Label>
                  <Select
                    value={
                      statusOptions
                        .find((s) => s.name === editAppointment.status_name)
                        ?.id.toString() || ""
                    }
                    onValueChange={(value) => {
                      const status = statusOptions.find(
                        (s) => s.id.toString() === value
                      );
                      if (status) {
                        setEditAppointment({
                          ...editAppointment,
                          status_name: status.name,
                          status_color: status.color,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem
                          key={status.id}
                          value={status.id.toString()}
                        >
                          <div className='flex items-center gap-2'>
                            <div
                              className='w-2 h-2 rounded-full'
                              style={{ backgroundColor: status.color }}
                            />
                            {status.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='edit-appointment-date'>
                    Appointment Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-full justify-start text-left font-normal'
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {format(
                          parseISO(editAppointment.appointment_date),
                          "PPP p"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0'>
                      <Calendar
                        mode='single'
                        selected={parseISO(editAppointment.appointment_date)}
                        onSelect={(date) => {
                          if (date) {
                            const currentDate = parseISO(
                              editAppointment.appointment_date
                            );
                            const newDate = new Date(date);
                            newDate.setHours(currentDate.getHours());
                            newDate.setMinutes(currentDate.getMinutes());

                            setEditAppointment({
                              ...editAppointment,
                              appointment_date: newDate.toISOString(),
                            });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor='edit-problem'>Problem Description</Label>
                <Textarea
                  id='edit-problem'
                  value={editAppointment.problem_description}
                  onChange={(e) =>
                    setEditAppointment({
                      ...editAppointment,
                      problem_description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor='edit-notes'>Notes</Label>
                <Textarea
                  id='edit-notes'
                  value={editAppointment.notes || ""}
                  onChange={(e) =>
                    setEditAppointment({
                      ...editAppointment,
                      notes: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateAppointment} disabled={isUpdating}>
              {isUpdating && (
                <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
              )}
              Update Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
