
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Calendar, Eye, Download, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { deleteReport } from '@/lib/actions';
import { cn } from '@/lib/utils';
import type { Report } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ReportDetailModal } from './report-detail-modal';
import { EditReportModal } from './edit-report-modal';
import { FileViewerModal } from '@/components/history/file-viewer-modal';

interface ReportCardProps {
  report: Report;
  currentUserRole?: string;
}

export function ReportCard({ report, currentUserRole }: ReportCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const router = useRouter();

  const handleDownload = (report: Report) => {
    if (!report.archivoContenido) {
      toast({
        title: 'Error',
        description: 'No se encontró el archivo para descargar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create blob from base64
      const byteCharacters = atob(report.archivoContenido);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: report.archivoTipo || 'application/pdf' });
      
      // Download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.archivoNombre || 'informe.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al descargar el archivo.',
        variant: 'destructive',
      });
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };

  const canModify = !!currentUserRole && ['DOCTOR', 'ADMIN', 'ADMINISTRATOR'].includes(currentUserRole.toUpperCase());

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const currentUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : {};
      const currentUserId = currentUser?.id;
      await deleteReport(report.id, currentUserId);
      toast({
        title: 'Informe eliminado',
        description: 'El informe ha sido eliminado correctamente.',
      });
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Error',
        description: error?.message || 'No se pudo eliminar el informe.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <>
      <motion.div variants={itemVariants}>
        <Card className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.02]",
          "hover:shadow-[0_0_20px_rgba(46,49,146,0.4)]"
        )}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="line-clamp-2">{report.title || 'Sin título'}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{report.type || 'Sin tipo'}</Badge>
                {canModify && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditModalOpen(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar informe?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El informe "{report.title}" será eliminado permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? 'Eliminando...' : 'Eliminar'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
            <CardDescription className="flex items-center gap-2 pt-1">
              <Calendar className="h-4 w-4" />
              {report.date ? new Date(report.date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }) : 'Fecha no disponible'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {report.notes || 'No hay notas disponibles'}
            </p>
          </CardContent>
          <CardFooter className="bg-muted/30 p-4 gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setIsModalOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalles
            </Button>
            {report.archivoNombre && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setFileViewerOpen(true)}
                  title="Vista previa del archivo"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDownload(report)}
                  title="Descargar archivo"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
          </CardFooter>
          
          <FileViewerModal
            isOpen={fileViewerOpen}
            onClose={() => setFileViewerOpen(false)}
            report={{
              id: report.id,
              title: report.title,
              archivoNombre: report.archivoNombre,
              archivoTipo: report.archivoTipo,
              archivoContenido: report.archivoContenido,
              archivoTamaño: report.archivoTamaño,
            }}
          />
        </Card>
      </motion.div>
      
      <ReportDetailModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} report={report} />
      
      <EditReportModal
        report={report}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          router.refresh();
          toast({
            title: 'Informe actualizado',
            description: 'Los cambios se guardaron correctamente.',
          });
        }}
      />
    </>
  );
}
