
'use client';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ClipboardPlus, CalendarPlus, FileDown } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConsultationForm, ConsultationFormValues } from "./consultation-form";
import type { Patient, Appointment, Consultation, IpssScore } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface QuickActionsProps {
    patient: Patient & { companyName?: string };
    upcomingAppointments: Appointment[];
    latestConsultations: Consultation[];
    latestIpss: IpssScore | null;
    latestPsa: { value: string; date: string; };
}

export function QuickActions({ patient, upcomingAppointments, latestConsultations, latestIpss, latestPsa }: QuickActionsProps) {
    const { toast } = useToast();
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const handleAddHistory = (values: ConsultationFormValues) => {
        toast({
            title: "Acción Simulada: Agregar Historia",
            description: `Nueva consulta de tipo "${values.type}" guardada.`,
        });
        setIsHistoryModalOpen(false);
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

        autoTable(doc, {
            startY: y,
            theme: 'plain',
            body: [
                ['Nombre:', patient.name],
                ['Edad:', `${patient.age} años`],
                ['Género:', patient.gender],
                ['Grupo Sanguíneo:', patient.bloodType || 'No disponible'],
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
                ['Último PSA', `${latestPsa.value} ng/mL`, latestPsa.date ? format(new Date(latestPsa.date), 'dd/MM/yyyy') : 'N/A'],
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start text-left h-auto py-3 bg-card/50" onClick={() => setIsHistoryModalOpen(true)}>
                    <ClipboardPlus className="mr-4 h-6 w-6 text-primary" />
                    <div>
                        <p className="font-semibold">Agregar Historia</p>
                        <p className="text-xs text-muted-foreground">Nueva consulta, nota o resultado.</p>
                    </div>
                </Button>
                <Button variant="outline" className="justify-start text-left h-auto py-3 bg-card/50" onClick={() => setIsAppointmentModalOpen(true)}>
                    <CalendarPlus className="mr-4 h-6 w-6 text-primary" />
                    <div>
                        <p className="font-semibold">Agendar Cita</p>
                        <p className="text-xs text-muted-foreground">Programar una nueva cita.</p>
                    </div>
                </Button>
                <Button variant="outline" className="justify-start text-left h-auto py-3 bg-card/50" onClick={() => setIsExportModalOpen(true)}>
                    <FileDown className="mr-4 h-6 w-6 text-primary" />
                    <div>
                        <p className="font-semibold">Exportar Resumen</p>
                        <p className="text-xs text-muted-foreground">Descargar un resumen en PDF.</p>
                    </div>
                </Button>
            </div>

            {/* Modals */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Añadir Nueva Consulta</DialogTitle>
                        <DialogDescription>Rellena los detalles para el nuevo registro de consulta para {patient.name}.</DialogDescription>
                    </DialogHeader>
                    <ConsultationForm onFormSubmit={handleAddHistory} />
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
