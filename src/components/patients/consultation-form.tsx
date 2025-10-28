'use client';
<<<<<<< HEAD
=======

>>>>>>> 6ab26e7 (main)
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Pill, FileText, Trash2, PlusCircle } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Consultation, Doctor, Report } from "@/lib/types";
import { FileInput } from "../ui/file-input";
import { getDoctors } from "@/lib/actions";

const formSchema = z.object({
  date: z.date({ required_error: "Se requiere una fecha." }),
  doctor: z.string().min(2, "Se requiere el nombre del doctor."),
<<<<<<< HEAD
  type: z.enum(['Inicial' , 'Seguimiento' , 'Pre-operatorio' , 'Post-operatorio']),
=======
  type: z.enum(['Inicial', 'Seguimiento', 'Pre-operatorio', 'Post-operatorio']),
>>>>>>> 6ab26e7 (main)
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
<<<<<<< HEAD
    file: z.instanceof(File).optional(),
=======
    file: z.instanceof(File).optional().or(z.string().optional()),
    fileUrl: z.string().optional(),
    attachments: z.array(z.object({
      name: z.string(),
      type: z.string(),
      size: z.number(),
      url: z.string()
    })).optional()
>>>>>>> 6ab26e7 (main)
  })).optional(),
  labResults: z.array(z.object({
    id: z.string().optional(),
    testName: z.string(),
    value: z.string(),
    referenceRange: z.string().optional(),
    date: z.string(),
  })).optional(),
})

<<<<<<< HEAD
export type ConsultationFormValues = Omit<Consultation, 'id' | 'userId'>;


interface ConsultationFormProps {
    userId: string;
    onFormSubmit: (values: ConsultationFormValues) => void;
=======
export type ConsultationFormValues = Omit<z.infer<typeof formSchema>, 'date'> & { date: string };

interface ConsultationFormProps {
  userId: string;
  onFormSubmit: (values: ConsultationFormValues) => void;
>>>>>>> 6ab26e7 (main)
}

export function ConsultationForm({ userId, onFormSubmit }: ConsultationFormProps) {
  const { toast } = useToast()
<<<<<<< HEAD
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsData = await getDoctors();
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Error fetching doctors:', error);
=======
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; avatarUrl?: string; especialidad?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  // SINGLE form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      doctor: '',
      type: 'Seguimiento',
      notes: '',
      prescriptions: [],
      reports: [],
      labResults: []
    },
  });

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        console.log('🔍 Fetching doctors...');
        const doctorsData = await getDoctors();
        console.log('📋 Doctors data:', doctorsData);

        const formattedDoctors = doctorsData.map((doctor: any) => ({
          id: doctor.userId || doctor.id,
          name: doctor.name || '',
          avatarUrl: doctor.avatarUrl,
          especialidad: doctor.doctorInfo?.especialidad
        }));

        setDoctors(formattedDoctors);
      } catch (error) {
        console.error('❌ Error fetching doctors:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los doctores. Intente nuevamente.",
        });
        setDoctors([]);
