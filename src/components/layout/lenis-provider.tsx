'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      wheelMultiplier: 1,
      smoothTouch: false,
    })

    // Exponer Lenis globalmente para debugging
    if (typeof window !== 'undefined') {
      (window as any).lenis = lenis
    }

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      if (typeof window !== 'undefined') {
        delete (window as any).lenis
      }
    }
  }, [])

  return <>{children}</>
}
