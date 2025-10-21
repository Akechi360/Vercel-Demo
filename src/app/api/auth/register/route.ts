import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/actions';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Dirección de correo inválida.' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
  role: z.string().optional().default('patient'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API POST /api/auth/register called');
    
    const body = await request.json();
    console.log('📝 Datos recibidos:', { name: body.name, email: body.email, role: body.role });
    
    // Validate request body
    console.log('🔍 Validando datos...');
    const validatedData = registerSchema.parse(body);
    console.log('✅ Datos validados:', validatedData);
    
    // Create user with validated data
    console.log('🔄 Llamando a createUser...');
    const newUser = await createUser({
      name: validatedData.name,
      email: validatedData.email,
      password: validatedData.password,
      role: validatedData.role,
      status: 'INACTIVE', // Usuarios requieren aprobación del administrador
      phone: null,
      lastLogin: null,
      userId: `U${Date.now().toString().slice(-6)}`,
      avatarUrl: null,
    });
    
    console.log('✅ Usuario creado exitosamente:', { 
      id: newUser.id, 
      userId: newUser.userId, 
      name: newUser.name, 
      email: newUser.email 
    });
    
    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente. Espera la aprobación del administrador.',
      user: {
        id: newUser.id,
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      }
    });
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown');
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => err.message).join(', ');
      console.log('❌ Validation error:', errorMessages);
      return NextResponse.json({
        success: false,
        error: 'Datos inválidos',
        details: errorMessages
      }, { status: 400 });
    }
    
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Ya existe un usuario registrado con ese correo')) {
        return NextResponse.json({
          success: false,
          error: 'Ya existe un usuario registrado con ese correo electrónico.',
          code: 'EMAIL_EXISTS'
        }, { status: 409 });
      }
      
      if (error.message.includes('Faltan campos requeridos')) {
        return NextResponse.json({
          success: false,
          error: 'Faltan campos requeridos',
          details: error.message
        }, { status: 400 });
      }
      
      if (error.message.includes('Base de datos no disponible')) {
        return NextResponse.json({
          success: false,
          error: 'Servicio temporalmente no disponible',
          details: 'La base de datos no está disponible en este momento.'
        }, { status: 503 });
      }
    }
    
    // Generic error response
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: 'No se pudo crear el usuario. Intenta nuevamente.'
    }, { status: 500 });
  }
}
