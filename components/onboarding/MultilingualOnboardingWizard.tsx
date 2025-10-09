// Multilingual Onboarding Wizard - Task 4.2
// Main wizard component for the onboarding process

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StepIndicator } from './StepIndicator';
import { LanguageSelectionStep } from './LanguageSelectionStep';
import { SMSPreferencesStep } from './SMSPreferencesStep';
import { OnboardingWizardState, ONBOARDING_STEPS, BusinessData, SMSPreferences } from '@/lib/onboarding/wizard-state';

interface MultilingualOnboardingWizardProps {
  initialTemplate?: string;
  initialLanguage?: string;
}

export function MultilingualOnboardingWizard({
  initialTemplate = '',
  initialLanguage = 'en'
}: MultilingualOnboardingWizardProps) {
  const router = useRouter();
  const [wizardState, setWizardState] = useState<OnboardingWizardState | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [businessData, setBusinessData] = useState<Partial<BusinessData>>({});
  const [smsPreferences, setSmsPreferences] = useState<Partial<SMSPreferences>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize wizard state
  useEffect(() => {
    const state = new OnboardingWizardState();
    state.loadProgress();
    setWizardState(state);
    
    // Subscribe to state changes
    const unsubscribe = state.subscribe((newState) => {
      setCurrentStep(newState.currentStep);
      setSelectedTemplate(newState.selectedTemplate);
      setSelectedLanguage(newState.selectedLanguage);
      setBusinessData(newState.businessData);
      setSmsPreferences(newState.smsPreferences);
    });

    return unsubscribe;
  }, []);

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    wizardState?.updateState({ selectedLanguage: language });
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    wizardState?.updateState({ selectedTemplate: template });
  };

  const handleBusinessDataChange = (data: Partial<BusinessData>) => {
    setBusinessData(prev => ({ ...prev, ...data }));
    wizardState?.updateState({ businessData: { ...businessData, ...data } });
  };

  const handleSMSPreferencesChange = (prefs: Partial<SMSPreferences>) => {
    setSmsPreferences(prev => ({ ...prev, ...prefs }));
    wizardState?.updateState({ smsPreferences: { ...smsPreferences, ...prefs } });
  };

  const handleStepComplete = async (stepData: any) => {
    try {
      setIsLoading(true);
      
      // Update state based on current step
      switch (currentStep) {
        case 0: // Language Selection
          handleLanguageSelect(stepData.language);
          break;
        case 1: // Template Selection
          handleTemplateSelect(stepData.template);
          break;
        case 2: // Business Information
          handleBusinessDataChange(stepData);
          break;
        case 3: // SMS Preferences
          handleSMSPreferencesChange(stepData);
          break;
        case 4: // Phone Setup
          // Handle phone setup
          break;
        case 5: // Testing
          // Handle testing completion
          break;
      }

      // Mark current step as completed
      const currentStepData = ONBOARDING_STEPS[currentStep];
      if (currentStepData) {
        wizardState?.completeStep(currentStepData.id);
      }

      // Move to next step or complete wizard
      if (currentStep < ONBOARDING_STEPS.length - 1) {
        wizardState?.nextStep();
      } else {
        // Complete onboarding
        await completeOnboarding();
      }
    } catch (error) {
      console.error('Error completing step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Create multilingual assistant
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          language: selectedLanguage,
          businessData,
          smsPreferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      const result = await response.json();
      
      // Save progress
      wizardState?.updateState({ isCompleted: true });
      wizardState?.saveProgress();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleStepClick = (step: number) => {
    if (wizardState) {
      wizardState.goToStep(step);
    }
  };

  const handlePreviousStep = () => {
    wizardState?.previousStep();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <LanguageSelectionStep
            selectedLanguage={selectedLanguage}
            onLanguageSelect={handleLanguageSelect}
            onComplete={() => handleStepComplete({ language: selectedLanguage })}
            language={selectedLanguage}
          />
        );
      
      case 1:
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {selectedLanguage === 'es' 
                  ? 'Seleccione su plantilla de industria'
                  : 'Select Your Industry Template'
                }
              </h2>
              <p className="text-lg text-gray-600">
                {selectedLanguage === 'es'
                  ? 'Elija la plantilla que mejor se adapte a su industria'
                  : 'Choose the template that best fits your industry'
                }
              </p>
            </div>
            {/* Template selection would go here */}
            <div className="text-center">
              <button
                onClick={() => handleStepComplete({ template: 'hvac' })}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {selectedLanguage === 'es' ? 'Continuar' : 'Continue'}
              </button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {selectedLanguage === 'es' 
                  ? 'Información del negocio'
                  : 'Business Information'
                }
              </h2>
              <p className="text-lg text-gray-600">
                {selectedLanguage === 'es'
                  ? 'Ingrese los detalles de su negocio'
                  : 'Enter your business details'
                }
              </p>
            </div>
            {/* Business info form would go here */}
            <div className="text-center">
              <button
                onClick={() => handleStepComplete({ businessName: 'Test Business' })}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {selectedLanguage === 'es' ? 'Continuar' : 'Continue'}
              </button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <SMSPreferencesStep
            preferences={smsPreferences}
            onPreferencesChange={handleSMSPreferencesChange}
            onComplete={handleStepComplete}
            language={selectedLanguage}
          />
        );
      
      case 4:
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {selectedLanguage === 'es' 
                  ? 'Configuración de teléfono'
                  : 'Phone Setup'
                }
              </h2>
              <p className="text-lg text-gray-600">
                {selectedLanguage === 'es'
                  ? 'Configure los números de teléfono y pruebe las conexiones'
                  : 'Configure phone numbers and test connections'
                }
              </p>
            </div>
            {/* Phone setup form would go here */}
            <div className="text-center">
              <button
                onClick={() => handleStepComplete({ phoneSetup: { testCallCompleted: true, testSMSCompleted: true } })}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {selectedLanguage === 'es' ? 'Continuar' : 'Continue'}
              </button>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {selectedLanguage === 'es' 
                  ? 'Pruebas'
                  : 'Testing'
                }
              </h2>
              <p className="text-lg text-gray-600">
                {selectedLanguage === 'es'
                  ? 'Pruebe su asistente de IA y sistema SMS'
                  : 'Test your AI assistant and SMS system'
                }
              </p>
            </div>
            {/* Testing interface would go here */}
            <div className="text-center">
              <button
                onClick={() => handleStepComplete({ testing: { completed: true } })}
                className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                {selectedLanguage === 'es' ? 'Completar configuración' : 'Complete Setup'}
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!wizardState) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={ONBOARDING_STEPS.length}
        language={selectedLanguage}
        steps={ONBOARDING_STEPS.map(step => ({
          id: step.id,
          title: step.title,
          isCompleted: step.isCompleted,
          isOptional: step.isOptional
        }))}
        onStepClick={handleStepClick}
      />

      {/* Current Step Content */}
      <div className="py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderCurrentStep()
        )}
      </div>

      {/* Navigation */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedLanguage === 'es' ? 'Anterior' : 'Previous'}
          </button>
          
          <div className="text-sm text-gray-600">
            {selectedLanguage === 'es' ? 'Paso' : 'Step'} {currentStep + 1} {selectedLanguage === 'es' ? 'de' : 'of'} {ONBOARDING_STEPS.length}
          </div>
        </div>
      </div>
    </div>
  );
}
