"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { LifeLine } from "react-loading-indicators";

interface HeartbeatLoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export function HeartbeatLoader({
  text = "Cargando...",
  size = "md"
}: HeartbeatLoaderProps) {
  const logoSizes = {
    sm: { width: 60, height: 60 },
    md: { width: 100, height: 100 },
    lg: { width: 140, height: 140 }
  };
  
  const selectedSize = logoSizes[size];
  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center space-y-8">
        {/* Logo con animación de pulsación de corazón */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1, 1.1, 1],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.1, 0.2, 0.3, 1]
          }}
          className="relative"
        >
          {/* Glow effect pulsante */}
          <motion.div
            className="absolute inset-0 blur-2xl bg-urovital-blue/20 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Logo principal */}
          <Image
            src="/images/logo/urovital-logo.png"
            alt="UroVital"
            width={selectedSize.width}
            height={selectedSize.height}
            className="relative z-10 dark:invert"
            priority
          />
        </motion.div>

        {/* LifeLine animation from react-loading-indicators */}
        <div className="flex flex-col items-center gap-4">
          <LifeLine 
            color="#0080FF"
            size={size === "sm" ? "small" : size === "md" ? "medium" : "large"}
            speedPlus={0}
          />
          
          {/* Texto de carga */}
          {text && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`${textSizes[size]} text-urovital-blue font-medium`}
            >
              {text}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}

// Full-screen version for page loading
export function HeartbeatLoaderFullScreen({ text }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <HeartbeatLoader text={text} size="lg" />
    </div>
  );
}

// Componente de carga simple (para usos más pequeños)
export function LoadingSpinner({ 
  size = "md", 
  className = "" 
}: { 
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <HeartbeatLoader text="" size={size} />
    </div>
  );
}

// Componente de carga en línea (para botones, etc.)
export function InlineLoader({ 
  size = "sm",
  color = "#0080FF"
}: {
  size?: "sm" | "md" | "lg";
  color?: string;
}) {
  return (
    <div className="inline-flex items-center">
      <LifeLine 
        color={color}
        size={size === "sm" ? "small" : size === "md" ? "medium" : "large"}
        speedPlus={0}
      />
    </div>
  );
}
