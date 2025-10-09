// Template Selection Page - Task 4.1
// Page for selecting industry templates in multiple languages

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MultilingualTemplateSelection } from '@/components/templates/MultilingualTemplateSelection';

export default function TemplateSelectionPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const handleTemplateSelect = (industryCode: string, language: string) => {
    setSelectedTemplate(industryCode);
    setSelectedLanguage(language);
    
    // Navigate to onboarding wizard with selected template and language
    router.push(`/onboarding?template=${industryCode}&language=${language}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MultilingualTemplateSelection
        onTemplateSelect={handleTemplateSelect}
        userLanguage="en"
        selectedTemplate={selectedTemplate}
        selectedLanguage={selectedLanguage}
      />
    </div>
  );
}
