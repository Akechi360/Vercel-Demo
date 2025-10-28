'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Company, Patient, Report } from '@/lib/types';
import { Badge } from '../ui/badge';
import { FileDown, Paperclip, Calendar, FileText, Eye, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { addUroVitalLogo } from '@/lib/pdf-helpers';
import { getCompanyById, getPatientById } from '@/lib/actions';

interface ReportDetailModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  report: Report;
}

// Helper function to convert base64 to Blob
const base64ToBlob = (base64: string, type: string = 'application/pdf'): Blob => {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  } catch (error) {
    console.error('Error converting base64 to Blob:', error);
    return new Blob([], { type });
  }
};

export function ReportDetailModal({ isOpen, setIsOpen, report }: ReportDetailModalProps) {
  const { toast } = useToast();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (report.archivoContenido) {
      const blob = base64ToBlob(
        report.archivoContenido, 
        report.archivoTipo || 'application/pdf'
      );
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      // Cleanup object URL on unmount
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [report.archivoContenido, report.archivoTipo]);

  useEffect(() => {
    // Cleanup function to revoke object URL when component unmounts or URL changes
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleDownloadFile = async () => {
    if (!report.archivoContenido) {
      toast({
        title: 'Error',
        description: 'No hay archivo para descargar',
        variant: 'destructive',
      });
      return;
    }

    try {
      const blob = base64ToBlob(report.archivoContenido, report.archivoTipo || 'application/octet-stream');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.archivoNombre || 'documento';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el archivo',
        variant: 'destructive',
      });
    }
  };

  const handleViewFullScreen = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleExport = async () => {
    try {
        const patient = await getPatientById(report.userId);
        if (!patient) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo cargar la información del paciente para exportar.'
            });
            return;
        }
        
        let company: Company | undefined;
        if (patient.companyId) {
            company = await getCompanyById(patient.companyId) || undefined;
        }

        const doc = new jsPDF();
        const margin = 14;
        const exportDate = new Date();

        // Add UroVital logo
        addUroVitalLogo(doc);

        // Título y fecha
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Informe Médico", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150);
        doc.text(`Generado el: ${format(exportDate, 'dd/MM/yyyy')}`, doc.internal.pageSize.getWidth() - margin, 20, { align: "right" });

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
                ['Empresa:', company?.name || 'Paciente Particular'],
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

        // Detalles del Informe
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Detalles del Informe", margin, y);
        y+= 8;

        autoTable(doc, {
            startY: y,
            theme: 'plain',
            body: [
                ['Título:', report.title],
                ['Tipo:', report.type],
                ['Fecha:', format(new Date(report.date), 'dd/MM/yyyy')],
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
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Observaciones", margin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const notesLines = doc.splitTextToSize(report.notes, doc.internal.pageSize.getWidth() - (margin * 2));
        doc.text(notesLines, margin, y);
        y += notesLines.length * 5 + 10;

        // Show file attachment info if available
        if (report.archivoNombre) {
            const formatFileSize = (bytes: number): string => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
            };

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Archivo Adjunto:", margin, y);
            y += 6;
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            
            // File name and size
            const fileInfo = `- ${report.archivoNombre} (${formatFileSize(report.archivoTamaño || 0)})`;
            doc.text(fileInfo, margin, y);
            y += 10;
        }

        // Show additional attachments if any
        if (report.attachments && report.attachments.length > 0) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Archivos Adjuntos Adicionales:", margin, y);
            y += 6;
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            report.attachments.forEach(attachment => {
                const attachmentInfo = `- ${attachment.name || 'Archivo sin nombre'}`;
                doc.text(attachmentInfo, margin, y);
                y += 5;
            });
        }

        const signatureY = doc.internal.pageSize.getHeight() - 40;
        doc.line(60, signatureY, doc.internal.pageSize.getWidth() - 60, signatureY);
        doc.setFontSize(10);
        doc.text("Firma y Sello del Médico", doc.internal.pageSize.getWidth() / 2, signatureY + 8, { align: 'center' });

        const dateString = new Date(report.date).toISOString().slice(0,10);
        const filename = `informe_${report.id}_${dateString}.pdf`;
        doc.save(filename);

        toast({
            title: "Exportando Informe",
            description: `Se ha iniciado la descarga del informe: ${report.title}.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error en la exportación",
            description: "No se pudo generar el archivo del informe.",
        });
        console.error("Failed to export report:", error);
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{report.title}</DialogTitle>
          <div className="flex items-center gap-4 pt-1 text-sm text-muted-foreground">
            <Badge variant="secondary">{report.type || 'Sin tipo'}</Badge>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4'/>
              {report.date ? new Date(report.date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }) : 'Fecha no disponible'}
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
          <div className='space-y-2'>
            <h3 className='font-semibold'>Notas del Informe</h3>
            <p className="text-muted-foreground">
              {report.notes || 'No hay notas disponibles'}
            </p>
          </div>
          
          {/* PDF Preview Section */}
          {report.archivoContenido && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold">Archivo Adjunto</h3>
              <div className="border rounded-lg p-4 bg-muted/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">{report.archivoNombre || 'Documento'}</span>
                    <span className="text-xs text-muted-foreground">
                      {report.archivoTipo || 'application/pdf'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewFullScreen}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver completo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadFile}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Descargar
                    </Button>
                  </div>
                </div>
                
                {/* PDF Preview */}
                <div className="border rounded overflow-hidden">
                  <iframe
                    src={pdfUrl || ''}
                    className="w-full h-[400px]"
                    title="Vista previa del documento"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Additional Attachments */}
          {report.attachments && report.attachments.length > 0 && (
            <div className='space-y-2'>
              <h3 className='font-semibold flex items-center gap-2'><Paperclip className='h-4 w-4'/> Adjuntos Adicionales</h3>
              <div className="flex flex-col gap-2">
                {report.attachments.map((attachment, index) => (
                  <div key={index} className="flex flex-col gap-1 text-sm p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                      <a 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium hover:underline truncate"
                      >
                        {attachment.name || 'Archivo sin nombre'}
                      </a>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 pl-6">
                      <span>{attachment.type || 'Tipo de archivo no especificado'}</span>
                      {attachment.size && (
                        <span>{(attachment.size / 1024).toFixed(2)} KB</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cerrar</Button>
          <Button onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar como PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
