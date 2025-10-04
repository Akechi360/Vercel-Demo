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
      title: '¿Eliminar promotora?',
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
            text: 'La promotora fue eliminada.', 
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de la Promotora</DialogTitle>
            <DialogDescription>ID: {affiliation.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <p>
              <strong>Nombre:</strong> {affiliation.promotora}
            </p>
            <p>
              <strong>Afiliados Totales:</strong> {affiliation.afiliados}
            </p>
            <p>
              <strong>Última Afiliación:</strong> {new Date(affiliation.ultimaAfiliacion).toLocaleDateString()}
            </p>
            <p className="flex items-center gap-2">
              <strong>Estado:</strong>
              <Badge className={cn(
                    affiliation.estado === "Activo" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300"
                )}>
                    {affiliation.estado}
                </Badge>
            </p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Promotora</DialogTitle>
            <DialogDescription>
              Modifica los datos de la promotora. Los cambios no se guardarán.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input id="name" defaultValue={affiliation.promotora} className="col-span-3" />
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
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
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
