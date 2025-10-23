'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Image, Download, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: {
    id: string;
    title: string;
    notes?: string;
    attachments?: string[];
    fileUrl?: string;
    type?: string;
    archivoNombre?: string;
    archivoTipo?: string;
    archivoContenido?: string;
    archivoTamaño?: number;
  };
}

export function FileViewerModal({ isOpen, onClose, report }: FileViewerModalProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debug: Log completo del reporte recibido
  console.log('🔍 FileViewerModal - Report recibido:', {
    id: report.id,
    title: report.title,
    archivoNombre: report.archivoNombre,
    archivoTipo: report.archivoTipo,
    archivoTamaño: report.archivoTamaño,
    hasArchivoContenido: !!report.archivoContenido,
    archivoContenidoLength: report.archivoContenido?.length || 0,
    archivoContenidoPreview: report.archivoContenido?.substring(0, 100),
    attachments: report.attachments,
    fileUrl: report.fileUrl,
    type: report.type
  });

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return 'Imagen';
    }
    if (extension === 'pdf') {
      return 'PDF';
    }
    return 'Documento';
  };

  const handleFileClick = (fileName: string) => {
    setSelectedFile(fileName);
    setIsLoading(true);
    
    try {
      // Usar el archivo adjunto directamente del reporte
      if (report.archivoContenido) {
        // Debug logging
        console.log('📄 FileViewerModal - Loading file:', {
          fileName,
          archivoTipo: report.archivoTipo,
          archivoNombre: report.archivoNombre,
          contentLength: report.archivoContenido.length,
          contentPreview: report.archivoContenido.substring(0, 50) + '...',
          hasDataPrefix: report.archivoContenido.startsWith('data:')
        });

        // Validar que el contenido no esté vacío
        if (!report.archivoContenido || report.archivoContenido.trim() === '') {
          throw new Error('El contenido del archivo está vacío');
        }

        // Construir data URL correctamente
        let dataUrl: string;
        if (report.archivoContenido.startsWith('data:')) {
          // Ya tiene el prefijo data:
          dataUrl = report.archivoContenido;
        } else {
          // Construir el data URL con el tipo MIME correcto
          const mimeType = report.archivoTipo || 'application/octet-stream';
          dataUrl = `data:${mimeType};base64,${report.archivoContenido}`;
        }

        console.log('📄 FileViewerModal - Data URL constructed:', {
          dataUrlLength: dataUrl.length,
          dataUrlPrefix: dataUrl.substring(0, 100) + '...'
        });

        // Para imágenes y PDFs, usar data URL directamente
        // Solo convertir a blob URL si el archivo es muy grande (>2MB)
        if (report.archivoTipo?.startsWith('image/') || report.archivoTipo === 'application/pdf') {
          const estimatedSize = (report.archivoContenido.length * 3) / 4; // Tamaño aproximado del base64
          
          if (estimatedSize > 2 * 1024 * 1024) {
            // Archivo grande, usar blob URL para mejor rendimiento
            console.log('📄 FileViewerModal - Large file detected, converting to blob URL');
            fetch(dataUrl)
              .then(res => res.blob())
              .then(blob => {
                const url = URL.createObjectURL(blob);
                console.log('📄 FileViewerModal - Blob URL created:', url);
                setFileContent(url);
                setIsLoading(false);
              })
              .catch(error => {
                console.error('❌ Error al convertir a blob:', error);
                setFileContent('Error al cargar el archivo');
                setIsLoading(false);
              });
          } else {
            // Archivo pequeño, usar data URL directamente
            console.log('📄 FileViewerModal - Using data URL directly');
            setFileContent(dataUrl);
            setIsLoading(false);
          }
        } else {
          // Para otros tipos, mostrar información
          setFileContent(`Archivo cargado: ${fileName} (${report.archivoTamaño || '?'} bytes)`);
          setIsLoading(false);
        }
      } else if (report.fileUrl) {
        // Para compatibilidad con URLs externas (opcional)
        console.log('📄 FileViewerModal - Using external URL:', report.fileUrl);
        setFileContent(report.fileUrl);
        setIsLoading(false);
      } else {
        console.warn('⚠️ FileViewerModal - No file content available');
        setFileContent('No hay contenido de archivo disponible');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Error al cargar el archivo:', error);
      setFileContent('Error al cargar el archivo: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      setIsLoading(false);
    }
  };

  // Verifica si el reporte tiene archivos adjuntos
  const hasFileAttachment = (report: any): boolean => {
    return !!report.archivoContenido || 
           !!(report.fileUrl) || 
           !!(report.attachments && report.attachments.length > 0);
  };

  // Obtiene la URL del archivo adjunto
  const getFileUrl = (report: any): string | null => {
    if (report.archivoContenido) {
      return `data:${report.archivoTipo || 'application/octet-stream'};base64,${report.archivoContenido}`;
    }
    if (report.fileUrl) return report.fileUrl;
    if (report.attachments && report.attachments.length > 0) return report.attachments[0];
    return null;
  };
  
  // Obtiene el nombre del archivo a mostrar
  const getDisplayFileName = (report: any): string => {
    return report.archivoNombre || 
           report.fileUrl?.split('/').pop() || 
           (report.attachments?.[0] || 'Archivo adjunto');
  };

  const handleDownload = async (fileName: string) => {
    try {
      console.log('💾 FileViewerModal - Starting download:', fileName);
      
      // Verificar si el reporte tiene un archivo adjunto
      if (!hasFileAttachment(report)) {
        throw new Error('Este reporte no tiene un archivo adjunto para descargar.');
      }

      // Determinar el nombre del archivo
      const downloadName = report.archivoNombre || 
                          fileName || 
                          `reporte-${report.id}.${getFileExtension(report.archivoTipo || '')}`;

      console.log('💾 FileViewerModal - Download name:', downloadName);

      // Si tenemos contenido base64 directamente
      if (report.archivoContenido) {
        try {
          // Construir data URL correctamente
          let dataUrl: string;
          if (report.archivoContenido.startsWith('data:')) {
            dataUrl = report.archivoContenido;
          } else {
            const mimeType = report.archivoTipo || 'application/octet-stream';
            dataUrl = `data:${mimeType};base64,${report.archivoContenido}`;
          }

          console.log('💾 FileViewerModal - Converting base64 to blob for download');

          // Convertir data URL a blob para descarga
          const response = await fetch(dataUrl);
          if (!response.ok) {
            throw new Error('Error al decodificar el archivo base64');
          }
          
          const blob = await response.blob();
          console.log('💾 FileViewerModal - Blob created:', {
            size: blob.size,
            type: blob.type
          });

          // Crear URL del blob y descargar
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = downloadName;
          document.body.appendChild(a);
          a.click();
          
          // Limpieza
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            console.log('💾 FileViewerModal - Download completed and cleaned up');
          }, 100);
          
          return;
        } catch (base64Error) {
          console.error('❌ Error al procesar base64:', base64Error);
          throw new Error('El archivo base64 está corrupto o tiene un formato inválido');
        }
      }

      // Fallback: usar fileUrl si está disponible
      const fileUrl = getFileUrl(report);
      if (!fileUrl) {
        throw new Error('No se pudo obtener el contenido del archivo.');
      }

      console.log('💾 FileViewerModal - Using fileUrl:', fileUrl);

      // Para URLs externas (compatibilidad hacia atrás)
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error al descargar el archivo: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      
      // Limpieza
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error al descargar el archivo:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ocurrió un error inesperado al intentar descargar el archivo.';
      
      alert(errorMessage);
    }
  };
  
  // Obtiene la extensión del archivo a partir del tipo MIME
  const getFileExtension = (mimeType: string): string => {
    const extensionMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/plain': 'txt',
      'text/csv': 'csv'
    };
    
    return extensionMap[mimeType.toLowerCase()] || 'bin';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {report.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[70vh]">
          {/* Lista de archivos */}
          <div className="w-1/3 border-r pr-4">
            <h3 className="font-semibold mb-3">Archivos Adjuntos</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {hasFileAttachment(report) ? (
                <div
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFile ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleFileClick(getDisplayFileName(report))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(getDisplayFileName(report))}
                      <span className="text-sm font-medium truncate">
                        {getDisplayFileName(report)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {getFileType(getDisplayFileName(report))}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(getDisplayFileName(report));
                        }}
                        className="h-6 w-6 p-0"
                        title="Descargar archivo"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No hay archivos adjuntos</p>
                </div>
              )}
            </div>
          </div>

          {/* Visor de archivo */}
          <div className="w-2/3 pl-4">
                {selectedFile ? (
              <div className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getFileIcon(selectedFile)}
                    <span className="truncate max-w-xs">{selectedFile}</span>
                    {report.archivoTamaño && (
                      <span className="text-xs text-muted-foreground font-normal">
                        ({(report.archivoTamaño / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="border rounded-lg h-[calc(100%-3rem)] overflow-hidden">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center bg-muted/30">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Cargando archivo...</p>
                      </div>
                    </div>
                  ) : getFileType(selectedFile) === 'Imagen' ? (
                    <div className="h-full flex flex-col">
                      {fileContent && (fileContent.startsWith('blob:') || fileContent.startsWith('data:')) ? (
                        <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
                          <img 
                            src={fileContent} 
                            alt={selectedFile}
                            className="max-w-full max-h-full object-contain"
                            onError={() => setFileContent('Error al cargar la imagen')}
                          />
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center bg-muted/30">
                          <div className="text-center">
                            <Image className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">{fileContent || 'No se puede mostrar la vista previa'}</p>
                          </div>
                        </div>
                      )}
                      <div className="p-4 border-t bg-white">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(selectedFile)}
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar Imagen
                        </Button>
                      </div>
                    </div>
                  ) : getFileType(selectedFile) === 'PDF' ? (
                    <div className="h-full flex flex-col">
                      {fileContent && (fileContent.startsWith('blob:') || fileContent.startsWith('data:')) ? (
                        <div className="flex-1">
                          <iframe 
                            src={fileContent}
                            className="w-full h-full border-0"
                            title={selectedFile}
                            onError={() => setFileContent('Error al cargar el PDF')}
                          />
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center bg-muted/30">
                          <div className="text-center">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">{fileContent || 'No se puede mostrar la vista previa'}</p>
                          </div>
                        </div>
                      )}
                      <div className="p-4 border-t bg-white">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(selectedFile)}
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar PDF Completo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-muted/30">
                      <div className="text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Vista previa no disponible</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {selectedFile}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Tipo: {report.archivoTipo || 'Desconocido'}
                        </p>
                        <div className="mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownload(selectedFile)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar Archivo
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Selecciona un archivo para verlo</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Descripción del informe */}
        {report.notes && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold mb-2">Descripción del Informe</h4>
            <p className="text-sm text-muted-foreground">{report.notes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
