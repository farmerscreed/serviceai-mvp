'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useToast } from '@/components/ui/Toast'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Save,
  X
} from 'lucide-react'

interface Appointment {
  id: string
  customer_name: string
  appointment_type: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  status: string
}

export default function RescheduleAppointmentPage({ params }: { params: { id: string } }) {
  const { currentOrganization } = useOrganization()
  const router = useRouter()
  const toast = useToast()

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    reason: '',
  })

  useEffect(() => {
    if (params.id) {
      loadAppointment()
    }
  }, [params.id])

  const loadAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${params.id}`, { credentials: 'same-origin' })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const apt = result.appointment
          setAppointment(apt)
          setFormData({
            scheduledDate: apt.scheduled_date,
            scheduledTime: apt.scheduled_time,
            reason: '',
          })
        } else {
          toast.error(result.error || 'Failed to load appointment')
          router.push('/appointments')
        }
      } else {
        toast.error('Failed to load appointment')
        router.push('/appointments')
      }
    } catch (error) {
      console.error('Error loading appointment:', error)
      toast.error('Error loading appointment')
      router.push('/appointments')
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  const validateForm = () => {
    if (!formData.scheduledDate) {
      toast.warning('Please select a new date')
      return false
    }
    if (!formData.scheduledTime) {
      toast.warning('Please select a new time')
      return false
    }
    if (!formData.reason.trim()) {
      toast.warning('Please provide a reason for rescheduling')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)
    try {
      const response = await fetch(`/api/appointments/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_date: formData.scheduledDate,
          scheduled_time: formData.scheduledTime,
          reschedule_reason: formData.reason,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Appointment rescheduled successfully!')
        router.push(`/appointments/${params.id}`)
      } else {
        toast.error(result.error || 'Failed to reschedule appointment')
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      toast.error('Error rescheduling appointment')
    } finally {
      setSaving(false)
    }
  }

  const formatDateTime = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`)
    return dateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointment not found</h3>
          <p className="text-gray-600 mb-4">The appointment you're trying to reschedule doesn't exist.</p>
          <Link
            href="/appointments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Appointments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={`/appointments/${params.id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Appointment
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reschedule Appointment</h1>
            <p className="text-gray-600">{appointment.customer_name} - {appointment.appointment_type}</p>
          </div>
        </div>

        {/* Current Appointment Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Appointment</h2>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">
                {formatDateTime(appointment.scheduled_date, appointment.scheduled_time)}
              </p>
              <p className="text-sm text-gray-600">{appointment.duration_minutes} minutes</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Date & Time */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Date & Time</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Time *
                </label>
                <select
                  required
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.scheduledDate && formData.scheduledTime && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">New appointment time:</span>{' '}
                  {formatDateTime(formData.scheduledDate, formData.scheduledTime)}
                </p>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reason for Rescheduling</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please explain why this appointment needs to be rescheduled *
              </label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Customer requested different time, scheduling conflict, etc."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/appointments/${params.id}`}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Rescheduling...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Reschedule Appointment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
