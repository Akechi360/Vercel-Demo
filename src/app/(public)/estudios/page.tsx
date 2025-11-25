
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


    const getCategoryColor = (categoria: string) => {
        switch (categoria) {
            case 'Endoscópicos': return 'text-blue-400';
            case 'Funcionales': return 'text-green-400';
            case 'Imagen': return 'text-purple-400';
            case 'Procedimientos': return 'text-red-400';
            default: return 'text-blue-400';
        }
    };

    return (
        <section className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 pt-16 pb-20 relative overflow-hidden">
            {/* Animated gradient mesh background */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
                <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none" />

            {/* Back Button */}
            <div className="container mx-auto px-4 pt-4 relative z-10">
                <MagneticButton
                    className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors duration-200 font-medium bg-white/5 border border-white/10 p-2 rounded-lg hover:bg-white/10 backdrop-blur-sm"
                    strength={0.2}
                    onClick={() => window.location.href = '/landing'}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
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
                    <h1 className="text-4xl md:text-5xl font-bold text-white font-headline mb-4">Estudios Urológicos</h1>
                    <p className="text-blue-100/60 text-lg max-w-2xl mx-auto">Tecnología avanzada para un diagnóstico preciso</p>
                </div>

                <div className="relative w-full max-w-lg mx-auto mb-16">
                    <div className='relative group'>
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
                            <div className="relative flex items-center">
                                <Search className="absolute left-4 h-5 w-5 text-blue-400" />
                                <Input
                                    placeholder="Buscar estudio..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 h-14 text-base rounded-full bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-blue-100/40"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    <StaggerContainer
                        key={`${searchTerm}-${currentPage}`}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        staggerDelay={0.05}
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

                            const IconComponent = getCategoryIcon(estudio.categoria);
                            const iconColor = getCategoryColor(estudio.categoria);

                            return (
                                <StaggerItem key={estudio.id}>
                                    <AnimatedCard className={cn(
                                        "flex flex-col h-full rounded-2xl transition-all duration-300 ease-in-out group relative overflow-hidden",
                                        "bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10",
                                        "hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                                    )}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <CardHeader className="relative">
                                            <CardTitle className="flex items-center gap-3">
                                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-blue-500/30 transition-colors">
                                                    <IconComponent className={`h-6 w-6 ${iconColor}`} />
                                                </div>
                                                <span className="text-lg font-bold text-white font-headline leading-tight">{estudio.categoria}</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-4 text-sm relative">
                                            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                                <Microscope className="h-4 w-4 text-blue-400 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-blue-100 text-xs uppercase tracking-wider mb-1">Estudio</p>
                                                    <p className="text-white font-medium">{toSentenceCase(estudio.nombre)}</p>
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
                                "px-4 py-2 rounded-full font-medium transition-all duration-200 backdrop-blur-sm",
                                "border border-white/10",
                                currentPage === 1
                                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                                    : "bg-white/10 text-white hover:bg-white/20 hover:border-white/30"
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
                                        "w-9 h-9 rounded-full font-medium transition-all duration-200 backdrop-blur-sm",
                                        "border border-white/10",
                                        currentPage === page
                                            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent shadow-lg shadow-blue-500/20"
                                            : "bg-white/10 text-white hover:bg-white/20 hover:border-white/30"
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
                                "px-4 py-2 rounded-full font-medium transition-all duration-200 backdrop-blur-sm",
                                "border border-white/10",
                                currentPage === totalPages
                                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                                    : "bg-white/10 text-white hover:bg-white/20 hover:border-white/30"
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
                        className="text-center mt-6 text-sm text-blue-100/40"
                    >
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredEstudios.length)} de {filteredEstudios.length} estudios
                    </motion.div>
                )}

                {filteredEstudios.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 col-span-full"
                    >
                        <div className="inline-flex p-4 rounded-full bg-white/5 border border-white/10 mb-4">
                            <Search className="h-8 w-8 text-blue-400" />
                        </div>
                        <p className="font-semibold text-white text-lg">No se encontraron resultados</p>
                        <p className="text-blue-100/60">Intenta con otro término de búsqueda.</p>
                    </motion.div>
                )}

            </main>

            <style jsx global>{`
                @keyframes blob {
                  0%, 100% { transform: translate(0, 0) scale(1); }
                  25% { transform: translate(20px, -50px) scale(1.1); }
                  50% { transform: translate(-20px, 20px) scale(0.9); }
                  75% { transform: translate(50px, 50px) scale(1.05); }
                }
                .animate-blob {
                  animation: blob 20s infinite;
                }
                .animation-delay-2000 {
                  animation-delay: 2s;
                }
                .animation-delay-4000 {
                  animation-delay: 4s;
                }
            `}</style>
        </section>
    );
}
