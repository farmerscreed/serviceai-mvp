'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { LoadingList, EmptyAppointments, LoadingButton } from '@/components/ui/LoadingStates'
import { 
  ArrowLeft, 
  Calendar, 
  Plus,
  Search,
  Filter,
  Phone,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

interface Appointment {
  id: string
  customerName: string
  customerPhone: string
  serviceAddress: string
  appointmentType: string
  scheduledTime: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  notes?: string
}

// Appointments are now loaded from the database via API

export default function AppointmentsPage() {
  const { currentOrganization } = useOrganization()
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!currentOrganization) return
    loadAppointments()
  }, [filterStatus, currentOrganization])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const url = filterStatus === 'all' 
        ? '/api/appointments'
        : `/api/appointments?status=${filterStatus}`
      
      const response = await fetch(url, { credentials: 'same-origin' })
      if (response.status === 401) {
        // Not authenticated yet; skip silently and let a later retry load
        return
      }
      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }
      const result = await response.json()
      if (result.success) {
        setAppointments(result.appointments || [])
      } else {
        // API returned success:false; keep empty list but log for debugging
        console.warn('Appointments API warning:', result.error)
        setAppointments([])
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          apt.customerPhone.includes(searchQuery) ||
                          apt.serviceAddress.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 text-green-700 border-green-200'
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="w-4 h-4" />
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle2 className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewDetails = (appointmentId: string) => {
    router.push(`/appointments/${appointmentId}`)
  }

  const handleReschedule = (appointmentId: string) => {
    router.push(`/appointments/${appointmentId}/reschedule`)
  }

  const handleCancel = async (appointment: Appointment) => {
    const confirmed = await confirm({
      title: 'Cancel Appointment?',
      message: `Are you sure you want to cancel the appointment with ${appointment.customerName} on ${formatDate(appointment.scheduledTime)}?`,
      confirmText: 'Yes, Cancel',
      variant: 'warning',
    })

    if (!confirmed) return

    setActionLoading(appointment.id)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })

      if (response.ok) {
        toast.success('Appointment cancelled successfully')
        await loadAppointments()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to cancel appointment')
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error('Error cancelling appointment')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkComplete = async (appointment: Appointment) => {
    const confirmed = await confirm({
      title: 'Mark as Complete?',
      message: `Mark the appointment with ${appointment.customerName} as completed?`,
      confirmText: 'Yes, Complete',
      variant: 'info',
    })

    if (!confirmed) return

    setActionLoading(appointment.id)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })

      if (response.ok) {
        toast.success('Appointment marked as completed')
        await loadAppointments()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update appointment')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Error updating appointment')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
              <p className="text-gray-600">{currentOrganization?.organization_name}</p>
            </div>
          </div>
          <Link
            href="/appointments/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

               {/* Appointments List */}
               <div className="space-y-4">
                 {loading ? (
                   <LoadingList count={3} showIcons={true} />
                 ) : filteredAppointments.length === 0 ? (
                   <EmptyAppointments />
                 ) : (
            filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{apt.customerName}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {apt.customerPhone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(apt.scheduledTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getStatusColor(apt.status)}`}>
                    {getStatusIcon(apt.status)}
                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{apt.serviceAddress}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">{apt.appointmentType}</span>
                  </div>
                </div>

                {apt.notes && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                    <span className="font-medium">Notes:</span> {apt.notes}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleViewDetails(apt.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  
                  {apt.status === 'pending' && (
                    <button
                      onClick={() => handleReschedule(apt.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Reschedule
                    </button>
                  )}
                  
                         {apt.status === 'confirmed' && (
                           <LoadingButton
                             loading={actionLoading === apt.id}
                             onClick={() => handleMarkComplete(apt)}
                             variant="primary"
                             size="sm"
                             className="text-green-600 hover:bg-green-50"
                           >
                             <CheckCircle2 className="w-4 h-4" />
                             Complete
                           </LoadingButton>
                         )}
                  
                         {(apt.status === 'pending' || apt.status === 'confirmed') && (
                           <LoadingButton
                             loading={actionLoading === apt.id}
                             onClick={() => handleCancel(apt)}
                             variant="danger"
                             size="sm"
                             className="text-red-600 hover:bg-red-50"
                           >
                             <XCircle className="w-4 h-4" />
                             Cancel
                           </LoadingButton>
                         )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

