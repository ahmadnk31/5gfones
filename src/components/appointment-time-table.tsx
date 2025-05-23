"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface TimeSlot {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_appointments: number;
  is_available: boolean;
  service_type: string;
}

interface TimeSlotExclusion {
  exclusion_date: string;
}

interface AvailableSlot {
  date: Date;
  time: string;
  timeSlotId: number;
}

interface AppointmentTimeTableProps {
  onSelectDateTime: (date: Date, time: string) => void;
  serviceType?: string;
  daysToShow?: number;
}

export default function AppointmentTimeTable({
  onSelectDateTime,
  serviceType = "repair",
  daysToShow = 14,
}: AppointmentTimeTableProps) {
  const t = useTranslations("common");
  const supabase = createClient();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [exclusions, setExclusions] = useState<TimeSlotExclusion[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTimes, setAvailableTimes] = useState<AvailableSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch time slots and exclusions
  useEffect(() => {
    const fetchTimeSlotData = async () => {
      setLoading(true);
      try {
        // Fetch time slots
        const { data: timeSlotData, error: timeSlotError } = await supabase
          .from("time_slots")
          .select("*")
          .eq("is_available", true)
          .eq("service_type", serviceType)
          .order("start_time");

        if (timeSlotError) throw timeSlotError;
        setTimeSlots(timeSlotData || []);

        // Fetch exclusion dates
        const { data: exclusionData, error: exclusionError } = await supabase
          .from("time_slot_exclusions")
          .select("exclusion_date");

        if (exclusionError) throw exclusionError;
        setExclusions(exclusionData || []);
      } catch (error) {
        console.error("Error fetching time slot data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlotData();
  }, [supabase, serviceType]);

  // Generate available dates
  useEffect(() => {
    const now = new Date();
    const dates: Date[] = [];
    const exclusionDates = exclusions.map(e => e.exclusion_date.substring(0, 10));

    for (let i = 1; i <= daysToShow; i++) {
      const date = addDays(now, i);
      const dateString = format(date, "yyyy-MM-dd");
      
      // Check if the date is excluded
      if (!exclusionDates.includes(dateString)) {
        // Check if there are time slots available for this day of week
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        const hasSlotsForDay = timeSlots.some(slot => slot.day_of_week === dayOfWeek);
        
        if (hasSlotsForDay) {
          dates.push(date);
        }
      }
    }

    setAvailableDates(dates);
    
    // Select the first available date by default if there are any
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [timeSlots, exclusions, daysToShow, selectedDate]);

  // Generate available times for selected date
  useEffect(() => {
    if (!selectedDate) return;

    // Get the day of week for the selected date
    const dayOfWeek = selectedDate.getDay();
    
    // Filter time slots for the selected day
    const slotsForDay = timeSlots.filter(slot => slot.day_of_week === dayOfWeek);
    
    // Create available time slots
    const times: AvailableSlot[] = slotsForDay.map(slot => ({
      date: selectedDate,
      time: slot.start_time.substring(0, 5),
      timeSlotId: slot.id
    }));
    
    setAvailableTimes(times);
    
    // Reset selected time when date changes
    setSelectedTime(null);
  }, [selectedDate, timeSlots]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    
    if (selectedDate) {
      // Combine date and time and call the parent handler
      onSelectDateTime(selectedDate, time);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className="text-center py-6">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2 text-gray-500">{t("noAvailableSlots")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm">{t("selectDate")}</h3>
        <div className="flex flex-wrap gap-2">
          {availableDates.map((date, index) => (
            <Button
              key={index}
              variant={isSameDay(date, selectedDate || new Date()) ? "default" : "outline"}
              className="flex flex-col px-3 py-2 h-auto"
              onClick={() => handleDateSelect(date)}
            >
              <span className="text-xs">{format(date, "EEE")}</span>
              <span className="text-lg font-bold">{format(date, "d")}</span>
              <span className="text-xs">{format(date, "MMM")}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && availableTimes.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-medium text-sm">{t("selectTime")}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {availableTimes.map((slot, index) => (
              <Button
                key={index}
                variant={selectedTime === slot.time ? "default" : "outline"}
                className="flex items-center gap-1"
                onClick={() => handleTimeSelect(slot.time)}
              >
                <Clock className="h-3 w-3" />
                <span>{slot.time}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : selectedDate ? (
        <div className="text-center py-4">
          <p className="text-gray-500">{t("noTimeSlotsForDate")}</p>
        </div>
      ) : null}
    </div>
  );
}
