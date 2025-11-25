'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassmorphismCardProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
    variant?: 'blue' | 'purple' | 'cyan' | 'default';
    withBlobs?: boolean;
    withGradientLine?: boolean;
    hover?: boolean;
}

const variantStyles = {
    blue: {
        gradient: 'from-blue-600/10 via-transparent to-cyan-500/10',
        blob1: 'bg-blue-500/20',
        blob2: 'bg-cyan-500/20',
        gradientLine: 'from-blue-600 via-cyan-500 to-blue-600',
        shadow: 'hover:shadow-blue-500/20',
    },
    purple: {
        gradient: 'from-purple-600/10 via-transparent to-pink-500/10',
        blob1: 'bg-purple-500/20',
        blob2: 'bg-pink-500/20',
        gradientLine: 'from-purple-600 via-pink-500 to-purple-600',
        shadow: 'hover:shadow-purple-500/20',
    },
    cyan: {
        gradient: 'from-cyan-500/10 via-transparent to-blue-400/10',
        blob1: 'bg-cyan-500/20',
        blob2: 'bg-blue-400/20',
        gradientLine: 'from-cyan-500 via-blue-400 to-cyan-500',
        shadow: 'hover:shadow-cyan-500/20',
    },
    default: {
        gradient: 'from-white/5 via-transparent to-white/5',
        blob1: 'bg-white/10',
        blob2: 'bg-white/10',
        gradientLine: 'from-white/50 via-white/30 to-white/50',
        shadow: 'hover:shadow-white/10',
    },
};

export function GlassmorphismCard({
    children,
    className,
    variant = 'default',
    withBlobs = false,
    withGradientLine = false,
    hover = true,
    ...props
}: GlassmorphismCardProps) {
    const styles = variantStyles[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={hover ? { y: -4, transition: { duration: 0.3 } } : undefined}
            className="group relative"
            {...props}
        >
            <div
                className={cn(
                    'relative overflow-hidden rounded-3xl',
                    'bg-white/5 backdrop-blur-xl',
                    'border border-white/10',
                    'shadow-2xl',
                    'transition-all duration-500',
                    hover && styles.shadow,
                    hover && 'hover:border-white/20',
                    className
                )}
            >
                {/* Gradient Overlay */}
                <div
                    className={cn(
                        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                        styles.gradient
                    )}
                />

                {/* Animated Blobs */}
                {withBlobs && (
                    <>
                        <div
                            className={cn(
                                'absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700',
                                styles.blob1
                            )}
                        />
                        <div
                            className={cn(
                                'absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700',
                                styles.blob2
                            )}
                        />
                    </>
                )}

                {/* Content */}
                <div className="relative z-10">{children}</div>

                {/* Bottom Gradient Line */}
                {withGradientLine && (
                    <div
                        className={cn(
                            'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-50',
                            styles.gradientLine
                        )}
                    />
                )}
            </div>
        </motion.div>
    );
}
