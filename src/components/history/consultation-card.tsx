'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Pill, Microscope, Download, FileDown, Eye } from "lucide-react"
import { format } from "date-fns"
import type { Consultation, Patient } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { getPatientById } from "@/lib/actions";
import { useEffect, useState }from "react";
import { FileViewerModal } from "./file-viewer-modal";

interface ConsultationCardProps {
    consultation: Consultation;
}

export function ConsultationCard({ consultation }: ConsultationCardProps) {
    const { toast } = useToast();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);

    // ✅ VALIDACIÓN CRÍTICA - Verificar que consultation sea válido
    const isValidConsultation = consultation && consultation.id;
    
    if (!isValidConsultation) {
        console.error('❌ ConsultationCard - consultation inválido:', { consultation });
    }

    console.log('🔍 ConsultationCard - consultation recibida:', {
        id: consultation?.id,
        userId: consultation?.userId,
        userIdType: typeof consultation?.userId,
        date: consultation?.date,
        doctor: consultation?.doctor,
        type: consultation?.type
    });

    useEffect(() => {
        if (!isValidConsultation) return;
        // ✅ VALIDACIÓN CRÍTICA - Verificar que consultation.userId no sea undefined/null
        if (!consultation.userId || typeof consultation.userId !== 'string') {
            console.error('❌ ConsultationCard - consultation.userId inválido:', { 
                userId: consultation.userId, 
                type: typeof consultation.userId,
                consultationId: consultation.id,
                fullConsultation: consultation
            });
            setPatient(null);
            return;
        }
        
        console.log('🔍 ConsultationCard - Cargando paciente con userId:', consultation.userId);
        console.log('🔍 ConsultationCard - Tipo de userId:', typeof consultation.userId);
        console.log('🔍 ConsultationCard - Longitud de userId:', consultation.userId.length);
        
        getPatientById(consultation.userId)
            .then(p => {
                console.log('🔍 ConsultationCard - Paciente cargado:', !!p);
                if (p) {
                    console.log('🔍 ConsultationCard - Datos del paciente:', {
                        id: p.id,
                        name: p.name,
                        age: p.age,
                        status: p.status
                    });
                }
                setPatient(p || null);
            })
            .catch(error => {
                console.error('❌ ConsultationCard - Error cargando paciente:', error);
                setPatient(null);
            });
    }, [consultation.userId]);

    const handleExportPrescription = () => {
        // ✅ VALIDACIÓN CRÍTICA - Verificar que consultation.userId sea válido
        if (!consultation.userId || typeof consultation.userId !== 'string') {
            console.error('❌ handleExportPrescription - consultation.userId inválido:', consultation.userId);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'ID de paciente inválido. No se puede exportar la receta.'
            });
            return;
        }
        
        if (!patient) {
            console.error('❌ handleExportPrescription - Paciente no cargado para userId:', consultation.userId);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo cargar la información del paciente para exportar.'
            });
            return;
        }
        
        console.log('🔍 handleExportPrescription - Exportando receta para paciente:', patient.name, 'userId:', consultation.userId);

        const doc = new jsPDF();
        const exportDate = new Date();
        
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Receta Médica", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150);
        doc.text(`Fecha de emisión: ${format(new Date(consultation.date), 'dd/MM/yyyy')}`, doc.internal.pageSize.getWidth() - 14, 30, { align: "right" });

        let y = 40;
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text("Paciente:", 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(`${patient.name} (${patient.age} años)`, 50, y);
        y += 7;

        autoTable(doc, {
            startY: y,
            head: [['Medicamento', 'Dosis', 'Duración']],
            body: consultation.prescriptions.map(p => [
                p.medication,
                p.dosage,
                p.duration,
            ]),
            headStyles: { fillColor: [58, 109, 255] },
            theme: 'striped'
        });
        
        y = (doc as any).lastAutoTable.finalY + 20;

        if (consultation.notes) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Notas Adicionales:", 14, y);
            y += 8;
            doc.setFont("helvetica", "normal");
            const notesLines = doc.splitTextToSize(consultation.notes, doc.internal.pageSize.getWidth() - 28);
            doc.text(notesLines, 14, y);
            y += notesLines.length * 5;
        }

        const signatureY = doc.internal.pageSize.getHeight() - 40;
        doc.line(60, signatureY, doc.internal.pageSize.getWidth() - 60, signatureY);
        doc.setFontSize(10);
        doc.text("Firma y Sello del Médico", doc.internal.pageSize.getWidth() / 2, signatureY + 8, { align: 'center' });

        doc.save(`receta_${patient.name.replace(/\s/g, '_')}_${format(exportDate, 'yyyy-MM-dd')}.pdf`);
        
        toast({
            title: "Receta Exportada",
            description: "El PDF de la receta ha sido generado.",
        });
    }

    const handleExportReport = async (report: any) => {
        if (!patient) return;

        const doc = new jsPDF();
        const exportDate = new Date();

        // Logo UroVital
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(58, 109, 255);
        doc.text("UroVital", 14, 20);

        doc.setFont("helvetica", "bold");
        doc.text("Informe Médico", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150);
        doc.text(`Fecha de emisión: ${format(exportDate, 'dd/MM/yyyy')}`, doc.internal.pageSize.getWidth() - 14, 30, { align: "right" });

        let y = 40;
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text("Paciente:", 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(`${patient.name}`, 50, y);
        y += 7;

        doc.setFont("helvetica", "bold");
        doc.text("Informe:", 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(report.title, 50, y);
        y += 7;

        if (report.notes) {
            doc.setFont("helvetica", "bold");
            doc.text("Descripción:", 14, y);
            y += 8;
            doc.setFont("helvetica", "normal");
            const notesLines = doc.splitTextToSize(report.notes, doc.internal.pageSize.getWidth() - 28);
            doc.text(notesLines, 14, y);
            y += notesLines.length * 5 + 10;
        }

        if (report.attachments && report.attachments.length > 0) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Archivos Adjuntos:", 14, y);
            y += 6;
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            report.attachments.forEach((file: string) => {
                doc.text(`- ${file}`, 14, y);
                y += 5;
            });
        }

        const signatureY = doc.internal.pageSize.getHeight() - 40;
        doc.line(60, signatureY, doc.internal.pageSize.getWidth() - 60, signatureY);
        doc.setFontSize(10);
        doc.text("Firma y Sello del Médico", doc.internal.pageSize.getWidth() / 2, signatureY + 8, { align: 'center' });

        doc.save(`informe_${report.title.replace(/\s/g, '_')}_${format(exportDate, 'yyyy-MM-dd')}.pdf`);
        
        toast({
            title: "Informe Exportado",
            description: "El PDF del informe ha sido generado.",
        });
    }

    const handleViewReport = (report: any) => {
        console.log('📄 handleViewReport - Report data:', {
            id: report.id,
            title: report.title,
            hasAttachments: !!report.attachments?.length,
            attachments: report.attachments,
            archivoNombre: report.archivoNombre,
            archivoTipo: report.archivoTipo,
            hasArchivoContenido: !!report.archivoContenido,
            archivoContenidoLength: report.archivoContenido?.length || 0
        });
        
        // Get the first attachment if it exists
        const firstAttachment = report.attachments?.[0];
        
        // Create a new report object with all required fields
        const reportWithContent = {
            ...report,
            // Use the attachment's name if archivoNombre is not set
            archivoNombre: report.archivoNombre || firstAttachment?.name || 'Archivo adjunto',
            // Use the attachment's type if archivoTipo is not set
            archivoTipo: report.archivoTipo || firstAttachment?.type || 'application/pdf',
            // Get content from either the report or the first attachment
            archivoContenido: report.archivoContenido || firstAttachment?.base64Content || firstAttachment?.archivoContenido,
            // Ensure we have a fileUrl
            fileUrl: report.fileUrl || firstAttachment?.url || ''
        };
        
        console.log('🔄 handleViewReport - Processed report:', {
            ...reportWithContent,
            archivoContenido: reportWithContent.archivoContenido ? 
                `[Base64 data, length: ${reportWithContent.archivoContenido.length}]` : 
                'No content'
        });
        
        setSelectedReport(reportWithContent);
        setIsFileViewerOpen(true);
    };

    // Mostrar error si consultation es inválido
    if (!isValidConsultation) {
        return (
            <Card>
                <CardContent className="p-4 text-center text-destructive">
                    <p>Error: Consulta inválida</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{format(new Date(consultation.date), "d 'de' MMMM, yyyy")}</CardTitle>
                        <CardDescription>Consulta con {consultation.doctor}</CardDescription>
                    </div>
                     <Badge variant={consultation.type === 'Seguimiento' ? 'secondary' : 'default'}>{consultation.type}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold text-sm mb-1">Notas</h4>
                    <p className="text-muted-foreground text-sm">{consultation.notes}</p>
                </div>

                {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <h4 className="font-semibold text-sm flex items-center"><Pill className="w-4 h-4 mr-2" />Recetas</h4>
                             <Button variant="ghost" size="sm" onClick={handleExportPrescription}>
                                 <Download className="w-4 h-4 mr-2" />
                                 Exportar Receta (PDF)
                             </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Medicamento</TableHead>
                                    <TableHead>Dosis</TableHead>
                                    <TableHead>Duración</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {consultation.prescriptions.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.medication}</TableCell>
                                        <TableCell>{p.dosage}</TableCell>
                                        <TableCell>{p.duration}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                
                {consultation.labResults && consultation.labResults.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center"><Microscope className="w-4 h-4 mr-2" />Resultados de Laboratorio</h4>
                        <div className="flex flex-wrap gap-2">
                             {consultation.labResults.map(l => <Badge variant="outline" key={l.id}>{l.testName}</Badge>)}
                        </div>
                    </div>
                )}

                {consultation.reports && consultation.reports.length > 0 && (
                     <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center"><FileText className="w-4 h-4 mr-2" />Informes</h4>
                        <div className="space-y-2">
                            {consultation.reports.map((report, index) => {
                                // Crear una clave única usando el ID del reporte o un índice con prefijo
                                const uniqueKey = report?.id 
                                    ? `report-${report.id}` 
                                    : `report-${consultation.id}-${index}`;
                                    
                                return (
                                <div key={uniqueKey} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{report.title}</span>
                                        {report.attachments && report.attachments.length > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                                {report.attachments.length} archivo(s)
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewReport(report)}
                                            className="h-7 px-2"
                                        >
                                            <Eye className="w-3 h-3 mr-1" />
                                            Ver
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExportReport(report)}
                                            className="h-7 px-2"
                                        >
                                            <FileDown className="w-3 h-3 mr-1" />
                                            PDF
                                        </Button>
                                    </div>
                                </div>
                            );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
        
        {/* Modal de visualización de archivos */}
        {selectedReport && (
            <FileViewerModal
                isOpen={isFileViewerOpen}
                onClose={() => {
                    setIsFileViewerOpen(false);
                    setSelectedReport(null);
                }}
                // Normalizar archivoNombre: extraer solo el string
                archivoNombre={
                    typeof selectedReport.archivoNombre === 'string'
                        ? selectedReport.archivoNombre
                        : selectedReport.archivoNombre?.name || 'Archivo sin nombre'
                }
                // Normalizar fileUrl: extraer solo el string
                fileUrl={
                    typeof selectedReport.fileUrl === 'string'
                        ? selectedReport.fileUrl
                        : selectedReport.fileUrl?.url || selectedReport.archivoContenido || ''
                }
                fileType={selectedReport.archivoTipo || 'application/pdf'}
                report={{
                    ...selectedReport,
                    // Asegurar que archivoNombre sea un string en el objeto report también
                    archivoNombre: typeof selectedReport.archivoNombre === 'string'
                        ? selectedReport.archivoNombre
                        : selectedReport.archivoNombre?.name || 'Archivo sin nombre'
                }}
            />
        )}
    </>
    )
}
