// Types for the repair system
export interface DeviceModel {
  id: number;
  name: string | null;
  series?: {
    name: string | null;
    device_type?: {
      name: string | null;
      brand?: {
        name: string | null;
      };
    };
  };
}

export interface AppointmentItem {
  id: number;
  is_service: boolean;
  service_description: string | null;
  product?: {
    name: string | null;
    description: string | null;
  } | null;
}

export interface AppointmentData {
  id: number;
  status_id: number;
  appointment_date: string;
  actual_completion_date: string | null;
  estimated_completion_date: string | null;
  technician_notes: string | null;
  problem_description: string | null;
  device: DeviceModel | null;
  appointment_items: AppointmentItem[];
}

export interface RepairStatus {
  name: string;
  description: string | null;
}

export interface RepairResult {
  id: string;
  status: 'pending' | 'in_progress' | 'completed';
  date: string;
  device: string;
  service: string;
  estimatedCompletion?: string;
  completionDate?: string;
  technicianNotes?: string;
}

export type RepairStatusMap = Record<number, 'pending' | 'in_progress' | 'completed'>;
