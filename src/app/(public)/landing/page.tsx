'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Stethoscope, 
  Check, 
  Users, 
  ShieldCheck, 
  HeartPulse, 
  Bone, 
  FlaskConical, 
  ZoomIn, 
  Play, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Ambulance, 
  Microscope, 
  Clock, 
  Activity,
  Star,
  ArrowRight,
  Award,
  Calendar,
  FileText,
  Zap,
  Globe,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const fadeIn = (delay: number = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      delay,
    },
  },
});

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const metrics = [
  { number: "1,200+", label: "Pacientes Activos", icon: Users },
  { number: "30+", label: "Especialistas", icon: Stethoscope },
  { number: "500+", label: "Estudios Realizados", icon: Microscope },
  { number: "98%", label: "Satisfacción", icon: Star },
];

const benefits = [
  {
    icon: MessageSquare,
    title: "Consultas Ilimitadas",
    description: "Chatea con nuestro equipo médico especializado las 24 horas del día.",
    color: "bg-urovital-blue/10 text-urovital-blue"
  },
  {
    icon: FlaskConical,
    title: "Cobertura en Estudios",
    description: "Acceso a radiología, uroflujometrías y más con descuentos preferenciales.",
    color: "bg-urovital-red/10 text-urovital-red"
  },
  {
    icon: Calendar,
    title: "Atención Prioritaria",
    description: "Turnos con especialistas sin demoras y seguimiento personalizado.",
    color: "bg-urovital-blue/10 text-urovital-blue"
  },
  {
    icon: ShieldCheck,
    title: "Seguimiento 24/7",
    description: "Recordatorios automáticos y acceso rápido a tus resultados médicos.",
    color: "bg-urovital-red/10 text-urovital-red"
  }
];

const specialties = [
  {
    icon: Stethoscope,
    title: 'Urología',
    description: 'Atención especializada para el sistema urinario y reproductivo masculino.',
    color: 'bg-urovital-blue/10 text-urovital-blue'
  },
  {
    icon: HeartPulse,
    title: 'Ginecología',
    description: 'Cuidado integral de la salud femenina, desde revisiones hasta tratamientos complejos.',
    color: 'bg-urovital-red/10 text-urovital-red'
  },
  {
    icon: Bone,
    title: 'Oncología',
    description: 'Diagnóstico y tratamiento de cáncer con un enfoque multidisciplinario y humano.',
    color: 'bg-urovital-blue/10 text-urovital-blue'
  },
  {
    icon: Activity,
    title: 'Uroginecología',
    description: 'Tratamientos avanzados de trastornos del piso pélvico.',
    color: 'bg-urovital-red/10 text-urovital-red'
  },
];

const processSteps = [
  { 
    number: "01", 
    title: "Regístrate", 
    description: "Crea tu cuenta en segundos y elige tu plan ideal.",
    icon: Users
  },
  { 
    number: "02", 
    title: "Agenda tu cita", 
    description: "Selecciona fecha, hora y especialista que prefieras.",
    icon: Calendar
  },
  { 
    number: "03", 
    title: "Recibe atención", 
    description: "Consulta presencial o virtual con nuestros expertos.",
    icon: Stethoscope
  },
  { 
    number: "04", 
    title: "Seguimiento continuo", 
    description: "Acceso a resultados y seguimiento personalizado.",
    icon: FileText
  },
];

const pricingPlans = [
  {
    id: 'tarjeta-saludable',
    name: "Tarjeta Saludable",
    subtitle: "Individual + 2 Beneficiarios",
    features: [
      "Afiliación sin costo inicial",
      "Consultas médicas gratuitas (hasta 6 al año)",
      "Descuentos en laboratorio e imagenología",
      "Acceso a Fisiatría y Rehabilitación",
      "Descuentos en Cirugías Urológicas",
    ],
    price: 150,
    priceSummary: "$150 anual (contado), 3 cuotas de $50 o $10 mensuales",
    popular: true,
  },
  {
    id: 'fondo-espiritu-santo',
    name: "Fondo Espíritu Santo",
    subtitle: "Grupos de 200–500 afiliados",
    features: [
      "Desde 17.500 hasta 87.000 USD por Grupos",
      "Cobertura anual integral completa",
      "Procedimientos quirúrgicos electivos",
      "Traslados en ambulancia 24/7",
    ],
    price: 250,
    priceSummary: "$250 anual (contado) o 4 cuotas de $62.50",
    popular: false,
  }
];

