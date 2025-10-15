import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 DEBUG API POST /api/auth/register-debug called');
    
    const body = await request.json();
    console.log('📝 Datos recibidos:', body);
    
    // Simular respuesta exitosa sin base de datos
    return NextResponse.json({
      success: true,
      message: 'Debug: Ruta funcionando correctamente',
      receivedData: body
    });
    
  } catch (error) {
    console.error('❌ Error en debug route:', error);
    return NextResponse.json({
      success: false,
      error: 'Error en debug route',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
