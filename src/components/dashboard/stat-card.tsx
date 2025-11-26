
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus, Users, Calendar, FlaskConical, Activity, CalendarDays, Handshake, FileText } from 'lucide-react';
import { ElementType, memo } from 'react';

const icons: { [key: string]: ElementType } = {
  Users,
  Calendar,
  CalendarDays,
  FlaskConical,
  Activity,
  Handshake,
  FileText
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
    color: 'text-[#1cc88a]', // Medicare Success Green
    bgColor: 'bg-[#1cc88a]/10',
  },
  down: {
    icon: ArrowDownRight,
    color: 'text-[#e74a3b]', // Medicare Danger Red
    bgColor: 'bg-[#e74a3b]/10',
  },
  stale: {
    icon: Minus,
    color: 'text-[#858796]', // Medicare Secondary Text
    bgColor: 'bg-[#858796]/10',
  },
};

// Medicare-specific color mapping for icons based on card type/index
const iconColorMap = [
  { bg: 'bg-[#4e73df]', shadow: 'shadow-blue-500/30' }, // Blue (Primary)
  { bg: 'bg-[#1cc88a]', shadow: 'shadow-green-500/30' }, // Green (Success)
  { bg: 'bg-[#36b9cc]', shadow: 'shadow-cyan-500/30' }, // Cyan (Info)
  { bg: 'bg-[#f6c23e]', shadow: 'shadow-yellow-500/30' }, // Yellow (Warning)
];

export const StatCard = memo(function StatCard({ title, value, iconName, subtext, trend, index }: StatCardProps) {
  const TrendIcon = trendConfig[trend].icon;
  const trendColor = trendConfig[trend].color;
  const trendBg = trendConfig[trend].bgColor;
  const Icon = icons[iconName];

  // Cycle through colors based on index
  const iconStyle = iconColorMap[index % iconColorMap.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{
        y: -5,
        transition: { duration: 0.2 }
      }}
      className={cn(
        "relative overflow-hidden rounded-xl bg-[#2a2d3e] p-0 shadow-lg transition-all duration-300",
        "border-l-4",
        index % 4 === 0 ? "border-l-[#4e73df]" :
          index % 4 === 1 ? "border-l-[#1cc88a]" :
            index % 4 === 2 ? "border-l-[#36b9cc]" :
              "border-l-[#f6c23e]"
      )}
    >
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[#858796] mb-1">
              {title}
            </div>
            <div className="text-2xl font-bold text-white">
              {value}
            </div>
          </div>

          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg",
            iconStyle.bg,
            iconStyle.shadow
          )}>
            {Icon && <Icon className="h-6 w-6" />}
          </div>
        </div>

        <div className="mt-4 flex items-center text-xs">
          <span className={cn("flex items-center font-bold mr-2", trendColor)}>
            <TrendIcon className="mr-1 h-3 w-3" />
            {trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '0%'}
          </span>
          <span className="text-[#858796]">{subtext}</span>
        </div>
      </div>
    </motion.div>
  );
});
