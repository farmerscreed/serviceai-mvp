'use client'

import { forwardRef, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  rounded?: boolean
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      icon,
      iconPosition = 'left',
      rounded = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center gap-1.5 font-medium transition-colors'

    const variantStyles = {
      default: 'bg-gray-100 text-gray-800 border border-gray-200',
      primary: 'bg-blue-100 text-blue-800 border border-blue-200',
      success: 'bg-green-100 text-green-800 border border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      danger: 'bg-red-100 text-red-800 border border-red-200',
      info: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      outline: 'bg-transparent text-gray-700 border-2 border-gray-300',
    }

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    }

    const iconSizeMap = {
      sm: 'w-3 h-3',
      md: 'w-3.5 h-3.5',
      lg: 'w-4 h-4',
    }

    const roundedStyles = rounded ? 'rounded-full' : 'rounded-md'

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          roundedStyles,
          className
        )}
        {...props}
      >
        {icon && iconPosition === 'left' && (
          <span className={iconSizeMap[size]}>{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className={iconSizeMap[size]}>{icon}</span>
        )}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Pre-built status badges
export function StatusBadge({ 
  status, 
  ...props 
}: { 
  status: 'active' | 'pending' | 'completed' | 'cancelled' | 'failed' 
} & Omit<BadgeProps, 'variant'>) {
  const variantMap = {
    active: 'success' as const,
    pending: 'warning' as const,
    completed: 'primary' as const,
    cancelled: 'default' as const,
    failed: 'danger' as const,
  }

  const labelMap = {
    active: 'Active',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    failed: 'Failed',
  }

  return (
    <Badge variant={variantMap[status]} {...props}>
      {labelMap[status]}
    </Badge>
  )
}

export { Badge }
export default Badge

