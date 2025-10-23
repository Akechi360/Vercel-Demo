
'use client';

import type { LucideProps } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus, Users, Calendar, FlaskConical, Activity, CalendarDays } from 'lucide-react';
import { ElementType, memo } from 'react';

const icons: { [key: string]: ElementType } = {
    Users,
    Calendar,
    CalendarDays,
    FlaskConical,
    Activity,
};

interface StatCardProps {
  title: string;
  value: string | number;
  iconName: keyof typeof icons;
  subtext: string;
  trend: 'up' | 'down' | 'stale';
  index: number;
}

const trendConfig = {
  up: {
    icon: ArrowUpRight,
    color: 'text-success',
  },
  down: {
    icon: ArrowDownRight,
    color: 'text-destructive',
  },
  stale: {
    icon: Minus,
    color: 'text-muted-foreground',
  },
};

// ⚡ Memoized para evitar re-renders innecesarios
export const StatCard = memo(function StatCard({ title, value, iconName, subtext, trend, index }: StatCardProps) {
  const TrendIcon = trendConfig[trend].icon;
  const trendColor = trendConfig[trend].color;
  const Icon = icons[iconName];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.25, 0.4, 0.25, 1]
      }}
      whileHover={{ 
        y: -3,
        boxShadow: "0 8px 30px rgba(59, 130, 246, 0.08)",
        borderColor: "rgba(59, 130, 246, 0.2)",
        transition: { duration: 0.25, ease: "easeOut" }
      }}
      data-card="true"
      className={cn(
        "relative rounded-lg border border-border/50 bg-card p-6 shadow-sm overflow-hidden",
        "transition-all duration-300",
        "hover:border-primary/20",
        "cursor-default"
      )}
    >
      {/* Acento superior minimalista */}
      <div className="absolute top-0 left-0 w-16 h-px bg-primary/20" />
        <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: index * 0.08 + 0.15,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  className="text-3xl font-bold text-foreground"
                >
                  {value}
                </motion.p>
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: index * 0.08 + 0.15,
                type: "spring",
                stiffness: 200,
                damping: 12
              }}
              whileHover={{ 
                scale: 1.08,
                rotate: 5,
                transition: { duration: 0.2 }
              }}
              className="rounded-full bg-gradient-to-br from-primary/12 via-primary/8 to-accent/6 p-3 ring-1 ring-primary/10 transition-all duration-300 hover:ring-primary/20 hover:from-primary/15"
            >
              {Icon && <Icon className="h-5 w-5 text-primary" />}
            </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08 + 0.25 }}
          className="mt-4 flex items-center gap-2"
        >
          <TrendIcon className={cn("h-4 w-4", trendColor)} />
          <span className={cn("text-xs", trendColor)}>{subtext}</span>
        </motion.div>
    </motion.div>
  );
});
