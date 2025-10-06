'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/lib/types';
import jsPDF from 'jspdf';
import { addUroVitalLogo } from '@/lib/pdf-helpers';

interface Receipt {
  id: string;
  number: string;
  patientName: string;
  patientCedula: string;
  amount: number;
  concept: string;
  method: string;
  createdAt: string;
  createdBy: string;
}

interface ReceiptsTableProps {
  receipts: Receipt[];
  patients: Patient[];
}

const paymentMethods = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'tarjeta_debito', label: 'Tarjeta de Débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'binance', label: 'Binance' },
  { value: 'wally', label: 'Wally' },
  { value: 'zinli', label: 'Zinli' },
];

export function ReceiptsTable({ receipts, patients }: ReceiptsTableProps) {
  const { toast } = useToast();

  const generateReceiptPDF = (receipt: Receipt) => {
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
      doc.text(`Método de pago: ${paymentMethods.find(m => m.value === receipt.method)?.label || receipt.method}`, margin, y);
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

  if (receipts.length === 0) {
    return (
      <div className="text-center p-8 bg-muted rounded-lg">
        <p className="text-muted-foreground">No hay comprobantes generados aún.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Concepto</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell className="font-medium">{receipt.number}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{receipt.patientName}</div>
                  <div className="text-sm text-muted-foreground">{receipt.patientCedula}</div>
                </div>
              </TableCell>
              <TableCell>{receipt.concept}</TableCell>
              <TableCell className="font-medium">${Number(receipt.amount).toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {paymentMethods.find(m => m.value === receipt.method)?.label || receipt.method}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(receipt.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateReceiptPDF(receipt)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
