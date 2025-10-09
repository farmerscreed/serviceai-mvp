// Language Selection Step - Task 4.2
// First step of the onboarding wizard for language selection

'use client';

import { useState } from 'react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useTemplateTranslations } from '@/lib/i18n/template-translations';

interface LanguageSelectionStepProps {
  selectedLanguage: string;
  onLanguageSelect: (language: string) => void;
  onComplete: () => void;
  language: string;
}

export function LanguageSelectionStep({
  selectedLanguage,
  onLanguageSelect,
  onComplete,
  language
}: LanguageSelectionStepProps) {
  const [currentLanguage, setCurrentLanguage] = useState(selectedLanguage);
  const t = useTemplateTranslations(language);

  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    onLanguageSelect(newLanguage);
  };

  const handleContinue = () => {
    onComplete();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {language === 'es' 
            ? 'Seleccione su idioma preferido'
            : 'Select Your Preferred Language'
          }
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          {language === 'es'
            ? 'Elija el idioma en el que desea que su asistente de IA se comunique con sus clientes'
            : 'Choose the language you want your AI assistant to communicate with your customers'
          }
        </p>
      </div>

      {/* Language Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {language === 'es' ? 'Idioma del Asistente' : 'Assistant Language'}
          </h3>
          <div className="flex justify-center">
            <LanguageSelector
              selectedLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
              className="text-lg"
            />
          </div>
        </div>
      </div>

      {/* Language Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* English Benefits */}
        <div className={`bg-white rounded-lg border-2 p-6 ${
          currentLanguage === 'en' 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200'
        }`}>
          <div className="text-center">
            <div className="text-4xl mb-4">🇺🇸</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {t.englishBenefits.title}
            </h3>
            <ul className="space-y-2 text-left">
              {t.englishBenefits.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start space-x-2 text-gray-700">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Spanish Benefits */}
        <div className={`bg-white rounded-lg border-2 p-6 ${
          currentLanguage === 'es' 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200'
        }`}>
          <div className="text-center">
            <div className="text-4xl mb-4">🇪🇸</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {t.spanishBenefits.title}
            </h3>
            <ul className="space-y-2 text-left">
              {t.spanishBenefits.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start space-x-2 text-gray-700">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Market Information */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {language === 'es' 
            ? 'Información del Mercado'
            : 'Market Information'
          }
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {language === 'es' ? 'Mercado en Inglés' : 'English Market'}
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {language === 'es' ? 'Amplio alcance de mercado' : 'Wide market reach'}</li>
              <li>• {language === 'es' ? 'Comunicación profesional estándar' : 'Standard professional communication'}</li>
              <li>• {language === 'es' ? 'Fácil integración con sistemas existentes' : 'Easy integration with existing systems'}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {language === 'es' ? 'Mercado en Español' : 'Spanish Market'}
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {language === 'es' ? '40% más grande que el mercado en inglés' : '40% larger than English market'}</li>
              <li>• {language === 'es' ? 'Comunicación culturalmente apropiada' : 'Culturally appropriate communication'}</li>
              <li>• {language === 'es' ? 'Mayor satisfacción del cliente' : 'Higher customer satisfaction'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <button
          onClick={handleContinue}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {language === 'es' ? 'Continuar' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
