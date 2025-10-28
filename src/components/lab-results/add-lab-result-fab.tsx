'use client';

import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/layout/auth-provider';
import { addLabResult } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { FileInput } from '@/components/ui/file-input';

interface AddLabResultFabProps {
  patientUserId: string;
  patientName: string;
  onSuccess?: () => void;
}

export default function AddLabResultFab({ patientUserId, patientName, onSuccess }: AddLabResultFabProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Campos para parámetros dinámicos (carga manual)
  const [params, setParams] = useState([
    { name: '', value: '' }
  ]);
  // Archivo adjunto
  const [fileList, setFileList] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Urológico',
    resultado: ''
  });

  const handleParamChange = (idx: number, field: 'name' | 'value', value: string) => {
    setParams((prev) => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };
  const handleAddParam = () => setParams([...params, { name: '', value: '' }]);
  const handleRemoveParam = (idx: number) => setParams(params.length === 1 ? [{ name: '', value: '' }] : params.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ title: 'Error', description: 'Debes estar autenticado', variant: 'destructive' });
      return;
    }
    if (!formData.nombre) {
      toast({ title: 'Campo requerido', description: 'El nombre del estudio es obligatorio.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      let fileData = null;
      if (fileList.length > 0) {
        const file = fileList[0];
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = () => resolve(true);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        // Separar header data:, tipo MIME y contenido base64 si necesario
        const content = (reader.result as string);
        fileData = {
          archivoNombre: file.name,
          archivoTipo: file.type,
          archivoTamaño: file.size,
          archivoContenido: content?.split(',')[1] || '', // guardar solo base64 puro como en informes
        };
        console.log('[LAB_RESULT_FORM] Archivo procesado:', {
          nombre: fileData.archivoNombre,
          tipo: fileData.archivoTipo,
          tamaño: fileData.archivoTamaño,
          contenidoLength: fileData.archivoContenido.length
        });
      }
      // Guardar todos los parámetros en un objeto JSON
      const valores = params.filter(p => p.name && p.value);
      await addLabResult(
        {
          nombre: formData.nombre,
          tipo: formData.tipo,
          resultado: valores.length > 0 ? JSON.stringify(valores) : '',
          valores: valores.length > 0 ? valores : undefined,
          patientUserId: patientUserId,
          doctorUserId: currentUser.userId,
          ...(fileData || {})
        },
        {
          userId: currentUser.userId,
          role: currentUser.role as any,
          name: currentUser.name,
          email: currentUser.email,
          currentTime: new Date()
        }
      );
      toast({ title: 'Éxito', description: 'Resultado de laboratorio agregado' });
      setOpen(false);
      setFormData({ nombre: '', tipo: 'Urológico', resultado: '' });
      setParams([{ name: '', value: '' }]);
      setFileList([]);
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Error al agregar resultado', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-400/90 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-[0_0_20px_rgba(58,109,255,0.4),0_0_40px_rgba(186,85,211,0.3),0_0_60px_rgba(255,105,180,0.2)] animate-pulse-slow"
        >
          <FlaskConical className="h-8 w-8" />
          <span className="sr-only">Agregar Resultado de Laboratorio</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Agregar Resultado de Laboratorio
          </DialogTitle>
          <DialogDescription>
            Paciente: {patientName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Estudio *</Label>
            <Input
              id="nombre"
              placeholder="Ej: PSA Total, Hematología, Glucosa..."
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de estudio *</Label>
            <Select
              value={formData.tipo}
              onValueChange={v => setFormData({ ...formData, tipo: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PSA">PSA (Antígeno Prostático)</SelectItem>
                <SelectItem value="Urológico">Urológico</SelectItem>
                <SelectItem value="Sangre">Sangre</SelectItem>
                <SelectItem value="Orina">Orina</SelectItem>
                <SelectItem value="Imagen">Imagen</SelectItem>
                <SelectItem value="Biopsia">Biopsia</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Parámetros (Carga Manual)</Label>
            <div className="space-y-2">
              {params.map((param, idx) => (
                <div key={idx} className="flex gap-2 mb-1">
                  <Input
                    placeholder="Parámetro (ej: PSA Total)"
                    value={param.name}
                    onChange={e => handleParamChange(idx, 'name', e.target.value)}
                    className="flex-1" required={idx === 0}
                  />
                  <Input
                    placeholder="Valor (ej: 3.4 ng/mL)"
                    value={param.value}
                    onChange={e => handleParamChange(idx, 'value', e.target.value)}
                    className="flex-1" required={idx === 0}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveParam(idx)} disabled={params.length === 1}>✕</Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={handleAddParam}>Agregar campo</Button>
            </div>
          </div>

          <div>
            <Label>Adjuntar Archivo (PDF o Imagen)</Label>
            <FileInput value={fileList} onValueChange={setFileList} accept=".pdf,.jpg,.jpeg,.png,.gif" multiple={false}/>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Agregando...' : 'Agregar Resultado'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

