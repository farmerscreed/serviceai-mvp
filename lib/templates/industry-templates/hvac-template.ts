// HVAC Industry Template - English and Spanish
// Task 1.4: Industry Template Definitions

import type { IndustryTemplate } from '../types'

export const HVAC_TEMPLATE_EN: IndustryTemplate = {
  id: 'hvac-en-template',
  industry_code: 'hvac',
  language_code: 'en',
  display_name: 'HVAC & Climate Control',
  version: 1,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  
  template_config: {
    system_prompt_template: `You are an AI assistant for {business_name}, a professional HVAC and climate control service company. 

Your role is to:
- Answer customer calls professionally and helpfully
- Assess HVAC issues and determine urgency levels
- Schedule appointments for repairs, maintenance, and installations
- Provide emergency assistance for urgent heating/cooling problems
- Collect customer information and service requirements
- Send SMS confirmations and reminders

Business Information:
- Company: {business_name}
- Phone: {business_phone}
- Address: {business_address}
- Email: {business_email}

You are knowledgeable about:
- Heating systems (furnaces, heat pumps, boilers)
- Cooling systems (air conditioners, heat pumps)
- Ventilation and air quality
- Thermostats and controls
- Ductwork and air distribution
- Energy efficiency and maintenance

Always be professional, helpful, and prioritize customer safety.`,

    greeting_template: `Hello! Thank you for calling {business_name}. This is our AI assistant. I'm here to help you with your HVAC needs. How can I assist you today?`,

    fallback_responses: {
      en: [
        "I understand you're having an HVAC issue. Let me help you with that.",
        "I'm here to help with your heating and cooling needs. What's the problem?",
        "Let me get some information about your HVAC issue so I can help you properly."
      ],
      es: [
        "Entiendo que tiene un problema con su sistema de HVAC. Permíteme ayudarle.",
        "Estoy aquí para ayudarle con sus necesidades de calefacción y refrigeración. ¿Cuál es el problema?",
        "Permíteme obtener información sobre su problema de HVAC para poder ayudarle adecuadamente."
      ]
    },

    conversation_flow: {
      initial_greeting: {
        en: "Hello! Thank you for calling {business_name}. How can I help you with your HVAC needs today?",
        es: "¡Hola! Gracias por llamar a {business_name}. ¿Cómo puedo ayudarle con sus necesidades de HVAC hoy?"
      },
      language_detection: {
        en: "Would you prefer to speak in English or Spanish?",
        es: "¿Prefiere hablar en inglés o español?"
      },
      emergency_assessment: {
        en: "I need to assess the urgency of your HVAC issue. Can you describe what's happening?",
        es: "Necesito evaluar la urgencia de su problema de HVAC. ¿Puede describir qué está pasando?"
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
        'no heat', 'no heating', 'furnace not working', 'heater broken',
        'no cooling', 'no air conditioning', 'AC not working', 'air conditioner broken',
        'gas smell', 'gas leak', 'carbon monoxide', 'CO detector',
        'furnace out', 'heater out', 'AC out', 'cooling out',
        'emergency', 'urgent', 'asap', 'immediately',
        'freezing', 'too hot', 'too cold', 'temperature',
        'pilot light', 'flame', 'smoke', 'burning smell'
      ],
      es: [
        'sin calefacción', 'no calienta', 'horno no funciona', 'calentador roto',
        'sin aire', 'sin refrigeración', 'aire acondicionado no funciona', 'AC roto',
        'olor a gas', 'fuga de gas', 'monóxido de carbono', 'detector de CO',
        'horno descompuesto', 'calentador descompuesto', 'AC descompuesto',
        'emergencia', 'urgente', 'inmediatamente', 'ya',
        'congelando', 'muy caliente', 'muy frío', 'temperatura',
        'piloto', 'llama', 'humo', 'olor a quemado'
      ]
    },
    urgency_indicators: {
      en: [
        'emergency', 'urgent', 'asap', 'immediately', 'right now',
        'no heat in winter', 'no cooling in summer', 'gas leak',
        'carbon monoxide', 'freezing', 'overheating', 'dangerous'
      ],
      es: [
        'emergencia', 'urgente', 'inmediatamente', 'ahora mismo',
        'sin calefacción en invierno', 'sin aire en verano', 'fuga de gas',
        'monóxido de carbono', 'congelando', 'sobrecalentamiento', 'peligroso'
      ]
    },
    context_patterns: {
      en: [
        'winter', 'summer', 'extreme weather', 'elderly', 'children',
        'medical condition', 'pets', 'pipes freezing', 'heat wave'
      ],
      es: [
        'invierno', 'verano', 'clima extremo', 'ancianos', 'niños',
        'condición médica', 'mascotas', 'tuberías congeladas', 'ola de calor'
      ]
    },
    escalation_triggers: {
      en: [
        'gas leak', 'carbon monoxide', 'no heat in winter', 'no cooling in summer',
        'elderly person', 'medical emergency', 'pipes freezing'
      ],
      es: [
        'fuga de gas', 'monóxido de carbono', 'sin calefacción en invierno',
        'sin aire en verano', 'persona mayor', 'emergencia médica', 'tuberías congeladas'
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
        en: 'Urgent HVAC repairs for heating/cooling emergencies',
        es: 'Reparaciones urgentes de HVAC para emergencias de calefacción/refrigeración'
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
        en: 'Scheduled HVAC repairs and troubleshooting',
        es: 'Reparaciones programadas de HVAC y solución de problemas'
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
        en: 'Preventive maintenance for HVAC systems',
        es: 'Mantenimiento preventivo para sistemas HVAC'
      }
    },
    installation: {
      display_name: { en: 'Installation Service', es: 'Servicio de Instalación' },
      duration_minutes: 240,
      priority: 2,
      same_day_available: false,
      advance_booking_days: 14,
      required_fields: ['customer_name', 'customer_phone', 'service_address', 'equipment_type'],
      description: {
        en: 'New HVAC equipment installation',
        es: 'Instalación de nuevo equipo HVAC'
      }
    }
  },

  required_fields: {
    customer_info: ['customer_name', 'customer_phone', 'customer_email'],
    service_details: ['service_address', 'issue_description', 'equipment_type'],
    emergency_contact: ['emergency_contact_phone'],
    sms_preferences: ['sms_opt_in', 'preferred_language'],
    language_preference: ['preferred_language']
  },

  sms_templates: {
    appointment_confirmation: {
      en: "Hi {name}! Your HVAC service is confirmed for {date} at {time}. Address: {address}. Questions? Call {business_phone}",
      es: "¡Hola {name}! Su servicio de HVAC está confirmado para {date} a las {time}. Dirección: {address}. ¿Preguntas? Llame {business_phone}"
    },
    appointment_reminder: {
      en: "Reminder: Your HVAC service is tomorrow at {time}. Address: {address}. Call {business_phone} to reschedule.",
      es: "Recordatorio: Su servicio de HVAC es mañana a las {time}. Dirección: {address}. Llame {business_phone} para reprogramar."
    },
    emergency_alert: {
      en: "URGENT: HVAC emergency from {customer_name} at {address}. Issue: {description}. Contact: {phone}",
      es: "URGENTE: Emergencia de HVAC de {customer_name} en {address}. Problema: {description}. Contacto: {phone}"
    },
    emergency_confirmation: {
      en: "Emergency HVAC service dispatched. Technician {technician_name} will arrive within 30-60 minutes. Call {business_phone} for updates.",
      es: "Servicio de emergencia HVAC despachado. Técnico {technician_name} llegará en 30-60 minutos. Llame {business_phone} para actualizaciones."
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
        'Use professional but friendly tone'
      ],
      es: [
        'Use "usted" for formal situations, especially emergencies',
        'Be patient and provide detailed explanations',
        'Show respect and build trust through relationship',
        'Consider family safety and comfort in explanations'
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
        field_name: 'equipment_type',
        data_type: 'string',
        required: false,
        validation_rules: ['valid_equipment_type'],
        description: {
          en: 'Type of HVAC equipment (furnace, AC, heat pump, etc.)',
          es: 'Tipo de equipo HVAC (horno, AC, bomba de calor, etc.)'
        }
      }
    ]
  }
}

export const HVAC_TEMPLATE_ES: IndustryTemplate = {
  ...HVAC_TEMPLATE_EN,
  id: 'hvac-es-template',
  language_code: 'es',
  display_name: 'HVAC y Control de Clima'
}
