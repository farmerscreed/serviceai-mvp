'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  MapPin,
  Clock,
  FileText,
  Globe,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  History
} from 'lucide-react'

interface Appointment {
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  service_address?: string
  appointment_type: string
  service_description?: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  language_preference: string
  notes?: string
  created_at: string
  updated_at: string
  confirmed_at?: string
  cancelled_at?: string
  completed_at?: string
  vapi_call_id?: string
  google_calendar_event_id?: string
  outlook_calendar_event_id?: string
  calendar_provider?: string
  sms_sent: boolean
  sms_reminder_sent: boolean
  emergency_detected: boolean
  urgency_score?: number
}

interface SMSLog {
  id: string
  phone_number: string
  message_type: string
  message_content: string
  status: string
  created_at: string
  delivered_at?: string
}

export default function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const { currentOrganization } = useOrganization()
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      loadAppointment()
      loadSMSLogs()
    }
  }, [params.id])

  const loadAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${params.id}`, { credentials: 'same-origin' })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAppointment(result.appointment)
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

  const loadSMSLogs = async () => {
    try {
      const response = await fetch(`/api/appointments/${params.id}/sms`, { credentials: 'same-origin' })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSmsLogs(result.smsLogs || [])
        }
      }
    } catch (error) {
      console.error('Error loading SMS logs:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 text-green-700 border-green-200'
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
      case 'no_show': return 'bg-gray-50 text-gray-700 border-gray-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="w-4 h-4" />
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle2 className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      case 'no_show': return <XCircle className="w-4 h-4" />
      default: return null
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  const handleStatusChange = async (newStatus: string) => {
    const statusMessages = {
      confirmed: 'confirm',
      cancelled: 'cancel',
      completed: 'mark as completed',
      no_show: 'mark as no-show'
    }

    const confirmed = await confirm({
      title: `${statusMessages[newStatus as keyof typeof statusMessages]}?`,
      message: `Are you sure you want to ${statusMessages[newStatus as keyof typeof statusMessages]} this appointment?`,
      confirmText: 'Yes',
      variant: newStatus === 'cancelled' ? 'warning' : 'info',
    })

    if (!confirmed) return

    setActionLoading(newStatus)
    try {
      const response = await fetch(`/api/appointments/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(`Appointment ${statusMessages[newStatus as keyof typeof statusMessages]} successfully`)
        await loadAppointment()
      } else {
        toast.error(result.error || 'Failed to update appointment')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Error updating appointment')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReschedule = () => {
    router.push(`/appointments/${params.id}/reschedule`)
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
          <p className="text-gray-600 mb-4">The appointment you're looking for doesn't exist or has been deleted.</p>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/appointments"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Appointments
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{appointment.customer_name}</h1>
              <p className="text-gray-600">{appointment.appointment_type}</p>
              <p className="text-sm text-gray-500">{formatDateTime(appointment.scheduled_date, appointment.scheduled_time)}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${getStatusColor(appointment.status)}`}>
            {getStatusIcon(appointment.status)}
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' ')}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{appointment.customer_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{appointment.customer_phone}</p>
                  </div>
                </div>
                
                {appointment.customer_email && (
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{appointment.customer_email}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Language</p>
                    <p className="font-medium text-gray-900">
                      {appointment.language_preference === 'es' ? 'Spanish' : 'English'}
                    </p>
                  </div>
                </div>
              </div>
              
              {appointment.service_address && (
                <div className="mt-4 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Service Address</p>
                    <p className="font-medium text-gray-900">{appointment.service_address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Appointment Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Appointment Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Service Type</p>
                    <p className="font-medium text-gray-900">{appointment.appointment_type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">{appointment.duration_minutes} minutes</p>
                  </div>
                </div>
              </div>
              
              {appointment.service_description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Service Description</p>
                  <p className="text-gray-900">{appointment.service_description}</p>
                </div>
              )}
              
              {appointment.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-900">{appointment.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* SMS Communication */}
            {smsLogs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  SMS Communication
                </h2>
                
                <div className="space-y-3">
                  {smsLogs.map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{log.message_type}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            log.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{formatRelativeTime(log.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{log.message_content}</p>
                      {log.delivered_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Delivered: {formatRelativeTime(log.delivered_at)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                {appointment.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange('confirmed')}
                    disabled={actionLoading === 'confirmed'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {actionLoading === 'confirmed' ? 'Confirming...' : 'Confirm Appointment'}
                  </button>
                )}
                
                {appointment.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusChange('completed')}
                    disabled={actionLoading === 'completed'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {actionLoading === 'completed' ? 'Updating...' : 'Mark as Complete'}
                  </button>
                )}
                
                {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                  <>
                    <button
                      onClick={handleReschedule}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Reschedule
                    </button>
                    
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={actionLoading === 'cancelled'}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      {actionLoading === 'cancelled' ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </>
                )}
                
                {appointment.status === 'completed' && (
                  <button
                    onClick={() => handleStatusChange('no_show')}
                    disabled={actionLoading === 'no_show'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {actionLoading === 'no_show' ? 'Updating...' : 'Mark as No-Show'}
                  </button>
                )}
              </div>
            </div>

            {/* Appointment Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                Timeline
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Appointment Created</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(appointment.created_at)}</p>
                  </div>
                </div>
                
                {appointment.confirmed_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Appointment Confirmed</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(appointment.confirmed_at)}</p>
                    </div>
                  </div>
                )}
                
                {appointment.cancelled_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Appointment Cancelled</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(appointment.cancelled_at)}</p>
                    </div>
                  </div>
                )}
                
                {appointment.completed_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Appointment Completed</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(appointment.completed_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Integration Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SMS Confirmation</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    appointment.sms_sent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.sms_sent ? 'Sent' : 'Not Sent'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SMS Reminder</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    appointment.sms_reminder_sent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.sms_reminder_sent ? 'Sent' : 'Not Sent'}
                  </span>
                </div>
                
                {appointment.calendar_provider && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Calendar Sync</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {appointment.calendar_provider}
                    </span>
                  </div>
                )}
                
                {appointment.emergency_detected && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Emergency Detected</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      Yes
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
