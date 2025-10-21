'use client'

import { motion } from 'framer-motion'

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg border bg-card p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-10 bg-primary/10 rounded-full animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </motion.div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
            <div className="h-5 w-40 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted/50 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
