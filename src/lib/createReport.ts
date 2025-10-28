'use server';

import { withDatabase } from './actions';

export async function createReport(reportData: {
  titulo: string;
  fecha: string;
  tipo: string;
  notas?: string;
  descripcion?: string;
  contenido?: any;
  autor?: string;
  patientUserId: string;
  archivoNombre?: string;
  archivoTipo?: string;
  archivoTamaño?: number;
  archivoContenido?: string;
  createdBy?: string;
}) {
  console.log('🔵 createReport called with:', {
    titulo: reportData.titulo,
    tipo: reportData.tipo,
    patientId: reportData.patientUserId,
    hasFile: !!reportData.archivoNombre
  });

  return withDatabase(async (prisma) => {
    try {
      const report = await prisma.report.create({
        data: {
          titulo: reportData.titulo,
          tipo: reportData.tipo,
          fecha: new Date(reportData.fecha),
          notas: reportData.notas || '',
          descripcion: reportData.descripcion || '',
          contenido: reportData.contenido || {},
          autor: reportData.autor || 'Sistema',
          patientUserId: reportData.patientUserId,
          archivoNombre: reportData.archivoNombre || null,
          archivoTipo: reportData.archivoTipo || null,
          archivoTamaño: reportData.archivoTamaño || null,
          archivoContenido: reportData.archivoContenido || null,
          createdBy: reportData.createdBy || null,
        },
      });
      
      console.log('✅ Report created successfully:', report.id);
      return report;
      
    } catch (error) {
      console.error('❌ Error creating report:', error);
      throw new Error('Error al guardar el informe');
    }
  });
}
