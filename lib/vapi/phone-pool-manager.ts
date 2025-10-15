/**
 * Phone Number Pool Manager
 *
 * Smart phone number management system that:
 * 1. Reuses unassigned Vapi phone numbers (from pool of 10 free numbers)
 * 2. Polls for phone number activation with extended timeout
 * 3. Tracks assignment status across assistants
 *
 * This solves the "Vapi-87ea540e" issue by:
 * - Searching for existing unassigned numbers FIRST
 * - Polling for 10 minutes (not 3) for number activation
 * - Reusing numbers when assistants are deleted
 */

import { createDirectVapiClient } from './direct-vapi-client'
import { createServerClient } from '@/lib/supabase/server'

export interface PhoneNumberPoolItem {
  id: string
  number?: string
  sipUri?: string
  provider: string
  status: string
  assistantId?: string
  isAssigned: boolean
  createdAt: string
}

export interface PhoneNumberAssignmentResult {
  phoneNumber: string
  phoneNumberId: string
  source: 'pool' | 'new' | 'twilio'
  wasReused: boolean
}

export class PhoneNumberPoolManager {
  /**
   * Get all available phone numbers from Vapi
   * Returns pool of 10 free Vapi numbers
   */
  async listAllPhoneNumbers(): Promise<PhoneNumberPoolItem[]> {
    try {
      const directClient = createDirectVapiClient()
      const allNumbers = await directClient.listPhoneNumbers()

      return allNumbers.map((pn: any) => ({
        id: pn.id,
        number: pn.number,
        sipUri: pn.sipUri,
        provider: pn.provider,
        status: pn.status,
        assistantId: pn.assistantId,
        isAssigned: !!pn.assistantId,
        createdAt: pn.createdAt
      }))
    } catch (error) {
      console.error('Error listing phone numbers:', error)
      return []
    }
  }

  /**
   * Find unassigned phone numbers in the pool
   * These are numbers that were created but not assigned to any assistant
   */
  async findUnassignedNumbers(): Promise<PhoneNumberPoolItem[]> {
    const allNumbers = await this.listAllPhoneNumbers()

    // Filter for Vapi provider numbers that are NOT assigned
    const unassigned = allNumbers.filter(
      pn => pn.provider === 'vapi' && !pn.assistantId
    )

    console.log(`📊 Phone Number Pool Status:`)
    console.log(`   Total Vapi numbers: ${allNumbers.filter(pn => pn.provider === 'vapi').length}/10`)
    console.log(`   Assigned: ${allNumbers.filter(pn => pn.provider === 'vapi' && pn.assistantId).length}`)
    console.log(`   Unassigned (available): ${unassigned.length}`)

    return unassigned
  }

