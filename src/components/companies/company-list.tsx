
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyStore } from '@/lib/store/company-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, Search, UserPlus } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AddCompanyForm } from './add-company-form';
import { cn } from '@/lib/utils';
import type { Company } from '@/lib/types';
import { Badge } from '../ui/badge';

const ITEMS_PER_PAGE = 6;

export default function CompanyList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();
  const companies = useCompanyStore((state) => state.companies);

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handleCompanyClick = (companyId: string) => {
    router.push(`/companies/${companyId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Agregar Empresa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Agregar Nueva Empresa</DialogTitle>
                    <DialogDescription>
                        Complete el formulario para registrar una nueva empresa.
                    </DialogDescription>
                </DialogHeader>
                <AddCompanyForm onSuccess={() => setIsModalOpen(false)} />
            </DialogContent>
        </Dialog>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {paginatedCompanies.map((company, index) => (
            <motion.div key={company.id} variants={itemVariants}>
              <Card 
                className={cn(
                    "flex flex-col h-full rounded-2xl shadow-sm transition-all duration-300 ease-in-out bg-card/50 hover:scale-[1.02] cursor-pointer",
                    "hover:shadow-[0_0_20px_rgba(46,49,146,0.4)]"
                )}
                onClick={() => handleCompanyClick(company.id)}
               >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                          <Building className="h-6 w-6 text-primary" />
                      </div>
                      <span>{company.name}</span>
                    </CardTitle>
                    <Badge variant={company.status === 'Activo' ? 'success' : 'destructive'}>
                        {company.status}
                    </Badge>
                  </div>
                  <CardDescription>RUC: {company.ruc}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                    <p>Teléfono: {company.phone || 'No disponible'}</p>
                    <p>Pacientes Afiliados: <span className="font-bold text-foreground">{company.patientCount}</span></p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredCompanies.length === 0 && (
         <div className="text-center py-16 text-muted-foreground col-span-full">
           <Search className="mx-auto h-10 w-10 mb-2" />
           No se encontraron empresas.
         </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 pt-4">
            <Button 
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            >
                Anterior
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>
            <Button 
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
            >
                Siguiente
            </Button>
        </div>
      )}
    </div>
  );
}
