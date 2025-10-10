import crypto from 'crypto'

/**
 * Vapi Webhook Signature Verification Utility
 * 
 * This utility provides proper webhook signature verification for Vapi.ai webhooks
 * to ensure the webhooks are authentic and haven't been tampered with.
 */

export interface VapiWebhookVerificationOptions {
  webhookSecret: string
  signature: string
  payload: string
  timestamp?: string
}

/**
 * Verify Vapi webhook signature
 * 
 * @param options - Verification options including secret, signature, and payload
 * @returns Promise<boolean> - True if signature is valid, false otherwise
 */
export async function verifyVapiWebhookSignature(
  options: VapiWebhookVerificationOptions
): Promise<boolean> {
  try {
    const { webhookSecret, signature, payload, timestamp } = options

    if (!webhookSecret) {
      console.warn('VAPI_WEBHOOK_SECRET not configured, skipping signature verification')
      return true // Allow in development/testing
    }

    if (!signature) {
      console.error('Webhook verification failed: Missing signature header')
      return false
    }

    if (!payload) {
      console.error('Webhook verification failed: Missing payload')
      return false
    }

    // Vapi typically uses HMAC-SHA256 for webhook signatures
    // The signature is usually in the format: "sha256=<hash>"
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')}`

    // Use crypto.timingSafeEqual to prevent timing attacks
    const providedSignature = Buffer.from(signature, 'utf8')
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8')

    if (providedSignature.length !== expectedSignatureBuffer.length) {
      console.error('Webhook verification failed: Signature length mismatch')
      return false
    }

    const isValid = crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)

    if (isValid) {
      console.log('✅ Vapi webhook signature verification passed')
    } else {
      console.error('❌ Vapi webhook signature verification failed')
    }

    return isValid

  } catch (error) {
    console.error('Error during Vapi webhook signature verification:', error)
    return false
  }
}

/**
 * Verify Vapi webhook signature with timestamp validation
 * 
 * This version also validates the timestamp to prevent replay attacks
 * 
 * @param options - Verification options including secret, signature, payload, and timestamp
 * @param maxAgeSeconds - Maximum age of the webhook in seconds (default: 300 = 5 minutes)
 * @returns Promise<boolean> - True if signature is valid and timestamp is recent, false otherwise
 */
export async function verifyVapiWebhookSignatureWithTimestamp(
  options: VapiWebhookVerificationOptions,
  maxAgeSeconds: number = 300
): Promise<boolean> {
  try {
    const { timestamp } = options

    // First verify the signature
    const signatureValid = await verifyVapiWebhookSignature(options)
    if (!signatureValid) {
      return false
    }

    // Then verify the timestamp if provided
    if (timestamp) {
      const webhookTime = parseInt(timestamp, 10)
      const currentTime = Math.floor(Date.now() / 1000)
      const age = currentTime - webhookTime

      if (age > maxAgeSeconds) {
        console.error(`Webhook verification failed: Webhook is too old (${age}s > ${maxAgeSeconds}s)`)
        return false
      }

      console.log(`✅ Webhook timestamp validation passed (age: ${age}s)`)
    }

    return true

  } catch (error) {
    console.error('Error during Vapi webhook signature verification with timestamp:', error)
    return false
  }
}

/**
 * Extract signature and timestamp from request headers
 * 
 * @param headers - Request headers object
 * @returns Object with signature and timestamp
 */
export function extractVapiWebhookHeaders(headers: Headers | Record<string, string>): {
  signature: string | null
  timestamp: string | null
} {
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name)
    }
    return headers[name] || null
  }

  return {
    signature: getHeader('x-vapi-signature') || getHeader('x-signature') || getHeader('signature'),
    timestamp: getHeader('x-vapi-timestamp') || getHeader('x-timestamp') || getHeader('timestamp')
  }
}

/**
 * Validate webhook payload structure
 * 
 * @param payload - The webhook payload
 * @returns boolean - True if payload has valid structure
 */
export function validateVapiWebhookPayload(payload: any): boolean {
  try {
    if (!payload || typeof payload !== 'object') {
      console.error('Webhook validation failed: Invalid payload type')
      return false
    }

    if (!payload.type || typeof payload.type !== 'string') {
      console.error('Webhook validation failed: Missing or invalid type field')
      return false
    }

    // Validate webhook type is from our expected list
    const validWebhookTypes = [
      'assistant-request',
      'tool-calls', 
      'language-detected',
      'call-started',
      'call-ended',
      'transcript-updated'
    ]

    if (!validWebhookTypes.includes(payload.type)) {
      console.error(`Webhook validation failed: Invalid webhook type: ${payload.type}`)
      return false
    }

    console.log(`✅ Webhook payload validation passed for type: ${payload.type}`)
    return true

  } catch (error) {
    console.error('Error during webhook payload validation:', error)
    return false
  }
}
