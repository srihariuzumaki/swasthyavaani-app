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

// Define supported languages outside component to prevent re-renders
const SUPPORTED_LANGUAGES: Array<{ code: SupportedLanguage; name: string; nativeName: string }> = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    // Initialize from localStorage
    const savedLang = localStorage.getItem('app_language');
    if (savedLang && SUPPORTED_LANGUAGES.find(l => l.code === savedLang)) {
      return savedLang as SupportedLanguage;
    }
    return 'en';
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language from localStorage or user preference
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        let lang: SupportedLanguage = 'en';

        // Check user preference first
        if (user?.preferences?.language) {
          lang = user.preferences.language as SupportedLanguage;
        } else {
          // Check localStorage
          const savedLang = localStorage.getItem('app_language');
          if (savedLang && SUPPORTED_LANGUAGES.find(l => l.code === savedLang)) {
            lang = savedLang as SupportedLanguage;
          }
        }

        // Set language in i18n
        await i18n.changeLanguage(lang);
        setLanguage(lang);
        localStorage.setItem('app_language', lang);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing language:', error);
        setIsInitialized(true); // Still set initialized to prevent blocking
      }
    };

    if (!isInitialized) {
      initializeLanguage();
    }
  }, [user, i18n, isInitialized]);

  const changeLanguage = async (lang: SupportedLanguage) => {
    try {
      // Validate language code
      if (!SUPPORTED_LANGUAGES.find(l => l.code === lang)) {
        console.error('Invalid language code:', lang);
        return;
      }

      // Update i18n first
      await i18n.changeLanguage(lang);
      
      // Update state and localStorage
      setLanguage(lang);
      localStorage.setItem('app_language', lang);

      // Update user preference if logged in (don't block on this)
      if (user) {
        updateProfile({
          preferences: {
            ...user.preferences,
            language: lang,
          },
        }).catch((error) => {
          console.error('Failed to update user language preference:', error);
          // Don't throw - language change was successful
        });
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      // Fallback to English on error
      try {
        await i18n.changeLanguage('en');
        setLanguage('en');
        localStorage.setItem('app_language', 'en');
      } catch (fallbackError) {
        console.error('Failed to fallback to English:', fallbackError);
      }
      throw error;
    }
  };

  const value: LanguageContextType = {
    language,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  // Always render children, even if not initialized (will use default language)
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

