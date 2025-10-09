// SMS Preferences Step - Task 4.2
// SMS configuration step in the onboarding wizard

'use client';

import { useState } from 'react';
import { useTemplateTranslations } from '@/lib/i18n/template-translations';

interface SMSPreferences {
  appointmentConfirmations: boolean;
  appointmentReminders: boolean;
  emergencyAlerts: boolean;
  statusUpdates: boolean;
  followUpSurveys: boolean;
  smsLanguage: string;
  reminderTiming: {
    appointmentReminder: number;
    followUpSurvey: number;
  };
  optInRequired: boolean;
  twoWaySMS: boolean;
}

interface SMSPreferencesStepProps {
  preferences: Partial<SMSPreferences>;
  onPreferencesChange: (prefs: Partial<SMSPreferences>) => void;
  onComplete: (data: SMSPreferences) => void;
  language: string;
}

export function SMSPreferencesStep({
  preferences,
  onPreferencesChange,
  onComplete,
  language
}: SMSPreferencesStepProps) {
  const [formData, setFormData] = useState<SMSPreferences>({
    appointmentConfirmations: true,
    appointmentReminders: true,
    emergencyAlerts: true,
    statusUpdates: true,
    followUpSurveys: true,
    smsLanguage: language,
    reminderTiming: {
      appointmentReminder: 24,
      followUpSurvey: 24
    },
    optInRequired: true,
    twoWaySMS: true,
    ...preferences
  });

  const t = useTemplateTranslations(language);

  const handleChange = (field: keyof SMSPreferences, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onPreferencesChange(newData);
  };

  const handleNestedChange = (parent: keyof SMSPreferences, field: string, value: any) => {
    const newData = {
      ...formData,
      [parent]: {
        ...(formData[parent] as any),
        [field]: value
      }
    };
    setFormData(newData);
    onPreferencesChange(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {language === 'es' 
            ? 'Preferencias de SMS'
            : 'SMS Preferences'
          }
        </h2>
        <p className="text-lg text-gray-600">
          {language === 'es'
            ? 'Configure cómo desea que su asistente de IA se comunique con los clientes por SMS'
            : 'Configure how you want your AI assistant to communicate with customers via SMS'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Appointment Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {language === 'es' ? 'Notificaciones de Citas' : 'Appointment Notifications'}
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.appointmentConfirmations}
                onChange={(e) => handleChange('appointmentConfirmations', e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {language === 'es' ? 'Enviar confirmaciones de citas' : 'Send appointment confirmations'}
                </div>
                <div className="text-sm text-gray-600">
                  {language === 'es' 
                    ? 'Los clientes recibirán un SMS inmediatamente después de programar una cita'
                    : 'Customers will receive an SMS immediately after scheduling an appointment'
                  }
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.appointmentReminders}
                onChange={(e) => handleChange('appointmentReminders', e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {language === 'es' ? 'Enviar recordatorios de citas' : 'Send appointment reminders'}
                </div>
                <div className="text-sm text-gray-600">
                  {language === 'es' 
                    ? 'Los clientes recibirán recordatorios antes de sus citas programadas'
                    : 'Customers will receive reminders before their scheduled appointments'
                  }
                </div>
              </div>
            </label>

            {formData.appointmentReminders && (
              <div className="ml-7">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Horas antes de la cita' : 'Hours before appointment'}
                </label>
                <select
                  value={formData.reminderTiming.appointmentReminder}
                  onChange={(e) => handleNestedChange('reminderTiming', 'appointmentReminder', parseInt(e.target.value))}
                  className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>{language === 'es' ? '1 hora' : '1 hour'}</option>
                  <option value={2}>{language === 'es' ? '2 horas' : '2 hours'}</option>
                  <option value={6}>{language === 'es' ? '6 horas' : '6 hours'}</option>
                  <option value={12}>{language === 'es' ? '12 horas' : '12 hours'}</option>
                  <option value={24}>{language === 'es' ? '24 horas' : '24 hours'}</option>
                  <option value={48}>{language === 'es' ? '48 horas' : '48 hours'}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {language === 'es' ? 'Notificaciones de Emergencia' : 'Emergency Notifications'}
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.emergencyAlerts}
                onChange={(e) => handleChange('emergencyAlerts', e.target.checked)}
                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {language === 'es' ? 'Enviar alertas de emergencia' : 'Send emergency alerts'}
                </div>
                <div className="text-sm text-gray-600">
                  {language === 'es' 
                    ? 'Reciba notificaciones inmediatas cuando se detecten emergencias'
                    : 'Receive immediate notifications when emergencies are detected'
                  }
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.statusUpdates}
                onChange={(e) => handleChange('statusUpdates', e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {language === 'es' ? 'Enviar actualizaciones de estado' : 'Send status updates'}
                </div>
                <div className="text-sm text-gray-600">
                  {language === 'es' 
                    ? 'Mantenga a los clientes informados sobre el progreso de sus servicios'
                    : 'Keep customers informed about the progress of their services'
                  }
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Follow-up and Surveys */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {language === 'es' ? 'Seguimiento y Encuestas' : 'Follow-up and Surveys'}
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.followUpSurveys}
                onChange={(e) => handleChange('followUpSurveys', e.target.checked)}
                className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {language === 'es' ? 'Enviar encuestas de seguimiento' : 'Send follow-up surveys'}
                </div>
                <div className="text-sm text-gray-600">
                  {language === 'es' 
                    ? 'Recopile comentarios de los clientes después de completar los servicios'
                    : 'Collect customer feedback after completing services'
                  }
                </div>
              </div>
            </label>

            {formData.followUpSurveys && (
              <div className="ml-7">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Horas después del servicio' : 'Hours after service'}
                </label>
                <select
                  value={formData.reminderTiming.followUpSurvey}
                  onChange={(e) => handleNestedChange('reminderTiming', 'followUpSurvey', parseInt(e.target.value))}
                  className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>{language === 'es' ? '1 hora' : '1 hour'}</option>
                  <option value={6}>{language === 'es' ? '6 horas' : '6 hours'}</option>
                  <option value={24}>{language === 'es' ? '24 horas' : '24 hours'}</option>
                  <option value={48}>{language === 'es' ? '48 horas' : '48 hours'}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Language Preferences */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {language === 'es' ? 'Preferencias de Idioma' : 'Language Preferences'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'es' ? 'Idioma para SMS' : 'SMS Language'}
              </label>
              <select
                value={formData.smsLanguage}
                onChange={(e) => handleChange('smsLanguage', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="auto">{language === 'es' ? 'Detección automática' : 'Auto-detect'}</option>
              </select>
              <p className="mt-1 text-sm text-gray-600">
                {language === 'es' 
                  ? 'El idioma en el que se enviarán los mensajes SMS a los clientes'
                  : 'The language in which SMS messages will be sent to customers'
                }
              </p>
            </div>

            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.twoWaySMS}
                onChange={(e) => handleChange('twoWaySMS', e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {language === 'es' ? 'SMS bidireccional' : 'Two-way SMS'}
                </div>
                <div className="text-sm text-gray-600">
                  {language === 'es' 
                    ? 'Permitir que los clientes respondan a los mensajes SMS'
                    : 'Allow customers to respond to SMS messages'
                  }
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.optInRequired}
                onChange={(e) => handleChange('optInRequired', e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {language === 'es' ? 'Requerir consentimiento' : 'Require opt-in'}
                </div>
                <div className="text-sm text-gray-600">
                  {language === 'es' 
                    ? 'Los clientes deben optar por recibir mensajes SMS'
                    : 'Customers must opt-in to receive SMS messages'
                  }
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {language === 'es' ? 'Continuar' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
