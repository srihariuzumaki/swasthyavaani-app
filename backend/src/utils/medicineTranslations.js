import { translateText, translateArray, normalizeLanguageCode } from './translator.js';

const supportedLanguages = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn'];

/**
 * Get translated medicine data based on language
 * Falls back to English if translation not available
 */
export const getTranslatedMedicine = async (medicine, language = 'en') => {
  if (!medicine) return null;

  const normalizedLang = normalizeLanguageCode(language);
  const lang = supportedLanguages.includes(normalizedLang) ? normalizedLang : 'en';

  const translated = {
    ...(medicine.toObject ? medicine.toObject() : medicine),
  };

  // Get translated name, genericName, description from stored translations
  const translationData = medicine.translations?.[lang];
  if (translationData) {
    const translation = translationData;
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

  if (lang !== 'en') {
    const needsAutoName = !translationData || !translationData.name;
    const needsAutoDescription = !translationData || !translationData.description;

    if (needsAutoName && medicine.name) {
      translated.name = await translateText(medicine.name, lang);
    }

    if (needsAutoDescription && medicine.description) {
      translated.description = await translateText(medicine.description, lang);
    }

    if (!translationData?.genericName && medicine.genericName) {
      translated.genericName = await translateText(medicine.genericName, lang);
    }

    translated.indications = await translateArray(
      translated.indications && translationData?.name ? translated.indications : medicine.indications || [],
      lang
    );

    if (medicine.sideEffects?.length) {
      translated.sideEffects = await translateArray(medicine.sideEffects, lang);
    }

    if (medicine.contraindications?.length) {
      translated.contraindications = await translateArray(medicine.contraindications, lang);
    }

    if (medicine.warnings?.length) {
      translated.warnings = await translateArray(medicine.warnings, lang);
    }

    if (medicine.precautions?.length) {
      translated.precautions = await translateArray(medicine.precautions, lang);
    }

    if (medicine.dosage) {
      translated.dosage = translated.dosage || { ...medicine.dosage };

      if (medicine.dosage.adult) {
        translated.dosage.adult = { ...medicine.dosage.adult };
        translated.dosage.adult.min = await translateText(medicine.dosage.adult.min, lang);
        translated.dosage.adult.max = await translateText(medicine.dosage.adult.max, lang);
        translated.dosage.adult.frequency = await translateText(medicine.dosage.adult.frequency, lang);
      }

      if (medicine.dosage.pediatric) {
        translated.dosage.pediatric = { ...medicine.dosage.pediatric };
        translated.dosage.pediatric.min = await translateText(medicine.dosage.pediatric.min, lang);
        translated.dosage.pediatric.max = await translateText(medicine.dosage.pediatric.max, lang);
        translated.dosage.pediatric.frequency = await translateText(medicine.dosage.pediatric.frequency, lang);
      }
    }

    if (medicine.storageInstructions) {
      translated.storageInstructions = await translateText(medicine.storageInstructions, lang);
    }
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
