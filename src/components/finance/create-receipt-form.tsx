'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getDoctors } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createReceipt } from '@/lib/actions';
import { useAuth } from '@/components/layout/auth-provider';
import type { Patient } from '@/lib/types';
import jsPDF from 'jspdf';
import { addUroVitalLogo } from '@/lib/pdf-helpers';
import { format } from 'date-fns';

const formSchema = z.object({
  userId: z.string().min(1, 'Debe seleccionar un paciente.'),
  type: z.enum(['Consulta', 'Afiliación'], {
    required_error: 'Debe seleccionar un tipo de comprobante.',
  }),
  amount: z.string().min(1, 'El monto es requerido.').refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'El monto debe ser un número válido mayor a 0.'),
  concept: z.string().min(3, 'El concepto debe tener al menos 3 caracteres.'),
  method: z.string().min(1, 'Debe seleccionar un método de pago.'),
  paymentType: z.enum(['Contado', 'Crédito'], {
    required_error: 'Debe seleccionar un tipo de pago.',
  }),
  doctorId: z.string().min(1, 'Debe seleccionar un doctor.'),
  plan: z.string().optional(),
}).refine((data) => {
  if (data.type === 'Afiliación') {
    return !!data.plan;
  }
  return true;
}, {
  message: 'Debe seleccionar un plan para afiliaciones',
  path: ['plan'],
});

type FormValues = z.infer<typeof formSchema>;

interface CreateReceiptFormProps {
  patients: Patient[];
  onSuccess: () => void;
}

const paymentMethods = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'tarjeta_debito', label: 'Tarjeta de Débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'binance', label: 'Binance' },
  { value: 'wally', label: 'Wally' },
  { value: 'zinli', label: 'Zinli' },
];

interface Doctor {
  id: string;
  userId: string;
  name?: string | null;
  nombre?: string | null;
  email?: string | null;
  especialidad?: string | null;
  cedula?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  area?: string | null;
  contacto?: string | null;
  avatarUrl?: string | null;
  doctorInfo?: {
    especialidad?: string | null;
    area?: string | null;
    contacto?: string | null;
  } | null;
}

