
'use client';

import { useState, useMemo } from 'react';
import type { Doctor } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Stethoscope, User, MapPin, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { StaggerContainer } from '@/components/animations/stagger-container';
import { StaggerItem } from '@/components/animations/stagger-item';
import { AnimatedCard } from '@/components/animations/animated-card';
import { MagneticButton } from '@/components/animations/magnetic-button';

// Lista completa de médicos
const doctorsData: Doctor[] = [
    { id: "1", userId: "1", nombre: "Dr. Francisco Torres", especialidad: "MEDICINA INTERNA / INTENSIVA", area: "NAGUANAGUA", contacto: "+58 412-000-0001" },
    { id: "2", userId: "2", nombre: "Dra. Maribel Gonzalez", especialidad: "MEDICINA INTERNA", area: "EL VIÑEDO", contacto: "+58 412-000-0002" },
    { id: "3", userId: "3", nombre: "Dr. Ramon Cedeño", especialidad: "CARDIOLOGIA", area: "NAGUANAGUA / VIÑA", contacto: "+58 412-000-0003" },
    { id: "4", userId: "4", nombre: "Dra. Vilma Hernandez", especialidad: "GINECOLOGIA", area: "LAS ACACIAS", contacto: "+58 412-000-0004" },
    { id: "5", userId: "5", nombre: "Dra. Isabel Rosales", especialidad: "GINECOLOGIA", area: "LA VIÑA", contacto: "+58 412-000-0005" },
    { id: "6", userId: "6", nombre: "Dr. Carlos Guevara", especialidad: "GINECOLOGIA", area: "LOS MANGOS", contacto: "+58 412-000-0006" },
    { id: "7", userId: "7", nombre: "Dr. Wilfredo Diaz", especialidad: "MEDICINA OCUPACIONAL", area: "SAN DIEGO / EL VIÑEDO", contacto: "+58 412-000-0007" },
    { id: "8", userId: "8", nombre: "Dr. Jose Avelardo Sanchez", especialidad: "MEDICINA FAMILIAR", area: "LA ISABELICA / EL VIÑEDO", contacto: "+58 412-000-0008" },
    { id: "9", userId: "9", nombre: "Dra. Yaritza Perez", especialidad: "NEFROLOGIA", area: "LAS ACACIAS / EL VIÑEDO", contacto: "+58 412-000-0009" },
    { id: "10", userId: "10", nombre: "Dr. Jose Gregorio Valera", especialidad: "CIRUGIA PEDIATRICA", area: "LAS ACACIAS", contacto: "+58 412-000-0010" },
    { id: "11", userId: "11", nombre: "Dr. Juan Carlos Rodriguez", especialidad: "UROLOGIA GENERAL / UROGINECOLOGIA", area: "LOS MANGOS / ISABELICA / EL VIÑEDO", contacto: "+58 412-000-0011" },
    { id: "12", userId: "12", nombre: "Dr. Luis Caricote", especialidad: "URODINAMIA / UROGINECOLOGIA", area: "LA VIÑA / VALLE DE SAN DIEGO", contacto: "+58 412-000-0012" },
    { id: "13", userId: "13", nombre: "Dr. Carlos Vasquez", especialidad: "CIRUGIA GENERAL", area: "EL VIÑEDO", contacto: "+58 412-000-0013" },
    { id: "14", userId: "14", nombre: "Dr. Carlos Vasquez", especialidad: "CIRUGIA GENERAL", area: "INCLUIDO ECO", contacto: "+58 412-000-0014" },
    { id: "15", userId: "15", nombre: "Dra. Juan Carlos Colina", especialidad: "CIRUGIA GENERAL", area: "LA VIÑA", contacto: "+58 412-000-0015" },
    { id: "16", userId: "16", nombre: "Dr. Hebert Barreto", especialidad: "CIRUGIA PLASTICA", area: "LA VIÑA", contacto: "+58 412-000-0016" },
    { id: "17", userId: "17", nombre: "Dra. Gianmary Miozzi", especialidad: "INFECTOLOGIA", area: "LA VIÑA", contacto: "+58 412-000-0017" },
    { id: "18", userId: "18", nombre: "Dr. Jaikel Bajanchez", especialidad: "ONCOLOGIA CLINICA / MASTOLOGIA", area: "LOS GUAYOS / BRANGER", contacto: "+58 412-000-0018" },
    { id: "19", userId: "19", nombre: "Dr. Odoardo Poggioli", especialidad: "ONCOLOGIA UROLOGICA", area: "LA PASTORA, LA ESMERALDA, CLINICARE", contacto: "+58 412-000-0019" },
    { id: "20", userId: "20", nombre: "Lic. Isabel Leonor Diaz", especialidad: "PSICOLOGIA CLINICA", area: "LOS MANGOS, SAN DIEGO", contacto: "+58 412-000-0020" },
    { id: "21", userId: "21", nombre: "Dr. Joel Felipe Pantoja", especialidad: "ONCOLOGIA CLINICA", area: "VALENCIA", contacto: "+58 412-000-0021" },
    { id: "22", userId: "22", nombre: "Dr. Rafael Odreman", especialidad: "TRAUMATOLOGIA GENERAL / HOMBRO", area: "NAGUANAGUA", contacto: "+58 412-000-0022" },
    { id: "23", userId: "23", nombre: "Dr. Erasto Latuff", especialidad: "TRAUMATOLOGIA GENERAL", area: "EL VIÑEDO / ISABELICA", contacto: "+58 412-000-0023" },
    { id: "24", userId: "24", nombre: "Dr. Lino Ojeda", especialidad: "ANESTESIOLOGIA TERAPIAS DEL DOLOR", area: "EL VIÑEDO / LA VIÑA", contacto: "+58 412-000-0024" },
    { id: "25", userId: "25", nombre: "Dra. Melina Silva", especialidad: "ANESTESIOLOGIA", area: "EL VIÑEDO", contacto: "+58 412-000-0025" },
    { id: "26", userId: "26", nombre: "Dra. Fabiana Bastidas", especialidad: "ANESTESIOLOGIA", area: "EL VIÑEDO", contacto: "+58 412-000-0026" },
    { id: "27", userId: "27", nombre: "Dr. Ricardo Alvarado", especialidad: "ANESTESIOLOGIA TERAPIA DEL DOLOR", area: "EL VIÑEDO / LAS ACACIAS", contacto: "+58 412-000-0027" },
    { id: "28", userId: "28", nombre: "Dr. Ernesto Tellez", especialidad: "CIRUJANO CARDIOVASCULAR", area: "EL VIÑEDO / ISABELICA", contacto: "+58 412-000-0028" },
    { id: "29", userId: "29", nombre: "Lic. Carlos Santodomingo", especialidad: "FISIATRIA Y REHABILITACION", area: "NAGUANAGUA", contacto: "+58 412-000-0029" },
    { id: "30", userId: "30", nombre: "Lic. Carlos Santodomingo", especialidad: "FISIATRIA DOMICILIO", area: "NAGUANAGUA / VALENCIA / ISABELICA", contacto: "+58 412-000-0030" },
    { id: "31", userId: "31", nombre: "Lic. William Aponte", especialidad: "FISIATRIA PISO PELVICO", area: "EL VIÑEDO", contacto: "+58 412-000-0031" }
];