>>>>>>> 6ab26e7 (main)
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
<<<<<<< HEAD
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        date: new Date(),
        doctor: doctors.length > 0 ? doctors[0].id : "",
        type: "Inicial",
        notes: "",
        prescriptions: [],
        reports: [],
        labResults: [],
    },
  })

  // Update doctor default value when doctors are loaded
  useEffect(() => {
    if (doctors.length > 0 && !form.getValues('doctor')) {
      form.setValue('doctor', doctors[0].id);
=======
  }, [toast]);

  // Set default doctor
  useEffect(() => {
    if (doctors.length > 0 && !form.getValues('doctor')) {
      const firstDoctor = doctors[0];
      if (firstDoctor && firstDoctor.id) {
        form.setValue('doctor', firstDoctor.id);
      }
>>>>>>> 6ab26e7 (main)
    }
  }, [doctors, form]);

  const { fields: prescriptionFields, append: appendPrescription, remove: removePrescription } = useFieldArray({
    control: form.control,
    name: "prescriptions",
  });

  const { fields: reportFields, append: appendReport, remove: removeReport } = useFieldArray({
    control: form.control,
    name: "reports",
  });

<<<<<<< HEAD
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsProcessingFiles(true);
    
    try {
      // Find the doctor name by ID
      const selectedDoctor = doctors.find(doctor => doctor.id === values.doctor);
      const doctorName = selectedDoctor ? selectedDoctor.nombre : values.doctor;
    
    // Procesar archivos antes de enviar
    const processFiles = async (files: File[]) => {
      const processedFiles = [];
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB límite por archivo
      
      for (const file of files) {
        if (file && file.size > 0) {
          // Validar tamaño del archivo
          if (file.size > MAX_FILE_SIZE) {
            console.warn(`Archivo ${file.name} es demasiado grande (${file.size} bytes). Máximo permitido: ${MAX_FILE_SIZE} bytes`);
            continue;
          }
          
          // Validar tipo de archivo
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
          if (!allowedTypes.includes(file.type)) {
            console.warn(`Tipo de archivo ${file.type} no permitido para ${file.name}`);
            continue;
          }
          
          try {
            // Convertir archivo a base64 para almacenamiento
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            
            processedFiles.push({
              name: file.name,
              type: file.type,
              size: file.size,
              data: base64
            });
          } catch (error) {
            console.error(`Error procesando archivo ${file.name}:`, error);
          }
        }
      }
      return processedFiles;
    };
    
    const formattedValues: ConsultationFormValues = {
        ...values,
        doctor: doctorName, // Convert ID back to name for the API
        date: values.date.toISOString(),
        prescriptions: (values.prescriptions || []).map(p => ({ ...p, id: p.id || `rx-${Date.now()}-${Math.random()}` })),
        reports: await Promise.all((values.reports || []).map(async r => {
            console.log('📝 Procesando reporte:', {
                hasFile: !!r.file,
                fileName: r.file?.name,
                fileType: r.file?.type,
                fileSize: r.file?.size
            });
            
            const attachments = r.file ? await processFiles([r.file]) : [];
            const firstAttachment = attachments[0];
            
            console.log('📎 Archivos procesados:', {
                attachmentsCount: attachments.length,
                firstAttachment: firstAttachment ? {
                    name: firstAttachment.name,
                    type: firstAttachment.type,
                    size: firstAttachment.size,
                    hasData: !!firstAttachment.data,
                    dataLength: firstAttachment.data?.length || 0,
                    dataPreview: firstAttachment.data?.substring(0, 100)
                } : null
            });
            
            // Limpiar el prefijo "data:...;base64," del contenido base64
            let cleanBase64 = firstAttachment?.data;
            if (cleanBase64 && cleanBase64.includes(',')) {
                cleanBase64 = cleanBase64.split(',')[1]; // Obtener solo la parte base64
            }
            
            console.log('🧹 Base64 limpio:', {
                hasCleanBase64: !!cleanBase64,
                cleanBase64Length: cleanBase64?.length || 0,
                cleanBase64Preview: cleanBase64?.substring(0, 100)
            });
            
            const reportData: Report = {
                id: `temp-${Date.now()}-${Math.random()}`, // ID temporal, se reemplazará en la BD
                userId: userId,
                title: r.title || 'Sin título',
                date: new Date().toISOString(),
                type: firstAttachment?.type || r.file?.type || 'application/pdf',
                notes: '',
                fileUrl: firstAttachment?.name || r.file?.name || '#',
                attachments: attachments.map(att => att.name || 'file'),
                // Campos necesarios para almacenar el archivo en base64
                archivoNombre: firstAttachment?.name || r.file?.name,
                archivoTipo: firstAttachment?.type || r.file?.type,
                archivoContenido: cleanBase64, // Base64 limpio (sin prefijo data:)
                archivoTamaño: firstAttachment?.size || r.file?.size,
            };
            
            console.log('✅ Datos del reporte a enviar:', {
                title: reportData.title,
                archivoNombre: reportData.archivoNombre,
                archivoTipo: reportData.archivoTipo,
                archivoTamaño: reportData.archivoTamaño,
                hasArchivoContenido: !!reportData.archivoContenido,
                archivoContenidoLength: reportData.archivoContenido?.length || 0
            });
            
            return reportData;
        })),
        labResults: (values.labResults || []).map(lr => ({
          ...lr,
          id: lr.id || `lab-${Date.now()}-${Math.random()}`
        })),
    }
    onFormSubmit(formattedValues);
    form.reset();
    } catch (error) {
      console.error('Error procesando archivos:', error);
      toast({
        title: "Error",
        description: "Hubo un problema procesando los archivos. Inténtalo de nuevo.",
        variant: "destructive",
=======
  // onSubmit function - DEFINED BEFORE return
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsProcessingFiles(true);

    // Process files function
    const processFiles = async (files: (File | string)[] = []): Promise<{name: string; type: string; size: number; url: string}[]> => {
      try {
        const processedFiles = await Promise.all(
          files.map(async (file) => {
            if (typeof file === 'string') {
              return {
                name: file.split('/').pop() || 'file',
                type: 'application/octet-stream',
                size: 0,
                url: file
              };
            }

            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              url: `data:${file.type};base64,${base64}`
            };
          })
        );
        return processedFiles;
      } catch (error) {
        console.error('Error processing files:', error);
        return [];
      }
    };

    try {
      // Find doctor name
      const selectedDoctor = doctors.find(doctor => doctor.id === values.doctor);
      const doctorName = selectedDoctor ? selectedDoctor.name : values.doctor;

      // Process reports
      const reports = await Promise.all((values.reports || []).map(async (r: any) => {
        const filesToProcess = r.file ? [r.file] : [];
        const attachments = await processFiles(filesToProcess);
        const firstAttachment = attachments[0];

        const getFileInfo = () => {
          if (firstAttachment) {
            return {
              name: firstAttachment.name,
              type: firstAttachment.type,
              size: firstAttachment.size,
              url: firstAttachment.url
            };
          }

          if (r.file) {
            if (typeof r.file === 'string') {
              const fileName = r.file.split('/').pop() || 'file';
              return {
                name: fileName,
                type: 'application/octet-stream',
                size: 0,
                url: r.file
              };
            }

            return {
              name: r.file.name,
              type: r.file.type,
              size: r.file.size,
              url: `#${r.file.name}`
            };
          }

          return {
            name: 'document.pdf',
            type: 'application/pdf',
            size: 0,
            url: '#'
          };
        };

        const fileInfo = getFileInfo();

        return {
          id: r.id || `report-${Date.now()}-${Math.random()}`,
          userId: userId,
          title: r.title || 'Sin título',
          date: r.date || new Date().toISOString(),
          type: r.type || 'Informe',
          notes: r.notes || r.title || '',
          fileUrl: fileInfo.url,
          attachments: [fileInfo],
          archivoNombre: fileInfo.name,
          archivoTipo: fileInfo.type,
          archivoContenido: fileInfo.url,
          archivoTamaño: fileInfo.size,
        };
      }));

      // Process lab results
      const labResults = (values.labResults || []).map((lr: any) => ({
        ...lr,
        id: lr.id || `lab-${Date.now()}-${Math.random()}`
      }));

      // Process prescriptions
      const prescriptions = (values.prescriptions || []).map((p: any) => ({
        ...p,
        id: p.id || `rx-${Date.now()}-${Math.random()}`
      }));

      // Format final values
      const formattedValues: ConsultationFormValues = {
        doctor: doctorName,
        date: values.date.toISOString(),
        type: values.type,
        notes: values.notes,
        prescriptions: prescriptions,
        reports: reports,
        labResults: labResults
      };

      console.log('✅ Datos a enviar:', formattedValues);

      onFormSubmit(formattedValues);
      form.reset();

      toast({
        title: 'Éxito',
        description: 'La consulta ha sido guardada correctamente.',
        variant: 'default'
      });

    } catch (error) {
      console.error('Error al procesar el formulario:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar la consulta. Por favor, intente nuevamente.',
        variant: 'destructive'
>>>>>>> 6ab26e7 (main)
      });
    } finally {
      setIsProcessingFiles(false);
    }
<<<<<<< HEAD
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="max-h-[70vh] overflow-y-auto pr-4">
          <div className="space-y-4">
=======
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Date Field */}
>>>>>>> 6ab26e7 (main)
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de la Consulta</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Elige una fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
<<<<<<< HEAD
=======

            {/* Doctor Field */}
>>>>>>> 6ab26e7 (main)
            <FormField
              control={form.control}
              name="doctor"
              render={({ field }) => {
                const selectedDoctor = doctors.find(d => d.id === field.value);
                return (
                  <FormItem>
                    <FormLabel>Doctor</FormLabel>
<<<<<<< HEAD
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un doctor" />
=======
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un doctor">
                            {loading ? (
                              <span>Cargando doctores...</span>
                            ) : selectedDoctor ? (
                              <div className="flex items-center gap-2">
                                {selectedDoctor.avatarUrl ? (
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={selectedDoctor.avatarUrl} />
                                    <AvatarFallback>{selectedDoctor.name?.charAt(0) || 'D'}</AvatarFallback>
                                  </Avatar>
                                ) : null}
                                <span>Dr. {selectedDoctor.name}</span>
                              </div>
                            ) : (
                              <span>Selecciona un doctor</span>
                            )}
                          </SelectValue>
>>>>>>> 6ab26e7 (main)
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loading ? (
<<<<<<< HEAD
                          <SelectItem value="loading" disabled>Cargando doctores...</SelectItem>
=======
                          <div className="p-2 text-sm text-muted-foreground">Cargando doctores...</div>
>>>>>>> 6ab26e7 (main)
                        ) : doctors.length > 0 ? (
                          doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              <div className="flex items-center gap-2">
<<<<<<< HEAD
                                <Avatar className="h-6 w-6">
                                  {doctor.avatarUrl ? (
                                    <AvatarImage src={doctor.avatarUrl} alt={doctor.nombre} />
                                  ) : null}
                                  <AvatarFallback className="text-xs">
                                    {doctor.nombre.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                {doctor.nombre}
=======
                                {doctor.avatarUrl ? (
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={doctor.avatarUrl} />
                                    <AvatarFallback>{doctor.name?.charAt(0) || 'D'}</AvatarFallback>
                                  </Avatar>
                                ) : null}
                                <span>{doctor.name || 'Doctor sin nombre'}</span>
                                {doctor.especialidad ? <span className="text-xs text-muted-foreground"> - {doctor.especialidad}</span> : ''}
>>>>>>> 6ab26e7 (main)
                              </div>
                            </SelectItem>
                          ))
                        ) : (
<<<<<<< HEAD
                          <SelectItem value="no-doctors" disabled>No hay doctores disponibles</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedDoctor && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-md">
                        <Avatar className="h-8 w-8">
                          {selectedDoctor.avatarUrl ? (
                            <AvatarImage src={selectedDoctor.avatarUrl} alt={selectedDoctor.nombre} />
                          ) : null}
                          <AvatarFallback>
                            {selectedDoctor.nombre.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">Dr. {selectedDoctor.nombre}</span>
                      </div>
                    )}
=======
                          <div className="p-2 text-sm text-muted-foreground">No hay doctores disponibles</div>
                        )}
                      </SelectContent>
                    </Select>
>>>>>>> 6ab26e7 (main)
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
<<<<<<< HEAD
=======

            {/* Type Field */}
>>>>>>> 6ab26e7 (main)
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
<<<<<<< HEAD
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
=======
                  <Select onValueChange={field.onChange} value={field.value}>
>>>>>>> 6ab26e7 (main)
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de consulta" />
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
<<<<<<< HEAD
=======

            {/* Notes Field */}
>>>>>>> 6ab26e7 (main)
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
<<<<<<< HEAD
                    <Textarea placeholder="Introduce notas clínicas..." {...field} rows={5} />
=======
                    <Textarea
                      placeholder="Notas de la consulta..."
                      className="resize-none"
                      {...field}
                    />
>>>>>>> 6ab26e7 (main)
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

<<<<<<< HEAD
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="prescriptions">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    Recetas ({prescriptionFields.length})
                  </div>
=======
            {/* Prescriptions Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="prescriptions">
                <AccordionTrigger>
                  <Pill className="mr-2 h-4 w-4" />
                  Recetas ({prescriptionFields.length})
>>>>>>> 6ab26e7 (main)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {prescriptionFields.map((field, index) => (
<<<<<<< HEAD
                      <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-card/50">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removePrescription(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <FormField control={form.control} name={`prescriptions.${index}.medication`} render={({ field }) => (
                            <FormItem><FormLabel>Medicamento</FormLabel><FormControl><Input placeholder="ej. Tamsulosina" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name={`prescriptions.${index}.dosage`} render={({ field }) => (
                                <FormItem><FormLabel>Dosis</FormLabel><FormControl><Input placeholder="ej. 0.4mg" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name={`prescriptions.${index}.duration`} render={({ field }) => (
                                <FormItem><FormLabel>Duración</FormLabel><FormControl><Input placeholder="ej. 90 días" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" className="w-full" onClick={() => appendPrescription({ medication: "", dosage: "", duration: "" })}>
=======
                      <div key={field.id} className="flex gap-2 items-start border p-3 rounded-md">
                        <div className="flex-1 space-y-3">
                          <FormField
                            control={form.control}
                            name={`prescriptions.${index}.medication`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Medicamento</FormLabel>
                                <FormControl>
                                  <Input {...field} />
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
                                  <Input {...field} />
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
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePrescription(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => appendPrescription({ medication: "", dosage: "", duration: "" })}
                    >
>>>>>>> 6ab26e7 (main)
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Receta
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
<<<<<<< HEAD
              <AccordionItem value="reports">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Informes ({reportFields.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                    {reportFields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-md space-y-2 relative bg-card/50">
                         <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeReport(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <FormField control={form.control} name={`reports.${index}.title`} render={({ field }) => (
                            <FormItem><FormLabel>Título del Informe</FormLabel><FormControl><Input placeholder="ej. Resultados Ecografía Renal" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField
                            control={form.control}
                            name={`reports.${index}.file`}
                            render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem>
                                <FormLabel>Archivo</FormLabel>
                                <FormControl>
                                    <FileInput
                                        value={value ? [value] : []}
                                        onValueChange={(files) => onChange(files[0])}
                                        accept="image/*,.pdf"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                      </div>
                    ))}
                     <Button type="button" variant="outline" className="w-full" onClick={() => appendReport({ title: "" })}>
=======

              {/* Reports Accordion */}
              <AccordionItem value="reports">
                <AccordionTrigger>
                  <FileText className="mr-2 h-4 w-4" />
                  Informes ({reportFields.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {reportFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start border p-3 rounded-md">
                        <div className="flex-1 space-y-3">
                          <FormField
                            control={form.control}
                            name={`reports.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Título del Informe</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
   <FormField
  control={form.control}
  name={`reports.${index}.file`}
  render={({ field: { onChange, value, ...restField } }) => (
    <FormItem>
      <FormLabel>Archivo</FormLabel>
      <FormControl>
        <FileInput
          {...restField}
          value={value instanceof File ? [value] : []}
          onValueChange={(files: File[]) => onChange(files[0])}
          accept="image/*,.pdf"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeReport(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => appendReport({ title: "" })}
                    >
>>>>>>> 6ab26e7 (main)
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Informe
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
<<<<<<< HEAD
        </div>
        <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isProcessingFiles}>
              {isProcessingFiles ? 'Procesando archivos...' : 'Guardar Consulta'}
            </Button>
        </div>
      </form>
    </Form>
  )
=======
        </ScrollArea>

        <Button type="submit" className="w-full" disabled={isProcessingFiles}>
          {isProcessingFiles ? 'Procesando archivos...' : 'Guardar Consulta'}
        </Button>
      </form>
    </Form>
  );
>>>>>>> 6ab26e7 (main)
}
