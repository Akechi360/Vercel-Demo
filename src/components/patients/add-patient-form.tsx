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
import { Badge } from '@/components/ui/badge';
import { addPatient, addPatientFromUser, getCompanies, listSelectablePatientUsers, testDatabaseConnection } from '@/lib/actions';
import { usePatientStore } from '@/lib/store/patient-store';
import type { Company } from '@/lib/types';
import Swal from 'sweetalert2';

const formSchema = z.object({
  userSelection: z.enum(['new', 'existing'], { required_error: 'Seleccione una opción.' }),
  userId: z.string().optional(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.').optional(),
  age: z.coerce.number().min(1, 'La edad debe ser mayor a 0.').max(120, 'La edad es inválida.'),
  gender: z.enum(['Masculino', 'Femenino', 'Otro'], { required_error: 'Seleccione un género.' }),
  phone: z.string().optional(),
  email: z.string().email('Dirección de correo inválida.').optional().or(z.literal('')),
  companyId: z.string().optional(),
}).refine((data) => {
  if (data.userSelection === 'existing' && !data.userId) {
    return false;
  }
  if (data.userSelection === 'new' && !data.name) {
    return false;
  }
  return true;
}, {
  message: 'Complete todos los campos requeridos.',
  path: ['userSelection']
});

type FormValues = z.infer<typeof formSchema>;

interface AddPatientFormProps {
  onSuccess: () => void;
}

export function AddPatientForm({ onSuccess }: AddPatientFormProps) {
  const { addPatient: addPatientToStore } = usePatientStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectableUsers, setSelectableUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    status: string;
  }>>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        const [companiesData, usersData] = await Promise.all([
          getCompanies(),
          listSelectablePatientUsers()
        ]);
        
        console.log('🏢 Available companies:', companiesData);
        console.log('👥 Available users:', usersData);
        
        setCompanies(companiesData);
        setSelectableUsers(usersData);
      } catch (error) {
        console.error('❌ Error loading data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar los datos';
        
        Swal.fire({
          title: 'Error de Carga',
          text: `No se pudieron cargar los datos: ${errorMessage}`,
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userSelection: 'new',
      userId: '',
      name: '',
      age: undefined,
      phone: '',
      email: '',
      companyId: '',
    },
  });

  const {formState: { isSubmitting } } = form;

  const onSubmit = async (values: FormValues) => {
    console.log('🚀 onSubmit function called with values:', values);
    try {
      // Test database connection first
      console.log('🔍 Testing database connection...');
      const isConnected = await testDatabaseConnection();
      if (!isConnected) {
        console.error('❌ Database connection failed');
        await Swal.fire({
          title: 'Error de Conexión',
          text: 'No se pudo conectar a la base de datos. Por favor, intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
        return;
      }
      console.log('✅ Database connection successful');

      console.log('🔍 Form values:', values);
      console.log('🔍 CompanyId from form:', values.companyId);
      console.log('🔍 Processed companyId:', values.companyId === 'none' ? undefined : values.companyId);
      
      let newPatient;
      
      if (values.userSelection === 'existing' && values.userId) {
        // Create patient from existing user
        newPatient = await addPatientFromUser(values.userId, {
          age: values.age,
          gender: values.gender,
          companyId: values.companyId === 'none' ? undefined : values.companyId,
        });
      } else {
        // Create new patient with manual data
        newPatient = await addPatient({
          name: values.name!,
          age: values.age,
          gender: values.gender,
          contact: {
              phone: values.phone || '',
              email: values.email || '',
          },
          companyId: values.companyId === 'none' ? undefined : values.companyId,
        });
      }
      
      addPatientToStore(newPatient);
      console.log('✅ Patient added successfully:', newPatient);
      
      // Mostrar mensaje de éxito
      await Swal.fire({
        title: '¡Éxito!',
        text: 'El paciente ha sido agregado correctamente.',
        icon: 'success',
        confirmButtonText: 'Entendido'
      });
      
      // Paciente agregado exitosamente
      onSuccess();
    } catch (error) {
      console.error('❌ Error in onSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al agregar el paciente';
      
      await Swal.fire({
        title: 'Error',
        text: `No se pudo agregar el paciente: ${errorMessage}`,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del formulario...</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="userSelection"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Paciente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una opción..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="new">Nuevo Paciente</SelectItem>
                  <SelectItem value="existing">Usuario Existente</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {form.watch('userSelection') === 'existing' && (
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seleccionar Usuario</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un usuario..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectableUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{user.name} ({user.email})</span>
                          <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'} className="ml-2">
                            {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {form.watch('userSelection') === 'new' && (
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
        )}
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico (Opcional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Ej: juan@ejemplo.com" {...field} />
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
