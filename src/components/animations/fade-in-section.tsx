'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface FadeInSectionProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function FadeInSection({ 
  children, 
  delay = 0,
  className = ''
}: FadeInSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.4, 0.25, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
