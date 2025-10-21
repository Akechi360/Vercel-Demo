'use client'

import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  from?: number
  to: number
  duration?: number
  suffix?: string
  className?: string
}

export function AnimatedCounter({ 
  from = 0, 
  to, 
  duration = 2,
  suffix = '',
  className = ''
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(from)
  const count = useMotionValue(from)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, to, { 
        duration,
        ease: 'easeOut',
        onUpdate: (latest) => {
          setDisplayValue(Math.round(latest))
        }
      })
      return controls.stop
    }
  }, [isInView, count, to, duration])

  return (
    <span ref={ref} className={className}>
      {displayValue}
      {suffix}
    </span>
  )
}
