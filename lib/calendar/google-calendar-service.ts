import { google } from 'googleapis'
import { createServerClient } from '@/lib/supabase/server'

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  startDateTime: string
  endDateTime: string
  attendeeEmail?: string
}

export class GoogleCalendarService {
  private oauth2Client: any

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`
    )
  }

  /**
   * Get OAuth authorization URL for user to grant calendar access
   */
  getAuthUrl(organizationId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      prompt: 'consent',
      state: organizationId // Pass org ID through OAuth flow
    })
  }

  /**
   * Handle OAuth callback and store refresh token
   */
  async handleCallback(code: string, organizationId: string): Promise<void> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code)
      
      if (!tokens.refresh_token) {
        throw new Error('No refresh token received from Google')
      }

      // Store refresh token in database
      const supabase = await createServerClient()
      const { error } = await supabase
        .from('organizations')
        .update({
          calendar_provider: 'google',
          google_refresh_token: tokens.refresh_token,
          calendar_sync_enabled: true,
          google_calendar_id: 'primary',
          calendar_metadata: {
            access_token_expires_at: tokens.expiry_date,
            scope: tokens.scope,
            token_type: tokens.token_type
          }
        })
        .eq('id', organizationId)

      if (error) {
        throw new Error(`Failed to store Google Calendar credentials: ${error.message}`)
      }

      console.log('✅ Google Calendar connected for organization:', organizationId)
    } catch (error: any) {
      console.error('❌ Google Calendar callback error:', error)
      throw error
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    organizationId: string,
    eventData: {
      summary: string
      description?: string
      startDateTime: string
      endDateTime: string
      attendeeEmail?: string
      timeZone?: string
    }
  ): Promise<string> {
    try {
      // Get organization's refresh token
      const supabase = await createServerClient()
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('google_refresh_token, google_calendar_id')
        .eq('id', organizationId)
        .single()

      if (orgError || !org?.google_refresh_token) {
        throw new Error('Google Calendar not connected for this organization')
      }

      // Set credentials
      this.oauth2Client.setCredentials({
        refresh_token: org.google_refresh_token
      })

      // Create calendar client
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      // Prepare event
      const event: any = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.startDateTime,
          timeZone: eventData.timeZone || 'America/New_York'
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: eventData.timeZone || 'America/New_York'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'sms', minutes: 24 * 60 }, // 24 hours
            { method: 'sms', minutes: 120 }      // 2 hours
          ]
        }
      }

      // Add attendee if provided
      if (eventData.attendeeEmail) {
        event.attendees = [
          { email: eventData.attendeeEmail }
        ]
      }

      // Create event
      const response = await calendar.events.insert({
        calendarId: org.google_calendar_id || 'primary',
        requestBody: event,
        sendUpdates: 'all' // Send email notifications to attendees
      })

      console.log('✅ Google Calendar event created:', response.data.id)
      return response.data.id!

    } catch (error: any) {
      console.error('❌ Error creating Google Calendar event:', error)
      throw new Error(`Failed to create calendar event: ${error.message}`)
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    organizationId: string,
    eventId: string,
    updates: Partial<{
      summary: string
      description: string
      startDateTime: string
      endDateTime: string
      attendeeEmail: string
      timeZone: string
    }>
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('google_refresh_token, google_calendar_id')
        .eq('id', organizationId)
        .single()

      if (orgError || !org?.google_refresh_token) {
        throw new Error('Google Calendar not connected')
      }

      this.oauth2Client.setCredentials({
        refresh_token: org.google_refresh_token
      })

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      const event: any = {}
      if (updates.summary) event.summary = updates.summary
      if (updates.description) event.description = updates.description
      if (updates.startDateTime) {
        event.start = {
          dateTime: updates.startDateTime,
          timeZone: updates.timeZone || 'America/New_York'
        }
      }
      if (updates.endDateTime) {
        event.end = {
          dateTime: updates.endDateTime,
          timeZone: updates.timeZone || 'America/New_York'
        }
      }

      await calendar.events.patch({
        calendarId: org.google_calendar_id || 'primary',
        eventId: eventId,
        requestBody: event,
        sendUpdates: 'all'
      })

      console.log('✅ Google Calendar event updated:', eventId)

    } catch (error: any) {
      console.error('❌ Error updating Google Calendar event:', error)
      throw new Error(`Failed to update calendar event: ${error.message}`)
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(organizationId: string, eventId: string): Promise<void> {
    try {
      const supabase = await createServerClient()
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('google_refresh_token, google_calendar_id')
        .eq('id', organizationId)
        .single()

      if (orgError || !org?.google_refresh_token) {
        throw new Error('Google Calendar not connected')
      }

      this.oauth2Client.setCredentials({
        refresh_token: org.google_refresh_token
      })

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      await calendar.events.delete({
        calendarId: org.google_calendar_id || 'primary',
        eventId: eventId,
        sendUpdates: 'all'
      })

      console.log('✅ Google Calendar event deleted:', eventId)

    } catch (error: any) {
      console.error('❌ Error deleting Google Calendar event:', error)
      throw new Error(`Failed to delete calendar event: ${error.message}`)
    }
  }

  /**
   * Check availability for a specific date and time
   */
  async checkAvailability(
    organizationId: string,
    date: string,
    durationMinutes: number = 60
  ): Promise<{ start_time: string; end_time: string; is_available: boolean }[]> {
    try {
      const supabase = await createServerClient()
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('google_refresh_token, google_calendar_id')
        .eq('id', organizationId)
        .single()

      if (orgError || !org?.google_refresh_token) {
        throw new Error('Google Calendar not connected')
      }

      this.oauth2Client.setCredentials({
        refresh_token: org.google_refresh_token
      })

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      // Get events for the specified date
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const response = await calendar.events.list({
        calendarId: org.google_calendar_id || 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      })

      const busySlots = response.data.items?.map(event => ({
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date
      })) || []

      // Generate time slots (8 AM to 6 PM)
      const slots: { start_time: string; end_time: string; is_available: boolean }[] = []
      const businessStart = 8 // 8 AM
      const businessEnd = 18 // 6 PM

      for (let hour = businessStart; hour < businessEnd; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`
        const endHour = hour + Math.floor(durationMinutes / 60)
        const endMinute = durationMinutes % 60
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`

        // Check if this slot conflicts with any busy slots
        const slotStart = new Date(`${date}T${startTime}`)
        const slotEnd = new Date(`${date}T${endTime}`)

        const isAvailable = !busySlots.some(busy => {
          const busyStart = new Date(busy.start!)
          const busyEnd = new Date(busy.end!)
          return (slotStart < busyEnd && slotEnd > busyStart)
        })

        slots.push({
          start_time: startTime,
          end_time: endTime,
          is_available: isAvailable
        })
      }

      return slots

    } catch (error: any) {
      console.error('❌ Error checking Google Calendar availability:', error)
      // Fall back to database-only availability
      throw error
    }
  }
}

