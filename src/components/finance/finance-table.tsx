'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Payment, Patient, User, PaymentType, PaymentMethod } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import { Search, MoreHorizontal, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { addUroVitalLogo } from '@/lib/pdf-helpers';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
const ITEMS_PER_PAGE = 5;

interface FinanceTableProps {
  initialPayments: Payment[];
  patients: Patient[];
  doctors: User[];
  paymentTypes: PaymentType[];
  paymentMethods: PaymentMethod[];
  showAdminData?: boolean;
  showReceiptGeneration?: boolean;
  showReceiptDownload?: boolean;
}

const statusColors = {
  Pagado: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700/60',
  Pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/60',
  Anulado: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700/60',
};

export function FinanceTable({ 
    initialPayments, 
    patients: allPatients,
    doctors: allDoctors,
    paymentTypes: allPaymentTypes,
    paymentMethods: allPaymentMethods,
    showAdminData = true,
    showReceiptGeneration = true,
    showReceiptDownload = true
}: FinanceTableProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const patientMap = useMemo(() => new Map(allPatients.map(p => [p.id, p])), [allPatients]);
  const doctorMap = useMemo(() => new Map(allDoctors.map(d => [d.id, d])), [allDoctors]);
  const paymentTypeMap = useMemo(() => new Map(allPaymentTypes.map(pt => [pt.id, pt.name])), [allPaymentTypes]);
  const paymentMethodMap = useMemo(() => new Map(allPaymentMethods.map(pm => [pm.id, pm.name])), [allPaymentMethods]);

  const filteredPayments = useMemo(() => {
    let filtered = payments.filter(payment => {
      const patient = patientMap.get(payment.patientId);
      const searchTermMatch =
        patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === 'Todos' || payment.status === statusFilter;

      return searchTermMatch && statusMatch;
    });

    // Asignar el doctor "Dr. John Doe" si no hay doctorId
    return filtered.map(p => {
        if (!p.doctorId) {
            const defaultDoctor = allDoctors.find(d => d.name === 'Dr. John Doe');
            return {...p, doctorId: defaultDoctor?.id || 'doc-001' }
        }
        return p;
    });
  }, [payments, searchTerm, statusFilter, patientMap, allDoctors]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
    exit: { opacity: 0 }
  };

  const handleExport = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Reporte de Pagos", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generado el: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);

      autoTable(doc, {
        startY: 35,
        head: [['ID', 'Paciente', 'Doctor', 'Fecha', 'Monto', 'Método', 'Estado']],
        body: filteredPayments.map(p => {
            const patient = patientMap.get(p.patientId);
            const doctor = doctorMap.get(p.doctorId || '');
            return [
                p.id,
                patient?.name ?? 'N/A',
                doctor?.name ?? 'N/A',
                format(new Date(p.date), 'dd/MM/yyyy'),
                `$${p.monto.toFixed(2)}`,
                paymentMethodMap.get(p.paymentMethodId) || 'N/A',
                p.status
            ]
        }),
        headStyles: { fillColor: [58, 109, 255] },
      });

      doc.save(`reporte_pagos_${format(new Date(), 'yyyyMMdd')}.pdf`);
       toast({
            title: "Exportación a PDF exitosa",
            description: "El reporte de pagos ha sido descargado.",
        });

    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error de Exportación",
            description: "No se pudo generar el archivo PDF.",
        });
    }
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailModalOpen(true);
  };
  
  const handleDownloadPDF = (payment: Payment) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
     MySwal.fire({
      title: '¿Descargar comprobante?',
      text: "Se generará un archivo PDF con los datos del comprobante.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Descargar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
      background: isDarkMode ? "#1e293b" : "#ffffff",
      color: isDarkMode ? "#f1f5f9" : "#0f172a",
    }).then((result) => {
      if (result.isConfirmed) {
        const doc = new jsPDF();
        const patient = patientMap.get(payment.patientId);
        
        // Add UroVital logo
        addUroVitalLogo(doc);

        doc.setFontSize(18);
        doc.text("Comprobante de Pago", 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Fecha: ${format(new Date(payment.date), 'dd/MM/yyyy')}`, 14, 40);
        doc.text(`Paciente: ${patient?.name || 'N/A'}`, 14, 50);
        doc.text(`ID de Comprobante: ${payment.id}`, 14, 60);

        autoTable(doc, {
            startY: 70,
            head: [['Descripción', 'Monto']],
            body: [
                [paymentTypeMap.get(payment.paymentTypeId) || 'Servicio', `$${payment.monto.toFixed(2)}`]
            ],
            foot: [['Total', `$${payment.monto.toFixed(2)}`]],
            headStyles: { fillColor: [58, 109, 255] },
            footStyles: { fillColor: [232, 232, 232], textColor: 40, fontStyle: 'bold' }
        });

        doc.save(`comprobante_${payment.id}.pdf`);
        
        MySwal.fire({
            title: 'Descargado', 
            text: 'El PDF se ha generado correctamente.', 
            icon: 'success',
            background: isDarkMode ? "#1e293b" : "#ffffff",
            color: isDarkMode ? "#f1f5f9" : "#0f172a",
            confirmButtonColor: '#4f46e5',
        });
      }
    });
  };

  const handleAnnul = (paymentId: string) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    MySwal.fire({
      title: '¿Anular comprobante?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#718096',
      background: isDarkMode ? "#1e293b" : "#ffffff",
      color: isDarkMode ? "#f1f5f9" : "#0f172a",
    }).then((result) => {
      if (result.isConfirmed) {
        setPayments(prevPayments => prevPayments.map(p => p.id === paymentId ? { ...p, status: 'Anulado' } : p));
        MySwal.fire({
            title: 'Anulado', 
            text: 'El comprobante ha sido anulado.', 
            icon: 'success',
            background: isDarkMode ? "#1e293b" : "#ffffff",
            color: isDarkMode ? "#f1f5f9" : "#0f172a",
            confirmButtonColor: '#4f46e5',
        });
      }
    });
  };

  return (
    <div className="space-y-6 overflow-x-auto md:overflow-x-visible">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className='flex items-center gap-2'>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                    <TabsTrigger value="Todos">Todos</TabsTrigger>
                    <TabsTrigger value="Pagado">Pagados</TabsTrigger>
                    <TabsTrigger value="Pendiente">Pendientes</TabsTrigger>
                    <TabsTrigger value="Anulado">Anulados</TabsTrigger>
                </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" onClick={handleExport}>
                <FileDown className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Desktop Table */}
          <motion.div 
            className="hidden md:block rounded-lg border bg-card"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Fecha</TableHead>
                  {showAdminData && <TableHead>Monto</TableHead>}
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  {showReceiptGeneration && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayments.map((payment) => {
                  const patient = patientMap.get(payment.patientId);
                  const doctor = doctorMap.get(payment.doctorId || '');
                  const paymentMethod = paymentMethodMap.get(payment.paymentMethodId);
                  return (
                    <motion.tr
                      key={payment.id}
                      variants={itemVariants}
                      layout
                      className="group"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {patient?.avatarUrl && <AvatarImage src={patient.avatarUrl} alt={patient.name} />}
                            <AvatarFallback>{getInitials(patient?.name ?? 'N/A')}</AvatarFallback>
                          </Avatar>
                          <div>
                             <span className="font-medium">{patient?.name ?? 'N/A'}</span>
                             <p className="text-xs text-muted-foreground">{payment.id}</p>
                          </div>
                        </div>
                      </TableCell>
                       <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                             <AvatarFallback>{getInitials(doctor?.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                             <span className="font-medium">{doctor?.name || 'N/A'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      {showAdminData && <TableCell className="font-semibold">${payment.monto.toFixed(2)}</TableCell>}
                      <TableCell>{paymentMethod || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={cn('font-medium', statusColors[payment.status])}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      {showReceiptGeneration && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className='h-8 w-8'>
                                 <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => handleViewDetails(payment)}>Ver comprobante</DropdownMenuItem>
                              {showReceiptDownload && <DropdownMenuItem onClick={() => handleDownloadPDF(payment)}>Descargar PDF</DropdownMenuItem>}
                              {showAdminData && <DropdownMenuItem onClick={() => handleAnnul(payment.id)} className="text-red-500">Anular</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </motion.div>

          {/* Mobile Cards */}
          <motion.div 
            className="grid grid-cols-1 gap-4 md:hidden"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {paginatedPayments.map((payment) => {
               const patient = patientMap.get(payment.patientId);
                const doctor = doctorMap.get(payment.doctorId || '');
               const paymentMethod = paymentMethodMap.get(payment.paymentMethodId);
              return (
              <motion.div
                key={payment.id}
                variants={itemVariants}
                layout
                className={cn(
                  "relative rounded-2xl bg-card p-4 shadow-md transition-all duration-300 ease-in-out active:scale-[0.99]",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {patient?.avatarUrl && <AvatarImage src={patient.avatarUrl} alt={patient.name} />}
                      <AvatarFallback>{getInitials(patient?.name ?? 'N/A')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{patient?.name ?? 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{payment.id}</p>
                    </div>
                  </div>
                  {showReceiptGeneration && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className='h-8 w-8 -mt-1'>
                          <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => handleViewDetails(payment)}>Ver comprobante</DropdownMenuItem>
                          {showReceiptDownload && <DropdownMenuItem onClick={() => handleDownloadPDF(payment)}>Descargar PDF</DropdownMenuItem>}
                          {showAdminData && <DropdownMenuItem onClick={() => handleAnnul(payment.id)} className="text-red-500">Anular</DropdownMenuItem>}
                      </DropdownMenuContent>
                  </DropdownMenu>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground space-y-2">
                  <p><strong>Doctor:</strong> {doctor?.name || 'N/A'}</p>
                  <p><strong>Método:</strong> {paymentMethod || 'N/A'}</p>
                  <div className='flex justify-between items-center'>
                    {showAdminData && <p className="text-base font-semibold text-foreground pt-1">Monto: ${payment.monto.toFixed(2)}</p>}
                    <Badge className={cn('font-medium', statusColors[payment.status])}>
                        {payment.status}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            )})}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {filteredPayments.length === 0 && (
        <div className="text-center py-16 text-muted-foreground col-span-full">
          <Search className="mx-auto h-10 w-10 mb-2" />
          No se encontraron pagos.
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

      {selectedPayment && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Detalle del Comprobante</DialogTitle>
                    <DialogDescription>ID: {selectedPayment.id}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p><strong>Paciente:</strong> {patientMap.get(selectedPayment.patientId)?.name ?? 'N/A'}</p>
                    <p><strong>Doctor:</strong> {doctorMap.get(selectedPayment.doctorId || '')?.name ?? 'N/A'}</p>
                    <p><strong>Monto:</strong> ${selectedPayment.monto.toFixed(2)}</p>
                    <p><strong>Fecha:</strong> {new Date(selectedPayment.date).toLocaleDateString()}</p>
                    <p><strong>Método:</strong> {paymentMethodMap.get(selectedPayment.paymentMethodId)}</p>
                    <p><strong>Estado:</strong> <Badge className={cn('font-medium', statusColors[selectedPayment.status])}>{selectedPayment.status}</Badge></p>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
