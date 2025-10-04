
'use client';
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { AddAppointmentForm, type AddAppointmentFormValues } from "./add-appointment-form";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addAppointment } from "@/lib/actions";
import { useAppointmentStore } from "@/lib/store/appointment-store";
  
export function AddAppointmentFab() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const { addAppointment: addAppointmentToStore } = useAppointmentStore();

    const handleFormSubmit = async (values: AddAppointmentFormValues) => {
        try {
            const newAppointmentData = {
                ...values,
                date: values.date.toISOString(),
            }
            const newAppointment = await addAppointment(newAppointmentData);
            addAppointmentToStore(newAppointment);
            toast({
                title: "Cita Agendada",
                description: `La cita para el paciente ha sido agendada.`,
            });
            setOpen(false);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo agendar la cita.',
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-400/90 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-[0_0_20px_rgba(58,109,255,0.4),0_0_40px_rgba(186,85,211,0.3),0_0_60px_rgba(255,105,180,0.2)] animate-pulse-slow">
                    <CalendarPlus className="h-8 w-8" />
                    <span className="sr-only">Agendar Nueva Cita</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>Agendar Nueva Cita</DialogTitle>
                <DialogDescription>
                    Rellena los detalles para programar una nueva cita.
                </DialogDescription>
                </DialogHeader>
                <AddAppointmentForm onFormSubmit={handleFormSubmit} />
            </DialogContent>
        </Dialog>
    )
}
