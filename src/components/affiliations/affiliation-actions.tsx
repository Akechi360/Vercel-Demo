// src/components/affiliations/affiliation-actions.tsx
'use client';

import { useState, useEffect } from 'react';
import type { Affiliation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { updateAffiliation } from '@/lib/actions';

const MySwal = withReactContent(Swal);

interface AffiliationActionsProps {
  affiliation: Affiliation;
  onDelete: () => void;
  onUpdate?: () => void;
}

export default function AffiliationActions({ affiliation, onDelete, onUpdate }: AffiliationActionsProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(affiliation.planId || 'basico');
  const [selectedPaymentType, setSelectedPaymentType] = useState(affiliation.tipoPago || 'contado');
  const [monto, setMonto] = useState(affiliation.monto || 0);
  const [estado, setEstado] = useState(affiliation.estado);
  
  // Sincronizar el estado cuando la prop affiliation cambie
  useEffect(() => {
    setSelectedPlan(affiliation.planId || 'basico');
    setSelectedPaymentType(affiliation.tipoPago || 'contado');
    setMonto(affiliation.monto || 0);
    setEstado(affiliation.estado);
  }, [affiliation]);

  const handleDelete = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    MySwal.fire({
      title: '¿Eliminar Afiliación?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: isDarkMode ? '#1e293b' : '#ffffff',
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete();
        MySwal.fire({
            title: 'Eliminado', 
            text: 'La afiliación fue eliminada.', 
            icon: 'success',
            background: isDarkMode ? '#1e293b' : '#ffffff',
            color: isDarkMode ? '#f1f5f9' : '#0f172a',
            confirmButtonColor: '#4f46e5',
        });
      }
    });
  };

  const handleSaveChanges = async () => {
    try {
      const isDarkMode = document.documentElement.classList.contains('dark');
      
      // Mostrar loading
      MySwal.fire({
        title: 'Guardando cambios...',
        text: 'Por favor espera',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          MySwal.showLoading();
        },
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f1f5f9' : '#0f172a',
      });

      // Actualizar la afiliación
      await updateAffiliation(affiliation.id, {
        planId: selectedPlan,
        tipoPago: selectedPaymentType,
        monto: monto,
        estado: estado
      });

      // Cerrar modal y mostrar éxito
      setIsEditOpen(false);
      
      // Refrescar la lista de afiliaciones para mostrar los cambios
      if (onUpdate) {
        onUpdate();
      }
      
      MySwal.fire({
        title: '¡Actualizado!',
        text: 'La afiliación fue actualizada correctamente.',
        icon: 'success',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f1f5f9' : '#0f172a',
        confirmButtonColor: '#4f46e5',
      });

    } catch (error) {
      console.error('Error updating affiliation:', error);
      const isDarkMode = document.documentElement.classList.contains('dark');
      MySwal.fire({
        title: 'Error',
        text: 'No se pudo actualizar la afiliación. Inténtalo de nuevo.',
        icon: 'error',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f1f5f9' : '#0f172a',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsDetailOpen(true)}>Ver detalle</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>Editar</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-500">
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de la Afiliación</DialogTitle>
            <DialogDescription>ID: {affiliation.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div>
                  <strong className="text-muted-foreground">Empresa:</strong>
                  <p className="font-medium">{affiliation.company?.nombre || 'Paciente Particular'}</p>
                </div>
                <div>
                  <strong className="text-muted-foreground">Usuario:</strong>
                  <p className="font-medium">{affiliation.user?.name || 'N/A'}</p>
                </div>
                <div>
                  <strong className="text-muted-foreground">Plan:</strong>
                  <p className="font-medium">
                    {affiliation.planId === 'basico' ? 'Tarjeta Saludable' : 
                     affiliation.planId === 'premium' ? 'F. Espíritu Santo' : 
                     affiliation.planId || 'N/A'}
                  </p>
                </div>
                <div>
                  <strong className="text-muted-foreground">Tipo de Pago:</strong>
                  <p className="font-medium">
                    {affiliation.tipoPago === 'contado' ? 'Contado' :
                     affiliation.tipoPago === 'credito' ? 'Crédito' :
                     affiliation.tipoPago || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <strong className="text-muted-foreground">Monto:</strong>
                  <p className="font-medium text-lg">${affiliation.monto || 0}</p>
                </div>
                <div>
                  <strong className="text-muted-foreground">Estado:</strong>
                  <div className="mt-1">
                    <Badge className={cn(
                      affiliation.estado === "ACTIVA" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : affiliation.estado === "INICIAL"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                        : affiliation.estado === "ABONO"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300"
                    )}>
                      {affiliation.estado === "ACTIVA" ? "Activa" :
                       affiliation.estado === "INICIAL" ? "Inicial" :
                       affiliation.estado === "ABONO" ? "Abono" :
                       affiliation.estado === "INACTIVA" ? "Inactiva" :
                       affiliation.estado === "SUSPENDIDA" ? "Suspendida" :
                       affiliation.estado === "VENCIDA" ? "Vencida" :
                       affiliation.estado || "N/A"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <strong className="text-muted-foreground">Fecha de Inicio:</strong>
                  <p className="font-medium">
                    {affiliation.fechaInicio ? new Date(affiliation.fechaInicio).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <strong className="text-muted-foreground">Fecha de Creación:</strong>
                  <p className="font-medium">
                    {affiliation.createdAt ? new Date(affiliation.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Información adicional para crédito */}
            {affiliation.tipoPago === 'credito' && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Información de Cuotas:</h4>
                <p className="text-sm text-muted-foreground">
                  {affiliation.planId === 'basico' 
                    ? '3 cuotas de $50.00 cada una' 
                    : affiliation.planId === 'premium'
                    ? '4 cuotas de $62.50 cada una'
                    : 'Cuotas según plan seleccionado'
                  }
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Afiliación</DialogTitle>
            <DialogDescription>
              Modifica los datos de la afiliación. Los cambios no se guardarán.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Empresa
              </Label>
              <Input id="company" defaultValue={affiliation.company?.nombre || 'Paciente Particular'} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">
                Usuario
              </Label>
              <Input id="user" defaultValue={affiliation.user?.name || 'N/A'} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan" className="text-right">
                Plan
              </Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccione un plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Plan Básico</SelectItem>
                  <SelectItem value="premium">Plan Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monto" className="text-right">
                Monto
              </Label>
              <Input 
                id="monto" 
                type="number" 
                value={monto} 
                onChange={(e) => setMonto(Number(e.target.value))}
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipoPago" className="text-right">
                Tipo de Pago
              </Label>
              <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccione tipo de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contado">Contado</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
               <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ACTIVA">Activa</SelectItem>
                    <SelectItem value="INACTIVA">Inactiva</SelectItem>
                    <SelectItem value="SUSPENDIDA">Suspendida</SelectItem>
                    <SelectItem value="VENCIDA">Vencida</SelectItem>
                    <SelectItem value="INICIAL">Inicial</SelectItem>
                    <SelectItem value="ABONO">Abono</SelectItem>
                </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
