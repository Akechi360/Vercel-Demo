'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Patient, User } from '@/lib/types';

const formSchema = z.object({
  serviceType: z.enum(['consulta', 'afiliacion'] as const, {
    required_error: 'Debe seleccionar un tipo de servicio',
  }),
  userId: z.string().min(1, 'Debe seleccionar un paciente'),
  doctorId: z.string().optional(),
  date: z.string().min(1, 'Debe seleccionar una fecha'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  method: z.string().min(1, 'Debe seleccionar un método de pago'),
  status: z.string().default('Pagado'),
}).refine(
  (data) => data.serviceType === 'afiliacion' || (data.serviceType === 'consulta' && data.doctorId),
  {
    message: 'Debe seleccionar un doctor para consultas',
    path: ['doctorId']
  }
);

type FormValues = z.infer<typeof formSchema>;

interface CreateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patients: Patient[];
  doctors: User[];
  editData?: any;
}

export function CreateReceiptModal({
  isOpen,
  onClose,
  onSuccess,
  patients,
  doctors,
  editData
}: CreateReceiptModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceType: editData?.serviceType || 'consulta',
      userId: editData?.userId || '',
      doctorId: editData?.doctorId || '',
      date: editData?.date || new Date().toISOString().slice(0, 16),
      amount: editData?.amount || 0,
      method: editData?.method || '',
      status: editData?.status || 'Pagado',
    },
  });

  const selectedPatient = patients.find(p => p.id === form.watch('userId'));

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (editData) {
        // TODO: Implementar edición de comprobante
        toast({
          title: "Función en desarrollo",
          description: "La edición de comprobantes estará disponible próximamente.",
        });
      } else {
        // Crear nuevo comprobante
        const { createReceipt } = await import('@/lib/actions');
        
        // Obtener el usuario actual del localStorage
        let createdBy = 'system'; // Valor por defecto seguro
        try {
          const currentUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
          if (currentUser) {
            const userData = JSON.parse(currentUser);
            if (userData?.id) {
              createdBy = userData.id;
            }
          }
        } catch (error) {
          console.error('Error getting current user:', error);
        }
        
        const label = data.serviceType === 'consulta' ? 'Consulta' : 'Afiliación';
        const date = new Date(data.date).toLocaleDateString();
        const concept = `${label} - ${date}`;
        
        const receiptData = {
          userId: data.userId,
          amount: data.amount,
          concept,
          method: data.method,
          createdBy,
          type: (data.serviceType === 'consulta' ? 'Consulta' : 'Afiliación') as 'Consulta' | 'Afiliación',
          paymentType: 'Contado' as const,
          doctorId: data.serviceType === 'consulta' ? data.doctorId : undefined,
          plan: '' // Add empty plan as it's optional in the type
        };

        await createReceipt(receiptData);
        
        toast({
          title: "Comprobante creado correctamente",
          description: "El comprobante ha sido guardado exitosamente.",
        });
      }

      onSuccess();
      onClose();
      form.reset();
    } catch (error) {
      console.error('Error creating receipt:', error);
      toast({
        variant: "destructive",
        title: "Error al crear comprobante",
        description: "No se pudo crear el comprobante. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'punto', label: 'Punto' },
    { value: 'zelle', label: 'Zelle' },
  ];

  const statusOptions = [
    { value: 'Pagado', label: 'Pagado' },
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'Anulado', label: 'Anulado' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {editData ? 'Editar Comprobante' : 'Crear Comprobante'}
            </DialogTitle>
            <DialogDescription>
              {editData 
                ? 'Modifica los datos del comprobante seleccionado.'
                : 'Completa los datos para crear un nuevo comprobante de pago.'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Servicio */}
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Servicio *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo de servicio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="consulta">Consulta Médica</SelectItem>
                          <SelectItem value="afiliacion">Afiliación</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Paciente */}
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paciente *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar paciente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name} - {patient.cedula}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Empresa */}
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input 
                      value={selectedPatient?.companyName || 'Paciente Particular'} 
                      disabled 
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormControl>
                </FormItem>

                {/* Doctor (solo para consultas) */}
                {form.watch('serviceType') === 'consulta' && (
                  <FormField
                    control={form.control}
                    name="doctorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar doctor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {doctors.map((doctor) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                {doctor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Fecha */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Monto */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Método de Pago */}
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Estado */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editData ? 'Actualizar Comprobante' : 'Guardar Comprobante'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