export default function DirectoryPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDoctors = useMemo(() => {
        if (!searchTerm) return doctorsData;
        return doctorsData.filter(doc =>
            doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

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

    const toSentenceCase = (str: string) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
                    <h1 className="text-4xl md:text-5xl font-bold text-white font-headline mb-4">Directorio Médico</h1>
                    <p className="text-blue-100/60 text-lg max-w-2xl mx-auto">Encuentra a los mejores especialistas para tu salud</p>
                </div>

                <div className="relative w-full max-w-lg mx-auto mb-16">
                    <div className='relative group'>
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
                            <div className="relative flex items-center">
                                <Search className="absolute left-4 h-5 w-5 text-blue-400" />
                                <Input
                                    placeholder="Buscar por nombre o especialidad..."
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
                        key={searchTerm}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        staggerDelay={0.05}
                    >
                        {filteredDoctors.map((doc, index) => (
                            <StaggerItem key={doc.nombre + index}>
                                <AnimatedCard className={cn(
                                    "flex flex-col h-full rounded-2xl transition-all duration-300 ease-in-out group relative overflow-hidden",
                                    "bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10",
                                    "hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                                )}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <CardHeader className="relative">
                                        <CardTitle className="flex items-center gap-3">
                                            <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/20">
                                                <User className="h-6 w-6 text-white" />
                                            </div>
                                            <span className="text-lg font-bold text-white font-headline leading-tight">{doc.nombre}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-4 text-sm relative">
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                            <Stethoscope className="h-4 w-4 text-blue-400 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-blue-100 text-xs uppercase tracking-wider mb-1">Especialidad</p>
                                                <p className="text-white font-medium">{toSentenceCase(doc.especialidad)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                            <MapPin className="h-4 w-4 text-blue-400 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-blue-100 text-xs uppercase tracking-wider mb-1">Área de Cobertura</p>
                                                <p className="text-white/80">{doc.area}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </AnimatedCard>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </AnimatePresence>

                {filteredDoctors.length === 0 && (
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
