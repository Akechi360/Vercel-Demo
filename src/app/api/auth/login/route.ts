import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/actions';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: 'Dirección de correo inválida.' }),
  password: z.string().min(1, { message: 'La contraseña es requerida.' }),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API POST /api/auth/login called');
    
    const body = await request.json();
    console.log('📝 Datos de login recibidos:', { email: body.email });
    
    // Validate request body
    const validatedData = loginSchema.parse(body);
    
    // Attempt login
    const result = await login({
      email: validatedData.email,
      password: validatedData.password,
    });
    
    if (result.success && result.user) {
      console.log('✅ Login exitoso:', { 
        id: result.user.id, 
        name: result.user.name, 
      });
      
      return NextResponse.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        user: result.user
      });
    } else {
      console.log('❌ Login fallido:', result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Credenciales inválidas',
        code: result.error === 'Usuario no encontrado' ? 'USER_NOT_FOUND' : 
              result.error === 'Contraseña incorrecta' ? 'INVALID_PASSWORD' : 'LOGIN_FAILED'
      }, { status: 401 });
    }
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => err.message).join(', ');
      return NextResponse.json({
        success: false,
        error: 'Datos inválidos',
        details: errorMessages
      }, { status: 400 });
    }
    
    // Generic error response
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: 'No se pudo procesar el inicio de sesión. Intenta nuevamente.'
    }, { status: 500 });
  }
}
