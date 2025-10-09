// Multilingual Template Card - Task 4.1
// Template card component with language-specific content

'use client';

import { useState } from 'react';
import { useTemplateTranslations } from '@/lib/i18n/template-translations';

export interface IndustryTemplate {
  id: string;
  industry_code: string;
  display_name: string;
  language_code: string;
  description: string;
  emergency_keywords: string[];
  appointment_types: Record<string, any>;
  sms_templates: Record<string, string>;
  cultural_guidelines: Record<string, any>;
  features: string[];
  stats: {
    emergency_keywords_count: number;
    appointment_types_count: number;
    sms_templates_count: number;
  };
}

interface MultilingualTemplateCardProps {
  template: IndustryTemplate;
  language: string;
  isSelected?: boolean;
  onClick: () => void;
  onPreview?: () => void;
  onCompare?: () => void;
}

export function MultilingualTemplateCard({
  template,
  language,
  isSelected = false,
  onClick,
  onPreview,
  onCompare
}: MultilingualTemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const t = useTemplateTranslations(language);

  const getIndustryIcon = (industryCode: string) => {
    const icons: Record<string, string> = {
      hvac: '❄️',
      plumbing: '🚰',
      electrical: '⚡',
      medical: '🏥',
      veterinary: '🐕',
      property: '🏢'
    };
    return icons[industryCode] || '🔧';
  };

  const getIndustryColor = (industryCode: string) => {
    const colors: Record<string, string> = {
      hvac: 'blue',
      plumbing: 'cyan',
      electrical: 'yellow',
      medical: 'red',
      veterinary: 'green',
      property: 'purple'
    };
    return colors[industryCode] || 'gray';
  };

  const colorClass = getIndustryColor(template.industry_code);
  const icon = getIndustryIcon(template.industry_code);

  return (
    <div
      className={`relative bg-white border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected 
          ? `border-${colorClass}-500 bg-${colorClass}-50` 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{template.display_name}</h3>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>
        </div>
        
        {/* Language Badge */}
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          language === 'es' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {language === 'es' ? '🇪🇸' : '🇺🇸'}
        </span>
      </div>

      {/* Features */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🚨</span>
          <span className="text-sm text-gray-700">{t.features.emergencyDetection}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg">📅</span>
          <span className="text-sm text-gray-700">{t.features.appointmentBooking}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg">💬</span>
          <span className="text-sm text-gray-700">{t.features.smsIntegration}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg">🌍</span>
          <span className="text-sm text-gray-700">{t.features.multilingualSupport}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{template.stats.emergency_keywords_count}</div>
          <div className="text-xs text-gray-600">{t.stats.emergencyKeywords}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{template.stats.appointment_types_count}</div>
          <div className="text-xs text-gray-600">{t.stats.appointmentTypes}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{template.stats.sms_templates_count}</div>
          <div className="text-xs text-gray-600">{t.stats.smsTemplates}</div>
        </div>
      </div>

      {/* Cultural Guidelines Preview */}
      {template.cultural_guidelines && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-1">{t.stats.culturalGuidelines}</div>
          <div className="text-xs text-gray-600">
            {language === 'es' 
              ? 'Comunicación respetuosa y culturalmente apropiada'
              : 'Culturally appropriate and respectful communication'
            }
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview?.();
          }}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {t.preview}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCompare?.();
          }}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {t.compare}
        </button>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className={`w-6 h-6 bg-${colorClass}-500 rounded-full flex items-center justify-center`}>
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Hover Overlay */}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-5 rounded-xl pointer-events-none" />
      )}
    </div>
  );
}
