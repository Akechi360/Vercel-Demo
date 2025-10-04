'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Pill, Microscope, Download } from "lucide-react"
import { format } from "date-fns"
import type { Consultation, Patient } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { getPatientById } from "@/lib/actions";
import { useEffect, useState }from "react";

interface ConsultationCardProps {
    consultation: Consultation;
}

export function ConsultationCard({ consultation }: ConsultationCardProps) {
    const { toast } = useToast();
    const [patient, setPatient] = useState<Patient | null>(null);

    useEffect(() => {
        getPatientById(consultation.patientId).then(p => setPatient(p || null));
    }, [consultation.patientId]);

    const handleExportPrescription = () => {
        if (!patient) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo cargar la información del paciente para exportar.'
            });
            return;
        }

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

    return (
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
                        <div className="flex flex-wrap gap-2">
                            {consultation.reports.map(r => <Badge variant="outline" key={r.id}>{r.title}</Badge>)}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
