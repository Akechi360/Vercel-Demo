'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
}

export function AnimatedCard({ 
  children, 
  className = ''
}: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      className={`
        transition-shadow duration-300
        hover:shadow-2xl hover:shadow-primary/10
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}
