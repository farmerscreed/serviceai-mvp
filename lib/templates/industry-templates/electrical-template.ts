// Electrical Industry Template - English and Spanish
// Task 1.4: Industry Template Definitions

import type { IndustryTemplate } from '../types'

export const ELECTRICAL_TEMPLATE_EN: IndustryTemplate = {
  id: 'electrical-en-template',
  industry_code: 'electrical',
  language_code: 'en',
  display_name: 'Electrical & Power Systems',
  version: 1,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  
  template_config: {
    system_prompt_template: `You are an AI assistant for {business_name}, a professional electrical and power systems service company.

Your role is to:
- Answer customer calls professionally and helpfully
- Assess electrical issues and determine urgency levels
- Schedule appointments for repairs, maintenance, and installations
- Provide emergency assistance for urgent electrical problems
- Collect customer information and service requirements
- Send SMS confirmations and reminders

Business Information:
- Company: {business_name}
- Phone: {business_phone}
- Address: {business_address}
- Email: {business_email}

You are knowledgeable about:
- Electrical systems (wiring, circuits, panels)
- Power distribution and safety
- Lighting systems and fixtures
- Outlets, switches, and receptacles
- Emergency repairs (power outages, safety hazards)
- Electrical code compliance and safety standards

Always be professional, helpful, and prioritize customer safety. Electrical work can be dangerous - never advise customers to attempt electrical repairs themselves.`,

    greeting_template: `Hello! Thank you for calling {business_name}. This is our AI assistant. I'm here to help you with your electrical needs. How can I assist you today?`,

    fallback_responses: {
      en: [
        "I understand you're having an electrical issue. Let me help you with that.",
        "I'm here to help with your electrical needs. What's the problem?",
        "Let me get some information about your electrical issue so I can help you properly."
      ],
      es: [
        "Entiendo que tiene un problema eléctrico. Permíteme ayudarle.",
        "Estoy aquí para ayudarle con sus necesidades eléctricas. ¿Cuál es el problema?",
        "Permíteme obtener información sobre su problema eléctrico para poder ayudarle adecuadamente."
      ]
    },

    conversation_flow: {
      initial_greeting: {
        en: "Hello! Thank you for calling {business_name}. How can I help you with your electrical needs today?",
        es: "¡Hola! Gracias por llamar a {business_name}. ¿Cómo puedo ayudarle con sus necesidades eléctricas hoy?"
      },
      language_detection: {
        en: "Would you prefer to speak in English or Spanish?",
        es: "¿Prefiere hablar en inglés o español?"
      },
      emergency_assessment: {
        en: "I need to assess the urgency of your electrical issue. Can you describe what's happening?",
        es: "Necesito evaluar la urgencia de su problema eléctrico. ¿Puede describir qué está pasando?"
      },
      appointment_booking: {
        en: "I can help you schedule an appointment. What type of service do you need?",
        es: "Puedo ayudarle a programar una cita. ¿Qué tipo de servicio necesita?"
      },
      information_collection: {
        en: "I'll need some information to schedule your service. What's your name and phone number?",
        es: "Necesitaré información para programar su servicio. ¿Cuál es su nombre y número de teléfono?"
      },
      confirmation: {
        en: "Perfect! I have your appointment scheduled. You'll receive a confirmation SMS shortly.",
        es: "¡Perfecto! Tengo su cita programada. Recibirá un SMS de confirmación en breve."
      }
    },

    business_hours: {
      timezone: 'America/New_York',
      weekdays: { open: '07:00', close: '18:00' },
      weekends: { open: '08:00', close: '16:00' },
      holidays: ['2024-01-01', '2024-07-04', '2024-12-25'],
      emergency_hours: {
        available: true,
        contact_method: 'phone'
      }
    },

    timezone_handling: {
      default_timezone: 'America/New_York',
      supported_timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
      daylight_saving: true,
      timezone_detection: true
    }
  },

  emergency_patterns: {
    keywords: {
      en: [
        'power outage', 'no power', 'electricity out', 'lights out',
        'sparking', 'sparks', 'electrical fire', 'burning smell',
        'shock', 'electrocution', 'electrical hazard', 'dangerous',
        'outlet not working', 'switch not working', 'circuit breaker',
        'flickering lights', 'dim lights', 'power surge',
        'emergency', 'urgent', 'asap', 'immediately',
        'electrical fire', 'smoke', 'burning', 'hot outlet',
        'exposed wires', 'loose wires', 'damaged wiring'
      ],
      es: [
        'corte de luz', 'sin electricidad', 'luz apagada', 'sin luz',
        'chispas', 'chispeando', 'incendio eléctrico', 'olor a quemado',
        'descarga', 'electrocutado', 'peligro eléctrico', 'peligroso',
        'enchufe no funciona', 'interruptor no funciona', 'disyuntor',
        'luces parpadeando', 'luces tenues', 'sobrecarga',
        'emergencia', 'urgente', 'inmediatamente', 'ya',
        'incendio eléctrico', 'humo', 'quemando', 'enchufe caliente',
        'cables expuestos', 'cables sueltos', 'cableado dañado'
      ]
    },
    urgency_indicators: {
      en: [
        'emergency', 'urgent', 'asap', 'immediately', 'right now',
        'sparking', 'electrical fire', 'shock hazard', 'power outage',
        'burning smell', 'smoke', 'exposed wires', 'dangerous'
      ],
      es: [
        'emergencia', 'urgente', 'inmediatamente', 'ahora mismo',
        'chispas', 'incendio eléctrico', 'peligro de descarga', 'corte de luz',
        'olor a quemado', 'humo', 'cables expuestos', 'peligroso'
      ]
    },
    context_patterns: {
      en: [
        'winter', 'summer', 'storm', 'weather', 'multiple rooms',
        'kitchen', 'bathroom', 'basement', 'outdoor', 'appliance'
      ],
      es: [
        'invierno', 'verano', 'tormenta', 'clima', 'múltiples habitaciones',
        'cocina', 'baño', 'sótano', 'exterior', 'electrodoméstico'
      ]
    },
    escalation_triggers: {
      en: [
        'electrical fire', 'shock hazard', 'sparking', 'burning smell',
        'exposed wires', 'power outage', 'multiple rooms affected'
      ],
      es: [
        'incendio eléctrico', 'peligro de descarga', 'chispas', 'olor a quemado',
        'cables expuestos', 'corte de luz', 'múltiples habitaciones afectadas'
      ]
    }
  },

  appointment_types: {
    emergency: {
      display_name: { en: 'Emergency Service', es: 'Servicio de Emergencia' },
      duration_minutes: 120,
      priority: 1,
      same_day_available: true,
      advance_booking_days: 0,
      required_fields: ['customer_name', 'customer_phone', 'service_address', 'issue_description'],
      description: {
        en: 'Urgent electrical repairs for safety emergencies',
        es: 'Reparaciones urgentes eléctricas para emergencias de seguridad'
      }
    },
    repair: {
      display_name: { en: 'Repair Service', es: 'Servicio de Reparación' },
      duration_minutes: 90,
      priority: 2,
      same_day_available: false,
      advance_booking_days: 7,
      required_fields: ['customer_name', 'customer_phone', 'service_address', 'issue_description'],
      description: {
        en: 'Scheduled electrical repairs and troubleshooting',
        es: 'Reparaciones programadas eléctricas y solución de problemas'
      }
    },
    maintenance: {
      display_name: { en: 'Maintenance Visit', es: 'Visita de Mantenimiento' },
      duration_minutes: 60,
      priority: 3,
      same_day_available: false,
      advance_booking_days: 14,
      required_fields: ['customer_name', 'customer_phone', 'service_address'],
      description: {
        en: 'Preventive maintenance for electrical systems',
        es: 'Mantenimiento preventivo para sistemas eléctricos'
      }
    },
    installation: {
      display_name: { en: 'Installation Service', es: 'Servicio de Instalación' },
      duration_minutes: 180,
      priority: 2,
      same_day_available: false,
      advance_booking_days: 14,
      required_fields: ['customer_name', 'customer_phone', 'service_address', 'fixture_type'],
      description: {
        en: 'New electrical fixtures and equipment installation',
        es: 'Instalación de nuevos accesorios y equipo eléctrico'
      }
    },
    inspection: {
      display_name: { en: 'Electrical Inspection', es: 'Inspección Eléctrica' },
      duration_minutes: 120,
      priority: 2,
      same_day_available: false,
      advance_booking_days: 7,
      required_fields: ['customer_name', 'customer_phone', 'service_address', 'inspection_type'],
      description: {
        en: 'Electrical safety inspection and code compliance check',
        es: 'Inspección de seguridad eléctrica y verificación de cumplimiento de código'
      }
    }
  },

  required_fields: {
    customer_info: ['customer_name', 'customer_phone', 'customer_email'],
    service_details: ['service_address', 'issue_description', 'fixture_type'],
    emergency_contact: ['emergency_contact_phone'],
    sms_preferences: ['sms_opt_in', 'preferred_language'],
    language_preference: ['preferred_language']
  },

  sms_templates: {
    appointment_confirmation: {
      en: "Hi {name}! Your electrical service is confirmed for {date} at {time}. Address: {address}. Questions? Call {business_phone}",
      es: "¡Hola {name}! Su servicio eléctrico está confirmado para {date} a las {time}. Dirección: {address}. ¿Preguntas? Llame {business_phone}"
    },
    appointment_reminder: {
      en: "Reminder: Your electrical service is tomorrow at {time}. Address: {address}. Call {business_phone} to reschedule.",
      es: "Recordatorio: Su servicio eléctrico es mañana a las {time}. Dirección: {address}. Llame {business_phone} para reprogramar."
    },
    emergency_alert: {
      en: "URGENT: Electrical emergency from {customer_name} at {address}. Issue: {description}. Contact: {phone}",
      es: "URGENTE: Emergencia eléctrica de {customer_name} en {address}. Problema: {description}. Contacto: {phone}"
    },
    emergency_confirmation: {
      en: "Emergency electrical service dispatched. Technician {technician_name} will arrive within 30-60 minutes. Call {business_phone} for updates.",
      es: "Servicio de emergencia eléctrica despachado. Técnico {technician_name} llegará en 30-60 minutos. Llame {business_phone} para actualizaciones."
    },
    status_update: {
      en: "Update: Your technician {technician_name} is en route. ETA: {eta}. Call {business_phone} if you have questions.",
      es: "Actualización: Su técnico {technician_name} está en camino. Tiempo estimado: {eta}. Llame {business_phone} si tiene preguntas."
    },
    follow_up: {
      en: "Thank you for choosing {business_name}! How was your service? Rate us: {rating_link}. Schedule maintenance: {business_phone}",
      es: "¡Gracias por elegir {business_name}! ¿Cómo fue su servicio? Califíquenos: {rating_link}. Programe mantenimiento: {business_phone}"
    }
  },

  cultural_guidelines: {
    communication_style: {
      en: 'direct_friendly',
      es: 'warm_respectful'
    },
    formality_level: {
      en: 'professional_casual',
      es: 'formal_usted'
    },
    urgency_expression: {
      en: 'immediate_action_focused',
      es: 'thorough_explanation_focused'
    },
    relationship_building: {
      en: 'minimal',
      es: 'important'
    },
    cultural_notes: {
      en: [
        'Be direct and efficient with English speakers',
        'Focus on immediate solutions and action steps',
        'Use professional but friendly tone',
        'Emphasize electrical safety and code compliance'
      ],
      es: [
        'Use "usted" for formal situations, especially emergencies',
        'Be patient and provide detailed explanations',
        'Show respect and build trust through relationship',
        'Consider family safety and electrical hazards',
        'Explain electrical safety thoroughly and clearly'
      ]
    }
  },

  integration_requirements: {
    vapi_tools: [],
    webhook_endpoints: [
      '/api/webhooks/vapi/emergency',
      '/api/webhooks/vapi/appointment',
      '/api/webhooks/vapi/sms'
    ],
    external_apis: [
      {
        name: 'weather_api',
        endpoint: 'https://api.weather.com',
        authentication: 'api_key',
        rate_limit: 1000,
        required: false
      }
    ],
    data_requirements: [
      {
        field_name: 'service_address',
        data_type: 'string',
        required: true,
        validation_rules: ['not_empty', 'valid_address'],
        description: {
          en: 'Complete service address including city, state, zip',
          es: 'Dirección completa del servicio incluyendo ciudad, estado, código postal'
        }
      },
      {
        field_name: 'fixture_type',
        data_type: 'string',
        required: false,
        validation_rules: ['valid_fixture_type'],
        description: {
          en: 'Type of electrical fixture (outlet, switch, light, etc.)',
          es: 'Tipo de accesorio eléctrico (enchufe, interruptor, luz, etc.)'
        }
      },
      {
        field_name: 'inspection_type',
        data_type: 'string',
        required: false,
        validation_rules: ['valid_inspection_type'],
        description: {
          en: 'Type of electrical inspection (safety, code compliance, etc.)',
          es: 'Tipo de inspección eléctrica (seguridad, cumplimiento de código, etc.)'
        }
      }
    ]
  }
}

export const ELECTRICAL_TEMPLATE_ES: IndustryTemplate = {
  ...ELECTRICAL_TEMPLATE_EN,
  id: 'electrical-es-template',
  language_code: 'es',
  display_name: 'Eléctrico y Sistemas de Energía'
}
