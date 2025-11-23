import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
let genAI = null;

const getGeminiAI = () => {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

/**
 * Translate text array using Gemini AI
 * @param {string[]} textArray - Array of text to translate
 * @param {string} targetLanguage - Target language code
 * @returns {Promise<string[]>} - Translated text array
 */
export const translateTextArray = async (textArray, targetLanguage = 'en') => {
    if (!textArray || textArray.length === 0) return [];
    if (targetLanguage === 'en') return textArray; // No translation needed for English

    const languageNames = {
        en: 'English',
        hi: 'Hindi',
        ta: 'Tamil',
        te: 'Telugu',
        bn: 'Bengali',
        mr: 'Marathi',
        gu: 'Gujarati',
        kn: 'Kannada'
    };

    const targetLang = languageNames[targetLanguage] || 'English';

    try {
        const ai = getGeminiAI();
        const model = ai.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Translate the following text items to ${targetLang}. Return ONLY a JSON array with the translations in the same order.

Text to translate:
${JSON.stringify(textArray)}

Return format: ["translation 1", "translation 2", ...]

IMPORTANT: Return ONLY the JSON array, no markdown formatting, no explanations.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text().trim();

        // Remove markdown code blocks if present
        if (text.startsWith('```json')) {
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (text.startsWith('```')) {
            text = text.replace(/```\n?/g, '');
        }

        const translated = JSON.parse(text);
        return Array.isArray(translated) ? translated : textArray;
    } catch (error) {
        console.error('Translation error:', error);
        return textArray; // Return original if translation fails
    }
};

/**
 * Analyze custom symptom using Gemini AI
 * @param {string} symptomText - User's symptom description
 * @param {string} language - Target language for response
 * @returns {Promise<Object>} - Analyzed symptom with suggestions
 */
export const analyzeSymptomWithAI = async (symptomText, language = 'en') => {
    try {
        const ai = getGeminiAI();
        const model = ai.getGenerativeModel({ model: 'gemini-pro' });

        const languageNames = {
            en: 'English',
            hi: 'Hindi',
            ta: 'Tamil',
            te: 'Telugu',
            bn: 'Bengali',
            mr: 'Marathi',
            gu: 'Gujarati',
            kn: 'Kannada'
        };

        const targetLanguage = languageNames[language] || 'English';

        const prompt = `You are a medical assistant. A user has described this symptom: "${symptomText}"

Please provide medical advice in ${targetLanguage} language in the following JSON format:

{
  "symptomName": "Brief name for the symptom",
  "description": "Brief description of what this symptom might indicate",
  "suggestedMedicines": [
    {
      "name": "Medicine name",
      "dosage": "Recommended dosage",
      "notes": "Important notes or warnings"
    }
  ],
  "homeRemedies": [
    "Home remedy 1",
    "Home remedy 2",
    "Home remedy 3"
  ],
  "whenToSeeDoctor": [
    "Warning sign 1",
    "Warning sign 2",
    "Warning sign 3"
  ]
}

IMPORTANT:
1. Only suggest over-the-counter (OTC) medicines
2. Provide 2-3 medicine suggestions maximum
3. Provide 3-5 home remedies
4. Provide 3-5 warning signs for when to see a doctor
5. All text must be in ${targetLanguage}
6. Be conservative and safe with medical advice
7. Return ONLY valid JSON, no markdown formatting`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Extract JSON from response (remove markdown code blocks if present)
        let jsonText = text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const parsedResponse = JSON.parse(jsonText);

        return {
            success: true,
            data: parsedResponse
        };
    } catch (error) {
        console.error('Error analyzing symptom with AI:', error);
        throw new Error('Failed to analyze symptom. Please try again.');
    }
};
