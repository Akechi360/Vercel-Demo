'use client';
import { useRouter } from 'next/navigation';
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
import { ConsultationForm, ConsultationFormValues, ReportAttachment } from "./consultation-form";
import type { Patient } from "@/lib/types";
import { addConsultation } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import { useAuth } from "@/components/layout/auth-provider";
import { UserRole } from "@/lib/types";

// Extend the ReportAttachment type to include base64Content
type ExtendedReportAttachment = ReportAttachment & {
  base64Content?: string;
  notes?: string;
};
  

export function AddHistoryFab({ userId, onFormSubmit }: { userId: string; onFormSubmit: (values: ConsultationFormValues) => void }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const { currentUser } = useAuth();
    const router = useRouter();

    const handleFormSubmit = async (values: ConsultationFormValues) => {
        try {
            console.log('📝 Iniciando guardado de consulta...', {
                hasReports: !!values.reports?.length,
                reportsCount: values.reports?.length || 0
            });

            // Ensure date is properly formatted as ISO string
            const formattedDate = values.date instanceof Date ? values.date.toISOString() : 
                               typeof values.date === 'string' ? values.date : 
                               new Date().toISOString();
            
            const submissionValues = {
                ...values,
                date: formattedDate,
                userId: userId,
            };
            
            console.log('🔄 AddHistoryFab - handleFormSubmit called with:', {
                userId: userId,
                currentUser: currentUser?.name,
                values: submissionValues
            });

            // Validar que el usuario esté autenticado
            if (!currentUser) {
                throw new Error('Usuario no autenticado. Debe iniciar sesión para crear consultas.');
            }

            // Validar que userId esté presente
            if (!userId || userId.trim() === '') {
                throw new Error('ID del paciente es requerido para crear la consulta');
            }

            // Crear contexto de usuario para la función addConsultation
            const userContext = {
                userId: currentUser.userId,
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role as UserRole,
                currentTime: new Date(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            // Preparar reportes con mapeo correcto de attachments
            const reports = values.reports?.flatMap(report => {
                // Si no hay attachments, devolver un reporte sin archivo
                if (!report.attachments || report.attachments.length === 0) {
                    return [{
                        title: report.title || 'Sin título',
                        notes: (report as any).notes || '',
                    }];
                }

                // Mapear cada attachment a un reporte separado
                return report.attachments.map(attachment => {
                    const extendedAttachment = attachment as ExtendedReportAttachment;
                    
                    console.log('📎 Procesando reporte:', {
                        title: report.title,
                        hasAttachment: true,
                        attachmentName: attachment.name,
                        hasBase64: !!extendedAttachment.base64Content,
                        base64Length: extendedAttachment.base64Content?.length || 0
                    });
                    
                    return {
                        title: report.title || 'Sin título',
                        notes: (report as any).notes || '',
                        // Mapear datos del attachment con optional chaining
                        archivoNombre: attachment?.name || undefined,
                        archivoTipo: attachment?.type || undefined,
                        archivoTamaño: attachment?.size || undefined,
                        archivoUrl: attachment?.url || undefined,
                        archivoContenido: extendedAttachment?.base64Content || undefined,
                    } as const;
                });
            }) || [];

            console.log('✅ Reportes mapeados:', {
                totalReports: reports.length,
                reportsWithContent: reports.filter((r: any) => 'archivoContenido' in r && r.archivoContenido).length
            });

            // Usar submissionValues con reportes correctamente mapeados
            await addConsultation({
                ...submissionValues,
                prescriptions: values.prescriptions,
                reports: reports, // ⭐ Usar reportes mapeados
                labResults: values.labResults,
            }, userContext);
            
            console.log('✅ Consulta guardada exitosamente');
            
            toast({
                title: "Consulta Guardada",
                description: `Nueva consulta de tipo "${values.type}" ha sido guardada exitosamente.`,
            });
            
            onFormSubmit(values);
            setOpen(false);
            // Revalidar el cache de Next.js para refrescar datos de BD
            router.refresh();
        } catch (error) {
            console.error('Error saving consultation:', error);
            toast({
                title: "Error",
                description: "No se pudo guardar la consulta. Por favor, inténtalo de nuevo.",
                variant: "destructive",
            });
        }
    }

    // State to track if component is mounted (for SSR/SSG)
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const dialogContent = (
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
    );

    // Only render the portal on the client side
    return mounted ? createPortal(dialogContent, document.body) : null;
}

// Add to tailwind.config.ts animation if not present
// animation: {
//     'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
// }
