'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Report } from '@/lib/types';
import { EditReportForm, EditReportFormValues } from './edit-report-form';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { updateReport } from '@/lib/actions';

interface EditReportModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditReportModal({ report, isOpen, onClose, onSuccess }: EditReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: EditReportFormValues) => {
    try {
      setIsSubmitting(true);

      const attachment = values.attachments?.[0];
      const currentUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : {};
      const currentUserId = currentUser?.id;

      await updateReport(report.id, currentUserId, {
        titulo: values.title,
        fecha: values.date,
        tipo: values.type,
        notas: values.notes || '',
        descripcion: values.notes || '',
        archivoNombre: attachment?.name ?? report.archivoNombre,
        archivoTipo: attachment?.type ?? report.archivoTipo,
        archivoContenido: attachment?.url ? attachment.url.split(',')[1] : report.archivoContenido,
        archivoTamaño: attachment?.size ?? report.archivoTamaño,
      });

      onSuccess();
      onClose();
      toast({ title: 'Informe actualizado', description: 'Los cambios se guardaron correctamente.' });
    } catch (error) {
      console.error('Error updating report:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el informe.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Informe</DialogTitle>
        </DialogHeader>
        <EditReportForm initialData={report} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
}


