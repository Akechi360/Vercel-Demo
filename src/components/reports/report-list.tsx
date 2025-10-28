'use client';
import { useState } from 'react';
<<<<<<< HEAD
=======
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
>>>>>>> 6ab26e7 (main)
import type { Report, NewReportFormValues } from '@/lib/types';
import { FileText, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportCard } from './report-card';
import { AddReportFab } from './add-report-fab';
<<<<<<< HEAD
=======
import { createReport } from '@/lib/actions';
>>>>>>> 6ab26e7 (main)

interface ReportListProps {
  initialReports: Report[];
  userId: string;
<<<<<<< HEAD
}

export default function ReportList({ initialReports, userId }: ReportListProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);

  const handleNewReport = (values: NewReportFormValues) => {
    const newReport: Report = {
      ...values,
      id: `rep-${Date.now()}`,
      userId: userId,
      fileUrl: '#', // Default file URL since NewReportFormValues doesn't have fileUrl
    };
    setReports(prev => [newReport, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
=======
  currentUserRole?: string;
}

export default function ReportList({ initialReports, userId, currentUserRole }: ReportListProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleNewReport = async (values: NewReportFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Get the first attachment if it exists
      const attachment = values.attachments?.[0];
      
      // Create the report in the database
      const newReport = await createReport({
        titulo: values.title,
        fecha: values.date,
        tipo: values.type,
        notas: values.notes || '',
        descripcion: values.notes || '',
        autor: 'Sistema',
        patientUserId: userId,
        archivoNombre: attachment?.name,
        archivoTipo: attachment?.type,
        archivoTamaño: attachment?.size,
        archivoContenido: attachment?.url?.split(',')[1],
        createdBy: userId,
      });

      // Update local state with the new report
      setReports(prev => [newReport, ...prev]);
      
      // Show success message
      toast({
        title: 'Éxito',
        description: 'El informe se ha guardado correctamente.',
        variant: 'default',
      });
      
      // Refresh the page to show the new report
      router.refresh();
      
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el informe. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
>>>>>>> 6ab26e7 (main)
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="relative">
      {reports.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {reports.map((report) => (
<<<<<<< HEAD
              <ReportCard key={report.id} report={report} />
=======
              <ReportCard key={report.id} report={report} currentUserRole={currentUserRole} />
>>>>>>> 6ab26e7 (main)
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 py-24 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Sin Informes</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No se han añadido informes para este paciente.
          </p>
        </div>
      )}
<<<<<<< HEAD
      <AddReportFab onFormSubmit={handleNewReport} />
=======
      <AddReportFab onFormSubmit={handleNewReport} isSubmitting={isSubmitting} />
>>>>>>> 6ab26e7 (main)
    </div>
  );
}
