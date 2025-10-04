
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
import type { Patient, User } from "@/lib/types";
import { useEffect, useState } from "react";
import { getPatients, getUsers } from "@/lib/actions";
import { Textarea } from "../ui/textarea";
import { useAuth } from "../layout/auth-provider";

const formSchema = z.object({
  patientId: z.string({ required_error: "Debe seleccionar un paciente." }),
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
  const [doctors, setDoctors] = useState<User[]>([]);

  const isPatient = currentUser?.role === 'patient';

  useEffect(() => {
    async function fetchData() {
        const [patientsData, usersData] = await Promise.all([
            getPatients(),
            getUsers()
        ]);
        setPatients(patientsData);
        setDoctors(usersData.filter(u => u.role === 'doctor'));
    }
    fetchData();
  }, []);

  const form = useForm<AddAppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        patientId: isPatient ? currentUser?.patientId : undefined,
        date: new Date(),
        reason: "",
    },
  })

  // Set patientId for patient user after form is initialized
  useEffect(() => {
      if (isPatient && currentUser?.patientId) {
          form.setValue('patientId', currentUser.patientId);
      }
  }, [isPatient, currentUser, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
        {!isPatient && (
            <FormField
                control={form.control}
                name="patientId"
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
                        {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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
                    {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
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
                <Popover>
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
                    onSelect={field.onChange}
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
