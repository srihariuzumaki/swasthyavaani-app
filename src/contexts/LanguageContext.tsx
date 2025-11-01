import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import apiClient from '@/lib/api';

type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn';

interface LanguageContextType {
  language: SupportedLanguage;
  changeLanguage: (lang: SupportedLanguage) => Promise<void>;
  supportedLanguages: Array<{ code: SupportedLanguage; name: string; nativeName: string }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  const supportedLanguages: Array<{ code: SupportedLanguage; name: string; nativeName: string }> = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  ];

  // Initialize language from localStorage or user preference
  useEffect(() => {
    const initializeLanguage = async () => {
      let lang: SupportedLanguage = 'en';

      // Check user preference first
      if (user?.preferences?.language) {
        lang = user.preferences.language as SupportedLanguage;
      } else {
        // Check localStorage
        const savedLang = localStorage.getItem('app_language');
        if (savedLang && supportedLanguages.find(l => l.code === savedLang)) {
          lang = savedLang as SupportedLanguage;
        }
      }

      // Set language in i18n
      await i18n.changeLanguage(lang);
      setLanguage(lang);
      localStorage.setItem('app_language', lang);
    };

    initializeLanguage();
  }, [user, i18n, supportedLanguages]);

  const changeLanguage = async (lang: SupportedLanguage) => {
    try {
      // Update i18n
      await i18n.changeLanguage(lang);
      setLanguage(lang);
      localStorage.setItem('app_language', lang);

      // Update user preference if logged in
      if (user) {
        try {
          await updateProfile({
            preferences: {
              ...user.preferences,
              language: lang,
            },
          });
        } catch (error) {
          console.error('Failed to update user language preference:', error);
        }
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    }
  };

  const value: LanguageContextType = {
    language,
    changeLanguage,
    supportedLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

