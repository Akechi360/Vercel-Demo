'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateLabResultStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface CompleteLabResultButtonProps {
  labResultId: string;
  testName: string;
  currentValue: string;
  onSuccess?: () => void;
}

export default function CompleteLabResultButton({ 
  labResultId, 
  testName, 
  currentValue,
  onSuccess 
}: CompleteLabResultButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(currentValue);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateLabResultStatus(labResultId, 'COMPLETADO', resultado);
      
      toast({
        title: 'Resultado marcado como completado',
        description: 'Se han enviado notificaciones al paciente y doctor'
      });
      
      setOpen(false);
      onSuccess?.();
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Error al completar resultado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="gap-1">
          <CheckCircle className="h-4 w-4" />
          Completar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Completar Resultado</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {testName}
          </p>
        </DialogHeader>

        <form onSubmit={handleComplete} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resultado">Valor del Resultado *</Label>
            <Input
              id="resultado"
              placeholder="Ej: 4.2 ng/mL"
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              💡 Al completar, se notificará automáticamente al paciente y doctor
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Completando...' : 'Marcar como Completado'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

