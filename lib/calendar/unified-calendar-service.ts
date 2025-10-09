import { GoogleCalendarService } from './google-calendar-service'
import { createServerClient } from '@/lib/supabase/server'

export interface AppointmentData {
  id: string
  customer_name: string
  customer_email?: string
  appointment_type: string
  service_description?: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  language_preference: string
}

export class UnifiedCalendarService {
  private googleService = new GoogleCalendarService()

  /**
   * Create appointment in calendar (if calendar sync is enabled)
   */
  async createAppointment(
    organizationId: string,
    appointment: AppointmentData
  ): Promise<{ eventId: string | null; provider: string }> {
    try {
      const supabase = await createServerClient()
      const { data: org } = await supabase
        .from('organizations')
        .select('calendar_provider, calendar_sync_enabled')
        .eq('id', organizationId)
        .single()

      if (!org?.calendar_sync_enabled) {
        console.log('📅 Calendar sync not enabled for organization')
        return { eventId: null, provider: 'none' }
      }

      // Combine date and time for event
      const startDateTime = this.combineDateAndTime(
        appointment.scheduled_date,
        appointment.scheduled_time
      )
      
      const endDateTime = this.addMinutes(startDateTime, appointment.duration_minutes)

      let eventId: string | null = null

      switch (org.calendar_provider) {
        case 'google':
          eventId = await this.googleService.createEvent(organizationId, {
            summary: `${appointment.appointment_type} - ${appointment.customer_name}`,
            description: appointment.service_description || `Appointment for ${appointment.customer_name}`,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            attendeeEmail: appointment.customer_email,
            timeZone: 'America/New_York' // TODO: Make configurable
          })
          break

        // TODO: Add Outlook and Calendly support
        case 'outlook':
          console.log('⚠️ Outlook integration not yet implemented')
          break

        case 'calendly':
          console.log('⚠️ Calendly integration not yet implemented')
          break

        default:
          console.log(`⚠️ Unsupported calendar provider: ${org.calendar_provider}`)
      }

      return {
        eventId,
        provider: org.calendar_provider
      }

    } catch (error: any) {
      console.error('❌ Error creating calendar appointment:', error)
      // Don't fail the whole appointment creation if calendar fails
      return { eventId: null, provider: 'error' }
    }
  }

  /**
   * Update appointment in calendar
   */
  async updateAppointment(
    organizationId: string,
    eventId: string,
    provider: string,
    updates: Partial<AppointmentData>
  ): Promise<void> {
    try {
      if (!eventId || provider === 'none') {
        return
      }

      const calendarUpdates: any = {}

      if (updates.customer_name || updates.appointment_type) {
        calendarUpdates.summary = `${updates.appointment_type || 'Appointment'} - ${updates.customer_name || 'Customer'}`
      }

      if (updates.service_description) {
        calendarUpdates.description = updates.service_description
      }

      if (updates.scheduled_date && updates.scheduled_time) {
        const startDateTime = this.combineDateAndTime(
          updates.scheduled_date,
          updates.scheduled_time
        )
        const endDateTime = this.addMinutes(
          startDateTime,
          updates.duration_minutes || 60
        )

        calendarUpdates.startDateTime = startDateTime.toISOString()
        calendarUpdates.endDateTime = endDateTime.toISOString()
      }

      if (updates.customer_email) {
        calendarUpdates.attendeeEmail = updates.customer_email
      }

      switch (provider) {
        case 'google':
          await this.googleService.updateEvent(organizationId, eventId, calendarUpdates)
          break

        // TODO: Add other providers
        default:
          console.log(`⚠️ Update not supported for provider: ${provider}`)
      }

    } catch (error: any) {
      console.error('❌ Error updating calendar appointment:', error)
      // Don't fail the appointment update if calendar fails
    }
  }

  /**
   * Delete appointment from calendar
   */
  async deleteAppointment(
    organizationId: string,
    eventId: string,
    provider: string
  ): Promise<void> {
    try {
      if (!eventId || provider === 'none') {
        return
      }

      switch (provider) {
        case 'google':
          await this.googleService.deleteEvent(organizationId, eventId)
          break

        // TODO: Add other providers
        default:
          console.log(`⚠️ Delete not supported for provider: ${provider}`)
      }

    } catch (error: any) {
      console.error('❌ Error deleting calendar appointment:', error)
      // Don't fail if calendar deletion fails
    }
  }

  /**
   * Check availability for a date
   */
  async checkAvailability(
    organizationId: string,
    date: string,
    duration: number = 60
  ): Promise<{ start_time: string; end_time: string; is_available: boolean }[]> {
    try {
      const supabase = await createServerClient()
      const { data: org } = await supabase
        .from('organizations')
        .select('calendar_provider, calendar_sync_enabled')
        .eq('id', organizationId)
        .single()

      if (!org?.calendar_sync_enabled) {
        // Fall back to database-only availability
        return this.checkDatabaseAvailability(organizationId, date, duration)
      }

      switch (org.calendar_provider) {
        case 'google':
          try {
            return await this.googleService.checkAvailability(organizationId, date, duration)
          } catch (error) {
            console.log('⚠️ Google Calendar availability check failed, falling back to database')
            return this.checkDatabaseAvailability(organizationId, date, duration)
          }

        // TODO: Add other providers
        default:
          return this.checkDatabaseAvailability(organizationId, date, duration)
      }

    } catch (error: any) {
      console.error('❌ Error checking availability:', error)
      // Fall back to database availability
      return this.checkDatabaseAvailability(organizationId, date, duration)
    }
  }

  /**
   * Check availability using database only (fallback method)
   */
  private async checkDatabaseAvailability(
    organizationId: string,
    date: string,
    duration: number
  ): Promise<{ start_time: string; end_time: string; is_available: boolean }[]> {
    try {
      const supabase = await createServerClient()
      const { data: slots, error } = await supabase
        .rpc('get_available_time_slots', {
          org_id: organizationId,
          target_date: date,
          slot_duration: duration
        })

      if (error) {
        throw error
      }

      return slots || []

    } catch (error: any) {
      console.error('❌ Database availability check error:', error)
      return []
    }
  }

  /**
   * Helper: Combine date and time strings into Date object
   */
  private combineDateAndTime(date: string, time: string): Date {
    return new Date(`${date}T${time}`)
  }

  /**
   * Helper: Add minutes to a date
   */
  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000)
  }
}

