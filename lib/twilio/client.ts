/**
 * Twilio SMS Client
 *
 * Handles SMS communication via Twilio for:
 * - Appointment confirmations and reminders
 * - Emergency alerts
 * - Status updates
 * - Two-way SMS communication
 *
 * Will be fully implemented in Task 3.1
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

export class TwilioClient {
  private accountSid: string
  private authToken: string
  private phoneNumber: string

  constructor() {
    this.accountSid = TWILIO_ACCOUNT_SID || ''
    this.authToken = TWILIO_AUTH_TOKEN || ''
    this.phoneNumber = TWILIO_PHONE_NUMBER || ''

    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      console.warn('Twilio credentials not fully set - SMS client will not work')
    }
  }

  async sendSMS(to: string, message: string) {
    // Stub - will implement in Task 3.1
    console.log('TwilioClient.sendSMS called (stub)', { to, message })
    throw new Error('Not implemented yet - see Task 3.1')
  }

  async sendMultilingualSMS(to: string, templateKey: string, language: string, data: any) {
    // Stub - will implement in Task 3.1
    console.log('TwilioClient.sendMultilingualSMS called (stub)', { to, templateKey, language, data })
    throw new Error('Not implemented yet - see Task 3.1')
  }
}

export const twilioClient = new TwilioClient()
