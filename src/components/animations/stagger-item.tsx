'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
}

export function StaggerItem({ 
  children, 
  className = ''
}: StaggerItemProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}
