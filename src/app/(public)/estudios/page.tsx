
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Estudio } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft, Microscope, Activity, Camera, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { StaggerContainer } from '@/components/animations/stagger-container';
import { StaggerItem } from '@/components/animations/stagger-item';
import { AnimatedCard } from '@/components/animations/animated-card';
import { MagneticButton } from '@/components/animations/magnetic-button';

// Lista completa de estudios urológicos
const estudiosData: Estudio[] = [
    // Estudios Endoscópicos
    { id: '1', categoria: 'Endoscópicos', nombre: 'CISTOSCOPIA DIAGNOSTICA SIMPLE' },
    { id: '2', categoria: 'Endoscópicos', nombre: 'CISTOSCOPIA GUIADA O ARMADA' },
    { id: '3', categoria: 'Endoscópicos', nombre: 'URETROCISTOSCOPIA FLEXIBLE' },
    { id: '4', categoria: 'Endoscópicos', nombre: 'URETERORENOSCOPIA DIAGNOSTICA' },
    { id: '5', categoria: 'Endoscópicos', nombre: 'DILATACION URETRAL GUIADA' },
    { id: '6', categoria: 'Endoscópicos', nombre: 'DILATACION URETRAL NEUMATICA CON BALON' },
    { id: '7', categoria: 'Endoscópicos', nombre: 'REGENERACION URINARIA CON OZONO / INFILTRATIVA' },
    { id: '8', categoria: 'Endoscópicos', nombre: 'REGENERACION GENITAL Y URINARIA CON BIOGEL / PRP / ACIDO HIALURONICO' },
    { id: '9', categoria: 'Endoscópicos', nombre: 'HISTEROSCOPIA FLEXIBLE / CONVENCIONAL' },
    { id: '10', categoria: 'Endoscópicos', nombre: 'VAGINOSCOPIA DIAGNOSTICA' },
    
    // Estudios Funcionales
    { id: '11', categoria: 'Funcionales', nombre: 'UROFLUJOMETRIA' },
    { id: '12', categoria: 'Funcionales', nombre: 'ESTUDIO URODINAMICO / VIDEOURODINAMIA' },
    { id: '13', categoria: 'Funcionales', nombre: 'PRUEBA DE PRESION FLUJO URINARIO' },
    { id: '14', categoria: 'Funcionales', nombre: 'CISTOMETRIA' },
    { id: '15', categoria: 'Funcionales', nombre: 'MAPA PROSTATICO' },
    
    // Estudios de Imagen
    { id: '16', categoria: 'Imagen', nombre: 'ECOGRAFIA RENAL, PROSTATICA, ABDOMINOPELVICA' },
    { id: '17', categoria: 'Imagen', nombre: 'ECOGRAFIA TESTICULAR CONVENCIONAL O DOPLER' },
    { id: '18', categoria: 'Imagen', nombre: 'ECOGRAFIA DOPLER RENAL' },
    { id: '19', categoria: 'Imagen', nombre: 'TAC ABDOMINOPELVICO' },
    { id: '20', categoria: 'Imagen', nombre: 'UROTAC CON CONTRASTE ENDOVENOSO' },
    { id: '21', categoria: 'Imagen', nombre: 'RESONANCIA MAGNETICA DE PISO PELVICO' },
    { id: '22', categoria: 'Imagen', nombre: 'RESONANCIA ABDOMINOPELVICA' },
    { id: '23', categoria: 'Imagen', nombre: 'RESONANCIA MAGNETICA MULTIPARAMETRICA' },
    { id: '24', categoria: 'Imagen', nombre: 'UROGRAFIA DE ELIMINACION' },
    { id: '25', categoria: 'Imagen', nombre: 'PIELOGRAFIA RETROGRADA ENDOSCOPICA' },
    { id: '26', categoria: 'Imagen', nombre: 'URETROGRAFIA' },
    { id: '27', categoria: 'Imagen', nombre: 'CISTOGRAFIA COMBINADA' },
    
    // Procedimientos Urológicos y Uroginecológicos
    { id: '28', categoria: 'Procedimientos', nombre: 'URETERORENOSCOPIA ENDOLITOTRIPCIA NEUMATICA' },
    { id: '29', categoria: 'Procedimientos', nombre: 'LITOTRIPCIA LASER URETERAL Y RENAL' },
    { id: '30', categoria: 'Procedimientos', nombre: 'URETEROTOMIA Y DILATACION NEUMATICA' },
    { id: '31', categoria: 'Procedimientos', nombre: 'URETROTOMIA ENDOSCOPICA' },
    { id: '32', categoria: 'Procedimientos', nombre: 'URETROPLASTIA CON BALON DE PACLITAXEL' },
    { id: '33', categoria: 'Procedimientos', nombre: 'CURA DE INCONTINENCIA CON MINI-SLING' },
    { id: '34', categoria: 'Procedimientos', nombre: 'CURA DE INCONTINENCIA CON CINCHA TVT O TOT' },
    { id: '35', categoria: 'Procedimientos', nombre: 'CURA DE INCONTINENCIA AUTOLOGA' },
    { id: '36', categoria: 'Procedimientos', nombre: 'REVERSION DE PROLAPSO GENITAL CON LASER, PRP, BIOGEL, HIFU' },
    { id: '37', categoria: 'Procedimientos', nombre: 'ADENOMECTOMIA PROSTATICA SUPRAPUBICA O TRANSVESICAL' },
    { id: '38', categoria: 'Procedimientos', nombre: 'ADENOMECTOMIA PROSTATICA BIPOLAR O BIPOLEP' },
    { id: '39', categoria: 'Procedimientos', nombre: 'RESECCION TRANSURETRAL DE PROSTATA CON BIPOLAR O MONOPOLAR' },
    { id: '40', categoria: 'Procedimientos', nombre: 'ABLACION PROSTATICA CON ETANOL (PROSTAJECT)' },
    { id: '41', categoria: 'Procedimientos', nombre: 'PROSTATECTOMIA RADICAL CONVENCIONAL' },
    { id: '42', categoria: 'Procedimientos', nombre: 'RESECCION TRANSURETRAL DE TUMOR VESICAL O RTUV' },
    { id: '43', categoria: 'Procedimientos', nombre: 'EMBOLIZACION UTERINA POR MIOMA / FIBROMIOMATOSIS' },
    { id: '44', categoria: 'Procedimientos', nombre: 'EMBOLIZACION DE PROSTATA' },
    { id: '45', categoria: 'Procedimientos', nombre: 'BIOPSIA RENAL PERCUTANEA' },
    { id: '46', categoria: 'Procedimientos', nombre: 'BIOPSIA TESTICULAR' },
    { id: '47', categoria: 'Procedimientos', nombre: 'BIOPSIA PROSTATICA TRANSPERINEAL' },
    { id: '48', categoria: 'Procedimientos', nombre: 'BIOPSIA PROSTATICA TRANSURETRAL' },
    { id: '49', categoria: 'Procedimientos', nombre: 'BIOPSIA DE UTERO, CUELLO, VAGINA' },
    { id: '50', categoria: 'Procedimientos', nombre: 'BIOPSIA URETRAL' },
    { id: '51', categoria: 'Procedimientos', nombre: 'BIOPSIA Y EXTRACCION DE POLIPOS UTERINOS POR HISTEROSCOPIA' },
    { id: '52', categoria: 'Procedimientos', nombre: 'CITOLOGIA DE PENE' },
    { id: '53', categoria: 'Procedimientos', nombre: 'PENOSCOPIA' }
];

