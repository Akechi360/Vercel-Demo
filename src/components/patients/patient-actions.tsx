'use client';

import { useState, useMemo } from 'react';
import type { Patient, Company } from '@/lib/types';
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
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, Edit, Trash2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
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
  fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  gender: z.enum(['Masculino', 'Femenino', 'Otro'], { required_error: 'Seleccione un género' }),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], { required_error: 'Seleccione un tipo de sangre' }),
  cedula: z.string().min(1, 'La cédula es requerida').regex(/^[VvEeJj]\d{6,9}$/, 'Formato de cédula inválido (V12345678, E12345678, J12345678)'),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  phone: z.string().optional(),
  email: z.string().email('Dirección de correo inválida').optional().or(z.literal('')),
  companyId: z.string().optional(),
});

type EditPatientFormValues = z.infer<typeof editPatientSchema>;

interface PatientActionsProps {
  patient: Patient;
  onPatientUpdated?: (updatedPatient: Patient) => void;
  onPatientDeleted?: (userId: string) => void;
}

const calculateAge = (birthDate: string | Date): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export default function PatientActions({ patient, onPatientUpdated, onPatientDeleted }: PatientActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const sweetAlertTheme = useSweetAlertTheme();

  // Generate years for the year selector (100 years range)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => currentYear - i);
  }, []);
  
  // Months in Spanish
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // Calcular fechaNacimiento desde la edad actual o usar fechaNacimiento si existe
  const getDefaultFechaNacimiento = (): string => {
    if ((patient as any).fechaNacimiento) {
      return (patient as any).fechaNacimiento;
    }
    // Si no hay fechaNacimiento, calcular aproximada desde edad
    const today = new Date();
    const ageNum = Number(patient.age);
    if (!Number.isFinite(ageNum) || ageNum <= 0) return '';
    
    const year = today.getFullYear() - ageNum;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const form = useForm<EditPatientFormValues>({
    resolver: zodResolver(editPatientSchema),
    defaultValues: {
      name: patient.name,
      fechaNacimiento: getDefaultFechaNacimiento(),
      gender: patient.gender,
      bloodType: patient.bloodType as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
      cedula: patient.cedula || '',
      direccion: patient.direccion || '',
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
        fechaNacimiento: values.fechaNacimiento,
        gender: values.gender,
        bloodType: values.bloodType,
        cedula: values.cedula,
        direccion: values.direccion,
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
                <Label htmlFor="edad">Edad</Label>
                <Input
                  id="edad"
                  type="number"
                  value={form.watch('fechaNacimiento') ? calculateAge(form.watch('fechaNacimiento')) : patient.age || 0}
                  disabled
                  className="cursor-not-allowed bg-muted"
                  placeholder="Calculada automáticamente"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Nacimiento *</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch('fechaNacimiento') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('fechaNacimiento') ? (
                      new Date(form.watch('fechaNacimiento')).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    ) : (
                      <span>Seleccione una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Mes:</h4>
                        <div className="relative">
                          <button
                            type="button"
                            className="absolute left-0 top-0 bottom-0 px-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSelectedMonth(prev => (prev > 0 ? prev - 1 : 11));
                            }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          
                          <div 
                            className="w-full text-center border rounded-md py-2 px-8 bg-background"
                            onWheel={(e) => {
                              e.preventDefault();
                              setSelectedMonth(prev => {
                                const delta = e.deltaY > 0 ? 1 : -1;
                                return (prev - delta + 12) % 12;
                              });
                            }}
                          >
                            {months[selectedMonth]}
                          </div>
                          
                          <button
                            type="button"
                            className="absolute right-0 top-0 bottom-0 px-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSelectedMonth(prev => (prev + 1) % 12);
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Año:</h4>
                        <div className="relative">
                          <button
                            type="button"
                            className="absolute left-0 top-0 bottom-0 px-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              const currentIndex = years.findIndex(y => y === selectedYear);
                              if (currentIndex > 0) {
                                setSelectedYear(years[currentIndex - 1]);
                              }
                            }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          
                          <div 
                            className="w-full text-center border rounded-md py-2 px-8 bg-background"
                            onWheel={(e) => {
                              e.preventDefault();
                              const currentIndex = years.findIndex(y => y === selectedYear);
                              const delta = e.deltaY > 0 ? 1 : -1;
                              const newIndex = Math.min(Math.max(0, currentIndex + delta), years.length - 1);
                              if (newIndex !== currentIndex) {
                                setSelectedYear(years[newIndex]);
                              }
                            }}
                          >
                            {selectedYear}
                          </div>
                          
                          <button
                            type="button"
                            className="absolute right-0 top-0 bottom-0 px-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              const currentIndex = years.findIndex(y => y === selectedYear);
                              if (currentIndex < years.length - 1) {
                                setSelectedYear(years[currentIndex + 1]);
                              }
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <style jsx>{`
                        .rdp {
                          --rdp-cell-size: 40px;
                          --rdp-accent-color: #3b82f6;
                          --rdp-background-color: #e0f2fe;
                          margin: 0;
                        }
                        .rdp-caption {
                          display: none !important;
                        }
                        .rdp-table {
                          margin: 0;
                        }
                        .rdp-day {
                          height: var(--rdp-cell-size);
                          width: var(--rdp-cell-size);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          border-radius: 0.5rem;
                          margin: 0;
                        }
                        .rdp-day_selected {
                          background-color: var(--rdp-accent-color) !important;
                          color: white !important;
                        }
                        .rdp-day_today:not(.rdp-day_selected) {
                          background-color: #f3f4f6;
                          color: #111827;
                        }
                      `}</style>
                      <Calendar
                        mode="single"
                        selected={form.watch('fechaNacimiento') ? 
                          new Date(form.watch('fechaNacimiento')) : 
                          undefined}
                        onSelect={(date) => {
                          if (date) {
                            // Obtener fecha local directamente
                            const localDate = new Date(date);
                            const year = localDate.getFullYear();
                            const month = String(localDate.getMonth() + 1).padStart(2, '0');
                            const day = String(localDate.getDate()).padStart(2, '0');
                            const formattedDate = `${year}-${month}-${day}`;
                            
                            console.log('Fecha seleccionada:', { 
                              raw: date, 
                              local: localDate, 
                              formatted: formattedDate 
                            });
                            
                            form.setValue('fechaNacimiento', formattedDate, { shouldValidate: true });
                            setSelectedYear(year);
                            setSelectedMonth(parseInt(month, 10) - 1);
                            setIsCalendarOpen(false);
                          }
                        }}
                        month={new Date(selectedYear, selectedMonth)}
                        onMonthChange={(date) => {
                          setSelectedYear(date.getFullYear());
                          setSelectedMonth(date.getMonth());
                        }}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                        className="p-0"
                        components={{
                          Caption: () => null,
                          CaptionLabel: () => null,
                          IconLeft: () => null,
                          IconRight: () => null,
                        }}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {form.formState.errors.fechaNacimiento && (
                <p className="text-sm text-red-500">{form.formState.errors.fechaNacimiento.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Género</Label>
                <Select onValueChange={(value) => form.setValue('gender', value as 'Masculino' | 'Femenino' | 'Otro')} defaultValue={form.watch('gender')}>
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
                <Select onValueChange={(value) => form.setValue('bloodType', value as "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-")} defaultValue={form.watch('bloodType')}>
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
                <Label htmlFor="cedula">Cédula</Label>
                <Input
                  id="cedula"
                  {...form.register('cedula')}
                  placeholder="Ej: V12345678"
                />
                {form.formState.errors.cedula && (
                  <p className="text-sm text-red-500">{form.formState.errors.cedula.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  {...form.register('direccion')}
                  placeholder="Ej: Av. Principal, Edif. Ejemplo, Piso 2"
                />
                {form.formState.errors.direccion && (
                  <p className="text-sm text-red-500">{form.formState.errors.direccion.message}</p>
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
