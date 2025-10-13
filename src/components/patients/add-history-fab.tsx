'use client';
import { Button } from "@/components/ui/button";
import { ClipboardPlus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/accessible-dialog"
import { ConsultationForm, ConsultationFormValues } from "./consultation-form";
import type { Patient } from "@/lib/types";
import { addConsultation } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
  

export function AddHistoryFab({ userId, onFormSubmit }: { userId: string; onFormSubmit: (values: ConsultationFormValues) => void }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const handleFormSubmit = async (values: ConsultationFormValues) => {
        try {
            await addConsultation({
                userId: userId,
                date: values.date,
                doctor: values.doctor,
                type: values.type,
                notes: values.notes,
                prescriptions: values.prescriptions,
                reports: values.reports,
                labResults: values.labResults,
            });
            
            toast({
                title: "Consulta Guardada",
                description: `Nueva consulta de tipo "${values.type}" ha sido guardada exitosamente.`,
            });
            
            onFormSubmit(values);
            setOpen(false);
        } catch (error) {
            console.error('Error saving consultation:', error);
            toast({
                title: "Error",
                description: "No se pudo guardar la consulta. Por favor, inténtalo de nuevo.",
                variant: "destructive",
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-400/90 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-[0_0_20px_rgba(58,109,255,0.4),0_0_40px_rgba(186,85,211,0.3),0_0_60px_rgba(255,105,180,0.2)] animate-pulse-slow">
                    <ClipboardPlus className="h-8 w-8" />
                    <span className="sr-only">Agregar Historial Médico</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Añadir Nueva Consulta</DialogTitle>
                <DialogDescription>
                    Rellena los detalles para el nuevo registro de consulta.
                </DialogDescription>
                </DialogHeader>
                <ConsultationForm userId={userId} onFormSubmit={handleFormSubmit} />
            </DialogContent>
        </Dialog>
    )
}

// Add to tailwind.config.ts animation if not present
// animation: {
//     'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
// }
