
'use client';

import { useState, useMemo } from 'react';
import type { Appointment } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Stethoscope,
  XCircle,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { useAppointmentStore } from '@/lib/store/appointment-store';

interface PatientAppointmentsProps {
  patientId: string;
}

type DateFilter = 'today' | 'week' | 'month' | 'year' | 'all';
type StatusFilter = 'all' | 'Programada' | 'Completada' | 'Cancelada';

const statusConfig = {
  Programada: {
    label: 'Próxima',
    icon: Clock,
    badgeVariant: 'secondary',
  },
  Completada: {
    label: 'Realizada',
    icon: CheckCircle,
    badgeVariant: 'success',
  },
  Cancelada: {
    label: 'Cancelada',
    icon: XCircle,
    badgeVariant: 'destructive',
  },
} as const;

export function PatientAppointments({
  patientId,
}: PatientAppointmentsProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const appointments = useAppointmentStore(state => state.appointments);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appt) => appt.patientId === patientId)
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
  }, [appointments, patientId, statusFilter, dateFilter]);

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

  // En una app real, el nombre del doctor vendría con la data o se buscaría por ID.
  const doctorName = "Dr. John Doe";

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
              const config = statusConfig[appt.status];
              return (
                <motion.div key={appt.id} variants={itemVariants}>
                  <Card className="transition-all hover:shadow-md hover:shadow-primary/10">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1 flex flex-col gap-1">
                          <p className="font-semibold text-foreground">
                            {appt.reason}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            {doctorName}
                          </p>
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
              <p className="font-medium">No tienes citas programadas</p>
              <p className="text-sm">
                Cuando tengas una cita, aparecerá aquí.
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