const partners = [
  { name: "Banesco", logo: "/images/banks/banesco.png", badge: "Banesco Vzla/Banesco Panama" },
  { name: "BDV", logo: "/images/banks/bdv.png", badge: "Banco de Venezuela" },
  { name: "Mercantil", logo: "/images/banks/mercantil.png", badge: "Banco Mercantil" },
  { name: "BNC", logo: "/images/banks/bnc.png", badge: "BNC" },
  { name: "PayPal", logo: "/images/banks/paypal.png", badge: "PayPal" },
  { name: "Wally", logo: "/images/banks/wally.png", badge: "WallyTech" },
];

const allies = [
  {
    name: "Oceánica de Seguros",
    logo: "/images/aliados/oceanica.png",
    description: "Empresa aseguradora líder, especializada en salud y bienestar, reconocida por su atención ágil y confiable."
  },
  {
    name: "CliniCare Centro Médico",
    logo: "/images/aliados/clinicare.png",
    description: "Centro médico integral con tecnología avanzada y atención humanizada, orientado al cuidado experto de los pacientes."
  }
];

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white via-urovital-blue-light/5 to-urovital-blue/10 dark:from-[#131c36] dark:via-[#071f3d] dark:to-[#131c36] pt-32 pb-20 md:pt-48 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center lg:text-left"
          >
            <motion.div 
              variants={fadeIn()} 
              className="inline-flex items-center gap-2 bg-urovital-blue/10 text-urovital-blue px-4 py-2 rounded-full text-sm font-semibold mb-6"
            >
              <Award className="w-4 h-4" />
              Líderes en Salud Urológica
            </motion.div>
            
            <motion.h1 
              variants={fadeIn()}
              className="text-4xl lg:text-6xl font-bold tracking-tight font-headline mb-6"
            >
              Tu salud es nuestra{' '}
              <span className="text-urovital-blue bg-gradient-to-r from-urovital-blue to-urovital-blue-light bg-clip-text text-transparent">
                prioridad
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeIn()}
              className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0"
            >
              Atención médica especializada, tecnología avanzada y un equipo humano 
              comprometido con tu bienestar integral.
            </motion.p>
            
            <motion.div 
              variants={fadeIn()}
              className="flex justify-center lg:justify-start"
            >
              <Button asChild size="lg" className="bg-urovital-blue hover:bg-urovital-blue/90 text-white px-8 py-6 text-lg font-semibold border-2 border-urovital-blue hover:border-urovital-blue/90 shadow-lg hover:shadow-urovital-blue/30 transition-all duration-300">
                <Link href="/afiliacion">
                  Afíliate Ahora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            className="relative"
          >
            <div className="relative">
              <Image 
                src="/images/landing/doctors-uro1.png" 
                alt="Equipo médico UroVital" 
                width={608} 
                height={601}
                className="relative rounded-2xl shadow-2xl mx-auto max-w-full h-auto"
                priority
              />
              <div className="absolute -top-4 -right-4 bg-urovital-blue text-white p-4 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-sm">Satisfacción</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Metrics */}
        <div className="container mx-auto px-4 mt-16">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.5 }} 
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div 
                  key={index}
                  variants={fadeIn()} 
                  className="text-center bg-white dark:bg-card rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:shadow-urovital-blue/20 transition-all duration-300 group hover:scale-105"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-urovital-blue/10 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-urovital-blue" />
                  </div>
                  <p className="text-3xl font-bold text-urovital-blue mb-2">{metric.number}</p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-28 bg-white dark:bg-[#131c36]">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.3 }} 
            variants={staggerContainer} 
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.p 
              variants={fadeIn()} 
              className="text-urovital-blue font-semibold text-sm uppercase mb-4 tracking-widest"
            >
              Beneficios Exclusivos
            </motion.p>
            <motion.h2 
              variants={fadeIn()} 
              className="text-3xl md:text-5xl font-bold font-headline mb-6"
            >
              Más salud por menos dinero
            </motion.h2>
            <motion.p 
              variants={fadeIn()} 
              className="text-lg text-muted-foreground"
            >
              Descubre por qué miles de pacientes confían en UroVital para su cuidado médico integral.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.2 }} 
            variants={staggerContainer} 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div 
                  key={index}
                  variants={fadeIn()} 
                  className="group"
                >
                  <Card className="h-full text-center p-8 hover:shadow-2xl hover:shadow-urovital-blue/20 transition-all duration-300 border-0 bg-gradient-to-br from-white to-urovital-blue-light/5 dark:from-card dark:to-urovital-blue/5 group-hover:scale-105">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${benefit.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-xl mb-4">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 bg-urovital-blue-light/5 dark:bg-[#071f3d]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{opacity: 0, scale: 0.9}} 
              whileInView={{opacity: 1, scale: 1}} 
              viewport={{once: true}} 
              transition={{duration: 0.6}} 
              className="relative overflow-hidden order-2 lg:order-1"
            >
              <Image 
                src="/images/landing/appointments1.jpg" 
                width={658} 
                height={488} 
                alt="Proceso de atención médica" 
                className="rounded-2xl shadow-2xl w-full h-auto object-cover" 
              />
            </motion.div>
            
            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true, amount: 0.5 }} 
              variants={fadeIn()}
              className="order-1 lg:order-2"
            >
              <p className="text-urovital-blue font-semibold text-sm uppercase mb-4 tracking-widest">Cómo funciona</p>
              <h2 className="text-3xl md:text-5xl font-bold font-headline mb-8">
                Proceso simple y efectivo
              </h2>
              <p className="text-lg text-muted-foreground mb-12">
                En solo 4 pasos tendrás acceso a la mejor atención médica especializada.
              </p>
              
              <div className="space-y-8">
                {processSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="flex items-start gap-6"
                    >
                      <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl bg-urovital-blue text-white font-bold text-lg shadow-lg">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-5 h-5 text-urovital-blue" />
                          <h3 className="font-bold text-xl">{step.title}</h3>
                        </div>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-20 md:py-28 bg-white dark:bg-[#131c36]">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.p
              variants={fadeIn()}
              className="text-urovital-blue font-semibold text-sm uppercase mb-4 tracking-widest"
            >
              Nuestras Especialidades
            </motion.p>
            <motion.h2
              variants={fadeIn()}
              className="text-3xl md:text-5xl font-bold font-headline mb-6"
            >
              Especialistas que cuidan cada etapa de tu salud
            </motion.h2>
            <motion.p 
              variants={fadeIn()} 
              className="text-lg text-muted-foreground"
            >
              Un equipo multidisciplinario dedicado a tu bienestar integral con la más alta tecnología.
            </motion.p>
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {specialties.map((specialty, index) => {
              const Icon = specialty.icon;
              return (
                <motion.div 
                  key={index}
                  variants={fadeIn()} 
                  className="group"
                >
                  <Card className="h-full text-center p-8 hover:shadow-2xl hover:shadow-urovital-blue/20 transition-all duration-300 border-0 bg-gradient-to-br from-white to-urovital-blue-light/5 dark:from-card dark:to-urovital-blue/5 group-hover:scale-105">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${specialty.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-xl mb-4">{specialty.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{specialty.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-28 bg-urovital-blue-light/5 dark:bg-[#071f3d]">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.3 }} 
            variants={staggerContainer} 
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.p 
              variants={fadeIn()} 
              className="text-urovital-blue font-semibold text-sm uppercase mb-4 tracking-widest"
            >
              Planes de Precios
            </motion.p>
            <motion.h2 
              variants={fadeIn()} 
              className="text-3xl md:text-5xl font-bold font-headline mb-6"
            >
              Elige el plan perfecto para ti
            </motion.h2>
            <motion.p 
              variants={fadeIn()} 
              className="text-lg text-muted-foreground"
            >
              Flexibilidad y transparencia en cada plan. Sin sorpresas, solo beneficios.
            </motion.p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                variants={fadeIn(0.2 * (index + 1))}
                className="relative"
              >
                {/* Badge flotante - no afecta el layout interno */}
                {plan.popular && (
                  <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-urovital-blue text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Más Popular
                    </div>
                  </div>
                )}
                
                {/* Card con altura fija idéntica */}
                <Card className={cn(
                  "flex flex-col h-[520px] rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-urovital-blue/20 transition-all duration-300 bg-white dark:bg-card group border-2",
                  plan.popular 
                    ? "border-urovital-blue/30 hover:border-urovital-blue/50" 
                    : "border-transparent hover:border-urovital-blue/20"
                )}>
                  {/* Header Section - Altura fija */}
                  <div className="p-8 pb-4 flex-shrink-0">
                    <div className="text-center">
                      <CardTitle className="text-2xl font-bold text-urovital-blue mb-2">{plan.name}</CardTitle>
                      <CardDescription className="text-lg text-muted-foreground">{plan.subtitle}</CardDescription>
                    </div>
                  </div>

                  {/* Content Section - Altura fija con scroll si es necesario */}
                  <div className="flex-1 px-8 overflow-hidden">
                    {/* Features List - Altura fija con scroll */}
                    <div className="h-full overflow-y-auto">
                      <ul className="space-y-3 pr-2">
                        {plan.features.map(feature => (
                          <li key={feature} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-urovital-blue mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground leading-relaxed text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Price Section - Altura fija */}
                  <div className="px-8 py-4 border-t border-border flex-shrink-0">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-urovital-blue mb-1">${plan.price}</div>
                      <p className="text-muted-foreground text-sm">{plan.priceSummary}</p>
                    </div>
                  </div>

                  {/* Footer Section - Altura fija, siempre al fondo */}
                  <div className="p-8 pt-4 flex-shrink-0">
                    <Button 
                      asChild 
                      size="lg" 
                      className="w-full py-6 text-lg font-semibold border-2 border-urovital-blue hover:border-urovital-blue/90 shadow-lg hover:shadow-urovital-blue/30 transition-all duration-300 bg-urovital-blue hover:bg-urovital-blue/90 text-white group-hover:scale-105"
                    >
                      <Link href={`/afiliacion?plan=${plan.id}`}>
                        Afíliate Ahora
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 md:py-28 bg-white dark:bg-[#131c36]">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.3 }} 
            variants={staggerContainer} 
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.p 
              variants={fadeIn()} 
              className="text-urovital-blue font-semibold text-sm uppercase mb-4 tracking-widest"
            >
              Pagos Asegurados
            </motion.p>
            <motion.h2 
              variants={fadeIn()} 
              className="text-3xl md:text-5xl font-bold font-headline mb-6"
            >
              Formas de pago seguras y confiables
            </motion.h2>
            <motion.p 
              variants={fadeIn()} 
              className="text-lg text-muted-foreground"
            >
              Aceptamos múltiples métodos de pago para tu comodidad y seguridad.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.2 }} 
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8"
          >
            {partners.map((partner, index) => (
              <motion.div 
                key={index}
                variants={fadeIn()} 
                className="group"
              >
                <div className="bg-white dark:bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex flex-col justify-center items-center h-[120px] relative">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-full flex justify-center">
                    <span className="bg-urovital-blue text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg whitespace-nowrap">
                      {partner.badge}
                    </span>
                  </div>
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={120}
                    height={60}
                    className={`max-h-[48px] w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300 ${partner.name === "PayPal" ? "transform scale-[1.95]" : ""}`}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Allies Section */}
      <section className="py-20 md:py-28 bg-gray-50 dark:bg-[#0f172a]">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.3 }} 
            variants={staggerContainer} 
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.p 
              variants={fadeIn()} 
              className="text-urovital-blue font-semibold text-sm uppercase mb-4 tracking-widest"
            >
              Nuestros Aliados
            </motion.p>
            <motion.h2 
              variants={fadeIn()} 
              className="text-3xl md:text-5xl font-bold font-headline mb-6"
            >
              Aliados estratégicos para tu bienestar
            </motion.h2>
            <motion.p 
              variants={fadeIn()} 
              className="text-lg text-muted-foreground"
            >
              Trabajamos con instituciones reconocidas para brindarte la mejor atención médica y seguros de calidad.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.2 }} 
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {allies.map((ally, index) => (
              <motion.div 
                key={index}
                variants={fadeIn()} 
                className="group"
              >
                <div className="bg-white dark:bg-card rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex flex-col items-center text-center h-full">
                  <div className="mb-6">
                    <Image
                      src={ally.logo}
                      alt={ally.name}
                      width={280}
                      height={160}
                      className="max-h-[120px] w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>
                  <h3 className="text-xl font-bold font-headline mb-4 text-foreground">
                    {ally.name}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {ally.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-urovital-blue to-urovital-blue-light dark:from-[#131c36] dark:to-[#071f3d] text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.5 }} 
            variants={fadeIn()}
          >
            <h2 className="text-3xl md:text-5xl font-bold font-headline mb-6">
              ¿Listo para mejorar tu salud?
            </h2>
            <p className="max-w-3xl mx-auto text-xl mb-8 opacity-90">
              Únete a miles de pacientes que ya confían en UroVital para su cuidado médico integral. 
              Tu bienestar es nuestra prioridad.
            </p>
            <div className="flex justify-center">
              <Button asChild size="lg" className="bg-urovital-blue hover:bg-urovital-blue/90 text-white px-8 py-6 text-lg font-semibold border-2 border-urovital-blue hover:border-urovital-blue/90 shadow-lg hover:shadow-urovital-blue/30 transition-all duration-300">
                <Link href="/afiliacion">
                  Afíliate Ahora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
            
            <motion.div 
              initial={{opacity: 0, scale: 0.5, y: 50}}
              animate={{opacity: 1, scale: 1, y: 0}}
              transition={{duration: 0.5, delay: 0.5, ease: "easeOut"}}
              className="mt-12 mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 max-w-80 mx-auto"
            >
              <div className="p-3 bg-white/20 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-white"/>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">Cuidado de Confianza</p>
                <p className="text-sm opacity-80">Especialistas Certificados</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}