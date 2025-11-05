'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Phone, Mail, Home, Check, ShieldCheck, Clock, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

const Particle = ({ x, y, size, duration, delay }: Particle) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}%`,
      top: `${y}%`,
    }}
    initial={{ opacity: 0 }}
    animate={{
      opacity: [0, 0.8, 0],
      y: [0, -40],
      x: [0, Math.random() * 20 - 10],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      repeatType: 'loop',
      ease: 'easeInOut',
    }}
  />
);

const ShieldIcon = () => (
  <div className="relative">
    <motion.div
      className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-red-500 opacity-20"
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 360],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
    <Shield className="relative z-10 h-16 w-16 text-orange-500" />
    <motion.div
      className="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 bg-white"
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
    <motion.div
      className="absolute left-1/2 top-1/2 h-1 w-8 -translate-x-1/2 -translate-y-1/2 bg-white"
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  </div>
);

const HeartbeatIcon = () => (
  <motion.div
    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    animate={{
      scale: [0.8, 1, 0.8],
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }}
  >
    <div className="h-20 w-20 rounded-full bg-red-500/20" />
  </motion.div>
);

const ProgressStep = ({ step, currentStep, label }: { step: number; currentStep: number; label: string }) => {
  const isCompleted = step < currentStep;
  const isActive = step === currentStep;
  const isUpcoming = step > currentStep;

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full border-2 font-medium',
          isCompleted && 'border-green-500 bg-green-500 text-white',
          isActive && 'border-orange-500 bg-orange-500 text-white',
          isUpcoming && 'border-gray-300 bg-white text-gray-400'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isCompleted ? <Check className="h-5 w-5" /> : step}
      </motion.div>
      <span
        className={cn(
          'mt-2 text-sm font-medium',
          isActive ? 'text-orange-500' : 'text-gray-500'
        )}
      >
        {label}
      </span>
      {isActive && (
        <motion.div
          className="absolute -z-10 h-12 w-12 rounded-full bg-orange-500/20"
          animate={{
            scale: [1, 1.5],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeOut',
          }}
        />
      )}
    </div>
  );
};

const ContactCard = ({ type }: { type: 'admin' | 'email' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isEmail = type === 'email';
  const Icon = isEmail ? Mail : Phone;
  
  return (
    <motion.div
      className={cn(
        'relative flex h-32 flex-col items-center justify-center rounded-xl p-4 shadow-lg',
        isEmail ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      <motion.div
        animate={{
          y: isHovered ? -5 : 0,
          rotate: isHovered && isEmail ? 10 : 0,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      >
        <Icon className="h-8 w-8 text-white" />
      </motion.div>
      <motion.h3 className="mt-2 text-sm font-medium text-white">
        {isEmail ? 'Enviar correo' : 'Llamar al administrador'}
      </motion.h3>
      
      {/* Sound waves effect for phone */}
      {!isEmail && (
        <div className="absolute bottom-4 flex space-x-1">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-1 w-1 rounded-full bg-white/50"
              animate={{
                height: [2, 10, 2],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.2,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}
      
      {/* Flying paper effect for email */}
      {isEmail && isHovered && (
        <motion.div
          className="absolute -right-2 -top-2 h-4 w-4 rounded bg-white/80"
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            y: -20,
            x: -10,
            rotate: -15,
          }}
          transition={{
            duration: 1.5,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.div>
  );
};

export default function RestrictedContentCard() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Generate particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 5,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.className = 'absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30';
    ripple.style.width = '10px';
    ripple.style.height = '10px';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    button.appendChild(ripple);
    
    // Animate ripple
    requestAnimationFrame(() => {
      ripple.style.width = '300px';
      ripple.style.height = '300px';
      ripple.style.opacity = '0';
      ripple.style.transition = 'all 1s ease-out';
    });
    
    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 1000);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <Particle key={particle.id} {...particle} />
        ))}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      {/* Main card */}
      <motion.div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white/80 p-8 text-center shadow-2xl backdrop-blur-sm"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Border gradient */}
        <div className="absolute inset-0 rounded-2xl p-[1px] [background:linear-gradient(120deg,transparent_0%,#f97316_50%,transparent_100%)] [mask:linear-gradient(white,white)_content-box_content-box,linear-gradient(white,white)] [mask-composite:xor]" />
        
        {/* Header with icon */}
        <motion.div 
          className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <HeartbeatIcon />
          <ShieldIcon />
        </motion.div>

        {/* Title */}
        <motion.h2
          className="mb-2 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-3xl font-bold text-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Contenido Restringido
        </motion.h2>

        {/* Description */}
        <motion.p
          className="mb-8 text-gray-600"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Su cuenta de paciente está en proceso de verificación. Siga estos pasos para completar su registro.
        </motion.p>

        {/* Progress steps */}
        <motion.div 
          className="relative mb-8 flex justify-between px-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="absolute left-1/2 top-5 -z-10 h-1 w-full -translate-x-1/2 bg-gray-200">
            <motion.div 
              className="h-full bg-orange-500"
              initial={{ width: '0%' }}
              animate={{ width: '33%' }}
              transition={{ duration: 1, delay: 0.7 }}
            />
          </div>
          <ProgressStep step={1} currentStep={1} label="Verificación" />
          <ProgressStep step={2} currentStep={1} label="Aprobación" />
          <ProgressStep step={3} currentStep={1} label="Completado" />
        </motion.div>

        {/* Contact cards */}
        <motion.div 
          className="mb-8 grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <ContactCard type="admin" />
          <ContactCard type="email" />
        </motion.div>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            ref={buttonRef}
            onClick={handleButtonClick}
            className="group relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6 text-white transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30"
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                backgroundSize: '200% 100%',
                backgroundPosition: '100% 0',
              }}
              animate={{
                backgroundPosition: ['100% 0', '0 0'],
              }}
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
              }}
            />
            <span className="relative z-10 flex items-center gap-2">
              <motion.span
                animate={{
                  x: [0, 5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
              >
                <Home className="h-5 w-5" />
              </motion.span>
              Volver al Inicio
            </span>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