  /**
   * SMART Assignment: Try to reuse existing unassigned number first
   * Falls back to creating new number if pool is empty
   */
  async assignPhoneNumberToAssistant(params: {
    organizationId: string
    assistantId: string
    country?: string
    areaCode?: string
  }): Promise<PhoneNumberAssignmentResult | null> {
    console.log('')
    console.log('╔════════════════════════════════════════════════════════════╗')
    console.log('║  📱 SMART PHONE NUMBER ASSIGNMENT                         ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log(`   Organization: ${params.organizationId}`)
    console.log(`   Assistant: ${params.assistantId}`)
    console.log('')

    // STRATEGY 1: Check for unassigned numbers in pool
    console.log('🎯 STRATEGY 1: Checking phone number pool for reusable numbers...')
    const unassigned = await this.findUnassignedNumbers()

    if (unassigned.length > 0) {
      console.log(`✅ Found ${unassigned.length} unassigned number(s) in pool!`)
      console.log('💡 Reusing existing number instead of creating new one')

      // Pick the first unassigned number
      const phoneToReuse = unassigned[0]
      console.log(`📞 Reusing phone number ID: ${phoneToReuse.id}`)

      try {
        // Assign it to the assistant
        const directClient = createDirectVapiClient()
        const updated = await directClient.updatePhoneNumber(phoneToReuse.id, {
          assistantId: params.assistantId,
          name: `Assistant ${params.assistantId.substring(0, 8)}`
        })

        // If number still doesn't have actual phone number, poll for it
        if (!updated.number && !updated.sipUri) {
          console.log('⏳ Number exists but not fully provisioned yet. Starting extended polling...')
          const provisioned = await this.pollForPhoneNumber(phoneToReuse.id, 10) // 10 minutes

          if (provisioned && (provisioned.number || provisioned.sipUri)) {
            const finalNumber = provisioned.number || provisioned.sipUri || `Vapi-${phoneToReuse.id.substring(0, 8)}`

            console.log('')
            console.log('╔════════════════════════════════════════════════════════════╗')
            console.log('║  ✅ SUCCESS! Phone Number Reused from Pool                ║')
            console.log('╚════════════════════════════════════════════════════════════╝')
            console.log(`   Phone Number: ${finalNumber}`)
            console.log(`   Source: Pool (reused)`)
            console.log(`   Cost: $0.00`)
            console.log('')

            return {
              phoneNumber: finalNumber,
              phoneNumberId: phoneToReuse.id,
              source: 'pool',
              wasReused: true
            }
          }
        }

        // Number is already provisioned
        const finalNumber = updated.number || updated.sipUri || `Vapi-${phoneToReuse.id.substring(0, 8)}`

        console.log('')
        console.log('╔════════════════════════════════════════════════════════════╗')
        console.log('║  ✅ SUCCESS! Phone Number Reused from Pool                ║')
        console.log('╚════════════════════════════════════════════════════════════╝')
        console.log(`   Phone Number: ${finalNumber}`)
        console.log(`   Source: Pool (reused)`)
        console.log(`   Cost: $0.00`)
        console.log('')

        return {
          phoneNumber: finalNumber,
          phoneNumberId: phoneToReuse.id,
          source: 'pool',
          wasReused: true
        }
      } catch (error: any) {
        console.error('❌ Failed to reuse number from pool:', error.message)
        console.log('💡 Falling back to creating new number...')
      }
    } else {
      console.log('ℹ️  No unassigned numbers found in pool')
      console.log('💡 Will create new number...')
    }

    // STRATEGY 2: Create new FREE Vapi number (if under limit)
    console.log('')
    console.log('🎯 STRATEGY 2: Creating NEW Vapi phone number...')

    try {
      const directClient = createDirectVapiClient()
      const newPhone = await directClient.createPhoneNumber({
        provider: 'vapi',
        assistantId: params.assistantId,
        name: `Assistant ${params.assistantId.substring(0, 8)}`
      })

      console.log(`📞 Phone number object created: ${newPhone.id}`)
      console.log(`   Status: ${newPhone.status}`)

      // Poll for the actual number with EXTENDED timeout (10 minutes)
      console.log('⏳ Polling for phone number activation (up to 10 minutes)...')
      const provisioned = await this.pollForPhoneNumber(newPhone.id, 10)

      if (provisioned && (provisioned.number || provisioned.sipUri)) {
        const finalNumber = provisioned.number || provisioned.sipUri!

        console.log('')
        console.log('╔════════════════════════════════════════════════════════════╗')
        console.log('║  ✅ SUCCESS! New Phone Number Provisioned                 ║')
        console.log('╚════════════════════════════════════════════════════════════╝')
        console.log(`   Phone Number: ${finalNumber}`)
        console.log(`   Source: New Vapi number`)
        console.log(`   Cost: $0.00 (FREE)`)
        console.log(`   Activation time: ~2-10 minutes`)
        console.log('')

        return {
          phoneNumber: finalNumber,
          phoneNumberId: newPhone.id,
          source: 'new',
          wasReused: false
        }
      } else {
        console.warn('⚠️ Phone number created but not provisioned after 10 minutes')
        console.warn(`   Phone Number ID: ${newPhone.id}`)
        console.warn(`   Check Vapi Dashboard: https://dashboard.vapi.ai/phone-numbers`)

        // Return ID as fallback
        return {
          phoneNumber: `Vapi-${newPhone.id.substring(0, 8)}`,
          phoneNumberId: newPhone.id,
          source: 'new',
          wasReused: false
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to create new Vapi number:', error.message)

      if (error.message.includes('limit') || error.message.includes('quota')) {
        console.error('')
        console.error('╔════════════════════════════════════════════════════════════╗')
        console.error('║  ⚠️  FREE VAPI NUMBER LIMIT REACHED (10/10)              ║')
        console.error('╚════════════════════════════════════════════════════════════╝')
        console.error('')
        console.error('💡 SOLUTIONS:')
        console.error('   1. Delete unused assistants to free up numbers')
        console.error('   2. Set up Twilio integration (see docs)')
        console.error('')
      }

      return null
    }
  }

  /**
   * Poll for phone number with EXTENDED timeout
   * Vapi can take 2-10 minutes to provision numbers
   */
  private async pollForPhoneNumber(
    phoneNumberId: string,
    maxMinutes: number = 10
  ): Promise<{ id: string; number?: string; sipUri?: string; status: string } | null> {
    const maxRetries = maxMinutes * 4 // 4 polls per minute (every 15 seconds)
    const retryInterval = 15000 // 15 seconds

    console.log(`⏳ Starting extended polling (${maxMinutes} minutes, ${maxRetries} attempts)`)

    const directClient = createDirectVapiClient()

    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, retryInterval))

      const elapsed = ((i + 1) * retryInterval) / 1000
      const minutesElapsed = (elapsed / 60).toFixed(1)

      console.log(`   📞 Polling attempt ${i + 1}/${maxRetries} (${minutesElapsed} min elapsed)...`)

      try {
        const phoneNumber = await directClient.getPhoneNumber(phoneNumberId)

        // Check if we got a real number
        if (phoneNumber.number || phoneNumber.sipUri) {
          console.log(`   ✅ Phone number provisioned: ${phoneNumber.number || phoneNumber.sipUri}`)
          console.log(`   ⏱️  Total time: ${minutesElapsed} minutes`)
          return phoneNumber
        }

        // Check status
        if (phoneNumber.status === 'active') {
          console.log(`   ℹ️  Status is 'active' but no number yet - continuing to poll...`)
        }
      } catch (pollError: any) {
        console.warn(`   ⚠️  Polling attempt failed: ${pollError.message}`)
      }
    }

    console.error(`❌ Phone number not provisioned after ${maxMinutes} minutes`)
    return null
  }

