// src/components/public/affiliate-enrollment.tsx
'use client';
import React, { useState, useMemo, Suspense } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { useSearchParams } from 'next/navigation';
import { AFFILIATE_PLANS, PAYMENT_METHODS } from '@/lib/payment-options';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import Image from 'next/image';
import { CheckCircle, Info } from 'lucide-react';
import { submitAffiliateLead } from '@/lib/actions';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Label } from '../ui/label';

const MySwal = withReactContent(Swal);

const formSchema = z.object({
  fullName: z.string().min(3, 'El nombre completo es requerido.'),
  documentId: z.string().min(5, 'La cédula/pasaporte es requerida.'),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha de nacimiento inválida.',
  }),
  phone: z.string().min(7, 'El teléfono es requerido.'),
  email: z.string().email('Email inválido.'),
  address: z.string().min(10, 'La dirección es requerida.'),
  planId: z.enum(['tarjeta-saludable', 'fondo-espiritu-santo'], {
    required_error: 'Debes seleccionar un plan.',
  }),
  paymentMode: z.enum(['contado', 'credito'], {
    required_error: 'Debes seleccionar una modalidad de pago.',
  }),
  paymentMethod: z.string({
    required_error: 'Debes seleccionar un método de pago.',
  }),
  installmentOption: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function AffiliateEnrollmentContent() {
  const searchParams = useSearchParams();
  const initialPlanId = searchParams.get('plan') || 'tarjeta-saludable';
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      documentId: '',
      birthDate: '',
      phone: '',
      email: '',
      address: '',
      planId: initialPlanId as 'tarjeta-saludable' | 'fondo-espiritu-santo',
      paymentMode: 'contado',
      paymentMethod: '',
      installmentOption: '',
    },
  });

  const { watch, trigger, formState: { errors } } = form;

  const planId = watch('planId');
  const paymentMode = watch('paymentMode');
  const installmentOption = watch('installmentOption');

  const selectedPlan = useMemo(() => AFFILIATE_PLANS.find(p => p.id === planId)!, [planId]);
  const selectedInstallment = useMemo(() => {
    if (paymentMode === 'credito' && installmentOption) {
      return selectedPlan.paymentModes.credito.installmentOptions.find(opt => `${opt.type}-${opt.count}` === installmentOption);
    }
    return null;
  }, [paymentMode, installmentOption, selectedPlan]);

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['fullName', 'documentId', 'birthDate', 'phone', 'email', 'address'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['planId', 'paymentMode', 'paymentMethod'];
       if (watch('paymentMode') === 'credito') {
        fieldsToValidate.push('installmentOption');
      }
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    const leadData = {
        ...data,
        schedule: selectedInstallment ? {
            upfront: 0,
            installments: selectedInstallment.count,
            installmentValue: selectedInstallment.amount,
            frequencyDays: selectedInstallment.type === 'mensual' ? 30 : 90,
        } : undefined,
    };
    
    try {
        await submitAffiliateLead(leadData);
        const isDarkMode = document.documentElement.classList.contains('dark');
        MySwal.fire({
            title: '¡Afiliación Exitosa!',
            html: `
                <p>Tu solicitud ha sido enviada. Recibirás un correo electrónico con los siguientes pasos.</p>
                <p class="mt-2 text-sm">Gracias por unirte a UroVital.</p>`,
            icon: 'success',
            background: isDarkMode ? '#1e293b' : '#ffffff',
            color: isDarkMode ? '#f1f5f9' : '#0f172a',
            confirmButtonColor: '#4f46e5',
        });
        setCurrentStep(4);
    } catch (error) {
        // Handle submission error
    }
  };


  const renderOrderSummary = () => {
    if (!selectedPlan) return null;

    const affiliationFee = selectedPlan.affiliationFee ?? 0;
    
    let total = 0;
    if (paymentMode === 'contado') {
        total = selectedPlan.paymentModes.contado.price;
    } else if (selectedInstallment) {
        // Para crédito: Cuota de Afiliación + Pago Inicial
        total = affiliationFee + selectedInstallment.amount;
    }

    return (
        <div className="space-y-2 mt-6 p-4 border rounded-lg bg-background/50">
            <h4 className="font-semibold text-lg">Resumen de Orden</h4>
            <div className="flex justify-between text-sm">
                <span>Plan de Afiliación</span>
                <span className="font-medium">{selectedPlan.name}</span>
            </div>
             <div className="flex justify-between text-sm">
                <span>Cuota de Afiliación</span>
                <span className="font-medium">${affiliationFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed my-2"></div>
             {selectedInstallment ? (
                <>
                    <div className="flex justify-between text-sm">
                        <span>Pago Inicial (Cuota 1 de {selectedInstallment.count})</span>
                        <span className="font-medium">${selectedInstallment.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Pagos restantes</span>
                        <span>{selectedInstallment.count - 1} de ${selectedInstallment.amount.toFixed(2)}</span>
                    </div>
                </>
            ) : (
                <div className="flex justify-between text-sm">
                    <span>Monto a pagar hoy</span>
                    <span className="font-medium">${selectedPlan.paymentModes.contado.price.toFixed(2)}</span>
                </div>
            )}
             <div className="border-t my-2"></div>
             <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
            </div>
        </div>
    );
  };


  const renderStepContent = () => {
    if (currentStep === 1) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nombre y Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cédula de Identidad o Pasaporte</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: V-12345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 0414-1234567" {...field} />
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
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Ej: juan.perez@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ej: Urb. La Viña, Calle 1, Casa 2, Valencia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
        )
    }
    if (currentStep === 2) {
        return (
            <div className="space-y-8">
                 {/* Plan Selection */}
                <FormField
                    control={form.control}
                    name="planId"
                    render={({ field }) => (
                    <FormItem className="space-y-4">
                        <FormLabel className="text-lg font-semibold">1. Elige tu Plan de Afiliación</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                            {AFFILIATE_PLANS.map((plan) => (
                                <FormItem key={plan.id}>
                                    <FormControl>
                                        <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                                    </FormControl>
                                    <Label
                                    htmlFor={plan.id}
                                    className={cn(
                                        "flex flex-col rounded-lg border-2 p-4 cursor-pointer transition-all",
                                        field.value === plan.id
                                        ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                        : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                                    )}
                                    >
                                    <span className="font-bold text-lg">{plan.name}</span>
                                    <span className="text-sm text-muted-foreground">{plan.subtitle}</span>
                                    </Label>
                                </FormItem>
                            ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                
                {/* Payment Mode Selection */}
                <FormField
                  control={form.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-lg font-semibold">2. Elige tu Modalidad de Pago</FormLabel>
                       <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="contado" id="contado" className="sr-only" />
                                    </FormControl>
                                    <Label htmlFor="contado" className={cn("flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all", field.value === 'contado' ? "border-primary bg-primary/10" : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground")}>
                                        Contado
                                        <span className="font-bold">${selectedPlan.paymentModes.contado.price.toFixed(2)}</span>
                                    </Label>
                                </FormItem>
                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="credito" id="credito" className="sr-only" />
                                    </FormControl>
                                    <Label htmlFor="credito" className={cn("flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all", field.value === 'credito' ? "border-primary bg-primary/10" : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground")}>
                                        Crédito
                                        <span className="text-sm text-muted-foreground">Paga en cuotas</span>
                                    </Label>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Installment Options */}
                {paymentMode === 'credito' && (
                  <FormField
                    control={form.control}
                    name="installmentOption"
                    render={({ field }) => (
                      <FormItem className="space-y-4 p-4 border rounded-lg bg-background/50">
                        <FormLabel className="text-base font-semibold">Opciones de Cuotas</FormLabel>
                         <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                {selectedPlan.paymentModes.credito.installmentOptions.map(opt => {
                                    const id = `${opt.type}-${opt.count}`;
                                    return (
                                        <FormItem key={id}>
                                            <FormControl>
                                                <RadioGroupItem value={id} id={id} className="sr-only" />
                                            </FormControl>
                                            <Label htmlFor={id} className={cn("flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all", field.value === id ? "border-primary bg-primary/10" : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground")}>
                                                <span className="font-semibold">{opt.count} Cuotas {opt.type === 'mensual' && 'Mensuales'}</span>
                                                <span className="text-lg font-bold">${opt.amount.toFixed(2)}</span>
                                            </Label>
                                        </FormItem>
                                    )
                                })}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Payment Method Selection */}
                <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem className="space-y-4">
                            <FormLabel className="text-lg font-semibold">3. Elige tu Método de Pago</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                                >
                                {PAYMENT_METHODS.map((method) => (
                                    <FormItem key={method.id} className="relative">
                                        <FormControl>
                                            <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                                        </FormControl>
                                        <Label
                                            htmlFor={method.id}
                                            className={cn(
                                                "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer aspect-square transition-all",
                                                field.value === method.id
                                                ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(37,99,253,0.3)]"
                                                : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                                            )}
                                        >
                                            <Image src={method.logoSrc} alt={method.label} width={80} height={80} className="mb-2 object-contain" />
                                            <span className="text-sm font-semibold text-center">{method.label}</span>
                                        </Label>
                                        {field.value === method.id && (
                                            <div className="absolute top-2 right-2 text-primary">
                                                <CheckCircle className="h-5 w-5" />
                                            </div>
                                        )}
                                    </FormItem>
                                ))}
                                </RadioGroup>
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        )
    }
    return null;
  }

  const renderConfirmation = () => {
    const selectedMethod = PAYMENT_METHODS.find(m => m.id === watch('paymentMethod'));
     return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold">Confirma tu Afiliación</h3>
            {renderOrderSummary()}

            {selectedMethod && (
                <div className="p-4 border rounded-lg bg-background/50">
                     <h4 className="font-semibold text-lg">Método de Pago Seleccionado</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <Image src={selectedMethod.logoSrc} alt={selectedMethod.label} width={80} height={80} className="object-contain" />
                        <div>
                            <p className="font-semibold">{selectedMethod.label}</p>
                            <div className="text-sm text-muted-foreground whitespace-pre-line">{selectedMethod.accountInfo}</div>
                        </div>
                    </div>
                </div>
            )}
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>¡Estás a un paso!</AlertTitle>
                <AlertDescription>
                    Al hacer clic en "Confirmar", tu solicitud será enviada. Recibirás un correo con la confirmación y los siguientes pasos para completar tu pago.
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  const renderSuccess = () => (
     <div className="text-center py-10">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold">¡Solicitud Enviada!</h2>
        <p className="text-muted-foreground mt-2">Hemos recibido tu solicitud de afiliación. Revisa tu correo electrónico para ver los siguientes pasos.</p>
    </div>
  )

  return (
    <>
      {currentStep < 4 && (
        <div className="relative mb-8">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-border -translate-y-1/2"></div>
            <div className="absolute left-0 top-1/2 h-0.5 bg-primary -translate-y-1/2 transition-all duration-500" style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
            <div className="relative flex justify-between items-center">
                {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center">
                    <div
                    className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300',
                        currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                    >
                    {step}
                    </div>
                    <span className={cn("mt-2 text-xs font-semibold", currentStep >= step ? 'text-primary' : 'text-muted-foreground' )}>
                        {step === 1 && "Información"}
                        {step === 2 && "Pago"}
                        {step === 3 && "Confirmación"}
                    </span>
                </div>
                ))}
            </div>
        </div>
      )}
      
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {currentStep === 1 && renderStepContent()}
            {currentStep === 2 && renderStepContent()}
            {currentStep === 3 && renderConfirmation()}
            {currentStep === 4 && renderSuccess()}
            
            {currentStep < 3 && (
                 <div className="flex justify-between items-center pt-4">
                    <Button type="button" variant="outline" onClick={handlePrevStep} disabled={currentStep === 1}>
                    Anterior
                    </Button>
                    <Button type="button" onClick={handleNextStep}>
                        Siguiente
                    </Button>
                </div>
            )}
            {currentStep === 3 && (
                <div className="flex justify-between items-center pt-4">
                    <Button type="button" variant="outline" onClick={handlePrevStep}>
                        Volver
                    </Button>
                    <Button type="submit">
                        Confirmar y Enviar Afiliación
                    </Button>
                </div>
            )}
        </form>
      </FormProvider>
    </>
  );
}

export function AffiliateEnrollment() {
  return (
    <div className="w-full max-w-4xl mx-auto overflow-hidden rounded-2xl border border-border/20 bg-card/50 shadow-2xl shadow-primary/10 backdrop-blur-lg">
      <div className="p-6 sm:p-8">
        <Suspense fallback={<div>Cargando...</div>}>
            <AffiliateEnrollmentContent />
        </Suspense>
      </div>
    </div>
  );
}
