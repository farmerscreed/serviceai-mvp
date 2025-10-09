/**
 * Vapi Call Transfer Tool
 * Allows AI assistant to transfer calls to human team members
 */

export interface VapiTool {
  type: 'function'
  async: boolean
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required: string[]
    }
  }
  server?: {
    url: string
    timeoutSeconds?: number
  }
}

export function createCallTransferTool(organizationId: string): VapiTool {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  return {
    type: 'function',
    async: false,
    function: {
      name: 'transfer_to_human',
      description: 'Transfer the call to a human team member when the customer requests it, when the situation is too complex for AI to handle, or when immediate human assistance is needed. Use this for billing questions, complex technical issues, or when customer explicitly asks to speak with a person.',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Reason for transfer (e.g., "customer requested", "complex issue", "billing question", "technical problem beyond AI capability")'
          },
          urgency: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'emergency'],
            description: 'Urgency level: low (general inquiry), medium (needs attention), high (important issue), emergency (critical/safety issue)'
          },
          summary: {
            type: 'string',
            description: 'Brief summary of conversation so far to help the human agent understand context. Include customer name, issue, and any relevant details discussed.'
          },
          customer_name: {
            type: 'string',
            description: 'Customer name if collected during the conversation'
          },
          customer_phone: {
            type: 'string',
            description: 'Customer phone number if collected'
          },
          issue_category: {
            type: 'string',
            enum: ['technical', 'billing', 'scheduling', 'emergency', 'complaint', 'general'],
            description: 'Category of the issue being transferred'
          }
        },
        required: ['reason', 'urgency', 'summary']
      }
    },
    server: {
      url: `${baseUrl}/api/vapi/tools/transfer`,
      timeoutSeconds: 30
    }
  }
}

/**
 * Create emergency escalation tool
 * Specifically for emergency situations requiring immediate attention
 */
export function createEmergencyEscalationTool(organizationId: string): VapiTool {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  return {
    type: 'function',
    async: false,
    function: {
      name: 'escalate_emergency',
      description: 'EMERGENCY ONLY: Escalate to emergency contact for critical situations like gas leaks, no heat in winter, flooding, electrical hazards, or life-threatening situations. This triggers immediate notification to on-call emergency contacts.',
      parameters: {
        type: 'object',
        properties: {
          emergency_type: {
            type: 'string',
            enum: ['gas_leak', 'no_heat', 'no_cooling', 'flooding', 'electrical_hazard', 'fire_risk', 'other_critical'],
            description: 'Type of emergency situation'
          },
          severity: {
            type: 'string',
            enum: ['critical', 'severe', 'moderate'],
            description: 'Severity level: critical (life-threatening), severe (property damage risk), moderate (urgent but not immediate danger)'
          },
          location: {
            type: 'string',
            description: 'Customer location/address for emergency response'
          },
          description: {
            type: 'string',
            description: 'Detailed description of the emergency situation'
          },
          customer_name: {
            type: 'string',
            description: 'Customer name'
          },
          customer_phone: {
            type: 'string',
            description: 'Customer phone number for callback'
          },
          immediate_danger: {
            type: 'boolean',
            description: 'Is there immediate danger to life or property?'
          }
        },
        required: ['emergency_type', 'severity', 'description', 'customer_phone']
      }
    },
    server: {
      url: `${baseUrl}/api/vapi/tools/emergency-escalate`,
      timeoutSeconds: 20
    }
  }
}
