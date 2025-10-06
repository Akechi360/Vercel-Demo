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
  const paymentMethodMap = useMemo(() => new Map(allPaymentMethods.map(m => [m.id, m.name])), [allPaymentMethods]);

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const patient = patientMap.get(payment.patientId);
      const matchesSearch = patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payment.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter, patientMap]);

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const handleExport = () => {
    try {
      const doc = new jsPDF();
      const exportTime = new Date();

      // Add UroVital logo
      addUroVitalLogo(doc);
      
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(58, 109, 255);
      doc.text("Reporte Financiero - UroVital", 14, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      doc.text(`Generado el: ${format(exportTime, 'dd/MM/yyyy HH:mm')}`, doc.internal.pageSize.getWidth() - 14, 20, { align: "right" });

      autoTable(doc, {
        startY: 30,
        head: [['Paciente', 'Doctor', 'Fecha', 'Monto', 'Método', 'Estado']],
        body: filteredPayments.map(p => {
          const patient = patientMap.get(p.patientId);
          const doctor = doctorMap.get(p.doctorId || '');
          const method = paymentMethodMap.get(p.paymentMethodId);
          return [
            patient?.name || 'N/A',
            doctor?.name || 'N/A',
            format(new Date(p.date), 'dd/MM/yyyy'),
            `$${p.monto.toFixed(2)}`,
            method || 'N/A',
            p.status
          ];
        }),
        headStyles: {
            fillColor: [58, 109, 255],
            textColor: 255,
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [242, 242, 242]
        },
        styles: {
            cellPadding: 3,
            fontSize: 9,
            valign: 'middle'
        },
      });

      doc.save(`reporte-financiero-${format(exportTime, 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Exportación a PDF completada",
        description: "La descarga del reporte financiero ha comenzado.",
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error en la exportación",
        description: "No se pudo generar el archivo PDF.",
      });
      console.error("Failed to export financial report to PDF:", error);
    }
  };

  const handleDownloadPDF = (payment: Payment) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    MySwal.fire({
      title: 'Generar PDF',
      text: '¿Deseas generar el comprobante en PDF?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#718096',
      background: isDarkMode ? "#1e293b" : "#ffffff",
      color: isDarkMode ? "#f1f5f9" : "#0f172a",
    }).then((result) => {
      if (result.isConfirmed) {
        const doc = new jsPDF();
        const margin = 14;

        // Add UroVital logo
        addUroVitalLogo(doc);

        // Header
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(58, 109, 255);
        doc.text("UROVITAL - Sistema de Gestión Médica", doc.internal.pageSize.getWidth() / 2, 25, { align: "center" });

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Comprobante de Pago", doc.internal.pageSize.getWidth() / 2, 35, { align: "center" });

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Nº ${payment.id}`, doc.internal.pageSize.getWidth() / 2, 42, { align: "center" });

        // Date
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Fecha de emisión: ${format(new Date(payment.date), 'dd/MM/yyyy - HH:mm')}`, doc.internal.pageSize.getWidth() - margin, 20, { align: "right" });

        let y = 55;

        // Receipt details
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        // Patient info
        const patient = patientMap.get(payment.patientId);
        doc.setFont("helvetica", "bold");
        doc.text("Datos del Paciente:", margin, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.text(`Nombre: ${patient?.name || 'N/A'}`, margin, y);
        y += 6;
        doc.text(`Cédula: ${patient?.cedula || 'N/A'}`, margin, y);
        y += 10;

        // Payment details
        doc.setFont("helvetica", "bold");
        doc.text("Detalles del Pago:", margin, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.text(`Concepto: Consulta médica`, margin, y);
        y += 6;
        doc.text(`Monto: $${payment.monto.toFixed(2)}`, margin, y);
        y += 6;
        doc.text(`Método de pago: ${paymentMethodMap.get(payment.paymentMethodId) || 'N/A'}`, margin, y);
        y += 10;

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("Emitido automáticamente por UroVital © 2025", doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

        // Download PDF
        const fileName = `Comprobante_${payment.id}.pdf`;
        doc.save(fileName);

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

  const handleEditPayment = (payment: Payment) => {
    // TODO: Implementar edición de pago
    toast({
      title: "Función en desarrollo",
      description: "La edición de pagos estará disponible próximamente.",
    });
  };

  const handleGenerateReceipt = (payment: Payment) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    MySwal.fire({
      title: 'Generar Comprobante',
      text: '¿Deseas generar un comprobante para este pago?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#718096',
      background: isDarkMode ? "#1e293b" : "#ffffff",
      color: isDarkMode ? "#f1f5f9" : "#0f172a",
    }).then((result) => {
      if (result.isConfirmed) {
        // Generar comprobante usando la función existente
        handleDownloadPDF(payment);
        
        // TODO: Aquí se podría guardar el comprobante en la base de datos
        toast({
          title: "Comprobante generado",
          description: "El comprobante ha sido generado y descargado.",
        });
      }
    });
  };

  const handleAnnulPayment = (paymentId: string) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    MySwal.fire({
      title: '¿Anular pago?',
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
        setPayments(prevPayments => 
          prevPayments.map(p => 
            p.id === paymentId ? { ...p, status: 'Anulado' } : p
          )
        );
        MySwal.fire({
            title: 'Anulado', 
            text: 'El pago ha sido anulado.', 
            icon: 'success',
            background: isDarkMode ? "#1e293b" : "#ffffff",
            color: isDarkMode ? "#f1f5f9" : "#0f172a",
            confirmButtonColor: '#4f46e5',
        });
      }
    });
  };

  const generateReceiptPDF = (receipt: any) => {
    try {
      const doc = new jsPDF();
      const margin = 14;

      // Add UroVital logo
      addUroVitalLogo(doc);

      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(58, 109, 255);
      doc.text("UROVITAL - Sistema de Gestión Médica", doc.internal.pageSize.getWidth() / 2, 25, { align: "center" });

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Comprobante de Pago", doc.internal.pageSize.getWidth() / 2, 35, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Nº ${receipt.number}`, doc.internal.pageSize.getWidth() / 2, 42, { align: "center" });

      // Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Fecha de emisión: ${format(new Date(receipt.createdAt), 'dd/MM/yyyy - HH:mm')}`, doc.internal.pageSize.getWidth() - margin, 20, { align: "right" });

      let y = 55;

      // Receipt details
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      // Patient info
      doc.setFont("helvetica", "bold");
      doc.text("Datos del Paciente:", margin, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`Nombre: ${receipt.patientName}`, margin, y);
      y += 6;
      doc.text(`Cédula: ${receipt.patientCedula}`, margin, y);
      y += 10;

      // Payment details
      doc.setFont("helvetica", "bold");
      doc.text("Detalles del Pago:", margin, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`Concepto: ${receipt.concept}`, margin, y);
      y += 6;
      doc.text(`Monto: $${Number(receipt.amount).toFixed(2)}`, margin, y);
      y += 6;
      doc.text(`Método de pago: ${receipt.method}`, margin, y);
      y += 10;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("Emitido automáticamente por UroVital © 2025", doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

      // Download PDF
      const fileName = `Comprobante_${receipt.number}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF generado exitosamente",
        description: `El comprobante ${receipt.number} ha sido descargado.`,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Error al generar PDF",
        description: "No se pudo generar el archivo PDF.",
      });
    }
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
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={patient?.avatarUrl} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(patient?.name || 'N/A')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{patient?.name || 'N/A'}</div>
                                  <div className="text-sm text-muted-foreground">{patient?.cedula || 'N/A'}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(doctor?.name || 'N/A')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{doctor?.name || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(payment.date), 'dd/MM/yyyy')}
                            </TableCell>
                            {showAdminData && (
                              <TableCell className="font-medium">
                                ${payment.monto.toFixed(2)}
                              </TableCell>
                            )}
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {paymentMethod || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('font-medium', statusColors[payment.status])}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            {showReceiptGeneration && (
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedPayment(payment);
                                      setIsDetailModalOpen(true);
                                    }}>
                                      Ver detalles
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditPayment(payment)}>
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleGenerateReceipt(payment)}>
                                      Generar Comprobante
                                    </DropdownMenuItem>
                                    {payment.status !== 'Anulado' && (
                                      <DropdownMenuItem 
                                        onClick={() => handleAnnulPayment(payment.id)}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        Anular
                                      </DropdownMenuItem>
                                    )}
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
                  className="md:hidden space-y-4"
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
                        className="rounded-lg border bg-card p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={patient?.avatarUrl} />
                              <AvatarFallback>
                                {getInitials(patient?.name || 'N/A')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{patient?.name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{patient?.cedula || 'N/A'}</div>
                            </div>
                          </div>
                          <Badge className={cn('font-medium', statusColors[payment.status])}>
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Doctor:</span>
                            <div className="font-medium">{doctor?.name || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fecha:</span>
                            <div className="font-medium">{format(new Date(payment.date), 'dd/MM/yyyy')}</div>
                          </div>
                          {showAdminData && (
                            <div>
                              <span className="text-muted-foreground">Monto:</span>
                              <div className="font-medium">${payment.monto.toFixed(2)}</div>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Método:</span>
                            <div className="font-medium">{paymentMethod || 'N/A'}</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

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
        </motion.div>
      </AnimatePresence>

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