export function CreateReceiptForm({ patients, onSuccess }: CreateReceiptFormProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      type: "Consulta",
      amount: "",
      concept: "",
      method: "",
      paymentType: "Contado",
      doctorId: "",
      plan: ""
    }
  });
  
  // Initialize state and hooks
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  // Get the current form values
  const formValues = form.watch();
  const selectedPatient = patients.find(p => p.id === formValues.userId);
  const selectedDoctor = doctors.find(d => d.id === formValues.doctorId);
  const receiptType = form.watch('type');

  // Update company when patient changes
  useEffect(() => {
    if (selectedPatient) {
      console.log('Paciente seleccionado:', selectedPatient);
      console.log('Company ID:', selectedPatient.companyId);
      
      if (selectedPatient.companyId) {
        setSelectedCompany(selectedPatient.companyId);
      } else {
        setSelectedCompany(null);
      }
    } else {
      setSelectedCompany(null);
    }
  }, [selectedPatient]);

  // Update form validation based on receipt type and company selection
  useEffect(() => {
    if (receiptType === 'Afiliación') {
      form.setValue('doctorId', '');
      form.clearErrors('doctorId');
    } else if (selectedCompany) {
      // If company is selected, doctor is optional
      form.clearErrors('doctorId');
    } else if (receiptType === 'Consulta' && !selectedCompany) {
      // If no company, doctor is required for Consulta
      form.trigger('doctorId');
    }
  }, [receiptType, selectedCompany, form]);

  // Format doctor name to ensure consistent display
  const formatDoctorName = (doctor: Doctor | string | null | undefined): string => {
    if (!doctor) return 'Seleccionar doctor';
    
    // If it's a string (ID), find the doctor in the doctors array
    let doctorObj: Doctor | undefined;
    if (typeof doctor === 'string') {
      doctorObj = doctors.find(d => d.id === doctor);
      if (!doctorObj) return 'Seleccionar doctor';
    } else {
      doctorObj = doctor;
    }
    
    // Get the name, trying multiple possible fields
    const name = (
      doctorObj.name || 
      doctorObj.nombre || 
      (doctorObj.doctorInfo?.especialidad ? `Dr. ${doctorObj.doctorInfo.especialidad}` : '')
    )?.trim();
    
    if (!name) return 'Seleccionar doctor';
    
    // Clean up any existing Dr. prefixes (case insensitive)
    const cleanName = name.replace(/^Dr\.?\s*/i, '').trim();
    
    // Return with Dr. prefix if we have a name, otherwise return default
    return cleanName ? `Dr. ${cleanName}` : 'Seleccionar doctor';
  };
  
  // Format patient name and ID for display
  const formatPatientDisplay = (patient: Patient | string | null | undefined) => {
    if (!patient) return 'Seleccionar paciente';
    
    // If it's a string (ID), find the patient in the patients array
    let patientObj: Patient | undefined;
    if (typeof patient === 'string') {
      patientObj = patients.find(p => p.id === patient);
      if (!patientObj) return 'Seleccionar paciente';
    } else {
      patientObj = patient;
    }
    
    // Get the name and ID, using the patient's name and cedula
    const name = (patientObj.name || '').trim() || 'Paciente';
    const id = (patientObj.cedula || patientObj.id || '').trim() || 'Sin cédula';
    
    return `${name} - ${id}`;
  };
  
  // Load doctors when component mounts
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        console.log('🔍 Loading doctors...');
        const doctorsList = await getDoctors();
        console.log('✅ Doctors loaded:', doctorsList);
        
        // Map the doctors to ensure consistent structure
        const mappedDoctors = doctorsList.map((doctor: any) => ({
          id: doctor.id,
          userId: doctor.userId || doctor.id,
          name: doctor.name || doctor.nombre || '',
          email: doctor.email || '',
          especialidad: doctor.especialidad || doctor.doctorInfo?.especialidad || 'General',
          cedula: doctor.cedula || '',
          telefono: doctor.telefono,
          direccion: doctor.direccion,
          area: doctor.area || doctor.doctorInfo?.area || '',
          contacto: doctor.contacto || doctor.doctorInfo?.contacto || '',
          avatarUrl: doctor.avatarUrl || ''
        }));
        
        setDoctors(mappedDoctors);
        
        // If there's only one doctor, select it by default
        if (mappedDoctors.length === 1) {
          form.setValue('doctorId', mappedDoctors[0].id);
          console.log('👨‍⚕️ Auto-selected doctor:', mappedDoctors[0]);
        }
      } catch (error) {
        console.error('❌ Error loading doctors:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar los doctores. Por favor, intente nuevamente.'
        });
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, [form, toast]);
  
  const generateReceiptPDF = async (receiptData: any, patient: Patient) => {
    const doc = new jsPDF();
    const margin = 14;

    // Add UroVital logo
    addUroVitalLogo(doc);

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(58, 109, 255);
    doc.text("UROVITAL - Sistema de Gestión Médica", doc.internal.pageSize.getWidth() / 2, 25, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Comprobante de Pago", doc.internal.pageSize.getWidth() / 2, 35, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Nº ${receiptData.number}`, doc.internal.pageSize.getWidth() / 2, 42, { align: "center" });

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Fecha de emisión: ${format(new Date(receiptData.createdAt), 'dd/MM/yyyy - HH:mm')}`, doc.internal.pageSize.getWidth() - margin, 20, { align: "right" });

    let y = 55;

    // Receipt details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    // Patient info
    doc.setFont("helvetica", "bold");
    doc.text("Datos del Paciente:", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre: ${patient.name}`, margin, y);
    y += 6;
    doc.text(`Cédula: ${patient.cedula}`, margin, y);
    y += 10;

    // Payment details
    doc.setFont("helvetica", "bold");
    doc.text("Detalles del Pago:", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text(`Concepto: ${receiptData.concept}`, margin, y);
    y += 6;
    doc.text(`Monto: $${Number(receiptData.amount).toFixed(2)}`, margin, y);
    y += 6;
    doc.text(`Método de pago: ${paymentMethods.find(m => m.value === receiptData.method)?.label || receiptData.method}`, margin, y);
    y += 10;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Emitido automáticamente por UroVital © 2025", doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

    return doc;
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      // Find the selected patient
      const selectedPatient = patients.find(p => p.id === data.userId);
      if (!selectedPatient) {
        throw new Error('Paciente no encontrado');
      }

      const selectedDoctor = doctors.find(d => d.id === data.doctorId);
  
      // Create receipt data with all required fields
      if (!data.userId) {
        throw new Error('Debe seleccionar un paciente');
      }
      
      if (!data.doctorId) {
        throw new Error('Debe seleccionar un doctor');
      }

      const receiptData = {
        patientUserId: data.userId,
        amount: parseFloat(data.amount),
        method: data.method,
        type: data.type,
        paymentType: data.paymentType,
        doctorId: data.doctorId,
        plan: data.plan,
        createdBy: currentUser?.id || 'system',
        notes: data.concept
      };

      // Call the API
      const result = await createReceipt(receiptData);

      // Generate PDF
      await generateReceiptPDF(result, selectedPatient);

      // Show success message
      toast({
        title: "Comprobante creado",
        description: "El comprobante se ha generado correctamente.",
      });

      // Close the form
      onSuccess();

    } catch (error) {
      console.error('Error creating receipt:', error);
      toast({
        variant: "destructive",
        title: "Error al crear comprobante",
        description: error instanceof Error ? error.message : "No se pudo crear el comprobante.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Nuevo Comprobante</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Comprobante */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Tipo de Comprobante</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Consulta">Consulta</SelectItem>
                      <SelectItem value="Afiliación">Afiliación</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => {
                // Find the selected patient to show in the placeholder when selected
                const selectedPatient = patients.find(p => p.id === field.value);
                return (
                  <FormItem>
                    <FormLabel className="font-semibold">Paciente</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      required={true}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar paciente">
                            {selectedPatient ? formatPatientDisplay(selectedPatient) : 'Seleccionar paciente'}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {formatPatientDisplay(patient)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Monto</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-8"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Tipo de Pago</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de pago" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Contado">Contado</SelectItem>
                      <SelectItem value="Crédito">Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Método de Pago</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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

            <FormItem>
              <FormLabel className="font-semibold">Empresa</FormLabel>
              <div className="flex items-center h-10 px-3 py-2 text-sm border rounded-md bg-gray-50">
                {selectedCompany ? (
                  <span className="text-foreground">
                    {patients.find(p => p.companyId === selectedCompany)?.companyName || 'Empresa no encontrada'}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Paciente Particular</span>
                )}
              </div>
              <input type="hidden" name="companyId" value={selectedCompany || ''} />
            </FormItem>

            {receiptType === 'Consulta' && (
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => {
                  const selectedDoctor = doctors.find(d => d.id === field.value);
                  return (
                    <FormItem>
                      <FormLabel className="font-semibold">Doctor</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={loadingDoctors}
                        required={true}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loadingDoctors ? 'Cargando doctores...' : 'Seleccionar doctor'
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingDoctors ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              Cargando doctores...
                            </div>
                          ) : (
                            doctors.map((doctor) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                {formatDoctorName(doctor)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            {receiptType === 'Afiliación' && (
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Plan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Tarjeta Saludable">Tarjeta Saludable</SelectItem>
                        <SelectItem value="Fondo Espíritu Santo">Fondo Espíritu Santo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="concept"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="font-semibold">Concepto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descripción del pago..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSuccess}
              className="min-w-[120px]"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !form.watch('userId') || !form.watch('doctorId')}
              className="min-w-[160px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Generando...' : 'Crear Comprobante'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
