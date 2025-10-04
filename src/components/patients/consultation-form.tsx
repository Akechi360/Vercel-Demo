'use client';
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
import type { Consultation, Doctor } from "@/lib/types";
import { FileInput } from "../ui/file-input";
import { getDoctors } from "@/lib/actions";

const formSchema = z.object({
  date: z.date({ required_error: "Se requiere una fecha." }),
  doctor: z.string().min(2, "Se requiere el nombre del doctor."),
  type: z.enum(['Inicial' , 'Seguimiento' , 'Pre-operatorio' , 'Post-operatorio']),
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
    file: z.instanceof(File).optional(),
  })).optional(),
  labResults: z.array(z.object({
    id: z.string().optional(),
    testName: z.string(),
    value: z.string(),
    referenceRange: z.string().optional(),
    date: z.string(),
  })).optional(),
})

export type ConsultationFormValues = Omit<Consultation, 'id' | 'patientId'>;


interface ConsultationFormProps {
    onFormSubmit: (values: ConsultationFormValues) => void;
}

export function ConsultationForm({ onFormSubmit }: ConsultationFormProps) {
  const { toast } = useToast()
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsData = await getDoctors();
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        date: new Date(),
        doctor: doctors.length > 0 ? doctors[0].name : "",
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
      form.setValue('doctor', doctors[0].name);
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    const formattedValues: ConsultationFormValues = {
        ...values,
        date: values.date.toISOString(),
        prescriptions: (values.prescriptions || []).map(p => ({ ...p, id: p.id || `rx-${Date.now()}-${Math.random()}` })),
        reports: (values.reports || []).map(r => ({
            id: r.id || `rep-${Date.now()}`,
            title: r.title,
            date: new Date().toISOString(), 
            fileUrl: r.file?.name || '#',
            type: 'Otro', // Or derive from file type
            notes: '',
            attachments: [],
        })), // Mock data
        labResults: values.labResults || [],
    }
    onFormSubmit(formattedValues);
    toast({
      title: "Consulta Añadida",
      description: "El nuevo registro de consulta ha sido guardado.",
    })
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ScrollArea className="h-[65vh] pr-6">
          <div className="space-y-4">
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
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Introduce notas clínicas..." {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Accordion type="multiple" className="w-full">
              <AccordionItem value="prescriptions">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    Recetas ({prescriptionFields.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {prescriptionFields.map((field, index) => (
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
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Receta
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
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
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Informe
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>
        <div className="pt-4 flex justify-end">
            <Button type="submit">Guardar Consulta</Button>
        </div>
      </form>
    </Form>
  )
}
