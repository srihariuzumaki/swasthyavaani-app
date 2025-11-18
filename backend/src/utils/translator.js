import translatePkg from '@vitalets/google-translate-api';

const translateFn = translatePkg?.default || translatePkg;
const translationCache = new Map();

export const normalizeLanguageCode = (lang = 'en') => {
  if (!lang) return 'en';
  return lang.toLowerCase().split('-')[0] || 'en';
};

export const translateText = async (text, targetLanguage = 'en') => {
  if (!text) return text;
  const lang = normalizeLanguageCode(targetLanguage);
  if (lang === 'en') return text;

  const cacheKey = `${lang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const result = await translateFn(text, { to: lang });
    translationCache.set(cacheKey, result.text);
    return result.text;
  } catch (error) {
    console.error(`Translation failed for lang ${lang}`, error.message);
    translationCache.set(cacheKey, text);
    return text;
  }
};

export const translateArray = async (items = [], targetLanguage = 'en') => {
  if (!Array.isArray(items) || items.length === 0) return items;
  return Promise.all(items.map((item) => translateText(item, targetLanguage)));
};


