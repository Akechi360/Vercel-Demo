import { NextRequest, NextResponse } from 'next/server';
import { withDatabase } from '@/lib/actions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;
    
    const report = await withDatabase(async (prisma: any) => {
      return await prisma.consultationReport.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          archivoNombre: true,
          archivoTipo: true,
          archivoContenido: true,
          archivoTamaño: true,
        }
      });
    });

    if (!report) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    if (!report.archivoContenido) {
      return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 });
    }

    // Convertir base64 a buffer
    const base64Data = report.archivoContenido.replace(/^data:.*,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Determinar el tipo de contenido
    const contentType = report.archivoTipo || 'application/octet-stream';
    
    // Configurar headers para descarga
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', buffer.length.toString());
    headers.set('Content-Disposition', `inline; filename="${report.archivoNombre || 'archivo'}"`);
    headers.set('Cache-Control', 'public, max-age=3600');

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