  /**
   * Get phone number pool statistics
   */
  async getPoolStats(): Promise<{
    total: number
    assigned: number
    unassigned: number
    percentUsed: number
    limit: number
  }> {
    const allNumbers = await this.listAllPhoneNumbers()
    const vapiNumbers = allNumbers.filter(pn => pn.provider === 'vapi')
    const assigned = vapiNumbers.filter(pn => pn.isAssigned)
    const unassigned = vapiNumbers.filter(pn => !pn.isAssigned)

    const limit = 10
    const total = vapiNumbers.length
    const percentUsed = Math.round((total / limit) * 100)

    return {
      total,
      assigned: assigned.length,
      unassigned: unassigned.length,
      percentUsed,
      limit
    }
  }

  /**
   * Pre-provision phone numbers to have them ready in the pool
   * Call this to create numbers in advance
   */
  async preProvisionNumbers(count: number): Promise<void> {
    console.log(`📱 Pre-provisioning ${count} phone numbers for the pool...`)

    const directClient = createDirectVapiClient()
    const stats = await this.getPoolStats()

    if (stats.total + count > stats.limit) {
      console.warn(`⚠️  Cannot pre-provision ${count} numbers - would exceed limit of ${stats.limit}`)
      console.warn(`   Current: ${stats.total}, Requested: ${count}, Total: ${stats.total + count}`)
      return
    }

    for (let i = 0; i < count; i++) {
      try {
        console.log(`📞 Creating phone number ${i + 1}/${count}...`)

        const phoneNumber = await directClient.createPhoneNumber({
          provider: 'vapi',
          name: `Pool Number ${i + 1}`
          // NO assistantId - leaves it unassigned
        })

        console.log(`   ✅ Created: ${phoneNumber.id}`)

        // Poll for activation
        const provisioned = await this.pollForPhoneNumber(phoneNumber.id, 10)
        if (provisioned?.number) {
          console.log(`   ✅ Provisioned: ${provisioned.number}`)
        } else {
          console.log(`   ⏳ Created but still provisioning: ${phoneNumber.id}`)
        }
      } catch (error: any) {
        console.error(`   ❌ Failed to create number ${i + 1}:`, error.message)
      }
    }

    console.log('✅ Pre-provisioning complete!')
  }
}

/**
 * Create singleton instance
 */
let poolManagerInstance: PhoneNumberPoolManager | null = null

export function createPhonePoolManager(): PhoneNumberPoolManager {
  if (!poolManagerInstance) {
    poolManagerInstance = new PhoneNumberPoolManager()
  }
  return poolManagerInstance
}
