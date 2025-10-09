"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { toast } from 'sonner'

export function NotificationTest() {
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  const testServices = async () => {
    setTesting(true)
    try {
      // Test email service directly
      const emailResponse = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test Email - Hope Hall',
          html: '<p>This is a test email from Hope Hall notification service.</p>'
        })
      })

      const emailWorking = emailResponse.ok
      const emailError = emailResponse.ok ? null : await emailResponse.text()

      // Test SMS service directly
      const smsResponse = await fetch('/api/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: '+15551234567', // Valid US phone number format for testing
          body: 'Test SMS from Hope Hall notification service.'
        })
      })

      const smsWorking = smsResponse.ok
      const smsError = smsResponse.ok ? null : await smsResponse.text()

      const results = {
        emailWorking,
        smsWorking,
        errors: [
          ...(emailError ? [`Email: ${emailError}`] : []),
          ...(smsError ? [`SMS: ${smsError}`] : [])
        ]
      }

      setTestResults(results)
      
      if (results.emailWorking && results.smsWorking) {
        toast.success('All notification services working!')
      } else if (results.emailWorking) {
        toast.success('Email service working! SMS needs configuration.')
      } else {
        toast.error('Notification services need configuration.')
      }
    } catch (error) {
      console.error('Test failed:', error)
      toast.error('Test failed. Check console for details.')
    } finally {
      setTesting(false)
    }
  }

  const testBookingConfirmation = async () => {
    setTesting(true)
    try {
      // Test booking confirmation email
      const emailResponse = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test Booking Confirmation - Hope Hall',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Booking Confirmation - Hope Hall</h2>
              <p>Dear Test User,</p>
              <p>Your booking for <strong>Test Wedding</strong> has been confirmed!</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Event Details</h3>
                <p><strong>Event:</strong> Test Wedding</p>
                <p><strong>Date:</strong> 2025-08-15</p>
                <p><strong>Venue Fee:</strong> $3,000</p>
                <p><strong>Deposit Required:</strong> $1,500</p>
              </div>
              
              <p>We're excited to host your event! Please complete your deposit payment to secure your booking.</p>
              
              <p>Best regards,<br>The Hope Hall Team</p>
            </div>
          `
        })
      })

      const emailSent = emailResponse.ok
      const emailError = emailResponse.ok ? null : await emailResponse.text()

      // Test booking confirmation SMS
      const smsResponse = await fetch('/api/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: '+15551234567', // Valid US phone number format for testing
          body: 'Hi Test User! Your booking for Test Wedding on 2025-08-15 has been confirmed! We\'re excited to host your event. Please check your email for payment details. - Hope Hall Team'
        })
      })

      const smsSent = smsResponse.ok
      const smsError = smsResponse.ok ? null : await smsResponse.text()

      const results = {
        emailSent,
        smsSent,
        errors: [
          ...(emailError ? [`Email: ${emailError}`] : []),
          ...(smsError ? [`SMS: ${smsError}`] : [])
        ]
      }

      if (results.emailSent || results.smsSent) {
        toast.success('Test notification sent!')
      } else {
        toast.error('Test notification failed.')
      }
      
      setTestResults(results)
    } catch (error) {
      console.error('Test failed:', error)
      toast.error('Test failed. Check console for details.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Notification Service Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testServices} 
            disabled={testing}
            variant="outline"
          >
            {testing ? 'Testing...' : 'Test Services'}
          </Button>
          
          <Button 
            onClick={testBookingConfirmation} 
            disabled={testing}
            variant="outline"
          >
            {testing ? 'Sending...' : 'Test Booking Confirmation'}
          </Button>
        </div>

        {testResults && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300">Test Results:</h4>
            <div className="text-xs space-y-1">
              <div className="flex gap-2">
                <span className="text-slate-400">Email:</span>
                <span className={testResults.emailWorking ? 'text-green-400' : 'text-red-400'}>
                  {testResults.emailWorking ? '✅ Working' : '❌ Failed'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400">SMS:</span>
                <span className={testResults.smsWorking ? 'text-green-400' : 'text-red-400'}>
                  {testResults.smsWorking ? '✅ Working' : '❌ Failed'}
                </span>
              </div>
              {testResults.errors && testResults.errors.length > 0 && (
                <div className="text-red-400">
                  <div className="font-medium">Errors:</div>
                  {testResults.errors.map((error: string, index: number) => (
                    <div key={index} className="ml-2">• {error}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400">
          <p>Make sure you have configured your environment variables:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>RESEND_API_KEY for email service</li>
            <li>TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER for SMS service</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 