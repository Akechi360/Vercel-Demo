// src/components/affiliations/affiliation-actions.tsx
'use client';

import { useState } from 'react';
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

const MySwal = withReactContent(Swal);

interface AffiliationActionsProps {
  affiliation: Affiliation;
  onDelete: () => void;
}

export default function AffiliationActions({ affiliation, onDelete }: AffiliationActionsProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

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
              <Input id="plan" defaultValue={
                affiliation.planId === 'basico' ? 'Tarjeta Saludable' : 
                affiliation.planId === 'premium' ? 'F. Espíritu Santo' : 
                affiliation.planId || 'N/A'
              } className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monto" className="text-right">
                Monto
              </Label>
              <Input id="monto" type="number" defaultValue={affiliation.monto || 0} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
               <Select defaultValue={affiliation.estado}>
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
            <Button onClick={() => setIsEditOpen(false)}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
