// src/components/affiliations/add-affiliation-form.tsx
'use client';
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
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
import { useAffiliations, useCompanies, useUsers } from "@/lib/store/global-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getPatientsByCompanyId } from "@/lib/actions";
import { Users, User, Building2 } from "lucide-react";

const formSchema = z.object({
  selectionType: z.enum(['individual', 'particular', 'empresa'], { required_error: 'Seleccione un tipo' }),
  userId: z.string().optional(),
  companyId: z.string().optional(),
  selectedUserIds: z.array(z.string()).optional(),
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
  const { loading, error, refresh } = useAffiliations();
  const { companies } = useCompanies();
  const { users } = useUsers();
  const [companyEmployees, setCompanyEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectionType: "individual",
      userId: "",
      companyId: "none",
      selectedUserIds: [],
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
      refresh();
    }
  }, [companies.length, users.length, loading]); // Removed refresh to prevent infinite loop

  // Watch for changes in planId, tipoPago, selectionType, and companyId
  const planId = watch("planId");
  const tipoPago = watch("tipoPago");
  const selectionType = watch("selectionType");
  const companyId = watch("companyId");

  // Fetch employees when company changes
  useEffect(() => {
    async function fetchEmployees() {
      if (selectionType === 'empresa' && companyId && companyId !== 'none') {
        setIsLoadingEmployees(true);
        try {
          const employees = await getPatientsByCompanyId(companyId);
          setCompanyEmployees(employees);
          setSelectedEmployees([]);
        } catch (error) {
          console.error("Error fetching employees:", error);
          setCompanyEmployees([]);
        } finally {
          setIsLoadingEmployees(false);
        }
      } else {
        setCompanyEmployees([]);
        setSelectedEmployees([]);
      }
    }

    fetchEmployees();
  }, [selectionType, companyId]);

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

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleFormSubmit = (values: FormValues) => {
    // Include selected employees in the submission
    const submissionData = {
      ...values,
      selectedUserIds: selectionType === 'empresa' ? selectedEmployees : selectionType === 'individual' || selectionType === 'particular' ? [values.userId || ''] : []
    };
    onSubmit(submissionData);
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


      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Selection Type - Visual Cards */}
        <FormField
          control={form.control}
          name="selectionType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-base font-semibold">Tipo de Afiliación</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                    <Label
                      htmlFor="individual"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full transition-all"
                    >
                      <User className="mb-3 h-6 w-6" />
                      <div className="text-center">
                        <div className="font-semibold">Individual</div>
                        <div className="text-xs text-muted-foreground mt-1">Seleccionar paciente existente</div>
                      </div>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem value="particular" id="particular" className="peer sr-only" />
                    <Label
                      htmlFor="particular"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full transition-all"
                    >
                      <Users className="mb-3 h-6 w-6" />
                      <div className="text-center">
                        <div className="font-semibold">Particular</div>
                        <div className="text-xs text-muted-foreground mt-1">Paciente sin empresa</div>
                      </div>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem value="empresa" id="empresa" className="peer sr-only" />
                    <Label
                      htmlFor="empresa"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full transition-all"
                    >
                      <Building2 className="mb-3 h-6 w-6" />
                      <div className="text-center">
                        <div className="font-semibold">Empresa</div>
                        <div className="text-xs text-muted-foreground mt-1">Seleccionar empleados</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Patient Selector - for individual or particular */}
        {(selectionType === 'individual' || selectionType === 'particular') && (
          <div className="p-4 border rounded-lg bg-muted/20 animate-in fade-in slide-in-from-top-2">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seleccionar Paciente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Buscar paciente..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users
                        .filter((user: any) =>
                          user.role === 'USER' &&
                          (selectionType === 'individual' || (selectionType === 'particular' && !user.companyId))
                        )
                        .map((user: any) => (
                          <SelectItem key={user.id} value={user.userId || user.id}>
                            {user.name} {user.cedula ? `- ${user.cedula}` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Company Selector - for empresa */}
        {selectionType === 'empresa' && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20 animate-in fade-in slide-in-from-top-2">
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seleccionar Empresa</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecciona una empresa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map((company: any) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name || company.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Employee Checkboxes */}
            {isLoadingEmployees ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : companyEmployees.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">
                    Empleados Disponibles ({companyEmployees.length})
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedEmployees.length === companyEmployees.length) {
                        setSelectedEmployees([]);
                      } else {
                        setSelectedEmployees(companyEmployees.map(e => e.id));
                      }
                    }}
                  >
                    {selectedEmployees.length === companyEmployees.length ? "Deseleccionar todos" : "Seleccionar todos"}
                  </Button>
                </div>
                <div className="border rounded-md p-2 space-y-1 max-h-64 overflow-y-auto bg-background">
                  {companyEmployees.map((employee: any) => (
                    <div key={employee.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-sm transition-colors">
                      <Checkbox
                        id={employee.id}
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={() => handleEmployeeToggle(employee.id)}
                      />
                      <label
                        htmlFor={employee.id}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        <span className="font-medium">{employee.name}</span>
                        {employee.cedula && <span className="text-muted-foreground ml-2 text-xs">{employee.cedula}</span>}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {selectedEmployees.length} empleado(s) seleccionado(s)
                </p>
              </div>
            ) : companyId && companyId !== 'none' ? (
              <div className="text-center p-4 border border-dashed rounded-md">
                <p className="text-sm text-muted-foreground">
                  No hay empleados registrados para esta empresa.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Asegúrate de asignar la empresa a los pacientes desde el módulo de Pacientes.
                </p>
              </div>
            ) : null}
          </div>
        )}

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
        {
          planId && (
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
          )
        }

        {/* Monto and Estado in 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Afiliación"}
          </Button>
        </div>
      </form >
    </Form >
  );
}
