'use client'

import Link from 'next/link'
import { Phone, Calendar, MessageSquare, BarChart3 } from 'lucide-react'

export default function QuickActions() {
  const actions = [
    {
      title: 'Test Call Your Assistant',
      description: 'Make a test call to verify everything works',
      icon: Phone,
      href: '/assistants',
      variant: 'primary' as const,
    },
    {
      title: 'Book Appointment',
      description: 'Manually schedule a new appointment',
      icon: Calendar,
      href: '/appointments/create',
      variant: 'secondary' as const,
    },
    {
      title: 'Send Test SMS',
      description: 'Test your SMS delivery system',
      icon: MessageSquare,
      href: '/sms/test',
      variant: 'secondary' as const,
    },
    {
      title: 'View Analytics',
      description: 'See detailed reports and insights',
      icon: BarChart3,
      href: '/activity',
      variant: 'secondary' as const,
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      {actions.map((action) => {
        const Icon = action.icon
        const isPrimary = action.variant === 'primary'
        
        return (
          <Link
            key={action.href}
            href={action.href}
            className={
              isPrimary
                ? 'group bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg p-4 sm:p-5 hover:shadow-xl transition-all'
                : 'group bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-md hover:border-blue-300 transition-all'
            }
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={
                isPrimary
                  ? 'w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0'
                  : 'w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors'
              }>
                <Icon className={
                  isPrimary
                    ? 'w-5 h-5 sm:w-6 sm:h-6 text-white'
                    : 'w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-blue-600 transition-colors'
                } />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={
                  isPrimary
                    ? 'text-sm sm:text-base font-semibold mb-0.5 sm:mb-1'
                    : 'text-sm sm:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1'
                }>
                  {action.title}
                </h4>
                <p className={
                  isPrimary
                    ? 'text-xs sm:text-sm text-white/80'
                    : 'text-xs sm:text-sm text-gray-600'
                }>
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

