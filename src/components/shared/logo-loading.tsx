'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function LogoLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-8">
        
        {/* Logo con animación de pulso suave */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.9, 1, 0.9]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          {/* Glow effect detrás del logo */}
          <motion.div
            className="absolute inset-0 blur-2xl bg-primary/20 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Logo principal */}
          <Image 
            src="/images/logo/urovital-logo.png" 
            alt="UroVital"
            width={120}
            height={120}
            className="relative z-10 dark:invert"
            priority
          />
        </motion.div>
        
        {/* Barra de progreso con gradiente animado */}
        <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
            style={{
              backgroundSize: '200% 100%'
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
              width: ['20%', '80%', '20%']
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        {/* Texto de feedback con fade */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-sm text-muted-foreground font-medium"
        >
          Cargando panel de control...
        </motion.p>
        
        {/* Puntos animados (opcional) */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
