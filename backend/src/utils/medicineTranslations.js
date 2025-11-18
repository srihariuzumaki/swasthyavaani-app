import translate from '@vitalets/google-translate-api';

const supportedLanguages = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn'];
const translationCache = new Map();

const translateWithCache = async (text, lang) => {
  if (!text || lang === 'en') return text;
  const cacheKey = `${lang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }
  try {
    const result = await translate(text, { to: lang });
    translationCache.set(cacheKey, result.text);
    return result.text;
  } catch (error) {
    console.error(`Translation failed for lang ${lang}`, error.message);
    translationCache.set(cacheKey, text);
    return text;
  }
};

const translateArray = async (items = [], lang) => {
  if (!Array.isArray(items) || items.length === 0) return items;
  return Promise.all(items.map(text => translateWithCache(text, lang)));
};

/**
 * Get translated medicine data based on language
 * Falls back to English if translation not available
 */
export const getTranslatedMedicine = async (medicine, language = 'en') => {
  if (!medicine) return null;

  const lang = supportedLanguages.includes(language) ? language : 'en';

  const translated = {
    ...(medicine.toObject ? medicine.toObject() : medicine),
  };

  // Get translated name, genericName, description from stored translations
  if (medicine.translations && medicine.translations[lang]) {
    const translation = medicine.translations[lang];
    if (translation.name) translated.name = translation.name;
    if (translation.genericName) translated.genericName = translation.genericName;
    if (translation.description) translated.description = translation.description;
  }

  // Get translated indications/uses from DB
  if (medicine.multilingualIndications && medicine.multilingualIndications[lang]) {
    const translatedIndications = medicine.multilingualIndications[lang];
    if (translatedIndications && translatedIndications.length > 0) {
      translated.indications = translatedIndications;
    }
  }

  if (lang === 'en') {
    return translated;
  }

  // Auto-translate missing fields
  if (!translated.name && medicine.name) {
    translated.name = await translateWithCache(medicine.name, lang);
  }

  if (!translated.genericName && medicine.genericName) {
    translated.genericName = await translateWithCache(medicine.genericName, lang);
  }

  if (!translated.description && medicine.description) {
    translated.description = await translateWithCache(medicine.description, lang);
  }

  if (!translated.indications || translated.indications.length === 0) {
    if (medicine.indications && medicine.indications.length > 0) {
      translated.indications = await translateArray(medicine.indications, lang);
    }
  }

  if (medicine.sideEffects && medicine.sideEffects.length > 0) {
    translated.sideEffects = await translateArray(medicine.sideEffects, lang);
  }

  if (medicine.contraindications && medicine.contraindications.length > 0) {
    translated.contraindications = await translateArray(medicine.contraindications, lang);
  }

  if (medicine.warnings && medicine.warnings.length > 0) {
    translated.warnings = await translateArray(medicine.warnings, lang);
  }

  if (medicine.precautions && medicine.precautions.length > 0) {
    translated.precautions = await translateArray(medicine.precautions, lang);
  }

  if (medicine.dosage) {
    translated.dosage = translated.dosage || { ...medicine.dosage };

    if (medicine.dosage.adult) {
      translated.dosage.adult = { ...medicine.dosage.adult };
      if (medicine.dosage.adult.min) {
        translated.dosage.adult.min = await translateWithCache(medicine.dosage.adult.min, lang);
      }
      if (medicine.dosage.adult.max) {
        translated.dosage.adult.max = await translateWithCache(medicine.dosage.adult.max, lang);
      }
      if (medicine.dosage.adult.frequency) {
        translated.dosage.adult.frequency = await translateWithCache(medicine.dosage.adult.frequency, lang);
      }
    }

    if (medicine.dosage.pediatric) {
      translated.dosage.pediatric = { ...medicine.dosage.pediatric };
      if (medicine.dosage.pediatric.min) {
        translated.dosage.pediatric.min = await translateWithCache(medicine.dosage.pediatric.min, lang);
      }
      if (medicine.dosage.pediatric.max) {
        translated.dosage.pediatric.max = await translateWithCache(medicine.dosage.pediatric.max, lang);
      }
      if (medicine.dosage.pediatric.frequency) {
        translated.dosage.pediatric.frequency = await translateWithCache(medicine.dosage.pediatric.frequency, lang);
      }
    }
  }

  if (medicine.storageInstructions && !translated.storageInstructions) {
    translated.storageInstructions = await translateWithCache(medicine.storageInstructions, lang);
  }

  return translated;
};

/**
 * Get translated medicines array
 */
export const getTranslatedMedicines = async (medicines, language = 'en') => {
  if (!Array.isArray(medicines)) return [];
  return Promise.all(medicines.map(medicine => getTranslatedMedicine(medicine, language)));
};

