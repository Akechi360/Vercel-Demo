'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, CalendarIcon, Pill, FileText, Trash2, PlusCircle } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileInput } from '@/components/ui/file-input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Types and Actions
import type { Consultation } from '@/lib/types';
import { getDoctors } from '@/lib/actions';

// Define types for form values
export type ReportAttachment = {
  name: string;
  type: string;
  size: number;
  url: string;
};

type ReportFormValues = {
  id?: string;
  title: string;
  date?: string;
  file?: File | string | null;
  fileUrl?: string;
  attachments?: ReportAttachment[];
};

type PrescriptionFormValues = {
  id?: string;
  medication: string;
  dosage: string;
  duration: string;
};

type LabResultFormValues = {
  id?: string;
  testName: string;
  value: string;
  referenceRange?: string;
  date: string;
};

const formSchema = z.object({
  date: z.date({ required_error: "Se requiere una fecha." }),
  doctor: z.string().min(2, "Se requiere el nombre del doctor."),
  type: z.enum(['Inicial', 'Seguimiento', 'Pre-operatorio', 'Post-operatorio'] as const),
  notes: z.string().min(10, "Las notas deben tener al menos 10 caracteres."),
  prescriptions: z.array(z.object({
    id: z.string().optional(),
    medication: z.string().min(1, "Se requiere el medicamento."),
    dosage: z.string().min(1, "Se requiere la dosis."),
    duration: z.string().min(1, "Se requiere la duración."),
  })).optional(),
  reports: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1, "Se requiere el título del informe."),
    date: z.string().optional(),
    file: z.any().optional(),
    fileUrl: z.string().optional(),
    attachments: z.array(z.object({
      name: z.string(),
      type: z.string(),
      size: z.number(),
      url: z.string()
    })).optional(),
  })).optional(),
  labResults: z.array(z.object({
    id: z.string().optional(),
    testName: z.string(),
    value: z.string(),
    referenceRange: z.string().optional(),
    date: z.string(),
  })).optional(),
});

// Export the form values type for use in other components
export type ConsultationFormValues = z.infer<typeof formSchema>;
type FormValues = ConsultationFormValues;

// Define doctor type
interface Doctor {
  id: string;
  name: string;
  avatarUrl?: string;
  especialidad?: string;
}

interface ConsultationFormProps {
  userId: string;
  initialData?: Partial<Consultation>;
  onFormSubmit: (values: FormValues) => Promise<void>;
}

export function ConsultationForm({ userId, initialData, onFormSubmit }: ConsultationFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData?.date 
        ? (() => {
            const dateValue = typeof initialData.date === 'string' 
              ? new Date(initialData.date) 
              : new Date(initialData.date);
            return isNaN(dateValue.getTime()) ? new Date() : dateValue;
          })()
        : new Date(),
      doctor: initialData?.doctor || '',
      type: initialData?.type || 'Seguimiento',
      notes: initialData?.notes || '',
      prescriptions: initialData?.prescriptions || [],
      reports: initialData?.reports || [],
      labResults: initialData?.labResults || [],
    },
  });

  // Set up field arrays
  const {
    fields: prescriptionFields,
    append: appendPrescription,
    remove: removePrescription,
  } = useFieldArray({
    control: form.control,
    name: 'prescriptions',
  });

  const {
    fields: reportFields,
    append: appendReport,
    remove: removeReport,
  } = useFieldArray({
    control: form.control,
    name: 'reports',
  });

  // Fetch doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);
        const doctorsData = await getDoctors();
        const formattedDoctors = doctorsData.map((doctor: any) => ({
          id: doctor.userId || doctor.id,
          name: doctor.name || '',
          avatarUrl: doctor.avatarUrl,
          especialidad: doctor.doctorInfo?.especialidad,
        }));
        setDoctors(formattedDoctors);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los doctores. Por favor, intente nuevamente.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, [toast]);

  // Set default doctor if not already set
  useEffect(() => {
    if (doctors.length > 0) {
      const currentDoctorId = form.getValues('doctor');
      if (currentDoctorId) {
        const doctor = doctors.find(d => d.id === currentDoctorId);
        if (doctor) setSelectedDoctor(doctor);
      } else if (doctors[0]) {
        form.setValue('doctor', doctors[0].id);
        setSelectedDoctor(doctors[0]);
      }
    }
  }, [doctors, form]);

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setIsProcessingFiles(true);
      await onFormSubmit(values);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar la consulta. Por favor, intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingFiles(false);
    }
  };

  // Handle adding a new prescription
  const handleAddPrescription = () => {
    appendPrescription({
      medication: '',
      dosage: '',
      duration: '',
    });
  };

  // Handle adding a new report
  const handleAddReport = () => {
    appendReport({
      title: '',
      date: new Date().toISOString(),
      attachments: [],
    });
  };

  // Handle file upload for reports
  const handleFileUpload = async (file: File, reportIndex: number) => {
    try {
      setIsProcessingFiles(true);
      // In a real app, you would upload the file to a server here
      // For now, we'll just create a local URL for the file
      const fileUrl = URL.createObjectURL(file);
      
      // Update the form with the new file
      const currentReports = form.getValues('reports') || [];
      const updatedReports = [...currentReports];
      
      if (!updatedReports[reportIndex]) {
        updatedReports[reportIndex] = { 
          title: '', 
          date: format(new Date(), 'yyyy-MM-dd'), 
          attachments: [] 
        };
      }
      
      const newAttachment: ReportAttachment = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: fileUrl
      };
      
      if (!updatedReports[reportIndex].attachments) {
        updatedReports[reportIndex].attachments = [];
      }
      
      updatedReports[reportIndex].attachments!.push(newAttachment);
      
      form.setValue('reports', updatedReports);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el archivo. Por favor, intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingFiles(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Doctor Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="doctor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    const doctor = doctors.find(d => d.id === value);
                    if (doctor) setSelectedDoctor(doctor);
                  }}
                  value={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={doctor.avatarUrl} alt={doctor.name} />
                            <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{doctor.name}</span>
                          {doctor.especialidad && (
                            <span className="text-muted-foreground text-xs">
                              ({doctor.especialidad})
                            </span>
                          )}
                        </div>
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
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de la consulta</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Seleccione una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Consultation Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de consulta</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el tipo de consulta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Inicial">Inicial</SelectItem>
                  <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                  <SelectItem value="Pre-operatorio">Pre-operatorio</SelectItem>
                  <SelectItem value="Post-operatorio">Post-operatorio</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas de la consulta</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Escriba las notas de la consulta..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Prescriptions Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="prescriptions">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                <span>Recetas Médicas</span>
                <span className="text-sm text-muted-foreground">
                  ({prescriptionFields.length})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {prescriptionFields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-3 relative">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Receta {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePrescription(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`prescriptions.${index}.medication`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medicamento</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Paracetamol" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`prescriptions.${index}.dosage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dosis</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: 500mg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`prescriptions.${index}.duration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duración</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: 7 días" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleAddPrescription}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar receta
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Reports Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="reports">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Informes y Exámenes</span>
                <span className="text-sm text-muted-foreground">
                  ({reportFields.length})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {reportFields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-3 relative">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Informe {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeReport(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`reports.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título del informe</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Radiografía de tórax" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`reports.${index}.file`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Archivo adjunto</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="application/pdf,image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(file, index);
                                  }
                                }}
                                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                              {field.value?.[0]?.url && (
                                <a 
                                  href={field.value[0].url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  Ver archivo
                                </a>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleAddReport}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar informe
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || isProcessingFiles}>
            {isLoading || isProcessingFiles ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar consulta'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default ConsultationForm;
