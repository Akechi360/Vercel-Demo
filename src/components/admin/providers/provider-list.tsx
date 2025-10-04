'use client';

import { useState, useMemo } from 'react';
import { useProviderStore } from '@/lib/store/provider-store';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AddProviderForm } from './add-provider-form';

export default function ProviderList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const providers = useProviderStore((state) => state.providers);

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) =>
      provider.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [providers, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Proveedor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo Proveedor</DialogTitle>
                    <DialogDescription>
                        Complete el formulario para registrar un nuevo proveedor.
                    </DialogDescription>
                </DialogHeader>
                <AddProviderForm onSuccess={() => setIsModalOpen(false)} />
            </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Dirección</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProviders.map((provider) => (
              <motion.tr
                key={provider.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <TableCell className="font-medium">{provider.name}</TableCell>
                <TableCell>{provider.phone}</TableCell>
                <TableCell>{provider.email}</TableCell>
                <TableCell>{provider.address}</TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
        {filteredProviders.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
                <Search className="mx-auto h-10 w-10 mb-2" />
                No se encontraron proveedores.
            </div>
        )}
      </div>
    </div>
  );
}
