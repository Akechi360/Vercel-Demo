
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Stethoscope, LogIn } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
import { useToast } from '@/hooks/use-toast';
import { login, createUser } from '@/lib/actions';

const loginSchema = z.object({
  email: z.string().email({ message: 'Dirección de correo inválida.' }),
  password: z.string().min(3, { message: 'La contraseña debe tener al menos 3 caracteres.' }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Dirección de correo inválida.' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Dirección de correo inválida.' }),
});

type AuthMode = 'login' | 'register' | 'forgot-password';

interface AuthFormProps {
  mode: AuthMode;
}

const formSchemas = {
  login: loginSchema,
  register: registerSchema,
  'forgot-password': forgotPasswordSchema,
};

export default function AuthForm({ mode: initialMode }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { toast } = useToast();
  const router = useRouter();

  const getDefaultValues = (currentMode: AuthMode) => {
    switch (currentMode) {
      case 'login':
        return { email: '', password: '' };
      case 'register':
        return { name: '', email: '', password: '' };
      case 'forgot-password':
        return { email: '' };
      default:
        return { email: '' };
    }
  };

  const form = useForm<z.infer<typeof formSchemas[typeof mode]>>({
    resolver: zodResolver(formSchemas[mode]),
    defaultValues: getDefaultValues(mode),
  });
  
  const { formState: { isSubmitting }, reset } = form;

  const onSubmit = async (values: z.infer<typeof loginSchema | typeof registerSchema | typeof forgotPasswordSchema>) => {
    if (mode === 'login') {
        const result = await login(values as z.infer<typeof loginSchema>);
        if (result.success && result.user) {
            toast({ title: "Inicio de sesión exitoso", description: "Redirigiendo al panel..." });
            localStorage.setItem("user", JSON.stringify(result.user));
            router.push('/dashboard');
        } else {
            toast({ variant: "destructive", title: "Fallo en el inicio de sesión", description: result.error });
        }
    } else if (mode === 'register') {
        try {
            const registerValues = values as z.infer<typeof registerSchema>;
            const newUser = await createUser({
                name: registerValues.name,
                email: registerValues.email,
                password: registerValues.password,
                role: 'patient', // Default role for new users
                status: 'ACTIVE',
                phone: null,
                lastLogin: null,
                patientId: null
            });
            
            toast({ 
                title: "¡Cuenta creada exitosamente!", 
                description: "Ahora puedes iniciar sesión con tus credenciales." 
            });
            setMode('login');
            reset();
        } catch (error) {
            toast({ 
                variant: "destructive", 
                title: "Error al crear cuenta", 
                description: error instanceof Error ? error.message : "Error desconocido" 
            });
        }
    } else if (mode === 'forgot-password') {
        toast({ title: "¡Simulación de recuperación exitosa!", description: `Datos: ${JSON.stringify(values)}` });
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Bienvenido de Nuevo';
      case 'register': return 'Crear Cuenta';
      case 'forgot-password': return 'Restablecer Contraseña';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Inicia sesión para acceder a tu panel.';
      case 'register': return 'Únete a UroVital hoy.';
      case 'forgot-password': return 'Ingresa tu correo para recibir un enlace de restablecimiento.';
    }
  };

  const getButtonText = () => {
    switch (mode) {
        case 'login': return 'Iniciar Sesión';
        case 'register': return 'Registrarse';
        case 'forgot-password': return 'Enviar Enlace';
      }
  }

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    // Reset form with new default values for the new mode
    reset(getDefaultValues(newMode));
  }

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border/20 bg-card/50 shadow-2xl shadow-primary/10 backdrop-blur-lg">
      <div className="p-8">
        <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex justify-center">
                <Image
                    src="/images/logo/urovital-logo.png"
                    alt="UroVital"
                    width={131}
                    height={88}
                    className="h-[88px] w-[131px] object-contain"
                    priority
                />
            </div>
            <h1 className="text-3xl font-bold text-foreground font-headline">{getTitle()}</h1>
            <p className="text-muted-foreground">{getDescription()}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div
                key={mode}
                className="space-y-4"
              >
                {mode === 'register' && (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {(mode === 'login' || mode === 'register' || mode === 'forgot-password') && (
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección de Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="doctor@uroflow.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {(mode === 'login' || mode === 'register') && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                            <FormLabel>Contraseña</FormLabel>
                            {mode === 'login' && (
                                <button type="button" onClick={() => handleModeChange('forgot-password')} className="text-sm font-medium text-primary hover:underline">
                                    ¿Olvidaste?
                                </button>
                            )}
                        </div>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : getButtonText()}
              <LogIn className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          {mode === 'login' && (
            <p className="text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <button onClick={() => handleModeChange('register')} className="font-medium text-primary hover:underline">
                Regístrate
              </button>
            </p>
          )}
          {mode === 'register' && (
            <p className="text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <button onClick={() => handleModeChange('login')} className="font-medium text-primary hover:underline">
                Inicia Sesión
              </button>
            </p>
          )}
           {mode === 'forgot-password' && (
            <p className="text-muted-foreground">
              ¿Recuerdas tu contraseña?{' '}
              <button onClick={() => handleModeChange('login')} className="font-medium text-primary hover:underline">
                Inicia Sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
