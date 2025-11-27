
'use client';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ClipboardPlus, CalendarPlus, FileDown } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/accessible-dialog";
import { ConsultationForm, ConsultationFormValues } from "./consultation-form";
import type { Patient, Appointment, Consultation, IpssScore } from "@/lib/types";
import { addConsultation } from "@/lib/actions";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { addUroVitalLogo } from '@/lib/pdf-helpers';

interface QuickActionsProps {
    patient: Patient & { companyName?: string };
    upcomingAppointments: Appointment[];
    latestConsultations: Consultation[];
    latestIpss: IpssScore | null;
    latestPsa: { value: string; date: string; unit?: string } | null;
}

export function QuickActions({ patient, upcomingAppointments, latestConsultations, latestIpss, latestPsa }: QuickActionsProps) {
    const { toast } = useToast();
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const handleAddHistory = async (values: ConsultationFormValues) => {
        try {
            console.log('📝 Iniciando guardado de consulta desde QuickActions...', {
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
                userId: patient.id,
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
                    const extendedAttachment = attachment as any; // Usamos any para evitar problemas de tipos

                    console.log('📎 QuickActions - Procesando reporte:', {
                        title: report.title,
                        hasAttachment: true,
                        attachmentName: attachment.name,
                        hasBase64: !!extendedAttachment.base64Content,
                        base64Length: extendedAttachment.base64Content?.length || 0
                    });

                    return {
                        title: report.title || 'Sin título',
                        notes: (report as any).notes || '',
                        // Mapear datos del attachment
                        archivoNombre: attachment.name,
                        archivoTipo: attachment.type,
                        archivoTamaño: attachment.size,
                        archivoUrl: attachment.url,
                        archivoContenido: extendedAttachment.base64Content, // ⭐ CRÍTICO: contenido base64
                    };
                });
            }) || [];

            console.log('✅ QuickActions - Reportes mapeados:', {
                totalReports: reports.length,
                reportsWithContent: reports.filter((r: any) => r.archivoContenido).length
            });

            // Usar submissionValues con reportes correctamente mapeados
            await addConsultation({
                ...submissionValues,
                reports: reports, // ⭐ Usar reportes mapeados
            });

            console.log('✅ Consulta guardada exitosamente desde QuickActions');

            toast({
                title: "Consulta Guardada",
                description: `Nueva consulta de tipo "${values.type}" ha sido guardada exitosamente.`,
            });

            setIsHistoryModalOpen(false);
        } catch (error) {
            console.error('Error saving consultation:', error);
            toast({
                title: "Error",
                description: "No se pudo guardar la consulta. Por favor, inténtalo de nuevo.",
                variant: "destructive",
            });
        }
    }

    const handleAddAppointment = () => {
        toast({
            title: "Acción Simulada: Agendar Cita",
            description: `Modal de cita para ${patient.name} abierto.`,
        });
        setIsAppointmentModalOpen(false);
    }

    const handleExportSummary = () => {
        const doc = new jsPDF();
        const margin = 14;

        // Add UroVital logo
        addUroVitalLogo(doc);

        // Título y fecha
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Resumen del Paciente", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150);
        doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy')}`, doc.internal.pageSize.getWidth() - margin, 20, { align: "right" });

        let y = 35;

        // Datos del Paciente
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40);
        doc.text("Información del Paciente", margin, y);
        y += 8;

        const formatBloodType = (bloodType: string) => {
            const bloodTypeMap: Record<string, string> = {
                'A_POSITIVE': 'A+',
                'A_NEGATIVE': 'A-',
                'B_POSITIVE': 'B+',
                'B_NEGATIVE': 'B-',
                'AB_POSITIVE': 'AB+',
                'AB_NEGATIVE': 'AB-',
                'O_POSITIVE': 'O+',
                'O_NEGATIVE': 'O-',
            };
            return bloodTypeMap[bloodType] || bloodType;
        };

        autoTable(doc, {
            startY: y,
            theme: 'plain',
            body: [
                ['Nombre:', patient.name],
                ['Edad:', `${patient.age} años`],
                ['Género:', patient.gender],
                ['Grupo Sanguíneo:', patient.bloodType ? formatBloodType(patient.bloodType) : 'No disponible'],
                ['Teléfono:', patient.contact.phone || 'No disponible'],
                ['Email:', patient.contact.email || 'No disponible'],
                ['Empresa:', patient.companyName || 'Paciente Particular'],
            ],
            styles: {
                cellPadding: { top: 1, right: 0, bottom: 1, left: 0 },
                fontSize: 11
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40 },
                1: { fontStyle: 'normal' },
            }
        });
        y = (doc as any).lastAutoTable.finalY + 10;

        // Indicadores Clave
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Indicadores Clave", margin, y);
        y += 8;

        autoTable(doc, {
            startY: y,
            theme: 'striped',
            head: [['Indicador', 'Valor', 'Fecha/Info']],
            body: [
                ['Último PSA', latestPsa ? `${latestPsa.value} ${latestPsa.unit || 'ng/mL'}` : 'Sin resultados', latestPsa?.date ? format(new Date(latestPsa.date), 'dd/MM/yyyy') : 'N/A'],
                ['Último IPSS', latestIpss ? `${latestIpss.score} (${latestIpss.category})` : 'N/A', latestIpss ? format(new Date(latestIpss.date), 'dd/MM/yyyy') : 'N/A'],
                ['Próxima Cita', upcomingAppointments.length > 0 ? format(new Date(upcomingAppointments[0].date), 'dd/MM/yyyy HH:mm') : 'Ninguna', upcomingAppointments.length > 0 ? upcomingAppointments[0].reason : 'N/A'],
            ],
            headStyles: { fillColor: [58, 109, 255] },
        });
        y = (doc as any).lastAutoTable.finalY + 10;

        // Historial Reciente
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Consultas Recientes (Últimas 5)", margin, y);
        y += 8;

        if (latestConsultations.length > 0) {
            autoTable(doc, {
                startY: y,
                theme: 'grid',
                head: [['Fecha', 'Tipo', 'Doctor', 'Notas (resumen)']],
                body: latestConsultations.slice(0, 5).map(c => [
                    format(new Date(c.date), 'dd/MM/yyyy'),
                    c.type,
                    c.doctor,
                    c.notes.substring(0, 50) + (c.notes.length > 50 ? '...' : '')
                ]),
            });
        } else {
            doc.setFont("helvetica", "normal");
            doc.text("No hay consultas recientes.", margin, y);
        }

        const filename = `resumen_${patient.name.replace(/\s/g, '_')}.pdf`;
        doc.save(filename);

        toast({
            title: "Exportación Completada",
            description: `Se ha descargado el resumen de ${patient.name}.`,
        });
        setIsExportModalOpen(false);
    }

    return (
        <>
            <div className="flex justify-end">
                <Button
                    onClick={() => setIsExportModalOpen(true)}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                    size="lg"
                >
                    <FileDown className="h-5 w-5" />
                    Descargar Resumen (PDF)
                </Button>
            </div>

            {/* Modals */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Añadir Nueva Consulta</DialogTitle>
                        <DialogDescription>Rellena los detalles para el nuevo registro de consulta para {patient.name}.</DialogDescription>
                    </DialogHeader>
                    <ConsultationForm userId={patient.id} onFormSubmit={handleAddHistory} />
                </DialogContent>
            </Dialog>

            <Dialog open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agendar Nueva Cita</DialogTitle>
                        <DialogDescription>Programar una nueva cita para {patient.name}.</DialogDescription>
                    </DialogHeader>
                    {/* Placeholder for appointment form */}
                    <div className="py-8 text-center text-muted-foreground">
                        <p>El formulario para agendar citas aparecerá aquí.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsAppointmentModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddAppointment}>Guardar Cita</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Exportar Resumen del Paciente</DialogTitle>
                        <DialogDescription>
                            Se generará un documento PDF con el resumen de {patient.name}. ¿Deseas continuar?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsExportModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleExportSummary}>Sí, Exportar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
