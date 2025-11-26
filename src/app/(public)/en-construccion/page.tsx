'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function UnderConstructionPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">

            {/* Animated gradient mesh background */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
                <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none" />

            <div className="max-w-4xl w-full text-center space-y-12 relative z-10">

                {/* Main Illustration */}
                <div className="relative w-full max-w-3xl mx-auto">
                    <Image
                        src="/images/maintenance-medical.png"
                        alt="Mantenimiento Médico"
                        width={800}
                        height={600}
                        className="w-full h-auto object-contain drop-shadow-2xl"
                        priority
                    />
                </div>

                {/* ECG Animation */}
                <div className="w-full max-w-md mx-auto h-16 relative overflow-hidden">
                    <svg
                        viewBox="0 0 500 100"
                        className="w-full h-full text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0,50 L20,50 L30,20 L40,80 L50,50 L500,50"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            vectorEffect="non-scaling-stroke"
                            className="ecg-line"
                        />
                        <circle cx="0" cy="50" r="3" fill="currentColor" className="ecg-dot" />
                    </svg>
                </div>

                {/* Text Content */}
                <div className="space-y-6 px-4">
                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4">
                        Página en <br className="md:hidden" />
                        <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            Construcción
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed font-medium">
                        Esta sección está actualmente en <br className="hidden md:block" />
                        desarrollo. Estamos trabajando para <br className="hidden md:block" />
                        ofrecerte la mejor experiencia.
                    </p>
                </div>

                {/* Button */}
                <div className="pt-4">
                    <Button
                        asChild
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full shadow-[0_0_20px_rgba(37,99,253,0.3)] hover:shadow-[0_0_30px_rgba(37,99,253,0.5)] transition-all duration-300"
                    >
                        <Link href="/landing">
                            <Home className="mr-2 h-5 w-5" />
                            Volver al Inicio
                        </Link>
                    </Button>
                </div>
            </div>

            <style jsx>{`
        .ecg-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: dash 3s linear infinite;
        }
        
        .ecg-dot {
          animation: moveDot 3s linear infinite;
          opacity: 0;
        }

        @keyframes dash {
          0% {
            stroke-dashoffset: 1000;
          }
          20% {
             stroke-dashoffset: 1000;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes moveDot {
           0% {
            offset-distance: 0%;
            opacity: 0;
            transform: translateX(0);
          }
          20% {
             opacity: 1;
          }
          50% {
             transform: translateX(500px);
             opacity: 1;
          }
          55% {
             opacity: 0;
          }
          100% {
             opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}
