// Template Translations - Task 4.1
// Multi-language translations for template selection interface

export interface TemplateTranslations {
  // Common UI elements
  selectLanguage: string;
  chooseTemplate: string;
  templateFeatures: string;
  emergencyDetection: string;
  appointmentBooking: string;
  smsIntegration: string;
  emergencyKeywords: string;
  appointmentTypes: string;
  continue: string;
  preview: string;
  compare: string;
  select: string;
  
  // Language benefits
  languageBenefits: string;
  spanishBenefits: {
    title: string;
    benefits: string[];
  };
  englishBenefits: {
    title: string;
    benefits: string[];
  };
  
  // Template features
  features: {
    emergencyDetection: string;
    appointmentBooking: string;
    smsIntegration: string;
    multilingualSupport: string;
    culturalAwareness: string;
    automatedWorkflows: string;
  };
  
  // Industry templates
  industries: {
    hvac: string;
    plumbing: string;
    electrical: string;
    medical: string;
    veterinary: string;
    property: string;
  };
  
  // Template stats
  stats: {
    emergencyKeywords: string;
    appointmentTypes: string;
    smsTemplates: string;
    culturalGuidelines: string;
  };
}

export const templateTranslations: Record<string, TemplateTranslations> = {
  en: {
    selectLanguage: 'Select Language',
    chooseTemplate: 'Choose Your Industry Template',
    templateFeatures: 'Template Features',
    emergencyDetection: 'Emergency Detection',
    appointmentBooking: 'Appointment Booking',
    smsIntegration: 'SMS Integration',
    emergencyKeywords: 'Emergency Keywords',
    appointmentTypes: 'Appointment Types',
    continue: 'Continue',
    preview: 'Preview',
    compare: 'Compare',
    select: 'Select Template',
    
    languageBenefits: 'Language Benefits',
    spanishBenefits: {
      title: 'Spanish Language Benefits',
      benefits: [
        'Natural communication with Spanish-speaking customers',
        'Emergency detection in Spanish',
        'SMS reminders and confirmations in Spanish',
        'Cultural understanding in conversations',
        'Access to 40% larger market',
        'Improved customer satisfaction'
      ]
    },
    englishBenefits: {
      title: 'English Language Benefits',
      benefits: [
        'Wide market reach',
        'Professional communication',
        'Standard business terminology',
        'Easy integration with existing systems',
        'Comprehensive emergency detection',
        'Automated workflow management'
      ]
    },
    
    features: {
      emergencyDetection: 'Emergency Detection',
      appointmentBooking: 'Appointment Booking',
      smsIntegration: 'SMS Integration',
      multilingualSupport: 'Multilingual Support',
      culturalAwareness: 'Cultural Awareness',
      automatedWorkflows: 'Automated Workflows'
    },
    
    industries: {
      hvac: 'HVAC & Climate Control',
      plumbing: 'Plumbing & Water Systems',
      electrical: 'Electrical Services',
      medical: 'Medical & Dental',
      veterinary: 'Veterinary Services',
      property: 'Property Management'
    },
    
    stats: {
      emergencyKeywords: 'Emergency Keywords',
      appointmentTypes: 'Appointment Types',
      smsTemplates: 'SMS Templates',
      culturalGuidelines: 'Cultural Guidelines'
    }
  },
  
  es: {
    selectLanguage: 'Seleccionar Idioma',
    chooseTemplate: 'Elija Su Plantilla de Industria',
    templateFeatures: 'Características de la Plantilla',
    emergencyDetection: 'Detección de Emergencias',
    appointmentBooking: 'Reserva de Citas',
    smsIntegration: 'Integración SMS',
    emergencyKeywords: 'Palabras Clave de Emergencia',
    appointmentTypes: 'Tipos de Citas',
    continue: 'Continuar',
    preview: 'Vista Previa',
    compare: 'Comparar',
    select: 'Seleccionar Plantilla',
    
    languageBenefits: 'Beneficios del Idioma',
    spanishBenefits: {
      title: 'Beneficios del Español',
      benefits: [
        'Comunicación natural con clientes hispanohablantes',
        'Detección de emergencias en español',
        'SMS y recordatorios en español',
        'Comprensión cultural en las conversaciones',
        'Acceso a un mercado 40% más grande',
        'Mejor satisfacción del cliente'
      ]
    },
    englishBenefits: {
      title: 'Beneficios del Inglés',
      benefits: [
        'Alcance de mercado amplio',
        'Comunicación profesional',
        'Terminología empresarial estándar',
        'Fácil integración con sistemas existentes',
        'Detección de emergencias completa',
        'Gestión automatizada de flujos de trabajo'
      ]
    },
    
    features: {
      emergencyDetection: 'Detección de Emergencias',
      appointmentBooking: 'Reserva de Citas',
      smsIntegration: 'Integración SMS',
      multilingualSupport: 'Soporte Multilingüe',
      culturalAwareness: 'Conciencia Cultural',
      automatedWorkflows: 'Flujos de Trabajo Automatizados'
    },
    
    industries: {
      hvac: 'HVAC y Control de Clima',
      plumbing: 'Plomería y Sistemas de Agua',
      electrical: 'Servicios Eléctricos',
      medical: 'Médico y Dental',
      veterinary: 'Servicios Veterinarios',
      property: 'Gestión de Propiedades'
    },
    
    stats: {
      emergencyKeywords: 'Palabras Clave de Emergencia',
      appointmentTypes: 'Tipos de Citas',
      smsTemplates: 'Plantillas SMS',
      culturalGuidelines: 'Pautas Culturales'
    }
  }
};

// Hook for using translations
export function useTemplateTranslations(language: string = 'en'): TemplateTranslations {
  return templateTranslations[language] || templateTranslations.en;
}

// Get available languages
export function getAvailableLanguages(): Array<{ code: string; name: string; flag: string }> {
  return [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];
}
