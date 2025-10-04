
'use client';

import { useState, useMemo } from 'react';
import type { Appointment, Patient } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  isToday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  parseISO,
} from 'date-fns';
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  History,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { useAppointmentStore } from '@/lib/store/appointment-store';

interface DoctorAppointmentsProps {
  initialPatients: Patient[];
  doctorId: string;
}

type DateFilter = 'today' | 'week' | 'month' | 'year' | 'all';
type StatusFilter = 'all' | 'Programada' | 'Completada' | 'Cancelada';

const statusConfig = {
  Programada: {
    label: 'Próxima',
    icon: Clock,
    badgeVariant: 'secondary',
    textColor: 'text-foreground',
  },
  Completada: {
    label: 'Realizada',
    icon: CheckCircle,
    badgeVariant: 'success',
    textColor: 'text-success-foreground',
  },
  Cancelada: {
    label: 'Cancelada',
    icon: XCircle,
    badgeVariant: 'destructive',
    textColor: 'text-destructive-foreground',
  },
} as const;

export function DoctorAppointments({
  initialPatients,
  doctorId,
}: DoctorAppointmentsProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const router = useRouter();

  const appointments = useAppointmentStore(state => state.appointments);

  const patientsMap = useMemo(
    () => new Map(initialPatients.map((p) => [p.id, p])),
    [initialPatients]
  );

  const filteredAppointments = useMemo(() => {
    return appointments
      //.filter((appt) => appt.doctorId === doctorId) // Commented out for global view (admin/secretaria)
      .filter((appt) => {
        if (statusFilter === 'all') return true;
        return appt.status === statusFilter;
      })
      .filter((appt) => {
        const apptDate = parseISO(appt.date);
        switch (dateFilter) {
          case 'today':
            return isToday(apptDate);
          case 'week':
            return isThisWeek(apptDate, { weekStartsOn: 1 });
          case 'month':
            return isThisMonth(apptDate);
          case 'year':
            return isThisYear(apptDate);
          case 'all':
          default:
            return true;
        }
      })
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [appointments, statusFilter, dateFilter]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <Select
            value={dateFilter}
            onValueChange={(v) => setDateFilter(v as DateFilter)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="Programada">Próximas</SelectItem>
              <SelectItem value="Completada">Realizadas</SelectItem>
              <SelectItem value="Cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <AnimatePresence>
        <motion.div
          key={dateFilter + statusFilter}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4"
        >
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appt) => {
              const patient = patientsMap.get(appt.patientId);
              const config = statusConfig[appt.status];
              if (!patient) return null;

              return (
                <motion.div key={appt.id} variants={itemVariants}>
                  <Card className="transition-all hover:shadow-md hover:shadow-primary/10">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1 flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={patient.avatarUrl} />
                          <AvatarFallback>
                            {getInitials(patient.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">
                            {patient.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appt.reason}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-1 text-sm">
                        <Badge
                          variant={config.badgeVariant}
                          className="flex items-center gap-1.5"
                        >
                          <config.icon className="h-3 w-3" />
                          <span>{config.label}</span>
                        </Badge>
                        <span className="text-muted-foreground capitalize">
                          {format(parseISO(appt.date), "eeee, d 'de' MMMM, p", {
                            locale: es,
                          })}
                        </span>
                      </div>
                      <div className="flex w-full sm:w-auto gap-2 border-t sm:border-t-0 sm:border-l pl-0 sm:pl-4 pt-4 sm:pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/patients/${patient.id}`)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          Historial
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/patients/${patient.id}/reports`)
                          }
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Informes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full text-center py-16 text-muted-foreground flex flex-col items-center gap-4"
            >
              <Calendar className="h-12 w-12" />
              <p className="font-medium">No se encontraron citas</p>
              <p className="text-sm">
                Prueba a ajustar los filtros o registra una nueva cita.
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