export default function EstudiosPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const filteredEstudios = useMemo(() => {
        if (!searchTerm) return estudiosData;
        return estudiosData.filter(est =>
            est.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            est.categoria.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const paginatedEstudios = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredEstudios.slice(startIndex, endIndex);
    }, [filteredEstudios, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredEstudios.length / itemsPerPage);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Reset to first page when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);
    
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03,
        },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 },
    };

    const toSentenceCase = (str: string) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };


    return (
        <section className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-sky-100 dark:from-[#0D122A] dark:to-[#101633] pt-16 pb-20 relative overflow-hidden">
            {/* Fondo con gradiente animado */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="gradient-mesh-hero absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animated-gradient" />
            </div>
            
            {/* Back Button */}
            <div className="container mx-auto px-4 pt-4 relative z-10">
                <MagneticButton 
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors duration-200 font-medium bg-transparent border-0 p-2 rounded-lg hover:bg-primary/5"
                    strength={0.2}
                    onClick={() => window.location.href = '/landing'}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Atrás
                </MagneticButton>
            </div>
            <main className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <Image
                            src="/images/logo/urovital-logo.png"
                            alt="UroVital"
                            width={234}
                            height={83}
                            className="h-[83px] w-[234px] object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-4xl font-bold text-primary font-headline">Estudios urológicos</h1>
                </div>

                 <div className="relative w-full max-w-lg mx-auto mb-12">
                    <Card className='bg-white/90 dark:bg-[#101633] border border-primary/20 shadow-lg'>
                        <CardContent className='p-2'>
                             <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/70" />
                                <Input
                                    placeholder="Buscar por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 h-12 text-base rounded-full shadow-sm bg-transparent border-0 focus-visible:ring-primary"
                                />
                             </div>
                        </CardContent>
                    </Card>
                </div>

                <AnimatePresence>
                    <StaggerContainer 
                        key={`${searchTerm}-${currentPage}`}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        staggerDelay={0.1}
                    >
                        {paginatedEstudios.map((estudio) => {
                            const getCategoryIcon = (categoria: string) => {
                                switch (categoria) {
                                    case 'Endoscópicos': return Microscope;
                                    case 'Funcionales': return Activity;
                                    case 'Imagen': return Camera;
                                    case 'Procedimientos': return Scissors;
                                    default: return Microscope;
                                }
                            };
                            
                            const getCategoryColor = (categoria: string) => {
                                switch (categoria) {
                                    case 'Endoscópicos': return 'text-blue-600';
                                    case 'Funcionales': return 'text-green-600';
                                    case 'Imagen': return 'text-purple-600';
                                    case 'Procedimientos': return 'text-red-600';
                                    default: return 'text-primary';
                                }
                            };
                            
                            const IconComponent = getCategoryIcon(estudio.categoria);
                            const iconColor = getCategoryColor(estudio.categoria);
                            
                            return (
                                <StaggerItem key={estudio.id}>
                                    <AnimatedCard className={cn(
                                        "flex flex-col h-full rounded-2xl shadow-sm transition-all duration-300 ease-in-out card-gradient",
                                        "hover:shadow-[0_0_20px_rgba(37,99,235,0.2)] dark:hover:shadow-[0_0_30px_rgba(37,99,235,0.3)]",
                                        "border-b-4 border-transparent hover:border-primary/20"
                                    )}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-3">
                                                <div className="p-3 bg-primary/10 rounded-full">
                                                    <IconComponent className={`h-6 w-6 ${iconColor}`} />
                                                </div>
                                                <span className="text-lg font-bold text-primary font-headline">{estudio.categoria}</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-4 text-sm">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-primary/10 rounded-md">
                                                    <Microscope className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">Estudio</p>
                                                    <p className="text-muted-foreground">{toSentenceCase(estudio.nombre)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </AnimatedCard>
                                </StaggerItem>
                            );
                        })}
                    </StaggerContainer>
                </AnimatePresence>

                {/* Paginación */}
                {totalPages > 1 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center items-center gap-3 mt-12"
                    >
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={cn(
                                "px-4 py-2 rounded-full font-medium transition-all duration-200",
                                "border border-slate-200 dark:border-slate-700",
                                currentPage === 1 
                                    ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700" 
                                    : "bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-600"
                            )}
                        >
                            Anterior
                        </button>
                        
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={cn(
                                        "w-9 h-9 rounded-full font-medium transition-all duration-200",
                                        "border border-slate-200 dark:border-slate-700",
                                        currentPage === page
                                            ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                                            : "bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-600"
                                    )}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={cn(
                                "px-4 py-2 rounded-full font-medium transition-all duration-200",
                                "border border-slate-200 dark:border-slate-700",
                                currentPage === totalPages 
                                    ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700" 
                                    : "bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-600"
                            )}
                        >
                            Siguiente
                        </button>
                    </motion.div>
                )}

                {/* Información de paginación */}
                {filteredEstudios.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center mt-6 text-sm text-muted-foreground"
                    >
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredEstudios.length)} de {filteredEstudios.length} estudios
                    </motion.div>
                )}
                
                    {filteredEstudios.length === 0 && (
                    <motion.div 
                        initial={{opacity: 0}} 
                        animate={{opacity: 1}} 
                        className="text-center py-16 text-primary/70 col-span-full bg-primary/10 rounded-2xl"
                    >
                        <Search className="mx-auto h-10 w-10 mb-4" />
                        <p className="font-semibold">No se encontraron resultados</p>
                        <p>Intenta con otro término de búsqueda.</p>
                    </motion.div>
                )}

            </main>
        </section>
    );
}
