
import { create } from 'zustand';
import type { Appointment } from '@/lib/types';

interface AppointmentState {
  appointments: Appointment[];
  isInitialized: boolean;
  initializeAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  isInitialized: false,
  initializeAppointments: (appointments) => set({ appointments, isInitialized: true }),
  addAppointment: (appointment) => set((state) => ({
    appointments: [appointment, ...state.appointments]
  })),
}));
