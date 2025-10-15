

'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Company, Patient } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import { Search, UserPlus, Filter, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Label } from '../ui/label';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addUroVitalLogo } from '@/lib/pdf-helpers';
import { usePatients, useCompanies } from '@/lib/store/global-store';
import { AddPatientForm } from './add-patient-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/accessible-dialog';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { deletePatient } from '@/lib/actions';
import PatientActions from './patient-actions';

const MySwal = withReactContent(Swal);
const ITEMS_PER_PAGE = 5;

export default function PatientList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();
  const { patients, removePatient } = usePatients();
  const { companies } = useCompanies();
  const companyMap = useMemo(() => new Map(companies.map(c => [c.id, c.name])), [companies]);

    const handleDelete = (patientId: string) => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        MySwal.fire({
            title: '¿Eliminar paciente?',
            text: "Esta acción es irreversible. El paciente y todos sus datos asociados serán eliminados del sistema.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            background: isDarkMode ? '#1e293b' : '#ffffff',
            color: isDarkMode ? '#f1f5f9' : '#0f172a',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deletePatient(patientId);
                    removePatient(patientId);
                    // Paciente eliminado exitosamente
                } catch (error) {
                    console.error('Error deleting patient:', error);
                }
            }
        });
    };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const exportTime = new Date();

      // Add UroVital logo
      addUroVitalLogo(doc);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(58, 109, 255);
      doc.text("Lista de Pacientes", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      doc.text(`Generado el: ${format(exportTime, 'dd/MM/yyyy HH:mm')}`, doc.internal.pageSize.getWidth() - 14, 20, { align: "right" });

      autoTable(doc, {
        startY: 30,
        head: [['Nombre', 'Edad', 'Género', 'Teléfono', 'Email', 'Empresa', 'Estado']],
        body: filteredPatients.map(p => [
          p.name,
          p.age,
          p.gender,
          p.contact.phone || "N/A",
          p.contact.email || "N/A",
          p.companyId ? companyMap.get(p.companyId) || 'N/A' : 'Particular',
          p.status
        ]),
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

      doc.save(`pacientes-${format(exportTime, 'yyyy-MM-dd')}.pdf`);
      
      // Exportación a PDF completada

    } catch (error) {
      console.error("Failed to export patients list to PDF:", error);
    }
  };

  const exportToCSV = () => {
    try {
        const headers = ['Nombre', 'Edad', 'Género', 'Teléfono', 'Email', 'Empresa', 'Estado'];
        const csvContent = [
            headers.join(','),
            ...filteredPatients.map(p => [
                `"${p.name}"`,
                p.age,
                p.gender,
                `"${p.contact.phone || 'N/A'}"`,
                `"${p.contact.email || 'N/A'}"`,
                `"${p.companyId ? companyMap.get(p.companyId) || 'N/A' : 'Particular'}"`,
                p.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        link.href = URL.createObjectURL(blob);
        link.download = `pacientes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Exportación a CSV completada

    } catch (error) {
        console.error("Failed to export patients list to CSV:", error);
    }
  };

  const handleExport = () => {
    MySwal.fire({
      title: 'Formato de Exportación',
      text: 'Selecciona el formato en el que deseas exportar la lista de pacientes.',
      showCancelButton: true,
      confirmButtonText: 'Exportar a PDF',
      confirmButtonColor: '#3A6DFF',
      showDenyButton: true,
      denyButtonText: 'Exportar a CSV',
      denyButtonColor: '#14B8A6',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-2xl bg-card/80 backdrop-blur-md shadow-2xl',
        title: 'text-foreground',
        htmlContainer: 'text-muted-foreground',
        confirmButton: 'transition-all duration-300 ease-in-out hover:shadow-[0_0_20px_rgba(46,49,146,0.4)]',
        denyButton: 'transition-all duration-300 ease-in-out hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]',
      },
      showClass: {
        popup: 'animate__animated animate__fadeInDown animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp animate__faster'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        exportToPDF();
      } else if (result.isDenied) {
        exportToCSV();
      }
    });
  };

  const filteredPatients = useMemo(() => {
    let filtered = patients;

    if (searchTerm) {
        filtered = filtered.filter((patient) =>
            patient.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (genderFilter !== 'Todos') {
        filtered = filtered.filter((patient) => patient.gender === genderFilter);
    }

    if (statusFilter !== 'Todos') {
        filtered = filtered.filter((patient) => patient.status === statusFilter);
    }
    
    return filtered;
  }, [patients, searchTerm, genderFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, genderFilter, statusFilter]);

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePatientClick = (patient: Patient) => {
    // ✅ LOGS DE DEPURACIÓN - Verificar datos del paciente antes de navegar
    console.log('🔍 PatientList - handlePatientClick ejecutado:', {
      patientId: patient.id,
      patientName: patient.name,
      patientIdType: typeof patient.id,
      patientIdLength: patient.id?.length,
      fullPatient: patient
    });

    // ✅ VALIDACIÓN CRÍTICA - Verificar que patient.id sea válido
    if (!patient.id || typeof patient.id !== 'string' || patient.id.trim() === '') {
      console.error('❌ PatientList - patient.id inválido:', {
        patientId: patient.id,
        patientName: patient.name,
        type: typeof patient.id,
        fullPatient: patient
      });
      return;
    }

    console.log('🔍 PatientList - Navegando a:', `/patients/${patient.id}`);
    router.push(`/patients/${patient.id}`);
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
    exit: { opacity: 0 }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex-1 w-full flex gap-4">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="Buscar pacientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                    />
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Filtros
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Filtros</h4>
                                <p className="text-sm text-muted-foreground">
                                Ajusta los filtros para refinar la lista de pacientes.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="gender">Género</Label>
                                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                                        <SelectTrigger className="w-full sm:w-[180px] bg-card/50 backdrop-blur-lg col-span-2">
                                            <SelectValue placeholder="Filtrar por género" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Todos">Todos los Géneros</SelectItem>
                                            <SelectItem value="Masculino">Masculino</SelectItem>
                                            <SelectItem value="Femenino">Femenino</SelectItem>
                                            <SelectItem value="Otro">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="status">Estado</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full sm:w-[180px] bg-card/50 backdrop-blur-lg col-span-2">
                                            <SelectValue placeholder="Filtrar por estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Todos">Todos los Estados</SelectItem>
                                            <SelectItem value="Activo">Activo</SelectItem>
                                            <SelectItem value="Inactivo">Inactivo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                </Button>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Agregar Paciente
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
                        <DialogDescription>
                            Complete el formulario para registrar un nuevo paciente en el sistema.
                        </DialogDescription>
                    </DialogHeader>
                    <AddPatientForm onSuccess={() => setIsModalOpen(false)} />
                </DialogContent>
            </Dialog>
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
                className="hidden md:block"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                <Table className="border-separate border-spacing-y-4 -mt-4">
                <TableHeader>
                    <TableRow className='bg-transparent hover:bg-transparent border-none'>
                        <TableHead className='text-muted-foreground'>Nombre</TableHead>
                        <TableHead className='text-muted-foreground'>Edad</TableHead>
                        <TableHead className='text-muted-foreground'>Género</TableHead>
                        <TableHead className='text-muted-foreground'>Última Visita</TableHead>
                        <TableHead className='text-muted-foreground'>Estado</TableHead>
                        <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedPatients.map((patient) => (
                    <motion.tr
                        key={patient.id}
                        variants={itemVariants}
                        layout
                        className="group bg-card/95 rounded-2xl shadow-sm border border-border/50 hover:shadow-primary/10 transition-all overflow-hidden"
                    >
                        <TableCell onClick={() => handlePatientClick(patient)} className="cursor-pointer rounded-l-2xl py-5">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                {patient.avatarUrl && <AvatarImage src={patient.avatarUrl} alt={patient.name} />}
                                <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{patient.name}</span>
                            </div>
                        </TableCell>
                        <TableCell onClick={() => handlePatientClick(patient)} className="cursor-pointer py-5">{patient.age}</TableCell>
                        <TableCell onClick={() => handlePatientClick(patient)} className="cursor-pointer py-5">{patient.gender}</TableCell>
                        <TableCell onClick={() => handlePatientClick(patient)} className="cursor-pointer py-5">{patient.lastVisit || 'N/A'}</TableCell>
                        <TableCell onClick={() => handlePatientClick(patient)} className="cursor-pointer py-5">
                            <Badge variant={patient.status === 'Activo' ? 'success' : 'destructive'}>
                                {patient.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right rounded-r-2xl py-5">
                            <PatientActions 
                                patient={patient}
                                onPatientUpdated={(updatedPatient) => {
                                    // Update the patient in the store
                                    const { updatePatient } = usePatients();
                                    updatePatient(updatedPatient);
                                }}
                                onPatientDeleted={(patientId) => {
                                    // Remove the patient from the store
                                    removePatient(patientId);
                                }}
                            />
                        </TableCell>
                    </motion.tr>
                    ))}
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
                {paginatedPatients.map((patient, index) => (
                <motion.div
                    key={patient.id}
                    variants={itemVariants}
                    layout
                    className={cn(
                        "relative rounded-2xl bg-card p-4 shadow-md transition-all duration-300 ease-in-out active:scale-[0.99]",
                    )}
                >
                    <div onClick={() => handlePatientClick(patient)} className='cursor-pointer'>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                {patient.avatarUrl && <AvatarImage src={patient.avatarUrl} alt={patient.name} />}
                                <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                <p className="font-bold">{patient.name}</p>
                                <p className="text-sm text-muted-foreground">{patient.age} años • {patient.gender}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={patient.status === 'Activo' ? 'success' : 'destructive'} className="shrink-0">
                                    {patient.status}
                                </Badge>
                                <PatientActions 
                                    patient={patient}
                                    onPatientUpdated={(updatedPatient) => {
                                        // Update the patient in the store
                                        const { updatePatient } = usePatients();
                                        updatePatient(updatedPatient);
                                    }}
                                    onPatientDeleted={(patientId) => {
                                        // Remove the patient from the store
                                        removePatient(patientId);
                                    }}
                                />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground">
                            Última Visita: {patient.lastVisit || 'N/A'}
                        </div>
                    </div>
                </motion.div>
                ))}
            </motion.div>
        </motion.div>
       </AnimatePresence>

       {filteredPatients.length === 0 && (
         <div className="text-center py-16 text-muted-foreground col-span-full">
           <Search className="mx-auto h-10 w-10 mb-2" />
           No se encontraron pacientes que coincidan con los filtros.
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

    