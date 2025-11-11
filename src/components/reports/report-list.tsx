'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Report, NewReportFormValues } from '@/lib/types';
import { FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportCard } from './report-card';
import { AddReportFab } from './add-report-fab';
import { createReport } from '@/lib/actions';
import ReportFilterBar from './report-filter-bar';

interface ReportListProps {
  initialReports: Report[];
  userId: string;
  currentUserRole?: string;
}

export default function ReportList({ initialReports, userId, currentUserRole }: ReportListProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState<string>("");
  const [type, setType] = useState<string>("Todos");
  const router = useRouter();
  const { toast } = useToast();

  const handleNewReport = async (values: NewReportFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Get the first attachment if it exists
      const attachment = values.attachments?.[0];
      
      // Create the report in the database
      const newReport = await createReport({
        // Frontend field names
        title: values.title,
        date: values.date,
        type: values.type,
        notes: values.notes || '',
        // Backend field names (kept for backward compatibility)
        titulo: values.title,
        fecha: values.date,
        tipo: values.type,
        notas: values.notes || '',
        // Common fields
        descripcion: values.notes || '',
        autor: 'Sistema',
        patientUserId: userId,  // Required by the type
        userId: userId,         // Alternative field name
        // File fields
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

  const filtered = reports.filter((r) => {
    const matchesType = type === 'Todos' || (r.type || '').toLowerCase() === type.toLowerCase();
    const q = search.trim().toLowerCase();
    const matchesQuery = !q || (r.title || '').toLowerCase().includes(q) || (r.notes || '').toLowerCase().includes(q);
    return matchesType && matchesQuery;
  });

  return (
    <div className="relative">
      <ReportFilterBar search={search} type={type} onSearchChange={setSearch} onTypeChange={setType} />
      {filtered.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {filtered.map((report) => (
              <ReportCard key={report.id} report={report} currentUserRole={currentUserRole} />
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
      <AddReportFab onFormSubmit={handleNewReport} isSubmitting={isSubmitting} />
    </div>
  );
}
