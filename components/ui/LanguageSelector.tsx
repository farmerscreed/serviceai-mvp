// Language Selector - Task 4.1
// Multi-language selector with flag indicators

'use client';

import { useState } from 'react';
import { getAvailableLanguages } from '@/lib/i18n/template-translations';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  className?: string;
}

export function LanguageSelector({ 
  selectedLanguage, 
  onLanguageChange, 
  className = '' 
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const languages = getAvailableLanguages();
  const currentLanguage = languages.find(lang => lang.code === selectedLanguage) || languages[0];

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Language Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="font-medium text-gray-700">{currentLanguage.name}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Language Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  language.code === selectedLanguage 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {language.code === selectedLanguage && (
                  <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactLanguageSelector({ 
  selectedLanguage, 
  onLanguageChange, 
  className = '' 
}: LanguageSelectorProps) {
  const languages = getAvailableLanguages();
  const currentLanguage = languages.find(lang => lang.code === selectedLanguage) || languages[0];

  const handleToggle = () => {
    const currentIndex = languages.findIndex(lang => lang.code === selectedLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    onLanguageChange(languages[nextIndex].code);
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${className}`}
      title={`Switch to ${languages.find(lang => lang.code !== selectedLanguage)?.name}`}
    >
      <span className="text-lg">{currentLanguage.flag}</span>
      <span className="text-sm font-medium text-gray-700">{currentLanguage.code.toUpperCase()}</span>
    </button>
  );
}
