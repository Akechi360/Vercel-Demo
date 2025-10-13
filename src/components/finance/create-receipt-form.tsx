'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  amount: z.string().min(1, 'El monto es requerido.').refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'El monto debe ser un número válido mayor a 0.'),
  concept: z.string().min(3, 'El concepto debe tener al menos 3 caracteres.'),
  method: z.string().min(1, 'Debe seleccionar un método de pago.'),
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

export function CreateReceiptForm({ patients, onSuccess }: CreateReceiptFormProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      amount: '',
      concept: '',
      method: '',
    },
  });

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

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Find selected patient
      const selectedPatient = patients.find(p => p.id === values.userId);
      if (!selectedPatient) {
        throw new Error('Paciente no encontrado');
      }

      // Create receipt in database
      const receiptData = await createReceipt({
        userId: values.userId,
        amount: parseFloat(values.amount),
        concept: values.concept,
        method: values.method,
        createdBy: currentUser.email,
      });

      toast({
        title: "Comprobante creado exitosamente ✅",
        description: `El comprobante ${receiptData.number} ha sido creado. Puedes generar el PDF desde la lista de comprobantes.`,
      });

      form.reset();
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paciente *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un paciente" />
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
                  placeholder="0.00" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="concept"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Concepto *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ej: Consulta médica, Examen de laboratorio, etc." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pago *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona método de pago" />
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

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Generando...' : 'Crear Comprobante'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
