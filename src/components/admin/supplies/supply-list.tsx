'use client';

import { useState, useMemo } from 'react';
import { useSupplyStore } from '@/lib/store/supply-store';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AddSupplyForm } from './add-supply-form';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, isBefore, differenceInDays } from 'date-fns';

const LOW_STOCK_THRESHOLD = 20;
const EXPIRY_THRESHOLD_DAYS = 30;

export default function SupplyList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supplies = useSupplyStore((state) => state.supplies);

  const filteredSupplies = useMemo(() => {
    return supplies.filter((supply) =>
      supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supply.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [supplies, searchTerm]);

  const getStockStatus = (stock: number): 'ok' | 'low' | 'critical' => {
    if (stock < LOW_STOCK_THRESHOLD / 2) return 'critical';
    if (stock < LOW_STOCK_THRESHOLD) return 'low';
    return 'ok';
  }

  const getExpiryStatus = (expiryDateStr: string): 'ok' | 'soon' | 'expired' => {
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    if (isBefore(expiryDate, today)) return 'expired';
    const daysUntilExpiry = differenceInDays(expiryDate, today);
    if (daysUntilExpiry <= EXPIRY_THRESHOLD_DAYS) return 'soon';
    return 'ok';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar insumos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Insumo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo Insumo</DialogTitle>
                    <DialogDescription>
                        Complete el formulario para registrar un nuevo insumo en el inventario.
                    </DialogDescription>
                </DialogHeader>
                <AddSupplyForm onSuccess={() => setIsModalOpen(false)} />
            </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Vencimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSupplies.map((supply) => {
              const stockStatus = getStockStatus(supply.stock);
              const expiryStatus = getExpiryStatus(supply.expiryDate);
              return (
                <motion.tr
                  key={supply.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TableCell className="font-medium">{supply.name}</TableCell>
                  <TableCell>{supply.category}</TableCell>
                  <TableCell>
                    <Badge variant={stockStatus === 'critical' ? 'destructive' : stockStatus === 'low' ? 'outline' : 'success'}>
                      {supply.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>{supply.unit}</TableCell>
                  <TableCell>
                    <span className={cn({
                      'text-red-500 font-semibold': expiryStatus === 'expired',
                      'text-yellow-500': expiryStatus === 'soon',
                    })}>
                      {format(new Date(supply.expiryDate), 'dd/MM/yyyy')}
                    </span>
                  </TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
        {filteredSupplies.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
                <Search className="mx-auto h-10 w-10 mb-2" />
                No se encontraron suministros.
            </div>
        )}
      </div>
    </div>
  );
}
