// Plumbing Industry Template - English and Spanish
// Task 1.4: Industry Template Definitions

import type { IndustryTemplate } from '../types'

export const PLUMBING_TEMPLATE_EN: IndustryTemplate = {
  id: 'plumbing-en-template',
  industry_code: 'plumbing',
  language_code: 'en',
  display_name: 'Plumbing & Water Systems',
  version: 1,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  
  template_config: {
    system_prompt_template: `You are an AI assistant for {business_name}, a professional plumbing and water systems service company.

Your role is to:
- Answer customer calls professionally and helpfully
- Assess plumbing issues and determine urgency levels
- Schedule appointments for repairs, maintenance, and installations
- Provide emergency assistance for urgent water-related problems
- Collect customer information and service requirements
- Send SMS confirmations and reminders

Business Information:
- Company: {business_name}
- Phone: {business_phone}
- Address: {business_address}
- Email: {business_email}

You are knowledgeable about:
- Water supply systems (pipes, valves, fixtures)
- Drainage systems (drains, sewers, septic)
- Water heaters and heating systems
- Fixtures and appliances (toilets, sinks, showers)
- Emergency repairs (burst pipes, flooding, leaks)
- Water quality and filtration systems

Always be professional, helpful, and prioritize customer safety and property protection.`,

    greeting_template: `Hello! Thank you for calling {business_name}. This is our AI assistant. I'm here to help you with your plumbing needs. How can I assist you today?`,

    fallback_responses: {
      en: [
        "I understand you're having a plumbing issue. Let me help you with that.",
        "I'm here to help with your plumbing needs. What's the problem?",
        "Let me get some information about your plumbing issue so I can help you properly."
      ],
      es: [
        "Entiendo que tiene un problema de plomería. Permíteme ayudarle.",
        "Estoy aquí para ayudarle con sus necesidades de plomería. ¿Cuál es el problema?",
        "Permíteme obtener información sobre su problema de plomería para poder ayudarle adecuadamente."
      ]
    },

    conversation_flow: {
      initial_greeting: {
        en: "Hello! Thank you for calling {business_name}. How can I help you with your plumbing needs today?",
        es: "¡Hola! Gracias por llamar a {business_name}. ¿Cómo puedo ayudarle con sus necesidades de plomería hoy?"
      },
      language_detection: {
        en: "Would you prefer to speak in English or Spanish?",
        es: "¿Prefiere hablar en inglés o español?"
      },
      emergency_assessment: {
        en: "I need to assess the urgency of your plumbing issue. Can you describe what's happening?",
        es: "Necesito evaluar la urgencia de su problema de plomería. ¿Puede describir qué está pasando?"
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
        'burst pipe', 'flooding', 'water everywhere', 'pipe burst',
        'no water', 'water pressure', 'leak', 'leaking', 'drip',
        'toilet overflowing', 'toilet backed up', 'sewer backup',
        'drain clogged', 'drain blocked', 'drain not working',
        'water heater', 'hot water', 'no hot water', 'water heater leak',
        'emergency', 'urgent', 'asap', 'immediately',
        'water damage', 'flooding', 'basement flooded',
        'sewer smell', 'sewage', 'backup', 'overflow'
      ],
      es: [
        'tubería reventada', 'inundación', 'agua por todas partes', 'tubería rota',
        'sin agua', 'presión de agua', 'fuga', 'goteando', 'goteo',
        'inodoro desbordado', 'inodoro tapado', 'alcantarillado tapado',
        'drenaje tapado', 'drenaje bloqueado', 'drenaje no funciona',
        'calentador de agua', 'agua caliente', 'sin agua caliente', 'fuga de calentador',
        'emergencia', 'urgente', 'inmediatamente', 'ya',
        'daño por agua', 'inundación', 'sótano inundado',
        'olor a alcantarillado', 'aguas negras', 'tapado', 'desbordado'
      ]
    },
    urgency_indicators: {
      en: [
        'emergency', 'urgent', 'asap', 'immediately', 'right now',
        'flooding', 'water damage', 'burst pipe', 'sewer backup',
        'no water', 'toilet overflowing', 'basement flooded'
      ],
      es: [
        'emergencia', 'urgente', 'inmediatamente', 'ahora mismo',
        'inundación', 'daño por agua', 'tubería reventada', 'alcantarillado tapado',
        'sin agua', 'inodoro desbordado', 'sótano inundado'
      ]
    },
    context_patterns: {
      en: [
        'winter', 'freezing', 'frozen pipes', 'basement', 'upstairs',
        'kitchen', 'bathroom', 'multiple rooms', 'water damage'
      ],
      es: [
        'invierno', 'congelando', 'tuberías congeladas', 'sótano', 'piso de arriba',
        'cocina', 'baño', 'múltiples habitaciones', 'daño por agua'
      ]
    },
    escalation_triggers: {
      en: [
        'flooding', 'water damage', 'burst pipe', 'sewer backup',
        'basement flooded', 'multiple rooms affected', 'no water to house'
      ],
      es: [
        'inundación', 'daño por agua', 'tubería reventada', 'alcantarillado tapado',
        'sótano inundado', 'múltiples habitaciones afectadas', 'sin agua en la casa'
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
        en: 'Urgent plumbing repairs for water emergencies',
        es: 'Reparaciones urgentes de plomería para emergencias de agua'
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
        en: 'Scheduled plumbing repairs and troubleshooting',
        es: 'Reparaciones programadas de plomería y solución de problemas'
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
        en: 'Preventive maintenance for plumbing systems',
        es: 'Mantenimiento preventivo para sistemas de plomería'
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
        en: 'New plumbing fixtures and equipment installation',
        es: 'Instalación de nuevos accesorios y equipo de plomería'
      }
    },
    drain_cleaning: {
      display_name: { en: 'Drain Cleaning', es: 'Limpieza de Drenajes' },
      duration_minutes: 60,
      priority: 2,
      same_day_available: false,
      advance_booking_days: 7,
      required_fields: ['customer_name', 'customer_phone', 'service_address', 'drain_location'],
      description: {
        en: 'Professional drain cleaning and unclogging',
        es: 'Limpieza profesional de drenajes y destapado'
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
      en: "Hi {name}! Your plumbing service is confirmed for {date} at {time}. Address: {address}. Questions? Call {business_phone}",
      es: "¡Hola {name}! Su servicio de plomería está confirmado para {date} a las {time}. Dirección: {address}. ¿Preguntas? Llame {business_phone}"
    },
    appointment_reminder: {
      en: "Reminder: Your plumbing service is tomorrow at {time}. Address: {address}. Call {business_phone} to reschedule.",
      es: "Recordatorio: Su servicio de plomería es mañana a las {time}. Dirección: {address}. Llame {business_phone} para reprogramar."
    },
    emergency_alert: {
      en: "URGENT: Plumbing emergency from {customer_name} at {address}. Issue: {description}. Contact: {phone}",
      es: "URGENTE: Emergencia de plomería de {customer_name} en {address}. Problema: {description}. Contacto: {phone}"
    },
    emergency_confirmation: {
      en: "Emergency plumbing service dispatched. Technician {technician_name} will arrive within 30-60 minutes. Call {business_phone} for updates.",
      es: "Servicio de emergencia de plomería despachado. Técnico {technician_name} llegará en 30-60 minutos. Llame {business_phone} para actualizaciones."
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
        'Emphasize water damage prevention'
      ],
      es: [
        'Use "usted" for formal situations, especially emergencies',
        'Be patient and provide detailed explanations',
        'Show respect and build trust through relationship',
        'Consider family safety and property protection',
        'Explain water damage prevention thoroughly'
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
          en: 'Type of plumbing fixture (toilet, sink, shower, etc.)',
          es: 'Tipo de accesorio de plomería (inodoro, lavabo, ducha, etc.)'
        }
      },
      {
        field_name: 'drain_location',
        data_type: 'string',
        required: false,
        validation_rules: ['valid_drain_location'],
        description: {
          en: 'Location of drain issue (kitchen, bathroom, basement, etc.)',
          es: 'Ubicación del problema de drenaje (cocina, baño, sótano, etc.)'
        }
      }
    ]
  }
}

export const PLUMBING_TEMPLATE_ES: IndustryTemplate = {
  ...PLUMBING_TEMPLATE_EN,
  id: 'plumbing-es-template',
  language_code: 'es',
  display_name: 'Plomería y Sistemas de Agua'
}
