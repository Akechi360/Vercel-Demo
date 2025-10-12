
import { create } from 'zustand';
import type { Appointment } from '@/lib/types';

interface AppointmentState {
  appointments: Appointment[];
  isInitialized: boolean;
  initializeAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  removeAppointment: (appointmentId: string) => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  isInitialized: false,
  initializeAppointments: (appointments) => set({ appointments, isInitialized: true }),
  addAppointment: (appointment) => set((state) => ({
    appointments: [appointment, ...state.appointments]
  })),
  updateAppointment: (updatedAppointment) => set((state) => ({
    appointments: state.appointments.map(appointment => 
      appointment.id === updatedAppointment.id ? updatedAppointment : appointment
    )
  })),
  removeAppointment: (appointmentId) => set((state) => ({
    appointments: state.appointments.filter(appointment => appointment.id !== appointmentId)
  })),
}));
