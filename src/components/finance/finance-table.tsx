'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Payment, Patient, User, PaymentType, PaymentMethod } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import { Search, MoreHorizontal, FileDown, FileText, Edit, Ban, Plus } from 'lucide-react';
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
import { CreateReceiptModal } from './create-receipt-modal';

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
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [editingReceipt, setEditingReceipt] = useState<any>(null);

  const patientMap = useMemo(() => new Map(allPatients.map(p => [p.id, p])), [allPatients]);
  const doctorMap = useMemo(() => new Map(allDoctors.map(d => [d.id, d])), [allDoctors]);
  const paymentMethodMap = useMemo(() => new Map(allPaymentMethods.map(m => [m.id, m.name])), [allPaymentMethods]);

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const patient = patientMap.get(payment.userId);
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

  // Cargar comprobantes al montar el componente
  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const { getReceipts } = await import('@/lib/actions');
      const receiptsData = await getReceipts();
      
      // Debug log
      console.log('Receipts data loaded:', receiptsData);
      receiptsData.forEach((receipt: any, index: number) => {
        console.log(`Receipt ${index + 1}:`, {
          id: receipt.id,
          patient: receipt.patient || null,
          doctor: receipt.doctor || null,
          patientName: receipt.patientName,
          doctorName: receipt.doctorName
        });
      });
      
      setReceipts(receiptsData);
    } catch (error) {
      console.error('Error loading receipts:', error);
    }
  };


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
          const patient = patientMap.get(p.userId);
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
      
      // Exportación a PDF completada

    } catch (error) {
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
      doc.text(`ID del Pago: ${payment.id}`, doc.internal.pageSize.getWidth() / 2, 42, { align: "center" });

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
        const patient = patientMap.get(payment.userId);
        const doctor = doctorMap.get(payment.doctorId || '');
        const paymentMethod = paymentMethodMap.get(payment.paymentMethodId);
        
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
        doc.text(`Doctor: ${doctor?.name || 'N/A'}`, margin, y);
        y += 6;
        doc.text(`Fecha: ${format(new Date(payment.date), 'dd/MM/yyyy')}`, margin, y);
        y += 6;
        doc.text(`Monto: $${payment.monto.toFixed(2)}`, margin, y);
        y += 6;
        doc.text(`Método de pago: ${paymentMethod || 'N/A'}`, margin, y);
        y += 6;
        doc.text(`Estado: ${payment.status}`, margin, y);
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

  const handleEditReceipt = (receipt: any) => {
    setEditingReceipt(receipt);
    setIsCreateModalOpen(true);
  };

  const handleGeneratePDF = (receipt: any) => {
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
        // Generar y descargar el PDF
        generateReceiptPDF(receipt);
        
        MySwal.fire({
          title: 'PDF Generado',
          text: 'El comprobante se ha generado y descargado exitosamente.',
          icon: 'success',
          background: isDarkMode ? "#1e293b" : "#ffffff",
          color: isDarkMode ? "#f1f5f9" : "#0f172a",
          confirmButtonColor: '#4f46e5',
        });
      }
    });
  };

  const handleAnnulReceipt = async (receiptId: string) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    MySwal.fire({
      title: '¿Seguro que deseas anular este comprobante?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#718096',
      background: isDarkMode ? "#1e293b" : "#ffffff",
      color: isDarkMode ? "#f1f5f9" : "#0f172a",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // TODO: Implementar actualización de estado en base de datos
          // const { updateReceiptStatus } = await import('@/lib/actions');
          // await updateReceiptStatus(receiptId, 'Anulado');
          
          // Actualizar estado local
          setReceipts(prevReceipts => 
            prevReceipts.map(r => 
              r.id === receiptId ? { ...r, status: 'Anulado' } : r
            )
          );
          
          // Comprobante anulado correctamente
          
          MySwal.fire({
              title: 'Anulado', 
              text: 'El comprobante ha sido anulado.', 
              icon: 'success',
              background: isDarkMode ? "#1e293b" : "#ffffff",
              color: isDarkMode ? "#f1f5f9" : "#0f172a",
              confirmButtonColor: '#4f46e5',
          });
        } catch (error) {
          console.error('Error annulling receipt:', error);
        }
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
      
      // Get patient data with fallbacks
      const patientName = receipt.user?.name || receipt.patientName || 'No especificado';
      const patientCedula = receipt.user?.cedula || receipt.patientCedula || 'No especificada';
      
      doc.text(`Nombre: ${patientName}`, margin, y);
      y += 6;
      doc.text(`Cédula: ${patientCedula}`, margin, y);
      y += 10;

      // Payment details
      doc.setFont("helvetica", "bold");
      doc.text("Detalles del Pago:", margin, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`Concepto: ${receipt.concept || 'No especificado'}`, margin, y);
      y += 6;
      doc.text(`Monto: $${Number(receipt.amount || 0).toFixed(2)}`, margin, y);
      y += 6;
      doc.text(`Método de pago: ${receipt.method || 'No especificado'}`, margin, y);
      y += 6;
      doc.text(`Estado: ${receipt.status || 'Pagado'}`, margin, y);
      y += 6;
      
      // Get doctor/creator name with fallback
      const createdByName = receipt.createdBy?.name || 'Sistema UroVital';
      doc.text(`Emitido por: ${createdByName}`, margin, y);
      y += 10;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100);
      
      // Get current user name or use system as fallback
      const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null;
      const emittedBy = currentUser?.name ? `Emitido por: ${currentUser.name} - UroVital 2025` : 'Emitido por: Sistema UroVital - 2025';
      
      doc.text(emittedBy, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

      // Download PDF
      const fileName = `Comprobante_${receipt.number || 'sin_numero'}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleModalSuccess = () => {
    loadReceipts();
    setEditingReceipt(null);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingReceipt(null);
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
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Comprobante
            </Button>
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
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipts.map((receipt) => (
                        <motion.tr
                          key={receipt.id}
                          variants={itemVariants}
                          layout
                          className="group"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {receipt.patientName ? getInitials(receipt.patientName) : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{receipt.patientName || 'Sin paciente asignado'}</div>
                                <div className="text-sm text-muted-foreground">
                                  {receipt.patientCedula || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {receipt.doctorName ? (
                                <>
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(receipt.doctorName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">Dr. {receipt.doctorName}</span>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">Sin doctor asignado</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(receipt.createdAt), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${Number(receipt.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {receipt.method || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('font-medium', statusColors[receipt.status as keyof typeof statusColors] || statusColors.Pagado)}>
                              {receipt.status || 'Pagado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGeneratePDF(receipt)}
                                className="h-8 w-8 p-0"
                                title="Generar PDF"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditReceipt(receipt)}
                                className="h-8 w-8 p-0"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {receipt.status !== 'Anulado' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAnnulReceipt(receipt.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  title="Anular"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
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
                  {receipts.map((receipt) => (
                    <motion.div
                      key={receipt.id}
                      variants={itemVariants}
                      className="rounded-lg border bg-card p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {getInitials(receipt.patientName || 'N/A')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{receipt.patientName || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{receipt.patientCedula || 'N/A'}</div>
                          </div>
                        </div>
                        <Badge className={cn('font-medium', statusColors[receipt.status as keyof typeof statusColors] || statusColors.Pagado)}>
                          {receipt.status || 'Pagado'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Doctor:</span>
                          <div className="font-medium">Dr. {receipt.doctorName || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fecha:</span>
                          <div className="font-medium">{format(new Date(receipt.createdAt), 'dd/MM/yyyy')}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Monto:</span>
                          <div className="font-medium">${Number(receipt.amount).toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Método:</span>
                          <div className="font-medium">{receipt.method || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGeneratePDF(receipt)}
                          className="text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditReceipt(receipt)}
                          className="text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        {receipt.status !== 'Anulado' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAnnulReceipt(receipt.id)}
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Anular
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {receipts.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground col-span-full">
                    <FileText className="mx-auto h-10 w-10 mb-2" />
                    No hay comprobantes generados aún.
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
                    <p><strong>Paciente:</strong> {patientMap.get(selectedPayment.userId)?.name ?? 'N/A'}</p>
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

      <CreateReceiptModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        patients={allPatients}
        doctors={allDoctors}
        editData={editingReceipt}
      />
    </div>
  );
}