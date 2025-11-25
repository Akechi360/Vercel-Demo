'use client';

import { ReactNode } from 'react';

interface PageBackgroundProps {
    children: ReactNode;
    variant?: 'default' | 'blue' | 'purple';
}

export function PageBackground({ children, variant = 'default' }: PageBackgroundProps) {
    return (
        <div className="relative min-h-screen">
            {/* Gradient Mesh Background */}
            <div className="fixed inset-0 -z-10 gradient-mesh-hero" />
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />

            {/* Animated Blobs */}
            {variant === 'default' && (
                <>
                    <div className="fixed top-0 -left-4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob -z-10" />
                    <div className="fixed top-0 -right-4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 -z-10" />
                    <div className="fixed -bottom-8 left-20 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 -z-10" />
                </>
            )}

            {variant === 'blue' && (
                <>
                    <div className="fixed top-0 -left-4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob -z-10" />
                    <div className="fixed top-0 -right-4 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 -z-10" />
                    <div className="fixed -bottom-8 left-20 w-96 h-96 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 -z-10" />
                </>
            )}

            {variant === 'purple' && (
                <>
                    <div className="fixed top-0 -left-4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob -z-10" />
                    <div className="fixed top-0 -right-4 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 -z-10" />
                    <div className="fixed -bottom-8 left-20 w-96 h-96 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 -z-10" />
                </>
            )}

            {/* Content */}
            {children}
        </div>
    );
}
