'use client'

import { Loader2, Calendar, Phone, MessageSquare, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  )
}

interface LoadingCardProps {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export function LoadingCard({ title = 'Loading...', description, icon }: LoadingCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {icon || <LoadingSpinner size="lg" className="text-blue-600" />}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface LoadingListProps {
  count?: number
  showIcons?: boolean
}

export function LoadingList({ count = 3, showIcons = true }: LoadingListProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center gap-4">
            {showIcons && (
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
            )}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface LoadingTableProps {
  rows?: number
  columns?: number
}

export function LoadingTable({ rows = 5, columns = 4 }: LoadingTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="h-3 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'error' | 'success' | 'warning'
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  variant = 'default' 
}: EmptyStateProps) {
  const variantStyles = {
    default: {
      iconColor: 'text-gray-400',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    error: {
      iconColor: 'text-red-400',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    success: {
      iconColor: 'text-green-400',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    warning: {
      iconColor: 'text-yellow-400',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className={`${styles.bgColor} ${styles.borderColor} border rounded-xl p-12 text-center`}>
      <div className={`w-16 h-16 ${styles.iconColor} mx-auto mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Pre-built empty states for common scenarios
export function EmptyAppointments() {
  return (
    <EmptyState
      icon={<Calendar className="w-16 h-16" />}
      title="No appointments yet"
      description="Your scheduled appointments will appear here. Book your first appointment to get started."
      action={{
        label: 'Book Appointment',
        onClick: () => window.location.href = '/appointments/create'
      }}
    />
  )
}

export function EmptyCalls() {
  return (
    <EmptyState
      icon={<Phone className="w-16 h-16" />}
      title="No calls yet"
      description="Incoming and outgoing calls will be logged here once your AI assistant starts receiving calls."
    />
  )
}

export function EmptyMessages() {
  return (
    <EmptyState
      icon={<MessageSquare className="w-16 h-16" />}
      title="No messages yet"
      description="SMS conversations with customers will appear here once your assistant starts sending messages."
    />
  )
}

export function EmptyEmergencies() {
  return (
    <EmptyState
      icon={<AlertTriangle className="w-16 h-16" />}
      title="No emergencies detected"
      description="Emergency situations detected by your AI assistant will be highlighted here for quick response."
      variant="success"
    />
  )
}

export function EmptyActivity() {
  return (
    <EmptyState
      icon={<Clock className="w-16 h-16" />}
      title="No recent activity"
      description="Recent calls, appointments, and system events will appear here to keep you informed."
    />
  )
}

interface StatusIndicatorProps {
  status: 'loading' | 'success' | 'error' | 'warning' | 'pending'
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StatusIndicator({ status, label, size = 'md' }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const statusConfig = {
    loading: {
      icon: <LoadingSpinner size="sm" className="text-blue-600" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    success: {
      icon: <CheckCircle2 className={`${sizeClasses[size]} text-green-600`} />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200'
    },
    error: {
      icon: <AlertTriangle className={`${sizeClasses[size]} text-red-600`} />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    },
    warning: {
      icon: <AlertTriangle className={`${sizeClasses[size]} text-yellow-600`} />,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200'
    },
    pending: {
      icon: <Clock className={`${sizeClasses[size]} text-gray-600`} />,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200'
    }
  }

  const config = statusConfig[status]

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      {config.icon}
      {label && <span>{label}</span>}
    </div>
  )
}

interface LoadingButtonProps {
  loading: boolean
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingButton({ 
  loading, 
  children, 
  onClick, 
  disabled, 
  variant = 'primary',
  size = 'md',
  className = ''
}: LoadingButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  )
}
