'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Image, Download, X, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReportType {
  id: string;
  title: string;
  notes?: string;
  attachments?: string[];
  type?: string;
  archivoNombre?: string | { name: string };
  archivoTipo?: string;
  archivoContenido?: string;
  archivoTamaño?: number;
  fileUrl?: string;
}

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivoNombre?: string | { name: string };
  fileUrl?: string;
  fileType?: string;
  report: ReportType;
}

export function FileViewerModal({ 
  isOpen, 
  onClose, 
  archivoNombre: propArchivoNombre, 
  fileUrl: propFileUrl,
  fileType: propFileType,
  report 
}: FileViewerModalProps): JSX.Element {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Moved fileType declaration before useEffect
  const fileType = propFileType || report.archivoTipo || 'application/pdf';
  const archivoNombre = propArchivoNombre || report.archivoNombre || 'documento';
  const fileUrl = propFileUrl || report.fileUrl || '';
  
  useEffect(() => {
    const loadFileContent = async () => {
      if (!report.archivoContenido) {
        console.log('⚠️ No file content available in report');
        setError('No hay contenido de archivo disponible');
        setIsLoading(false);
        return;
      }

      console.log('🔄 Loading file content...', {
        hasContent: !!report.archivoContenido,
        contentLength: report.archivoContenido.length,
        fileType
      });

      try {
        setIsLoading(true);
        setError(null);
        
        // Create a data URL from the base64 content
        const dataUrl = `data:${fileType};base64,${report.archivoContenido}`;
        console.log('📄 Created data URL:', dataUrl.substring(0, 50) + '...');
        
        setFileContent(dataUrl);
        setSelectedFile(dataUrl);
      } catch (error) {
        console.error('❌ Error loading file content:', error);
        setError('Error al cargar el archivo');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && report.archivoContenido) {
      loadFileContent();
    } else {
      setFileContent(null);
      setSelectedFile(null);
      setIsLoading(false);
    }
  }, [isOpen, report.archivoContenido, fileType]);
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Utility functions
  const hasFileAttachment = (r: ReportType) => !!(r.archivoContenido || (r.attachments && r.attachments.length > 0));
  const getDisplayFileName = (r: ReportType) => {
    const name = r.archivoNombre || r.title || 'Archivo';
    return typeof name === 'string' ? name : name?.name || 'Archivo';
  };

  // Debug: Log completo de los datos recibidos
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 FileViewerModal - Datos recibidos:', {
        id: report.id,
        title: report.title,
        archivoNombre,
        fileType,
        fileUrl,
        archivoTamaño: report.archivoTamaño,
        hasArchivoContenido: !!report.archivoContenido,
        archivoContenidoLength: report.archivoContenido?.length || 0,
        archivoContenidoPreview: report.archivoContenido ? 
          `[Base64: ${report.archivoContenido.substring(0, 10)}...]` : 
          'No content',
        hasAttachments: !!report.attachments?.length,
        type: report.type
      });
    }
  }, [isOpen, report, archivoNombre, fileType, fileUrl]);

  // Check if we have content to display
  const hasContent = !!report.archivoContenido && report.archivoContenido.length > 0;
  
  // Create data URL for the file if we have content
  const fileDataUrl = hasContent && report.archivoContenido
    ? `data:${fileType};base64,${report.archivoContenido}`
    : null;
    
  console.log('📄 FileViewerModal - File data:', {
    hasContent,
    fileType,
    dataUrl: fileDataUrl ? `[Data URL, length: ${fileDataUrl.length}]` : 'No data URL',
    archivoNombre,
    fileUrl
  });

  const getFileIcon = (fileName: string | { name: string } | null | undefined) => {
    // Normalize fileName to string
    let name: string = '';
    if (typeof fileName === 'string') {
      name = fileName;
    } else if (fileName && typeof fileName === 'object' && 'name' in fileName) {
      name = fileName.name;
    }
    
    // If no valid name, return default icon
    if (!name) {
      return <FileText className="w-4 h-4" />;
    }
    
    const extension = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <Image className="w-4 h-4" />;
    }
    if (['pdf'].includes(extension || '')) {
      return <FileText className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getFileType = (fileName: string | { name: string } | null | undefined) => {
    // Normalize fileName to string
    let name: string = '';
    if (typeof fileName === 'string') {
      name = fileName;
    } else if (fileName && typeof fileName === 'object' && 'name' in fileName) {
      name = fileName.name;
    }
    
    if (!name) return 'Documento';
    
    const extension = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return 'Imagen';
    }
    if (extension === 'pdf') {
      return 'PDF';
    }
    return 'Documento';
  };

  const handleFileClick = (fileName: string | { name: string } | null | undefined) => {
    const displayName = typeof fileName === 'string' ? fileName : fileName?.name || 'Archivo';
    setSelectedFile(displayName);
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
        const dataUrl = report.archivoContenido;
        const isImage = dataUrl.startsWith('data:image');
        const isLargeFile = dataUrl.length > 100000; // ~100KB

        if (isImage && isLargeFile) {
          console.log('📄 FileViewerModal - Archivo de imagen grande detectado, convirtiendo a blob URL');
          
          // Convertir data URL a Blob
          const byteString = atob(dataUrl.split(',')[1]);
          const mimeString = dataUrl.split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          
          const blob = new Blob([ab], { type: mimeString });
          const url = URL.createObjectURL(blob);
          
          console.log('📄 FileViewerModal - Blob URL creada:', url);
          setFileContent(url);
          setIsLoading(false);
        } else {
          // Archivo pequeño o no es imagen, usar data URL directamente
          console.log('📄 FileViewerModal - Usando data URL directamente');
          setFileContent(dataUrl);
          setIsLoading(false);
        }
      } else {
        // Si no hay URL de archivo, verificar si hay contenido directo
        if (report.archivoContenido) {
          setFileContent(report.archivoContenido);
        } else {
          console.warn('⚠️ FileViewerModal - No hay contenido de archivo disponible');
          setFileContent('No hay contenido de archivo disponible');
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar el archivo:', error);
      setError('Error al cargar el archivo');
      setIsLoading(false);
    }
  };

  // Obtiene la URL del archivo adjunto
  const getFileUrl = (report: ReportType): string | null => {
    if (report.archivoContenido) {
      return `data:${report.archivoTipo || 'application/octet-stream'};base64,${report.archivoContenido}`;
    }
    if (report.attachments && report.attachments.length > 0) {
      return report.attachments[0];
    }
    return null;
  };

  const handleDownload = async (fileName: string | { name: string } | null | undefined) => {
    // Normalizar el nombre del archivo
    const name = typeof fileName === 'string' 
      ? fileName 
      : (fileName?.name || 'archivo');

    try {
      console.log('💾 FileViewerModal - Iniciando descarga:', name);
      
      // Verificar si el reporte tiene un archivo adjunto
      if (!(report.archivoContenido || (report.attachments && report.attachments.length > 0))) {
        throw new Error('Este reporte no tiene un archivo adjunto para descargar.');
      }

      // Determinar el nombre del archivo
      const downloadName = typeof report.archivoNombre === 'string' 
        ? report.archivoNombre 
        : (report.archivoNombre?.name || name || `reporte-${report.id}${getFileExtension(report.archivoTipo || '')}`);

      console.log('💾 FileViewerModal - Nombre de descarga:', downloadName);

      // 1. PRIORIDAD: contenido base64 de la BD
      if (report?.archivoContenido) {
        console.log('📦 Descargando desde base64...');
        
        const base64Data = report.archivoContenido.startsWith('data:') 
          ? report.archivoContenido.split(',')[1]
          : report.archivoContenido;
        const mimeType = report.archivoTipo || 'application/octet-stream';
        
        try {
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = downloadName;
          document.body.appendChild(link);
          link.click();
          
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 100);
          
          console.log('✅ Descarga desde base64 completada');
          return;
          
        } catch (base64Error) {
          console.error('Error al procesar base64:', base64Error);
          throw new Error('El archivo base64 está corrupto o tiene un formato inválido');
        }
      }

      // 2. FALLBACK: URL externa (solo HTTP/HTTPS válidas, NO blob URLs)
      const fileUrl = getFileUrl(report);
      if (fileUrl && typeof fileUrl === 'string' && 
          (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
        console.log('🌐 Descargando desde URL externa:', fileUrl);
        
        try {
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = downloadName;
          document.body.appendChild(link);
          link.click();
          
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 100);
          
          console.log('✅ Descarga desde URL completada');
          return;
          
        } catch (urlError) {
          console.error('Error al descargar desde URL:', urlError);
          // Continuar al siguiente método de descarga
        }
      }

      // 3. No hay archivo disponible
      throw new Error('No hay archivo disponible para descargar. Los reportes antiguos no tienen archivos almacenados.');
      
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Visualizador de Archivos</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[70vh]">
          {/* Lista de archivos */}
          <div className="w-1/3 border-r pr-4">
            <h3 className="font-semibold mb-3">Archivos Adjuntos</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {(report.archivoContenido || (report.attachments && report.attachments.length > 0)) ? (
                <div
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFile ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleFileClick(report.archivoNombre || report.fileUrl || '')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(report.archivoNombre || report.fileUrl || '')}
                      <span className="text-sm font-medium truncate">
                        {getDisplayFileName(report)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {getFileType(report.archivoNombre || report.fileUrl || '')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(report.archivoNombre || report.fileUrl || '');
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
                      </div>
                    </div>
                  ) : fileContent ? (
                    fileType.startsWith('image/') ? (
                      <img 
                        src={fileContent} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <iframe 
                        src={fileContent} 
                        className="w-full h-full" 
                        title="Document preview"
                      />
                    )
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p>No se pudo cargar el archivo</p>
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
