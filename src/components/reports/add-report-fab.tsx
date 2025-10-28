'use client';
import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { NewReportForm, NewReportFormValues } from './new-report-form';

interface AddReportFabProps {
  onFormSubmit: (values: NewReportFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddReportFab({ onFormSubmit, isSubmitting = false }: AddReportFabProps) {
  const [open, setOpen] = useState(false);

  const handleFormSubmit = async (values: NewReportFormValues) => {
    try {
      await onFormSubmit(values);
      setOpen(false);
    } catch (error) {
      // Error is already handled in the parent component
      console.error('Error in form submission:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-400/90 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-[0_0_20px_rgba(58,109,255,0.4),0_0_40px_rgba(186,85,211,0.3),0_0_60px_rgba(255,105,180,0.2)] animate-pulse-slow"
          disabled={isSubmitting}
        >
          <FileText className="h-8 w-8" />
          <span className="sr-only">Agregar Informe</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Informe</DialogTitle>
          <DialogDescription>
            Rellena los detalles para el nuevo informe médico.
          </DialogDescription>
        </DialogHeader>
        <NewReportForm 
          onFormSubmit={handleFormSubmit} 
          isSubmitting={isSubmitting} 
        />
      </DialogContent>
    </Dialog>
  );
}
