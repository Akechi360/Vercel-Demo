
'use client';
import { useState } from 'react';
import type { Report } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { ReportDetailModal } from './report-detail-modal';
import { cn } from '@/lib/utils';

interface ReportCardProps {
  report: Report;
}

export function ReportCard({ report }: ReportCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
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
              <CardTitle className="line-clamp-2">{report.title}</CardTitle>
              <Badge variant="outline">{report.type}</Badge>
            </div>
            <CardDescription className="flex items-center gap-2 pt-1">
              <Calendar className="h-4 w-4" />
              {new Date(report.date).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="line-clamp-3 text-sm text-muted-foreground">{report.notes}</p>
          </CardContent>
          <CardFooter className="bg-muted/30 p-4">
            <Button variant="ghost" className="w-full" onClick={() => setIsModalOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalles
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
      <ReportDetailModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} report={report} />
    </>
  );
}
