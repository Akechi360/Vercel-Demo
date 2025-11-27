'use client';
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Report, ReportAttachment } from "@/lib/types";
import { FileInput } from "../ui/file-input";

const reportTypes = ["Ecografía", "Tomografía", "Resonancia Magnética", "Biopsia", "Análisis de Sangre", "Uroflujometría", "Otro"];

const formSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  date: z.date({ required_error: "Se requiere una fecha." }),
  type: z.string({ required_error: "Selecciona un tipo de informe." }),
  notes: z.string().min(10, "Las notas deben tener al menos 10 caracteres."),
  attachments: z.array(z.union([
    z.instanceof(File),
    z.object({
      name: z.string(),
      type: z.string(),
      size: z.number(),
      url: z.string()
    })
  ])).optional(),
})

export type NewReportFormValues = Omit<Report, 'id' | 'userId' | 'fileUrl'>;

interface NewReportFormProps {
  onFormSubmit: (values: NewReportFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function NewReportForm({ onFormSubmit, isSubmitting = false }: NewReportFormProps) {
  const { toast } = useToast()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: new Date(),
      type: undefined,
      notes: "",
      attachments: [],
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Process files to ensure they're in the correct format
      const processAttachments = async (files: (File | ReportAttachment)[] = []): Promise<ReportAttachment[]> => {
        const processed = [];
        for (const file of files) {
          if (file instanceof File) {
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            processed.push({
              name: file.name,
              type: file.type,
              size: file.size,
              url: `data:${file.type};base64,${base64}`
            });
          } else if (file) {
            // Ensure it matches ReportAttachment type
            processed.push({
              name: file.name || 'file',
              type: file.type || 'application/octet-stream',
              size: file.size || 0,
              url: file.url || '#'
            });
          }
        }
        return processed;
      };

      const attachments = await processAttachments(values.attachments || []);

      const formattedValues: NewReportFormValues = {
        ...values,
        date: values.date.toISOString(),
        notes: values.notes || '',
        attachments: attachments,
      };

      await onFormSubmit(formattedValues);
      toast({
        title: "Informe Añadido",
        description: "El nuevo informe ha sido guardado.",
      });
      form.reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar el informe.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ScrollArea className="h-[65vh] pr-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título del Informe</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Ecografía Renal de Seguimiento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 1: Title, Date, Type in 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Título del Informe</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Ecografía Renal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha del Informe</FormLabel>
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
                          className="p-4"
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Tipo de Informe</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas / Resumen</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Introduce un resumen o las notas principales del informe..." {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjuntos</FormLabel>
                  <FormControl>
                    <FileInput
                      value={field.value ? field.value.map((file: any) =>
                        file instanceof File ? file : new File([], file.name || 'file', { type: file.type || 'application/octet-stream' })
                      ) : []}
                      onValueChange={(files) => {
                        // Convert FileList to array of Files
                        const fileArray = Array.from(files || []);
                        field.onChange(fileArray);
                      }}
                      multiple
                      accept="image/*,.pdf"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        <div className="pt-6 flex justify-end">
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              'Guardar Informe'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
