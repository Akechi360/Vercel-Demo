
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

// Lista completa de médicos
const doctorsData: Doctor[] = [
    { id: "1", nombre: "Dr. Francisco Torres", especialidad: "MEDICINA INTERNA / INTENSIVA", area: "NAGUANAGUA", contacto: "+58 412-000-0001" },
    { id: "2", nombre: "Dra. Maribel Gonzalez", especialidad: "MEDICINA INTERNA", area: "EL VIÑEDO", contacto: "+58 412-000-0002" },
    { id: "3", nombre: "Dr. Ramon Cedeño", especialidad: "CARDIOLOGIA", area: "NAGUANAGUA / VIÑA", contacto: "+58 412-000-0003" },
    { id: "4", nombre: "Dra. Vilma Hernandez", especialidad: "GINECOLOGIA", area: "LAS ACACIAS", contacto: "+58 412-000-0004" },
    { id: "5", nombre: "Dra. Isabel Rosales", especialidad: "GINECOLOGIA", area: "LA VIÑA", contacto: "+58 412-000-0005" },
    { id: "6", nombre: "Dr. Carlos Guevara", especialidad: "GINECOLOGIA", area: "LOS MANGOS", contacto: "+58 412-000-0006" },
    { id: "7", nombre: "Dr. Wilfredo Diaz", especialidad: "MEDICINA OCUPACIONAL", area: "SAN DIEGO / EL VIÑEDO", contacto: "+58 412-000-0007" },
    { id: "8", nombre: "Dr. Jose Avelardo Sanchez", especialidad: "MEDICINA FAMILIAR", area: "LA ISABELICA / EL VIÑEDO", contacto: "+58 412-000-0008" },
    { id: "9", nombre: "Dra. Yaritza Perez", especialidad: "NEFROLOGIA", area: "LAS ACACIAS / EL VIÑEDO", contacto: "+58 412-000-0009" },
    { id: "10", nombre: "Dr. Jose Gregorio Valera", especialidad: "CIRUGIA PEDIATRICA", area: "LAS ACACIAS", contacto: "+58 412-000-0010" },
    { id: "11", nombre: "Dr. Juan Carlos Rodriguez", especialidad: "UROLOGIA GENERAL / UROGINECOLOGIA", area: "LOS MANGOS / ISABELICA / EL VIÑEDO", contacto: "+58 412-000-0011" },
    { id: "12", nombre: "Dr. Luis Caricote", especialidad: "URODINAMIA / UROGINECOLOGIA", area: "LA VIÑA / VALLE DE SAN DIEGO", contacto: "+58 412-000-0012" },
    { id: "13", nombre: "Dr. Carlos Vasquez", especialidad: "CIRUGIA GENERAL", area: "EL VIÑEDO", contacto: "+58 412-000-0013" },
    { id: "14", nombre: "Dr. Carlos Vasquez", especialidad: "CIRUGIA GENERAL", area: "INCLUIDO ECO", contacto: "+58 412-000-0014" },
    { id: "15", nombre: "Dra. Juan Carlos Colina", especialidad: "CIRUGIA GENERAL", area: "LA VIÑA", contacto: "+58 412-000-0015" },
    { id: "16", nombre: "Dr. Hebert Barreto", especialidad: "CIRUGIA PLASTICA", area: "LA VIÑA", contacto: "+58 412-000-0016" },
    { id: "17", nombre: "Dra. Gianmary Miozzi", especialidad: "INFECTOLOGIA", area: "LA VIÑA", contacto: "+58 412-000-0017" },
    { id: "18", nombre: "Dr. Jaikel Bajanchez", especialidad: "ONCOLOGIA CLINICA / MASTOLOGIA", area: "LOS GUAYOS / BRANGER", contacto: "+58 412-000-0018" },
    { id: "19", nombre: "Dr. Odoardo Poggioli", especialidad: "ONCOLOGIA UROLOGICA", area: "LA PASTORA, LA ESMERALDA, CLINICARE", contacto: "+58 412-000-0019" },
    { id: "20", nombre: "Lic. Isabel Leonor Diaz", especialidad: "PSICOLOGIA CLINICA", area: "LOS MANGOS, SAN DIEGO", contacto: "+58 412-000-0020" },
    { id: "21", nombre: "Dr. Joel Felipe Pantoja", especialidad: "ONCOLOGIA CLINICA", area: "VALENCIA", contacto: "+58 412-000-0021" },
    { id: "22", nombre: "Dr. Rafael Odreman", especialidad: "TRAUMATOLOGIA GENERAL / HOMBRO", area: "NAGUANAGUA", contacto: "+58 412-000-0022" },
    { id: "23", nombre: "Dr. Erasto Latuff", especialidad: "TRAUMATOLOGIA GENERAL", area: "EL VIÑEDO / ISABELICA", contacto: "+58 412-000-0023" },
    { id: "24", nombre: "Dr. Lino Ojeda", especialidad: "ANESTESIOLOGIA TERAPIAS DEL DOLOR", area: "EL VIÑEDO / LA VIÑA", contacto: "+58 412-000-0024" },
    { id: "25", nombre: "Dra. Melina Silva", especialidad: "ANESTESIOLOGIA", area: "EL VIÑEDO", contacto: "+58 412-000-0025" },
    { id: "26", nombre: "Dra. Fabiana Bastidas", especialidad: "ANESTESIOLOGIA", area: "EL VIÑEDO", contacto: "+58 412-000-0026" },
    { id: "27", nombre: "Dr. Ricardo Alvarado", especialidad: "ANESTESIOLOGIA TERAPIA DEL DOLOR", area: "EL VIÑEDO / LAS ACACIAS", contacto: "+58 412-000-0027" },
    { id: "28", nombre: "Dr. Ernesto Tellez", especialidad: "CIRUJANO CARDIOVASCULAR", area: "EL VIÑEDO / ISABELICA", contacto: "+58 412-000-0028" },
    { id: "29", nombre: "Lic. Carlos Santodomingo", especialidad: "FISIATRIA Y REHABILITACION", area: "NAGUANAGUA", contacto: "+58 412-000-0029" },
    { id: "30", nombre: "Lic. Carlos Santodomingo", especialidad: "FISIATRIA DOMICILIO", area: "NAGUANAGUA / VALENCIA / ISABELICA", contacto: "+58 412-000-0030" },
    { id: "31", nombre: "Lic. William Aponte", especialidad: "FISIATRIA PISO PELVICO", area: "EL VIÑEDO", contacto: "+58 412-000-0031" }
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
        <section className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-sky-100 dark:from-[#0D122A] dark:to-[#101633] pt-16 pb-20">
            {/* Back Button */}
            <div className="container mx-auto px-4 pt-4">
                <Link 
                    href="/landing" 
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors duration-200 font-medium"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </Link>
            </div>
            <main className="container mx-auto px-4">
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
                    <h1 className="text-4xl font-bold text-primary font-headline">Directorio médico</h1>
                </div>

                <div className="relative w-full max-w-lg mx-auto mb-12">
                    <Card className='bg-white/90 dark:bg-[#101633] border border-primary/20 shadow-lg'>
                        <CardContent className='p-2'>
                             <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/70" />
                                <Input
                                    placeholder="Buscar por nombre o especialidad..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 h-12 text-base rounded-full shadow-sm bg-transparent border-0 focus-visible:ring-primary"
                                />
                             </div>
                        </CardContent>
                    </Card>
                </div>

                <AnimatePresence>
                    <motion.div
                        key={searchTerm}
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredDoctors.map((doc, index) => (
                            <motion.div key={doc.nombre + index} variants={itemVariants}>
                                <Card className={cn(
                                    "flex flex-col h-full rounded-2xl shadow-sm transition-all duration-300 ease-in-out bg-card/50",
                                    "hover:shadow-[0_0_20px_rgba(37,99,235,0.2)] dark:hover:shadow-[0_0_30px_rgba(37,99,235,0.3)]",
                                    "border-b-4 border-transparent hover:border-primary/20"
                                )}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3">
                                            <div className="p-3 bg-primary/10 rounded-full">
                                                <User className="h-6 w-6 text-primary" />
                                            </div>
                                            <span className="text-lg font-bold text-primary font-headline">{doc.nombre}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-4 text-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 rounded-md">
                                                <Stethoscope className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">Especialidad</p>
                                                <p className="text-muted-foreground">{toSentenceCase(doc.especialidad)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 rounded-md">
                                                <MapPin className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">Área de Cobertura</p>
                                                <p className="text-muted-foreground">{doc.area}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
                
                    {filteredDoctors.length === 0 && (
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
