/**
 * Get translated medicine data based on language
 * Falls back to English if translation not available
 */
export const getTranslatedMedicine = (medicine, language = 'en') => {
  if (!medicine) return null;

  const supportedLanguages = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn'];
  const lang = supportedLanguages.includes(language) ? language : 'en';

  const translated = {
    ...medicine.toObject ? medicine.toObject() : medicine,
  };

  // Get translated name, genericName, description
  if (medicine.translations && medicine.translations[lang]) {
    const translation = medicine.translations[lang];
    if (translation.name) translated.name = translation.name;
    if (translation.genericName) translated.genericName = translation.genericName;
    if (translation.description) translated.description = translation.description;
  }

  // Get translated indications/uses
  if (medicine.multilingualIndications && medicine.multilingualIndications[lang]) {
    const translatedIndications = medicine.multilingualIndications[lang];
    if (translatedIndications && translatedIndications.length > 0) {
      translated.indications = translatedIndications;
    }
  }

  // If no translations available, fall back to default English
  if (lang !== 'en' && !translated.name) {
    // Use original name as fallback
    translated.name = medicine.name || translated.name;
  }

  return translated;
};

/**
 * Get translated medicines array
 */
export const getTranslatedMedicines = (medicines, language = 'en') => {
  if (!Array.isArray(medicines)) return [];
  return medicines.map(medicine => getTranslatedMedicine(medicine, language));
};

