'use client';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Report, ReportAttachment } from "@/lib/types";
import { FileInput } from "../ui/file-input";

const reportTypes = ["Ecografía", "Tomografía", "Resonancia Magnética", "Biopsia", "Análisis de Sangre", "Uroflujometría", "Otro"];

const formSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  date: z.date(),
  type: z.string().min(1, "El tipo es requerido"),
  notes: z.string().optional(),
  attachments: z.array(z.union([
    z.instanceof(File),
    z.object({
      name: z.string(),
      type: z.string(),
      size: z.number(),
      url: z.string()
    })
  ])).optional(),
});

export type EditReportFormValues = {
  title: string;
  date: string; // ISO en onSubmit
  type: string;
  notes?: string;
  attachments?: ReportAttachment[];
};

interface EditReportFormProps {
  initialData: Report;
  onSubmit: (values: EditReportFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function EditReportForm({ initialData, onSubmit, isSubmitting = false }: EditReportFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title || "",
      date: initialData.date ? new Date(initialData.date) : new Date(),
      type: initialData.type || undefined,
      notes: initialData.notes || "",
      attachments: initialData.attachments || (initialData.archivoNombre ? [{
        name: initialData.archivoNombre,
        type: initialData.archivoTipo || 'application/octet-stream',
        size: initialData.archivoTamaño || 0,
        url: initialData.fileUrl || '#'
      }] : []),
    },
  });

  const processAttachments = async (files: (File | ReportAttachment)[] = []): Promise<ReportAttachment[]> => {
    const processed: ReportAttachment[] = [];
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

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const attachments = await processAttachments(values.attachments || []);
    const formatted: EditReportFormValues = {
      title: values.title,
      date: values.date.toISOString(),
      type: values.type,
      notes: values.notes || '',
      attachments,
    };
    await onSubmit(formatted);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
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

            <div className="grid grid-cols-2 gap-4">
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
                    <FormLabel>Tipo de Informe</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
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
                  <FormLabel>Adjuntos {initialData.archivoNombre ? `(Actual: ${initialData.archivoNombre})` : ''}</FormLabel>
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
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}


