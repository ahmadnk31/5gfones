"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AdminLayout } from "@/components/admin-layout";
import { format } from "date-fns";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PlusCircle,
  Trash,
  PencilIcon,
  ClockIcon,
  CalendarIcon,
  AlertTriangleIcon,
  CalendarDaysIcon,
  CalendarOffIcon,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form schema for time slot validation
const timeSlotFormSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Please enter a valid time in 24-hour format (HH:MM)",
  }),
  end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Please enter a valid time in 24-hour format (HH:MM)",
  }),
  max_appointments: z.number().int().min(1),
  is_available: z.boolean().default(true),
  service_type: z.string(),
});

// Form schema for exclusion date validation
const exclusionFormSchema = z.object({
  exclusion_date: z.string().min(1, {
    message: "Please select a date",
  }),
  reason: z.string().min(1, {
    message: "Please provide a reason for this exclusion",
  }),
});

// Type definitions based on the schemas
type TimeSlot = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_appointments: number;
  is_available: boolean;
  service_type: string;
  created_at: string;
  updated_at: string;
};

type TimeSlotExclusion = {
  id: number;
  exclusion_date: string;
  reason: string;
  created_at: string;
  updated_at: string;
};

export default function TimeSlotsPage() {
  const t = useTranslations("admin");
  const supabase = createClient();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [exclusions, setExclusions] = useState<TimeSlotExclusion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [isExclusionDialogOpen, setIsExclusionDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [editingExclusion, setEditingExclusion] = useState<TimeSlotExclusion | null>(null);
  const [activeTab, setActiveTab] = useState("slots");

  // Forms initialization
  const timeSlotForm = useForm<z.infer<typeof timeSlotFormSchema>>({
    resolver: zodResolver(timeSlotFormSchema),
    defaultValues: {
      day_of_week: 1, // Monday
      start_time: "10:00",
      end_time: "18:00",
      max_appointments: 1,
      is_available: true,
      service_type: "repair",
    },
  });

  const exclusionForm = useForm<z.infer<typeof exclusionFormSchema>>({
    resolver: zodResolver(exclusionFormSchema),
    defaultValues: {
      exclusion_date: format(new Date(), "yyyy-MM-dd"),
      reason: "",
    },
  });

  // Fetch time slots from the database
  const fetchTimeSlots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast.error("Failed to load time slots");
    } finally {
      setLoading(false);
    }
  };

  // Fetch exclusion dates from the database
  const fetchExclusions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("time_slot_exclusions")
        .select("*")
        .order("exclusion_date", { ascending: true });

      if (error) throw error;
      setExclusions(data || []);
    } catch (error) {
      console.error("Error fetching exclusions:", error);
      toast.error("Failed to load exclusion dates");
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchTimeSlots();
    fetchExclusions();
  }, []);

  // Handle time slot form submission
  const onSubmitTimeSlot = async (values: z.infer<typeof timeSlotFormSchema>) => {
    const {data:{user}} = await supabase.auth.getUser();
    try {
      const { 
        day_of_week, 
        start_time, 
        end_time, 
        max_appointments, 
        is_available, 
        service_type 
      } = values;

      const slotData = {
        day_of_week,
        start_time,
        end_time,
        max_appointments,
        is_available,
        service_type,
        user_uid: user?.id,
      };

      let result;

      if (editingSlot) {
        // Update existing time slot
        result = await supabase
          .from("time_slots")
          .update(slotData)
          .eq("id", editingSlot.id);
        
        if (result.error) throw result.error;
        toast.success("Time slot updated successfully");
      } else {
        // Create new time slot
        result = await supabase
          .from("time_slots")
          .insert([slotData]);
        
        if (result.error) throw result.error;
        toast.success("Time slot created successfully");
      }

      // Reset form and close dialog
      resetSlotForm();
      fetchTimeSlots();
    } catch (error) {
      console.error("Error saving time slot:", error);
      toast.error("Failed to save time slot");
    }
  };

  // Handle exclusion form submission
  const onSubmitExclusion = async (values: z.infer<typeof exclusionFormSchema>) => {
    try {
      const { exclusion_date, reason } = values;

      const exclusionData = {
        exclusion_date,
        reason,
      };

      let result;

      if (editingExclusion) {
        // Update existing exclusion
        result = await supabase
          .from("time_slot_exclusions")
          .update(exclusionData)
          .eq("id", editingExclusion.id);
        
        if (result.error) throw result.error;
        toast.success("Exclusion date updated successfully");
      } else {
        // Create new exclusion
        result = await supabase
          .from("time_slot_exclusions")
          .insert([exclusionData]);
        
        if (result.error) throw result.error;
        toast.success("Exclusion date created successfully");
      }

      // Reset form and close dialog
      resetExclusionForm();
      fetchExclusions();
    } catch (error) {
      console.error("Error saving exclusion date:", error);
      toast.error("Failed to save exclusion date");
    }
  };

  // Reset time slot form and dialog state
  const resetSlotForm = () => {
    timeSlotForm.reset({
      day_of_week: 1,
      start_time: "09:00",
      end_time: "17:00",
      max_appointments: 1,
      is_available: true,
      service_type: "repair",
    });
    setEditingSlot(null);
    setIsSlotDialogOpen(false);
  };

  // Reset exclusion form and dialog state
  const resetExclusionForm = () => {
    exclusionForm.reset({
      exclusion_date: format(new Date(), "yyyy-MM-dd"),
      reason: "",
    });
    setEditingExclusion(null);
    setIsExclusionDialogOpen(false);
  };

  // Set up form for editing time slot
  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot);
    timeSlotForm.reset({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time.substring(0, 5),
      end_time: slot.end_time.substring(0, 5),
      max_appointments: slot.max_appointments,
      is_available: slot.is_available,
      service_type: slot.service_type,
    });
    setIsSlotDialogOpen(true);
  };

  // Set up form for editing exclusion
  const handleEditExclusion = (exclusion: TimeSlotExclusion) => {
    setEditingExclusion(exclusion);
    exclusionForm.reset({
      exclusion_date: exclusion.exclusion_date.substring(0, 10),
      reason: exclusion.reason,
    });
    setIsExclusionDialogOpen(true);
  };

  // Handle time slot deletion
  const handleDeleteSlot = async (id: number) => {
    if (confirm(t("confirmDelete"))) {
      try {
        const { error } = await supabase.from("time_slots").delete().eq("id", id);
        if (error) throw error;
        toast.success("Time slot deleted successfully");
        fetchTimeSlots();
      } catch (error) {
        console.error("Error deleting time slot:", error);
        toast.error("Failed to delete time slot");
      }
    }
  };

  // Handle exclusion deletion
  const handleDeleteExclusion = async (id: number) => {
    if (confirm(t("confirmDelete"))) {
      try {
        const { error } = await supabase.from("time_slot_exclusions").delete().eq("id", id);
        if (error) throw error;
        toast.success("Exclusion date deleted successfully");
        fetchExclusions();
      } catch (error) {
        console.error("Error deleting exclusion date:", error);
        toast.error("Failed to delete exclusion date");
      }
    }
  };

  // Get day name from day number
  const getDayName = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day];
  };

  return (
    <div>
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("timeSlots")}</CardTitle>
              <CardDescription>{t("manageTimeSlotsDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="slots">
                <ClockIcon className="mr-2 h-4 w-4" />
                {t("timeSlots")}
              </TabsTrigger>
              <TabsTrigger value="exclusions">
                <CalendarOffIcon className="mr-2 h-4 w-4" />
                {t("exclusions")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="slots">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setIsSlotDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t("addTimeSlot")}
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>{t("noTimeSlotsFound")}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsSlotDialogOpen(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t("addTimeSlot")}
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">{t("id")}</TableHead>
                        <TableHead>{t("day")}</TableHead>
                        <TableHead>{t("time")}</TableHead>
                        <TableHead>{t("maxAppointments")}</TableHead>
                        <TableHead>{t("serviceType")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                        <TableHead className="w-[100px]">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeSlots.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell>{slot.id}</TableCell>
                          <TableCell>{getDayName(slot.day_of_week)}</TableCell>
                          <TableCell>
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </TableCell>
                          <TableCell>{slot.max_appointments}</TableCell>
                          <TableCell className="capitalize">{slot.service_type}</TableCell>
                          <TableCell>
                            <Badge
                              variant={slot.is_available ? "success" : "secondary"}
                              className="capitalize"
                            >
                              {slot.is_available ? t("available") : t("unavailable")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditSlot(slot)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-red-500"
                                onClick={() => handleDeleteSlot(slot.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="exclusions">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setIsExclusionDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t("addExclusion")}
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              ) : exclusions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarOffIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>{t("noExclusionsFound")}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsExclusionDialogOpen(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t("addExclusion")}
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">{t("id")}</TableHead>
                        <TableHead>{t("date")}</TableHead>
                        <TableHead>{t("reason")}</TableHead>
                        <TableHead className="w-[100px]">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exclusions.map((exclusion) => (
                        <TableRow key={exclusion.id}>
                          <TableCell>{exclusion.id}</TableCell>
                          <TableCell>
                            {new Date(exclusion.exclusion_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{exclusion.reason}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditExclusion(exclusion)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-red-500"
                                onClick={() => handleDeleteExclusion(exclusion.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Time Slot Dialog */}
      <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? t("editTimeSlot") : t("addTimeSlot")}
            </DialogTitle>
            <DialogDescription>
              {editingSlot ? t("editTimeSlotDesc") : t("addTimeSlotDesc")}
            </DialogDescription>
          </DialogHeader>

          <Form {...timeSlotForm}>
            <form onSubmit={timeSlotForm.handleSubmit(onSubmitTimeSlot)} className="space-y-6">
              <FormField
                control={timeSlotForm.control}
                name="day_of_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dayOfWeek")}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectDay")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">{t("sunday")}</SelectItem>
                        <SelectItem value="1">{t("monday")}</SelectItem>
                        <SelectItem value="2">{t("tuesday")}</SelectItem>
                        <SelectItem value="3">{t("wednesday")}</SelectItem>
                        <SelectItem value="4">{t("thursday")}</SelectItem>
                        <SelectItem value="5">{t("friday")}</SelectItem>
                        <SelectItem value="6">{t("saturday")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={timeSlotForm.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("startTime")}</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={timeSlotForm.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("endTime")}</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={timeSlotForm.control}
                  name="max_appointments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("maxAppointments")}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={timeSlotForm.control}
                  name="service_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("serviceType")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectServiceType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="repair">{t("repair")}</SelectItem>
                          <SelectItem value="consultation">{t("consultation")}</SelectItem>
                          <SelectItem value="trade-in">{t("tradeIn")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={timeSlotForm.control}
                name="is_available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("isAvailable")}</FormLabel>
                      <FormDescription>
                        {t("isAvailableDesc")}
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetSlotForm}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit">
                  {editingSlot ? t("updateTimeSlot") : t("createTimeSlot")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Exclusion Dialog */}
      <Dialog open={isExclusionDialogOpen} onOpenChange={setIsExclusionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingExclusion ? t("editExclusion") : t("addExclusion")}
            </DialogTitle>
            <DialogDescription>
              {editingExclusion ? t("editExclusionDesc") : t("addExclusionDesc")}
            </DialogDescription>
          </DialogHeader>

          <Form {...exclusionForm}>
            <form onSubmit={exclusionForm.handleSubmit(onSubmitExclusion)} className="space-y-6">
              <FormField
                control={exclusionForm.control}
                name="exclusion_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("date")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={exclusionForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("reason")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("reasonPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetExclusionForm}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit">
                  {editingExclusion ? t("updateExclusion") : t("createExclusion")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
