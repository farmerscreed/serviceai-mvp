// Step Indicator - Task 4.2
// Progress indicator for the onboarding wizard

'use client';

import { useTemplateTranslations } from '@/lib/i18n/template-translations';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  language: string;
  steps: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    isOptional: boolean;
  }>;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({
  currentStep,
  totalSteps,
  language,
  steps,
  onStepClick
}: StepIndicatorProps) {
  const t = useTemplateTranslations(language);

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepIcon = (stepIndex: number, status: string) => {
    if (status === 'completed') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (status === 'current') {
      return (
        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">{stepIndex + 1}</span>
        </div>
      );
    }
    
    return (
      <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
        <span className="text-gray-600 text-xs font-bold">{stepIndex + 1}</span>
      </div>
    );
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              {language === 'es' ? 'Progreso' : 'Progress'}: {currentStep + 1} {language === 'es' ? 'de' : 'of'} {totalSteps}
            </span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = onStepClick && (index <= currentStep || step.isOptional);
            
            return (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                {/* Step Circle */}
                <button
                  onClick={isClickable ? () => onStepClick?.(index) : undefined}
                  disabled={!isClickable}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    status === 'completed'
                      ? 'bg-green-500 hover:bg-green-600'
                      : status === 'current'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-300 hover:bg-gray-400'
                  } ${
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  {getStepIcon(index, status)}
                </button>

                {/* Step Label */}
                <div className="ml-3 flex-1">
                  <div className={`text-sm font-medium ${
                    status === 'completed' || status === 'current'
                      ? 'text-gray-900'
                      : 'text-gray-500'
                  }`}>
                    {step.title}
                    {step.isOptional && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({language === 'es' ? 'Opcional' : 'Optional'})
                      </span>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div className={`h-0.5 ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactStepIndicator({
  currentStep,
  totalSteps,
  language
}: {
  currentStep: number;
  totalSteps: number;
  language: string;
}) {
  const t = useTemplateTranslations(language);

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <span>
        {language === 'es' ? 'Paso' : 'Step'} {currentStep + 1} {language === 'es' ? 'de' : 'of'} {totalSteps}
      </span>
      <div className="flex space-x-1">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
