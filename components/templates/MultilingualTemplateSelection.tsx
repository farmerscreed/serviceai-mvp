// Multilingual Template Selection - Task 4.1
// Main component for selecting industry templates in multiple languages

'use client';

import { useState, useEffect } from 'react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { MultilingualTemplateCard, IndustryTemplate } from './MultilingualTemplateCard';
import { useTemplateTranslations } from '@/lib/i18n/template-translations';

interface MultilingualTemplateSelectionProps {
  onTemplateSelect: (industryCode: string, language: string) => void;
  userLanguage?: string;
  selectedTemplate?: string;
  selectedLanguage?: string;
}

// Mock data for templates - in real app, this would come from API
const mockTemplates: IndustryTemplate[] = [
  {
    id: 'hvac-en',
    industry_code: 'hvac',
    display_name: 'HVAC & Climate Control',
    language_code: 'en',
    description: 'Complete HVAC service management with emergency detection',
    emergency_keywords: ['no heat', 'no cooling', 'gas smell', 'carbon monoxide'],
    appointment_types: {
      emergency: { duration: 120, priority: 1 },
      repair: { duration: 90, priority: 2 },
      maintenance: { duration: 60, priority: 3 }
    },
    sms_templates: {
      confirmation: 'Your HVAC service is confirmed for {date} at {time}',
      reminder: 'Reminder: Your HVAC service is tomorrow at {time}',
      emergency: 'URGENT: HVAC emergency from {customer}'
    },
    cultural_guidelines: {
      communication_style: 'direct_friendly',
      formality_level: 'professional_casual'
    },
    features: ['emergency_detection', 'appointment_booking', 'sms_integration'],
    stats: {
      emergency_keywords_count: 12,
      appointment_types_count: 3,
      sms_templates_count: 8
    }
  },
  {
    id: 'hvac-es',
    industry_code: 'hvac',
    display_name: 'HVAC y Control de Clima',
    language_code: 'es',
    description: 'Gestión completa de servicios HVAC con detección de emergencias',
    emergency_keywords: ['sin calefacción', 'sin aire', 'olor a gas', 'monóxido de carbono'],
    appointment_types: {
      emergency: { duration: 120, priority: 1 },
      repair: { duration: 90, priority: 2 },
      maintenance: { duration: 60, priority: 3 }
    },
    sms_templates: {
      confirmation: 'Su servicio de HVAC está confirmado para {date} a las {time}',
      reminder: 'Recordatorio: Su servicio de HVAC es mañana a las {time}',
      emergency: 'URGENTE: Emergencia de HVAC de {customer}'
    },
    cultural_guidelines: {
      communication_style: 'warm_respectful',
      formality_level: 'formal_usted'
    },
    features: ['emergency_detection', 'appointment_booking', 'sms_integration'],
    stats: {
      emergency_keywords_count: 12,
      appointment_types_count: 3,
      sms_templates_count: 8
    }
  },
  {
    id: 'plumbing-en',
    industry_code: 'plumbing',
    display_name: 'Plumbing & Water Systems',
    language_code: 'en',
    description: 'Complete plumbing service management with emergency detection',
    emergency_keywords: ['water leak', 'flooding', 'no water', 'sewer backup'],
    appointment_types: {
      emergency: { duration: 90, priority: 1 },
      repair: { duration: 60, priority: 2 },
      maintenance: { duration: 45, priority: 3 }
    },
    sms_templates: {
      confirmation: 'Your plumbing service is confirmed for {date} at {time}',
      reminder: 'Reminder: Your plumbing service is tomorrow at {time}',
      emergency: 'URGENT: Plumbing emergency from {customer}'
    },
    cultural_guidelines: {
      communication_style: 'direct_friendly',
      formality_level: 'professional_casual'
    },
    features: ['emergency_detection', 'appointment_booking', 'sms_integration'],
    stats: {
      emergency_keywords_count: 10,
      appointment_types_count: 3,
      sms_templates_count: 6
    }
  },
  {
    id: 'plumbing-es',
    industry_code: 'plumbing',
    display_name: 'Plomería y Sistemas de Agua',
    language_code: 'es',
    description: 'Gestión completa de servicios de plomería con detección de emergencias',
    emergency_keywords: ['fuga de agua', 'inundación', 'sin agua', 'retroceso de alcantarillado'],
    appointment_types: {
      emergency: { duration: 90, priority: 1 },
      repair: { duration: 60, priority: 2 },
      maintenance: { duration: 45, priority: 3 }
    },
    sms_templates: {
      confirmation: 'Su servicio de plomería está confirmado para {date} a las {time}',
      reminder: 'Recordatorio: Su servicio de plomería es mañana a las {time}',
      emergency: 'URGENTE: Emergencia de plomería de {customer}'
    },
    cultural_guidelines: {
      communication_style: 'warm_respectful',
      formality_level: 'formal_usted'
    },
    features: ['emergency_detection', 'appointment_booking', 'sms_integration'],
    stats: {
      emergency_keywords_count: 10,
      appointment_types_count: 3,
      sms_templates_count: 6
    }
  }
];

export function MultilingualTemplateSelection({
  onTemplateSelect,
  userLanguage = 'en',
  selectedTemplate,
  selectedLanguage
}: MultilingualTemplateSelectionProps) {
  const [currentLanguage, setCurrentLanguage] = useState(selectedLanguage || userLanguage);
  const [templates, setTemplates] = useState<IndustryTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(selectedTemplate || null);
  const [isLoading, setIsLoading] = useState(false);
  
  const t = useTemplateTranslations(currentLanguage);

  // Load templates for current language
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        // In real app, this would be an API call
        const languageTemplates = mockTemplates.filter(
          template => template.language_code === currentLanguage
        );
        setTemplates(languageTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [currentLanguage]);

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    setSelectedTemplateId(null); // Reset selection when changing language
  };

  const handleTemplateSelect = (template: IndustryTemplate) => {
    setSelectedTemplateId(template.id);
    onTemplateSelect(template.industry_code, template.language_code);
  };

  const handleTemplatePreview = (template: IndustryTemplate) => {
    // TODO: Implement template preview modal
    console.log('Preview template:', template);
  };

  const handleTemplateCompare = (template: IndustryTemplate) => {
    // TODO: Implement template comparison
    console.log('Compare template:', template);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t.chooseTemplate}
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          {currentLanguage === 'es' 
            ? 'Seleccione la plantilla de su industria en su idioma preferido'
            : 'Select your industry template in your preferred language'
          }
        </p>
        
        {/* Language Selector */}
        <div className="flex justify-center">
          <LanguageSelector
            selectedLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />
        </div>
      </div>

      {/* Language Benefits */}
      <div className="mb-8">
        {currentLanguage === 'es' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              {t.spanishBenefits.title}
            </h3>
            <ul className="space-y-2">
              {t.spanishBenefits.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start space-x-2 text-green-700">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              {t.englishBenefits.title}
            </h3>
            <ul className="space-y-2">
              {t.englishBenefits.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start space-x-2 text-blue-700">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <MultilingualTemplateCard
              key={template.id}
              template={template}
              language={currentLanguage}
              isSelected={selectedTemplateId === template.id}
              onClick={() => handleTemplateSelect(template)}
              onPreview={() => handleTemplatePreview(template)}
              onCompare={() => handleTemplateCompare(template)}
            />
          ))}
        </div>
      )}

      {/* Continue Button */}
      {selectedTemplateId && (
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
              if (selectedTemplate) {
                onTemplateSelect(selectedTemplate.industry_code, selectedTemplate.language_code);
              }
            }}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {t.continue}
          </button>
        </div>
      )}
    </div>
  );
}
