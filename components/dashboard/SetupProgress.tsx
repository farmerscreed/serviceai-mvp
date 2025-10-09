'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SetupStep {
  id: string
  name: string
  description: string
  completed: boolean
  href: string
}

interface SetupProgressProps {
  organizationId: string
}

export default function SetupProgress({ organizationId }: SetupProgressProps) {
  const [steps, setSteps] = useState<SetupStep[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    loadSetupStatus()
  }, [organizationId])

  const loadSetupStatus = async () => {
    try {
      // Check various setup statuses
      let hasAssistant = false
      let hasCalendar = false
      let hasEmergency = false

      try {
        const assistantRes = await fetch('/api/assistants/stats')
        if (assistantRes.ok) {
          const assistantData = await assistantRes.json()
          hasAssistant = assistantData?.stats?.active > 0
        }
      } catch (error) {
        console.error('Error fetching assistants:', error)
      }

      try {
        const calendarRes = await fetch(`/api/calendar/status?organizationId=${organizationId}`)
        if (calendarRes.ok) {
          const calendarData = await calendarRes.json()
          hasCalendar = calendarData?.connected || false
        }
      } catch (error) {
        console.error('Error fetching calendar status:', error)
      }

      try {
        const emergencyRes = await fetch('/api/emergency-contacts')
        if (emergencyRes.ok) {
          const emergencyData = await emergencyRes.json()
          hasEmergency = (emergencyData?.contacts?.length || 0) > 0
        }
      } catch (error) {
        console.error('Error fetching emergency contacts:', error)
      }

      const setupSteps: SetupStep[] = [
        {
          id: 'assistant',
          name: 'Create AI Assistant',
          description: 'Set up your first AI phone assistant',
          completed: hasAssistant,
          href: '/assistants/create',
        },
        {
          id: 'calendar',
          name: 'Connect Calendar',
          description: 'Sync appointments with Google Calendar',
          completed: hasCalendar,
          href: '/settings/phone-calendar',
        },
        {
          id: 'emergency',
          name: 'Add Emergency Contact',
          description: 'Configure emergency escalation',
          completed: hasEmergency,
          href: '/settings/emergency',
        },
        {
          id: 'test',
          name: 'Make Test Call',
          description: 'Try calling your AI assistant',
          completed: false, // TODO: Track test calls
          href: '/settings/assistant',
        },
      ]

      setSteps(setupSteps)
      
      const completedCount = setupSteps.filter(s => s.completed).length
      setProgress((completedCount / setupSteps.length) * 100)
      
    } catch (error) {
      console.error('Error loading setup status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't show if 100% complete
  if (!loading && progress === 100) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/2 sm:w-1/3 mb-3 sm:mb-4"></div>
        <div className="h-2 bg-gray-200 rounded w-full mb-3 sm:mb-4"></div>
        <div className="space-y-2 sm:space-y-3">
          <div className="h-14 sm:h-16 bg-gray-100 rounded"></div>
          <div className="h-14 sm:h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-4 sm:p-6">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Complete Your Setup</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
            {Math.round(progress)}% complete • {steps.filter(s => !s.completed).length} steps remaining
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4 sm:mb-6">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2 sm:space-y-3">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={cn(
              'flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all group',
              step.completed
                ? 'bg-white border-green-200'
                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
            )}
          >
            <div className="flex-shrink-0">
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  'text-xs sm:text-sm font-medium',
                  step.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                )}>
                  {step.name}
                </h4>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
            </div>

            {!step.completed && (
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

