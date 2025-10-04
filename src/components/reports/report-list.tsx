'use client';
import { useState } from 'react';
import type { Report } from '@/lib/types';
import { FileText, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportCard } from './report-card';
import { AddReportFab } from './add-report-fab';

interface ReportListProps {
  initialReports: Report[];
  patientId: string;
}

export default function ReportList({ initialReports, patientId }: ReportListProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);

  const handleNewReport = (report: Omit<Report, 'id' | 'patientId'>) => {
    const newReport: Report = {
      ...report,
      id: `rep-${Date.now()}`,
      patientId: patientId,
      fileUrl: (report.attachments && report.attachments.length > 0) ? report.attachments[0] : '#',
    };
    setReports(prev => [newReport, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
              <ReportCard key={report.id} report={report} />
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
      <AddReportFab onFormSubmit={handleNewReport} />
    </div>
  );
}
