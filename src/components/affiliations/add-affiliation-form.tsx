// src/components/affiliations/add-affiliation-form.tsx
'use client';
import { useForm } from "react-hook-form";
import { useEffect } from "react";
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
import { CalendarIcon, Check, Star, Shield, CreditCard, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAffiliationStore } from "@/stores/affiliation-store";

const formSchema = z.object({
  companyId: z.string().optional(),
  planId: z.string().min(1, "El plan es requerido."),
  tipoPago: z.string().optional(),
  monto: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    },
    z.number().min(0, "El monto debe ser mayor o igual a 0.")
  ),
  estado: z.enum(['ACTIVA', 'INACTIVA', 'SUSPENDIDA', 'VENCIDA', 'ABONO', 'INICIAL']).default('ACTIVA'),
});

export type FormValues = z.infer<typeof formSchema>;

interface AddAffiliationFormProps {
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}

export function AddAffiliationForm({ onSubmit, onCancel }: AddAffiliationFormProps) {
  const { currentUser } = useAuth();
  const { companies, users, loading, error, loadData } = useAffiliationStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: "none",
      planId: "",
      tipoPago: "",
      monto: 0,
      estado: "ACTIVA",
    },
  });

  const { formState: { isSubmitting } } = form;
  const { watch, setValue } = form;

  // Cargar datos si no están disponibles (fallback)
  useEffect(() => {
    if (companies.length === 0 && users.length === 0 && !loading) {
      console.log('🔄 Loading data as fallback...');
      loadData();
    }
  }, [companies.length, users.length, loading, loadData]);

  // Watch for changes in planId and tipoPago
  const planId = watch("planId");
  const tipoPago = watch("tipoPago");

  // Handle auto-fill of monto based on plan and payment type
  const handlePlanChange = (newPlanId: string) => {
    setValue("planId", newPlanId);
    setValue("tipoPago", ""); // Reset payment type
    setValue("monto", 0); // Reset amount
  };

  const handleTipoPagoChange = (newTipoPago: string) => {
    setValue("tipoPago", newTipoPago);
    
    // Auto-fill monto based on plan and payment type
    let monto = 0;
    if (newTipoPago === "contado") {
      monto = planId === "basico" ? 150 : 250;
    } else if (newTipoPago === "credito") {
      monto = planId === "basico" ? 50 : 62.50; // First installment
    }
    
    setValue("monto", monto);
    
    // Set estado based on payment type
    if (newTipoPago === "credito") {
      setValue("estado", "INICIAL");
    } else {
      setValue("estado", "ACTIVA");
    }
  };

  const handleFormSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empresa (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una empresa o deja vacío para paciente particular" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Paciente Particular</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Usuario</label>
          <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {currentUser?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{currentUser?.name || 'Usuario'}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.role || 'Usuario'}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Se usará automáticamente tu usuario para esta afiliación
          </p>
        </div>

        <FormField
          control={form.control}
          name="planId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan de Afiliación</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  className={cn(
                    "relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                    field.value === "basico" 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handlePlanChange("basico")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Tarjeta Saludable</h3>
                        <p className="text-xs text-muted-foreground">Cobertura esencial</p>
                      </div>
                    </div>
                    {field.value === "basico" && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
                
                <div
                  className={cn(
                    "relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                    field.value === "premium" 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handlePlanChange("premium")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">F. Espíritu Santo</h3>
                        <p className="text-xs text-muted-foreground">Cobertura completa</p>
                      </div>
                    </div>
                    {field.value === "premium" && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de Pago - Solo aparece cuando se selecciona un plan */}
        {planId && (
          <FormField
            control={form.control}
            name="tipoPago"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Pago</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    className={cn(
                      "relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                      field.value === "contado" 
                        ? "border-green-500 bg-green-50 dark:bg-green-950" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleTipoPagoChange("contado")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">Contado</h3>
                          <p className="text-xs text-muted-foreground">
                            {planId === "basico" ? "$150.00" : "$250.00"}
                          </p>
                        </div>
                      </div>
                      {field.value === "contado" && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </div>
                  
                  <div
                    className={cn(
                      "relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                      field.value === "credito" 
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleTipoPagoChange("credito")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">Crédito</h3>
                          <p className="text-xs text-muted-foreground">
                            {planId === "basico" 
                              ? "3 cuotas de $50.00" 
                              : "4 cuotas de $62.50"
                            }
                          </p>
                        </div>
                      </div>
                      {field.value === "credito" && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="monto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={isNaN(field.value) ? "" : field.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? 0 : parseFloat(value));
                  }}
                />
              </FormControl>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tipoPago === "credito" ? (
                    <>
                      <SelectItem value="INICIAL">Inicial</SelectItem>
                      <SelectItem value="ABONO">Abono</SelectItem>
                      <SelectItem value="ACTIVA">Activa</SelectItem>
                      <SelectItem value="INACTIVA">Inactiva</SelectItem>
                      <SelectItem value="SUSPENDIDA">Suspendida</SelectItem>
                      <SelectItem value="VENCIDA">Vencida</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="ACTIVA">Activa</SelectItem>
                      <SelectItem value="INACTIVA">Inactiva</SelectItem>
                      <SelectItem value="SUSPENDIDA">Suspendida</SelectItem>
                      <SelectItem value="VENCIDA">Vencida</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
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
