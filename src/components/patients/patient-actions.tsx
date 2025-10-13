'use client';

import { useState } from 'react';
import type { Patient } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { deletePatient, updatePatient, getCompanies } from '@/lib/actions';
import { useSweetAlertTheme, getSweetAlertConfig, getSweetAlertWarningConfig } from '@/hooks/use-sweetalert-theme';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const MySwal = withReactContent(Swal);

const editPatientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  age: z.coerce.number().min(1, 'La edad debe ser mayor a 0').max(120, 'La edad es inválida'),
  gender: z.enum(['Masculino', 'Femenino', 'Otro'], { required_error: 'Seleccione un género' }),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], { required_error: 'Seleccione un tipo de sangre' }),
  phone: z.string().optional(),
  email: z.string().email('Dirección de correo inválida').optional().or(z.literal('')),
  companyId: z.string().optional(),
});

type EditPatientFormValues = z.infer<typeof editPatientSchema>;

interface PatientActionsProps {
  patient: Patient;
  onPatientUpdated?: (updatedPatient: Patient) => void;
  onPatientDeleted?: (patientId: string) => void;
}

export default function PatientActions({ patient, onPatientUpdated, onPatientDeleted }: PatientActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const sweetAlertTheme = useSweetAlertTheme();

  const form = useForm<EditPatientFormValues>({
    resolver: zodResolver(editPatientSchema),
    defaultValues: {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      bloodType: patient.bloodType as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
      phone: patient.contact.phone,
      email: patient.contact.email,
      companyId: patient.companyId || '',
    },
  });

  const handleDelete = () => {
    MySwal.fire({
      title: '¿Eliminar paciente?',
      text: 'Esta acción es irreversible. El paciente y todos sus datos asociados serán eliminados del sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      ...getSweetAlertWarningConfig(sweetAlertTheme),
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deletePatient(patient.id);
          onPatientDeleted?.(patient.id);
          
          MySwal.fire({
            title: 'Eliminado',
            text: 'El paciente ha sido eliminado exitosamente.',
            icon: 'success',
            confirmButtonText: 'Entendido',
            ...getSweetAlertConfig(sweetAlertTheme),
          });
        } catch (error) {
          console.error('Error deleting patient:', error);
          MySwal.fire({
            title: 'Error',
            text: 'No se pudo eliminar el paciente. Intente nuevamente.',
            icon: 'error',
            confirmButtonText: 'Entendido',
            ...getSweetAlertConfig(sweetAlertTheme),
          });
        }
      }
    });
  };

  const handleEdit = async () => {
    setIsLoadingCompanies(true);
    try {
      const companiesData = await getCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setIsLoadingCompanies(false);
    }
    setIsEditOpen(true);
  };

  const onSubmit = async (values: EditPatientFormValues) => {
    try {
      const updatedPatient = await updatePatient(patient.id, {
        name: values.name,
        age: values.age,
        gender: values.gender,
        bloodType: values.bloodType,
        phone: values.phone || '',
        email: values.email || '',
        companyId: values.companyId === 'none' ? undefined : values.companyId,
      });

      onPatientUpdated?.(updatedPatient);
      setIsEditOpen(false);

      MySwal.fire({
        title: 'Actualizado',
        text: 'Los datos del paciente han sido actualizados exitosamente.',
        icon: 'success',
        confirmButtonText: 'Entendido',
        ...getSweetAlertConfig(sweetAlertTheme),
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      MySwal.fire({
        title: 'Error',
        text: 'No se pudieron actualizar los datos del paciente. Intente nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido',
        ...getSweetAlertConfig(sweetAlertTheme),
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar datos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-500">
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Datos del Paciente</DialogTitle>
            <DialogDescription>
              Modifica la información del paciente. Los cambios se guardarán inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Ej: Juan Pérez"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  {...form.register('age')}
                  placeholder="Ej: 35"
                />
                {form.formState.errors.age && (
                  <p className="text-sm text-red-500">{form.formState.errors.age.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Género</Label>
                <Select onValueChange={(value) => form.setValue('gender', value as any)} defaultValue={form.watch('gender')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.gender && (
                  <p className="text-sm text-red-500">{form.formState.errors.gender.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodType">Grupo Sanguíneo</Label>
                <Select onValueChange={(value) => form.setValue('bloodType', value as any)} defaultValue={form.watch('bloodType')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un tipo de sangre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.bloodType && (
                  <p className="text-sm text-red-500">{form.formState.errors.bloodType.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="Ej: +58 412 123 4567"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="Ej: juan@email.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyId">Empresa Afiliada</Label>
              <Select onValueChange={(value) => form.setValue('companyId', value)} defaultValue={form.watch('companyId')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Paciente Particular</SelectItem>
                  {isLoadingCompanies ? (
                    <SelectItem value="loading" disabled>Cargando empresas...</SelectItem>
                  ) : (
                    companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
