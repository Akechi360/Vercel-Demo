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
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Report } from "@/lib/types";
import { FileInput } from "../ui/file-input";

const reportTypes = ["Ecografía", "Tomografía", "Resonancia Magnética", "Biopsia", "Análisis de Sangre", "Uroflujometría", "Otro"];

const formSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  date: z.date({ required_error: "Se requiere una fecha." }),
  type: z.string({ required_error: "Selecciona un tipo de informe."}),
  notes: z.string().min(10, "Las notas deben tener al menos 10 caracteres."),
  attachments: z.array(z.instanceof(File)).optional(),
})

export type NewReportFormValues = Omit<Report, 'id' | 'patientId' | 'fileUrl'>;

interface NewReportFormProps {
    onFormSubmit: (values: NewReportFormValues) => void;
}

export function NewReportForm({ onFormSubmit }: NewReportFormProps) {
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    const formattedValues: NewReportFormValues = {
        ...values,
        date: values.date.toISOString(),
        attachments: values.attachments?.map(f => f.name) || [],
    }
    onFormSubmit(formattedValues);
    toast({
      title: "Informe Añadido",
      description: "El nuevo informe ha sido guardado.",
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
                  <FormLabel>Adjuntos</FormLabel>
                  <FormControl>
                    <FileInput
                        value={field.value || []}
                        onValueChange={field.onChange}
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
            <Button type="submit">Guardar Informe</Button>
        </div>
      </form>
    </Form>
  )
}
