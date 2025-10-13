'use client';

import { useState } from 'react';
import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreVertical, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppointments } from '@/lib/store/global-store';
import { updateAppointment as updateAppointmentAction, deleteAppointment as deleteAppointmentAction } from '@/lib/actions';
import { useSweetAlertTheme, getSweetAlertConfig, getSweetAlertWarningConfig } from '@/hooks/use-sweetalert-theme';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface AppointmentActionsProps {
  appointment: Appointment;
  onAppointmentUpdated?: (appointment: Appointment) => void;
  onAppointmentDeleted?: (appointmentId: string) => void;
}

export function AppointmentActions({
  appointment,
  onAppointmentUpdated,
  onAppointmentDeleted,
}: AppointmentActionsProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const sweetAlertTheme = useSweetAlertTheme();
  
  // Estados para el formulario de edición
  const [editForm, setEditForm] = useState({
    date: format(parseISO(appointment.date), 'yyyy-MM-dd'),
    time: format(parseISO(appointment.date), 'HH:mm'),
    reason: appointment.reason,
    status: appointment.status,
  });

  // Estados para el formulario de re-agendar
  const [rescheduleForm, setRescheduleForm] = useState({
    date: format(parseISO(appointment.date), 'yyyy-MM-dd'),
    time: format(parseISO(appointment.date), 'HH:mm'),
  });

  const { removeAppointment, updateAppointment: updateAppointmentStore } = useAppointments();

  const handleEditAppointment = async () => {
    try {
      setIsLoading(true);
      
      // Crear fecha combinada
      const newDateTime = new Date(`${editForm.date}T${editForm.time}`);
      
      // Llamar a la función real de actualización
      const updatedAppointment = await updateAppointmentAction(appointment.id, {
        date: newDateTime.toISOString(),
        reason: editForm.reason,
        status: editForm.status as 'Programada' | 'Completada' | 'Cancelada',
      });

      updateAppointmentStore(updatedAppointment);
      onAppointmentUpdated?.(updatedAppointment);
      
      setIsEditModalOpen(false);
      
      await MySwal.fire({
        title: '¡Cita actualizada!',
        text: 'La cita ha sido modificada exitosamente.',
        icon: 'success',
        confirmButtonText: 'Entendido',
        ...getSweetAlertConfig(sweetAlertTheme),
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      await MySwal.fire({
        title: 'Error',
        text: 'No se pudo actualizar la cita. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Entendido',
        ...getSweetAlertConfig(sweetAlertTheme),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescheduleAppointment = async () => {
    try {
      setIsLoading(true);
      
      // Crear fecha combinada
      const newDateTime = new Date(`${rescheduleForm.date}T${rescheduleForm.time}`);
      
      // Llamar a la función real de actualización solo para fecha/hora
      const updatedAppointment = await updateAppointmentAction(appointment.id, {
        date: newDateTime.toISOString(),
      });

      updateAppointmentStore(updatedAppointment);
      onAppointmentUpdated?.(updatedAppointment);
      
      setIsRescheduleModalOpen(false);
      
      await MySwal.fire({
        title: '¡Cita re-agendada!',
        text: 'La cita ha sido movida a la nueva fecha y hora.',
        icon: 'success',
        confirmButtonText: 'Entendido',
        ...getSweetAlertConfig(sweetAlertTheme),
      });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      await MySwal.fire({
        title: 'Error',
        text: 'No se pudo re-agendar la cita. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Entendido',
        ...getSweetAlertConfig(sweetAlertTheme),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAppointment = async () => {
    const result = await MySwal.fire({
      title: '¿Eliminar cita?',
      text: 'Esta acción no se puede deshacer. La cita será eliminada permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      ...getSweetAlertWarningConfig(sweetAlertTheme),
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        
        // Llamar a la función real de eliminación
        await deleteAppointmentAction(appointment.id);
        
        removeAppointment(appointment.id);
        onAppointmentDeleted?.(appointment.id);
        
        await MySwal.fire({
          title: '¡Cita eliminada!',
          text: 'La cita ha sido eliminada exitosamente.',
          icon: 'success',
          confirmButtonText: 'Entendido',
          ...getSweetAlertConfig(sweetAlertTheme),
        });
      } catch (error) {
        console.error('Error deleting appointment:', error);
        await MySwal.fire({
          title: 'Error',
          text: 'No se pudo eliminar la cita. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          ...getSweetAlertConfig(sweetAlertTheme),
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isLoading}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menú de acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar cita
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsRescheduleModalOpen(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            Re-agendar cita
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDeleteAppointment}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar cita
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de Edición Completa */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
            <DialogDescription>
              Modifica todos los detalles de la cita.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Fecha</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Hora</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reason">Motivo de la cita</Label>
              <Textarea
                id="edit-reason"
                value={editForm.reason}
                onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Describe el motivo de la cita..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Estado</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as 'Programada' | 'Completada' | 'Cancelada' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Programada">Programada</SelectItem>
                  <SelectItem value="Completada">Completada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditAppointment} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Re-agendar */}
      <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Re-agendar Cita</DialogTitle>
            <DialogDescription>
              Selecciona una nueva fecha y hora para esta cita. El resto de la información permanecerá igual.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reschedule-date">Nueva fecha</Label>
                <Input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule-time">Nueva hora</Label>
                <Input
                  id="reschedule-time"
                  type="time"
                  value={rescheduleForm.time}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Motivo:</strong> {appointment.reason}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Estado:</strong> {appointment.status}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRescheduleModalOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleRescheduleAppointment} disabled={isLoading}>
              {isLoading ? 'Re-agendando...' : 'Re-agendar cita'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
