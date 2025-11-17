
'use client';
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Patient, User, Doctor } from "@/lib/types";
import { useEffect, useState } from "react";
import { getPatients, getUsers, getDoctors } from "@/lib/actions";
import { Textarea } from "../ui/textarea";
import { useAuth } from "../layout/auth-provider";
import { ROLES } from "@/lib/types";

const formSchema = z.object({
  userId: z.string({ required_error: "Debe seleccionar un paciente." }),
  doctorId: z.string({ required_error: "Debe seleccionar un doctor." }),
  date: z.date({ required_error: "Se requiere una fecha." }),
  reason: z.string().min(5, "El motivo debe tener al menos 5 caracteres."),
})

export type AddAppointmentFormValues = z.infer<typeof formSchema>;


interface AddAppointmentFormProps {
    onFormSubmit: (values: AddAppointmentFormValues) => void;
}

export function AddAppointmentForm({ onFormSubmit }: AddAppointmentFormProps) {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState({
    patients: true,
    doctors: true
  });
  const [error, setError] = useState<{
    patients: string | null;
    doctors: string | null;
  }>({ patients: null, doctors: null });
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isPatient = currentUser?.role === ROLES.USER;

  // Fetch patients and doctors
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only fetch patients if not a patient user
        if (!isPatient) {
          try {
            const patientsData = await getPatients();
            setPatients(Array.isArray(patientsData) ? patientsData : []);
            setError(prev => ({ ...prev, patients: null }));
          } catch (err) {
            console.error('Error loading patients:', err);
            setError(prev => ({ ...prev, patients: 'Error al cargar los pacientes' }));
          } finally {
            setIsLoading(prev => ({ ...prev, patients: false }));
          }
        } else {
          setIsLoading(prev => ({ ...prev, patients: false }));
        }

        // Always fetch doctors
        try {
          const doctorsData = await getDoctors();
          // Mapear datos al formato correcto
          const formattedDoctors = Array.isArray(doctorsData) 
            ? doctorsData.map(doctor => ({
                id: doctor.id,
                userId: doctor.userId || doctor.id, // Usar userId si existe, sino usar id
                nombre: doctor.nombre || doctor.name || 'Sin nombre',
                especialidad: doctor.especialidad || doctor.doctorInfo?.especialidad || 'General',
                area: doctor.area || doctor.doctorInfo?.area || '',
                contacto: doctor.contacto || doctor.phone || '',
                avatarUrl: doctor.avatarUrl
              }))
            : [];
          
          console.log('Doctores cargados:', formattedDoctors);
          setDoctors(formattedDoctors);
          setError(prev => ({ ...prev, doctors: null }));
        } catch (err) {
          console.error('Error loading doctors:', err);
          setError(prev => ({ ...prev, doctors: 'Error al cargar los doctores' }));
          setDoctors([]);
        } finally {
          setIsLoading(prev => ({ ...prev, doctors: false }));
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    fetchData();
  }, [isPatient]);

  const form = useForm<AddAppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        userId: isPatient ? currentUser?.userId || undefined : undefined,
        date: new Date(),
        reason: "",
    },
  })

  // Set userId for patient user after form is initialized
  useEffect(() => {
      if (isPatient && currentUser?.userId) {
          form.setValue('userId', currentUser.userId);
      }
  }, [isPatient, currentUser, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
        {!isPatient && (
            <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Paciente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un paciente" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading.patients ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">Cargando pacientes...</div>
                      ) : error.patients ? (
                        <div className="px-4 py-2 text-sm text-destructive">{error.patients}</div>
                      ) : patients.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">No hay pacientes disponibles</div>
                      ) : (
                        patients.map(patient => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}
        <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Doctor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccione un doctor" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoading.doctors ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">Cargando doctores...</div>
                  ) : error.doctors ? (
                    <div className="px-4 py-2 text-sm text-destructive">{error.doctors}</div>
                  ) : doctors.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">No hay doctores disponibles</div>
                  ) : (
                    doctors.map(doctor => {
                      const displayName = doctor.nombre || `Doctor ${doctor.userId?.substring(0, 4) || 'Doc'}`;
                      const specialty = doctor.especialidad ? ` - ${doctor.especialidad}` : '';
                      return (
                        <SelectItem key={doctor.userId || doctor.id} value={doctor.userId || doctor.id}>
                          {displayName}{specialty}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
            <FormItem className="flex flex-col">
                <FormLabel>Fecha y Hora</FormLabel>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                    <FormControl>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                        )}
                    >
                        {field.value ? format(field.value, "PPP") : <span>Elige una fecha</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                </PopoverContent>
                </Popover>
                <FormMessage />
            </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Motivo de la Cita</FormLabel>
                <FormControl>
                <Textarea placeholder="Ej: Seguimiento post-operatorio" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Agendando...' : 'Agendar Cita'}
            </Button>
        </div>
      </form>
    </Form>
  )
}
