// src/components/affiliations/add-affiliation-form.tsx
'use client';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "../layout/auth-provider";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const formSchema = z.object({
  nombreCompleto: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  telefono: z.string().min(7, "El teléfono debe tener al menos 7 dígitos."),
  direccion: z.string().min(10, "La dirección debe tener al menos 10 caracteres."),
  ultimaAfiliacion: z.date({
    required_error: "La fecha de afiliación es requerida.",
  }),
  estado: z.enum(['Activo', 'Inactivo']),
});

type FormValues = z.infer<typeof formSchema>;

interface AddAffiliationFormProps {
  onSubmit: (values: Omit<FormValues, 'nombreCompleto' | 'telefono' | 'direccion'>) => void;
  onCancel: () => void;
}

export function AddAffiliationForm({ onSubmit, onCancel }: AddAffiliationFormProps) {
  const { currentUser } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombreCompleto: "",
      telefono: "",
      direccion: "",
      ultimaAfiliacion: new Date(),
      estado: "Activo",
    },
  });

  const { formState: { isSubmitting } } = form;

  const handleFormSubmit = (values: FormValues) => {
    // We only pass the necessary fields, as the prompt requested placeholders
    const { nombreCompleto, telefono, direccion, ...rest } = values;
    onSubmit(rest);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="promotora"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Promotora</FormLabel>
              <FormControl>
                <Input value={currentUser?.name || "Usuario"} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nombreCompleto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo del Afiliado</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Ana de Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Teléfono</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="Ej: 0414-1234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: Urb. La Viña, Valencia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ultimaAfiliacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Afiliación</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal h-10",
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
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Afiliación"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
