// Onboarding Wizard State Management - Task 4.2
// State management for the multilingual onboarding wizard

export interface BusinessData {
  businessName: string;
  businessType: string;
  industryCode: string;
  primaryLanguage: string;
  secondaryLanguages: string[];
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  businessHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  emergencyContact: {
    name: string;
    phone: string;
    email: string;
  };
  serviceAreas: string[];
  specialties: string[];
}

export interface SMSPreferences {
  appointmentConfirmations: boolean;
  appointmentReminders: boolean;
  emergencyAlerts: boolean;
  statusUpdates: boolean;
  followUpSurveys: boolean;
  smsLanguage: string;
  reminderTiming: {
    appointmentReminder: number; // hours before
    followUpSurvey: number; // hours after
  };
  optInRequired: boolean;
  twoWaySMS: boolean;
}

export interface PhoneSetup {
  vapiPhoneNumber: string;
  twilioPhoneNumber: string;
  businessPhoneNumber: string;
  emergencyPhoneNumber: string;
  testCallCompleted: boolean;
  testSMSCompleted: boolean;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  selectedTemplate: string;
  selectedLanguage: string;
  businessData: Partial<BusinessData>;
  smsPreferences: Partial<SMSPreferences>;
  phoneSetup: Partial<PhoneSetup>;
  isCompleted: boolean;
  errors: Record<string, string>;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  isCompleted: boolean;
  isOptional: boolean;
  validation: string[];
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'language-selection',
    title: 'Select Language',
    description: 'Choose your preferred language for the AI assistant',
    component: 'LanguageSelectionStep',
    isCompleted: false,
    isOptional: false,
    validation: ['selectedLanguage']
  },
  {
    id: 'template-selection',
    title: 'Choose Template',
    description: 'Select your industry template',
    component: 'TemplateSelectionStep',
    isCompleted: false,
    isOptional: false,
    validation: ['selectedTemplate']
  },
  {
    id: 'business-info',
    title: 'Business Information',
    description: 'Enter your business details',
    component: 'BusinessInfoStep',
    isCompleted: false,
    isOptional: false,
    validation: ['businessName', 'contactInfo.phone', 'contactInfo.email']
  },
  {
    id: 'sms-preferences',
    title: 'SMS Preferences',
    description: 'Configure SMS notifications and language preferences',
    component: 'SMSPreferencesStep',
    isCompleted: false,
    isOptional: false,
    validation: ['smsPreferences.smsLanguage']
  },
  {
    id: 'phone-setup',
    title: 'Phone Setup',
    description: 'Configure phone numbers and test connections',
    component: 'PhoneSetupStep',
    isCompleted: false,
    isOptional: false,
    validation: ['phoneSetup.vapiPhoneNumber', 'phoneSetup.twilioPhoneNumber']
  },
  {
    id: 'testing',
    title: 'Testing',
    description: 'Test your AI assistant and SMS system',
    component: 'TestingStep',
    isCompleted: false,
    isOptional: false,
    validation: ['phoneSetup.testCallCompleted', 'phoneSetup.testSMSCompleted']
  }
];

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  currentStep: 0,
  totalSteps: ONBOARDING_STEPS.length,
  selectedTemplate: '',
  selectedLanguage: 'en',
  businessData: {},
  smsPreferences: {
    appointmentConfirmations: true,
    appointmentReminders: true,
    emergencyAlerts: true,
    statusUpdates: true,
    followUpSurveys: true,
    smsLanguage: 'en',
    reminderTiming: {
      appointmentReminder: 24,
      followUpSurvey: 24
    },
    optInRequired: true,
    twoWaySMS: true
  },
  phoneSetup: {},
  isCompleted: false,
  errors: {}
};

// Wizard state management functions
export class OnboardingWizardState {
  private state: OnboardingState;
  private listeners: Array<(state: OnboardingState) => void> = [];

  constructor(initialState: OnboardingState = INITIAL_ONBOARDING_STATE) {
    this.state = { ...initialState };
  }

  getState(): OnboardingState {
    return { ...this.state };
  }

  subscribe(listener: (state: OnboardingState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  updateState(updates: Partial<OnboardingState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  nextStep(): void {
    if (this.state.currentStep < this.state.totalSteps - 1) {
      this.updateState({ currentStep: this.state.currentStep + 1 });
    }
  }

  previousStep(): void {
    if (this.state.currentStep > 0) {
      this.updateState({ currentStep: this.state.currentStep - 1 });
    }
  }

  goToStep(step: number): void {
    if (step >= 0 && step < this.state.totalSteps) {
      this.updateState({ currentStep: step });
    }
  }

  completeStep(stepId: string): void {
    const stepIndex = ONBOARDING_STEPS.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      const updatedSteps = [...ONBOARDING_STEPS];
      updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], isCompleted: true };
      // Note: In a real implementation, you'd update the steps in state
    }
  }

  setError(field: string, error: string): void {
    this.updateState({
      errors: { ...this.state.errors, [field]: error }
    });
  }

  clearError(field: string): void {
    const { [field]: removed, ...rest } = this.state.errors;
    this.updateState({ errors: rest });
  }

  clearAllErrors(): void {
    this.updateState({ errors: {} });
  }

  isStepValid(stepId: string): boolean {
    const step = ONBOARDING_STEPS.find(s => s.id === stepId);
    if (!step) return false;

    return step.validation.every(field => {
      const value = this.getFieldValue(field);
      return value !== undefined && value !== null && value !== '';
    });
  }

  private getFieldValue(field: string): any {
    const keys = field.split('.');
    let value: any = this.state;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  canProceedToNextStep(): boolean {
    const currentStep = ONBOARDING_STEPS[this.state.currentStep];
    return this.isStepValid(currentStep.id);
  }

  getCompletionPercentage(): number {
    const completedSteps = ONBOARDING_STEPS.filter(step => step.isCompleted).length;
    return Math.round((completedSteps / this.state.totalSteps) * 100);
  }

  saveProgress(): void {
    // In a real implementation, this would save to localStorage or backend
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding-progress', JSON.stringify(this.state));
    }
  }

  loadProgress(): void {
    // In a real implementation, this would load from localStorage or backend
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('onboarding-progress');
      if (saved) {
        try {
          const savedState = JSON.parse(saved);
          this.updateState(savedState);
        } catch (error) {
          console.error('Error loading onboarding progress:', error);
        }
      }
    }
  }

  reset(): void {
    this.updateState(INITIAL_ONBOARDING_STATE);
  }
}
