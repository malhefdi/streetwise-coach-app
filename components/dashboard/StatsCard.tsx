'use client'

import { Card, CardContent } from '@/components/ui'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className,
}: StatsCardProps) {
  return (
    <Card variant="elevated" className={cn('p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend === 'up' && 'text-green-600',
                  trend === 'down' && 'text-red-600',
                  trend === 'neutral' && 'text-gray-600'
                )}
              >
                {trend === 'up' && '↑ '}
                {trend === 'down' && '↓ '}
                {trendValue}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-4xl ml-4 opacity-50">{icon}</div>
        )}
      </div>
    </Card>
  )
}
