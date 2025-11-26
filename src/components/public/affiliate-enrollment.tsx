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
import { sendAffiliationNotification } from '@/app/actions/ntfy';
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

      // Send NTFY notification (non-blocking)
      sendAffiliationNotification({
        nombre: data.fullName,
        cedula: data.documentId
      });

      MySwal.fire({
        title: '¡Afiliación Exitosa!',
        html: `
                <p>Tu solicitud ha sido enviada. Recibirás un correo electrónico con los siguientes pasos.</p>
                <p class="mt-2 text-sm">Gracias por unirte a UroVital.</p>`,
        icon: 'success',
        background: '#1e293b',
        color: '#f1f5f9',
        confirmButtonColor: '#4f46e5',
      });
      setCurrentStep(4);
    } catch (error) {
      console.error('Error submitting affiliate enrollment:', error);

      let errorMessage = 'No se pudo enviar la solicitud. Por favor, intenta nuevamente.';

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        } else if (errorMsg.includes('timeout')) {
          errorMessage = 'La operación tardó demasiado. Intenta nuevamente.';
        } else if (errorMsg.includes('validation') || errorMsg.includes('validación')) {
          errorMessage = 'Los datos proporcionados no son válidos. Verifica la información.';
        }
      }

      MySwal.fire({
        title: 'Error al enviar solicitud',
        text: errorMessage,
        icon: 'error',
        background: '#1e293b',
        color: '#f1f5f9',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Entendido'
      });
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
      <div className="space-y-2 mt-6 p-4 border border-white/10 rounded-lg bg-white/5 text-blue-100">
        <h4 className="font-semibold text-lg text-white">Resumen de Orden</h4>
        <div className="flex justify-between text-sm">
          <span>Plan de Afiliación</span>
          <span className="font-medium text-white">{selectedPlan.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Cuota de Afiliación</span>
          <span className="font-medium text-white">${affiliationFee.toFixed(2)}</span>
        </div>
        <div className="border-t border-white/10 border-dashed my-2"></div>
        {selectedInstallment ? (
          <>
            <div className="flex justify-between text-sm">
              <span>Pago Inicial (Cuota 1 de {selectedInstallment.count})</span>
              <span className="font-medium text-white">${selectedInstallment.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-blue-100/60">
              <span>Pagos restantes</span>
              <span>{selectedInstallment.count - 1} de ${selectedInstallment.amount.toFixed(2)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-sm">
            <span>Monto a pagar hoy</span>
            <span className="font-medium text-white">${selectedPlan.paymentModes.contado.price.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-white/10 my-2"></div>
        <div className="flex justify-between font-bold text-lg text-white">
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
                <FormLabel className="text-blue-100">Nombre y Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Juan Pérez" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-blue-100/30 focus-visible:ring-blue-500/50" />
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
                <FormLabel className="text-blue-100">Cédula de Identidad o Pasaporte</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: V-12345678" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-blue-100/30 focus-visible:ring-blue-500/50" />
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
                <FormLabel className="text-blue-100">Fecha de Nacimiento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-blue-100/30 focus-visible:ring-blue-500/50 [color-scheme:dark]" />
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
                <FormLabel className="text-blue-100">Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 0414-1234567" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-blue-100/30 focus-visible:ring-blue-500/50" />
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
                <FormLabel className="text-blue-100">Correo Electrónico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Ej: juan.perez@email.com" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-blue-100/30 focus-visible:ring-blue-500/50" />
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
                <FormLabel className="text-blue-100">Dirección</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ej: Urb. La Viña, Calle 1, Casa 2, Valencia" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-blue-100/30 focus-visible:ring-blue-500/50 min-h-[100px]" />
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
                <FormLabel className="text-lg font-semibold text-white">1. Elige tu Plan de Afiliación</FormLabel>
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
                            "flex flex-col rounded-xl border p-4 cursor-pointer transition-all duration-300",
                            field.value === plan.id
                              ? "border-blue-500/50 bg-blue-600/20 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                              : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                          )}
                        >
                          <span className="font-bold text-lg text-white">{plan.name}</span>
                          <span className="text-sm text-blue-100/60">{plan.subtitle}</span>
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
                <FormLabel className="text-lg font-semibold text-white">2. Elige tu Modalidad de Pago</FormLabel>
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
                      <Label htmlFor="contado" className={cn("flex flex-col items-center justify-between rounded-xl border p-4 cursor-pointer transition-all duration-300", field.value === 'contado' ? "border-blue-500/50 bg-blue-600/20 shadow-[0_0_20px_rgba(37,99,235,0.2)]" : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20")}>
                        <span className="text-white">Contado</span>
                        <span className="font-bold text-blue-400">${selectedPlan.paymentModes.contado.price.toFixed(2)}</span>
                      </Label>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem value="credito" id="credito" className="sr-only" />
                      </FormControl>
                      <Label htmlFor="credito" className={cn("flex flex-col items-center justify-between rounded-xl border p-4 cursor-pointer transition-all duration-300", field.value === 'credito' ? "border-blue-500/50 bg-blue-600/20 shadow-[0_0_20px_rgba(37,99,235,0.2)]" : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20")}>
                        <span className="text-white">Crédito</span>
                        <span className="text-sm text-blue-100/60">Paga en cuotas</span>
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
                <FormItem className="space-y-4 p-4 border border-white/10 rounded-xl bg-white/5">
                  <FormLabel className="text-base font-semibold text-white">Opciones de Cuotas</FormLabel>
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
                            <Label htmlFor={id} className={cn("flex flex-col items-center justify-between rounded-lg border p-4 cursor-pointer transition-all duration-300", field.value === id ? "border-blue-500/50 bg-blue-600/20" : "border-white/10 bg-white/5 hover:bg-white/10")}>
                              <span className="font-semibold text-white">{opt.count} Cuotas {opt.type === 'mensual' && 'Mensuales'}</span>
                              <span className="text-lg font-bold text-blue-400">${opt.amount.toFixed(2)}</span>
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
                <FormLabel className="text-lg font-semibold text-white">3. Elige tu Método de Pago</FormLabel>
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
                            "flex flex-col items-center justify-center rounded-xl border p-4 cursor-pointer aspect-square transition-all duration-300",
                            field.value === method.id
                              ? "border-blue-500/50 bg-blue-600/20 shadow-[0_0_20px_rgba(37,99,253,0.2)]"
                              : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                          )}
                        >
                          <Image
                            src={method.logoSrc}
                            alt={method.label}
                            width={method.id === 'usdt' || method.id === 'paypal' ? 100 : 80}
                            height={method.id === 'usdt' || method.id === 'paypal' ? 100 : 80}
                            className={cn(
                              "mb-2 object-contain",
                              method.id === 'usdt' || method.id === 'paypal' ? "scale-110" : ""
                            )}
                          />
                          <span className="text-sm font-semibold text-center text-white">{method.label}</span>
                        </Label>
                        {field.value === method.id && (
                          <div className="absolute top-2 right-2 text-blue-400">
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
        <h3 className="text-xl font-bold text-white">Confirma tu Afiliación</h3>
        {renderOrderSummary()}

        {selectedMethod && (
          <div className="p-4 border border-white/10 rounded-lg bg-white/5 text-blue-100">
            <h4 className="font-semibold text-lg text-white">Método de Pago Seleccionado</h4>
            <div className="flex items-center gap-4 mt-2">
              <Image src={selectedMethod.logoSrc} alt={selectedMethod.label} width={80} height={80} className="object-contain" />
              <div>
                <p className="font-semibold text-white">{selectedMethod.label}</p>
                <div className="text-sm text-blue-100/60 whitespace-pre-line">{selectedMethod.accountInfo}</div>
              </div>
            </div>
          </div>
        )}
        <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-100">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-white">¡Estás a un paso!</AlertTitle>
          <AlertDescription>
            Al hacer clic en &quot;Confirmar&quot;, tu solicitud será enviada. Recibirás un correo con la confirmación y los siguientes pasos para completar tu pago.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const renderSuccess = () => (
    <div className="text-center py-10">
      <CheckCircle className="mx-auto h-16 w-16 text-green-400 mb-4" />
      <h2 className="text-2xl font-bold text-white">¡Solicitud Enviada!</h2>
      <p className="text-blue-100/60 mt-2">Hemos recibido tu solicitud de afiliación. Revisa tu correo electrónico para ver los siguientes pasos.</p>
    </div>
  )

  return (
    <>
      {currentStep < 4 && (
        <div className="relative mb-8">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-white/10 -translate-y-1/2"></div>
          <div className="absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 -translate-y-1/2 transition-all duration-500" style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
          <div className="relative flex justify-between items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                    currentStep >= step ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-white/40'
                  )}
                >
                  {step}
                </div>
                <span className={cn("mt-2 text-xs font-semibold", currentStep >= step ? 'text-blue-400' : 'text-white/40')}>
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
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="border-white/10 text-white hover:bg-white/10 hover:text-white transition-all duration-300 bg-transparent"
              >
                Anterior
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 font-semibold border-0"
              >
                Siguiente
              </Button>
            </div>
          )}
          {currentStep === 3 && (
            <div className="flex justify-between items-center pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="border-white/10 text-white hover:bg-white/10 hover:text-white transition-all duration-300 bg-transparent"
              >
                Volver
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 font-semibold border-0"
              >
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
    <div className="w-full max-w-4xl mx-auto overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      <div className="p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white font-headline mb-2">Afíliate Ahora</h1>
          <p className="text-blue-100/60">Únete a UroVital y accede a los mejores servicios médicos</p>
        </div>
        <Suspense fallback={<div className="text-white text-center">Cargando...</div>}>
          <AffiliateEnrollmentContent />
        </Suspense>
      </div>
    </div>
  );
}
