# Multilingual Medicine App Implementation

This document describes the multilingual implementation for the Swasthya Vaani medicine app.

## Overview

The app now supports 8 languages:
- English (en) - Default
- Hindi (hi) - हिंदी
- Tamil (ta) - தமிழ்
- Telugu (te) - తెలుగు
- Bengali (bn) - বাংলা
- Marathi (mr) - मराठी
- Gujarati (gu) - ગુજરાતી
- Kannada (kn) - ಕನ್ನಡ

## Architecture

### Frontend

1. **i18n Setup** (`src/i18n/config.ts`)
   - Uses `react-i18next` for translations
   - Loads translations from JSON files
   - Persists language preference in localStorage

2. **Language Context** (`src/contexts/LanguageContext.tsx`)
   - Manages current language state
   - Syncs with user preferences
   - Provides language switching functionality

3. **Translation Files** (`src/locales/{lang}/common.json`)
   - Organized by language
   - Contains all UI text translations
   - Structure: `{namespace: {key: value}}`

4. **Language Selector Component** (`src/components/LanguageSelector.tsx`)
   - Dialog-based language switcher
   - Shows all supported languages with native names
   - Updates user preference on change

### Backend

1. **Medicine Model** (`backend/src/models/Medicine.js`)
   - Added `translations` field for multilingual names/descriptions
   - Added `multilingualIndications` for translated uses/indications
   - Structure:
     ```javascript
     translations: {
       en: { name, genericName, description },
       hi: { name, genericName, description },
       // ... other languages
     }
     ```

2. **Translation Utility** (`backend/src/utils/medicineTranslations.js`)
   - `getTranslatedMedicine()` - Returns medicine data in requested language
   - `getTranslatedMedicines()` - Returns array of translated medicines
   - Falls back to English if translation not available

3. **API Routes** (`backend/src/routes/medicines.js`)
   - Accepts `lang` query parameter
   - Returns translated medicine data based on language
   - Defaults to English if no language specified

## Usage

### Frontend Components

```tsx
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

const MyComponent = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  return (
    <div>
      <h1>{t("home.greeting", { name: "User" })}</h1>
      <button onClick={() => changeLanguage("hi")}>
        Switch to Hindi
      </button>
    </div>
  );
};
```

### API Calls

```typescript
// Search medicines with language
const response = await apiClient.searchMedicines({
  search: "paracetamol",
  lang: "hi"
});

// Get medicine details with language
const medicine = await apiClient.getMedicine(id, "ta");
```

## Adding New Languages

1. Create translation file: `src/locales/{code}/common.json`
2. Update `src/i18n/config.ts` to import and add the language
3. Update `src/contexts/LanguageContext.tsx` to include in `supportedLanguages`
4. Update `backend/src/models/Medicine.js` to add translation fields
5. Update `backend/src/utils/medicineTranslations.js` to handle new language

## Adding Medicine Translations

To add translations for medicines:

1. **Manual Entry (Admin Panel - Future)**
   - Store translations in `medicine.translations[lang]`
   - Store indications in `medicine.multilingualIndications[lang]`

2. **API Translation Service (Future)**
   - Use translation API (Google Translate, DeepL, etc.)
   - Translate medicine names and descriptions
   - Store in database for faster retrieval

## Current Status

✅ UI translations implemented
✅ Language selector component
✅ Backend API supports language parameter
✅ Medicine model updated for multilingual data
✅ Translation utility functions created
✅ User preference sync with database

## Future Enhancements

1. **Automatic Translation**
   - Integrate translation API for medicine data
   - Translate descriptions, side effects, etc.

2. **Search in Multiple Languages**
   - Allow searching medicine names in any language
   - Return results in user's preferred language

3. **Voice Input/Output**
   - Support voice input in different languages
   - Text-to-speech in selected language

4. **Admin Panel**
   - Interface for managing medicine translations
   - Bulk translation import/export

5. **Translation Management**
   - Translation completeness tracking
   - Missing translation alerts
   - Community contributions

## Testing

To test multilingual features:

1. Change language in Profile page
2. Search for medicines - should use selected language
3. View medicine details - should show translated content
4. UI text should change based on selected language

## Notes

- English is always the fallback language
- If translation is missing, English version is shown
- Language preference is saved in user profile
- Medicine translations need to be added manually or via translation service

