'use client';

import { useState } from 'react';
import { Plus, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/layout/auth-provider';
import { addLabResult } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

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
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Urológico',
    resultado: 'Pendiente'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'Debes estar autenticado',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      await addLabResult(
        {
          nombre: formData.nombre,
          tipo: formData.tipo,
          resultado: formData.resultado,
          patientUserId: patientUserId,
          doctorUserId: currentUser.userId
        },
        {
          userId: currentUser.userId,
          role: currentUser.role as any,
          name: currentUser.name,
          email: currentUser.email,
          currentTime: new Date()
        }
      );

      toast({
        title: 'Éxito',
        description: 'Resultado de laboratorio agregado'
      });
      setOpen(false);
      setFormData({ nombre: '', tipo: 'Urológico', resultado: 'Pendiente' });
      onSuccess?.();
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Error al agregar resultado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Agregar Resultado de Laboratorio
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Paciente: {patientName}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Test *</Label>
            <Input
              id="nombre"
              placeholder="Ej: PSA Total, Uroanálisis"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Estudio *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Urológico">Urológico</SelectItem>
                <SelectItem value="Sangre">Sangre</SelectItem>
                <SelectItem value="Orina">Orina</SelectItem>
                <SelectItem value="Imagen">Imagen</SelectItem>
                <SelectItem value="Biopsia">Biopsia</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
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

