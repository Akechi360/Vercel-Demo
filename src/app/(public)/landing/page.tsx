'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Stethoscope,
  Check,
  Users,
  ShieldCheck,
  HeartPulse,
  Bone,
  FlaskConical,
  MessageSquare,
  Microscope,
  Activity,
  Star,
  ArrowRight,
  Calendar,
  FileText,
  Zap,
  Sparkles,
  Network
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from '@/components/animations/animated-counter';
import { useRef } from 'react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const metrics = [
  { number: "1200", label: "Pacientes Activos", icon: Users, color: "from-blue-500 to-cyan-500" },
  { number: "30", label: "Especialistas", icon: Stethoscope, color: "from-purple-500 to-pink-500" },
  { number: "500", label: "Estudios Realizados", icon: Microscope, color: "from-orange-500 to-red-500" },
  { number: "98", label: "Satisfacción", icon: Star, color: "from-green-500 to-emerald-500" },
];

const benefits = [
  {
    icon: Network,
    title: "Telemedicina 24/7",
    description: "Conexión directa con especialistas médicos desde cualquier lugar",
    gradient: "from-blue-500 to-cyan-600"
  },
  {
    icon: FileText,
    title: "Historial Médico Digital",
    description: "Acceso completo a tu historial clínico y resultados de estudios",
    gradient: "from-violet-500 to-purple-600"
  },
  {
    icon: Calendar,
    title: "Gestión de Citas",
    description: "Agenda y administra tus consultas médicas de forma sencilla",
    gradient: "from-pink-500 to-rose-600"
  },
  {
    icon: Zap,
    title: "Atención Prioritaria",
    description: "Acceso rápido a especialistas y seguimiento personalizado",
    gradient: "from-amber-500 to-orange-600"
  }
];

const specialties = [
  {
    icon: Stethoscope,
    title: 'Urología',
    description: 'Atención especializada para el sistema urinario y reproductivo masculino',
    image: '/images/landing/doctors-uro1.png'
  },
  {
    icon: HeartPulse,
    title: 'Ginecología',
    description: 'Atención integral de la salud femenina con tratamientos especializados',
  },
  {
    icon: Bone,
    title: 'Oncología',
    description: 'Diagnóstico y tratamiento de cáncer con enfoque multidisciplinario',
  },
  {
    icon: Activity,
    title: 'Uroginecología',
    description: 'Tratamientos avanzados de trastornos del piso pélvico',
  },
];

