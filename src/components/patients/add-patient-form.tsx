'use client';

import { useEffect, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addPatient, getCompanies, testDatabaseConnection } from '@/lib/actions';
import { usePatientStore } from '@/lib/store/patient-store';
import type { Company } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  age: z.coerce.number().min(1, 'La edad debe ser mayor a 0.').max(120, 'La edad es inválida.'),
  gender: z.enum(['Masculino', 'Femenino', 'Otro'], { required_error: 'Seleccione un género.' }),
  phone: z.string().optional(),
  companyId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddPatientFormProps {
  onSuccess: () => void;
}

export function AddPatientForm({ onSuccess }: AddPatientFormProps) {
  const { toast } = useToast();
  const { addPatient: addPatientToStore } = usePatientStore();
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    getCompanies().then(setCompanies);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      age: undefined,
      phone: '',
      companyId: '',
    },
  });

  const {formState: { isSubmitting } } = form;

  const onSubmit = async (values: FormValues) => {
    try {
      // Test database connection first
      const isConnected = await testDatabaseConnection();
      if (!isConnected) {
        toast({
          variant: 'destructive',
          title: 'Error de Conexión',
          description: 'No se puede conectar a la base de datos. Verifique la configuración.',
        });
        return;
      }

      const newPatient = await addPatient({
        name: values.name,
        age: values.age,
        gender: values.gender,
        contact: {
            phone: values.phone || '',
            email: '',
        },
        companyId: values.companyId,
      });
      addPatientToStore(newPatient);
      toast({
        title: 'Paciente Agregado',
        description: `${newPatient.name} ha sido añadido a la lista.`,
      });
      onSuccess();
    } catch (error) {
      console.error('Error in onSubmit:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo agregar al paciente.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Juan Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Edad</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 45" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Género</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: 555-123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa Afiliada (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una empresa..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onSuccess}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Paciente'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
