'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
}

export function AnimatedButton({ 
  children, 
  className = '',
  onClick,
  variant = 'primary'
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative overflow-hidden
        transition-all duration-300
        ${className}
      `}
    >
      <motion.span
        className="relative z-10"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
      
      {/* Efecto de brillo sutil */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  )
}