const processSteps = [
  {
    number: "01",
    title: "Regístrate en la Plataforma",
    description: "Crea tu cuenta y selecciona el plan que mejor se adapte a tus necesidades",
    icon: Users
  },
  {
    number: "02",
    title: "Agenda tu Cita",
    description: "Selecciona especialista, fecha y hora según tu disponibilidad",
    icon: Calendar
  },
  {
    number: "03",
    title: "Consulta Médica",
    description: "Recibe atención presencial o por telemedicina con nuestros especialistas",
    icon: Stethoscope
  },
  {
    number: "04",
    title: "Accede a tu Historial",
    description: "Consulta resultados de estudios y seguimiento médico en cualquier momento",
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
  { name: "Banesco", logo: "/images/banks/banesco.png" },
  { name: "BDV", logo: "/images/banks/bdv.png" },
  { name: "Mercantil", logo: "/images/banks/mercantil.png" },
  { name: "BNC", logo: "/images/banks/bnc.png" },
  { name: "PayPal", logo: "/images/banks/paypal.png" },
  { name: "Wally", logo: "/images/banks/wally.png" },
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <>
      {/* Hero Section - Medical SaaS Tech */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:72px_72px]" />


        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container mx-auto px-4 py-20 relative z-10"
        >
          <div className="max-w-5xl mx-auto text-center">
            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Tecnología médica
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                que transforma vidas
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-blue-100/80 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Plataforma SaaS de salud con telemedicina avanzada y
              gestión médica en la nube. La evolución digital del cuidado de la salud.
            </motion.p>

            {/* Tech badge - moved below description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-12"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Plataforma Médica de Última Generación</span>
            </motion.div>


            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                size="lg"
                className="group relative px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0 shadow-2xl shadow-blue-500/50 transition-all duration-300"
                onClick={() => window.location.href = '/afiliacion'}
              >
                <span className="flex items-center gap-2">
                  Acceder a la Plataforma
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 bg-white/5 backdrop-blur-xl border-white/20 text-white hover:bg-white/10 transition-all duration-300"
                onClick={() => window.location.href = '#tecnologia'}
              >
                Ver Tecnología
              </Button>
            </motion.div>

            {/* Floating medical image with glassmorphism */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-20 relative"
            >
              <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl p-2 shadow-2xl">
                <Image
                  src="/images/landing/doctors-uro1.png"
                  alt="Plataforma UroVital"
                  width={1200}
                  height={600}
                  className="rounded-2xl w-full h-auto"
                  priority
                />
                {/* Floating tech indicators */}
                <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-green-500/20 backdrop-blur-xl border border-green-400/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-green-100">Sistema Activo</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Metrics Section - Floating cards */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="group relative"
                >
                  <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                    <div className="relative">
                      <Icon className="w-8 h-8 text-blue-400 mb-4" />
                      <div className="text-4xl font-bold text-white mb-2">
                        <AnimatedCounter to={parseInt(metric.number)} suffix={metric.number.includes('+') ? '+' : metric.number.includes('%') ? '%' : ''} />
                      </div>
                      <div className="text-sm text-blue-200/60">{metric.label}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section - Bento Grid with Tech Focus */}
      <section id="tecnologia" className="py-32 bg-slate-950 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Network className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Servicios Médicos</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Plataforma integral de salud
            </h2>
            <p className="text-xl text-blue-100/60 max-w-2xl mx-auto">
              Gestión completa de tu salud con telemedicina y seguimiento personalizado
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="group relative"
                >
                  <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                    <div className="relative">
                      <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${benefit.gradient} mb-6`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">{benefit.title}</h3>
                      <p className="text-blue-100/60 leading-relaxed">{benefit.description}</p>
                    </div>

                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Process Section - Timeline Tech */}
      <section className="py-32 bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Cómo funciona UroVital
            </h2>
            <p className="text-xl text-blue-100/60 max-w-2xl mx-auto">
              Cuatro pasos simples para acceder a atención médica especializada
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative flex gap-8 mb-12 last:mb-0"
                >
                  {/* Timeline line */}
                  {index < processSteps.length - 1 && (
                    <div className="absolute left-6 top-16 w-0.5 h-full bg-gradient-to-b from-blue-500 to-transparent" />
                  )}

                  {/* Number circle */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/50">
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-12">
                    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Icon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                          <p className="text-blue-100/60">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Specialties - Modern Grid */}
      <section className="py-32 bg-slate-950">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Especialidades médicas
            </h2>
            <p className="text-xl text-blue-100/60 max-w-2xl mx-auto">
              Atención especializada con tecnología de vanguardia
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {specialties.map((specialty, index) => {
              const Icon = specialty.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="group relative"
                >
                  <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-blue-500/50 transition-all duration-300 h-full">
                    <Icon className="w-10 h-10 text-blue-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-3">{specialty.title}</h3>
                    <p className="text-blue-100/60 text-sm leading-relaxed">{specialty.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Pricing - Modern SaaS Style */}
      <section className="py-32 bg-gradient-to-b from-slate-950 to-blue-950/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Planes de suscripción
            </h2>
            <p className="text-xl text-blue-100/60 max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold shadow-lg">
                      Más Popular
                    </div>
                  </div>
                )}

                <div className={cn(
                  "relative p-8 rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-2xl border transition-all duration-300 h-full flex flex-col",
                  plan.popular ? "border-blue-500/50 shadow-2xl shadow-blue-500/20" : "border-white/10 hover:border-white/20"
                )}>
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-blue-100/60">{plan.subtitle}</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-bold text-white">${plan.price}</span>
                      <span className="text-blue-100/60">/año</span>
                    </div>
                    <p className="text-sm text-blue-100/60">{plan.priceSummary}</p>
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn(
                      "w-full py-6 rounded-xl font-semibold transition-all duration-300",
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/50"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    )}
                    onClick={() => window.location.href = `/afiliacion?plan=${plan.id}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Seleccionar Plan
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners - Minimal */}
      <section className="py-20 bg-slate-950">
        <div className="container mx-auto px-4">
          <p className="text-center text-blue-100/60 text-sm mb-12 uppercase tracking-wider font-medium">Métodos de pago aceptados</p>
          <div className="flex flex-nowrap justify-center items-center gap-8 md:gap-12">
            {partners.map((partner, index) => (
              <div key={index} className="relative group flex-shrink-0">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={140}
                  height={70}
                  className={cn(
                    "w-auto object-contain relative z-10 transition-all duration-300 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110",
                    partner.name === 'PayPal' ? "h-16 md:h-20" : "h-10 md:h-12"
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Premium */}
      <section className="relative py-32 bg-gradient-to-br from-blue-950 via-slate-950 to-purple-950 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              El futuro de la salud
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                comienza hoy
              </span>
            </h2>
            <p className="text-xl text-blue-100/70 mb-12 max-w-2xl mx-auto">
              Únete a la revolución digital de la salud. Tecnología médica avanzada al alcance de tu mano.
            </p>
            <Button
              size="lg"
              className="px-12 py-7 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-lg font-semibold shadow-2xl shadow-blue-500/50 transition-all duration-300 rounded-xl"
              onClick={() => window.location.href = '/afiliacion'}
            >
              <span className="flex items-center gap-2">
                Comenzar Ahora
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </motion.div>
        </div>
      </section>

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
    </>
  );
}