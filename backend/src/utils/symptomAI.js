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
 * Analyze custom symptom using Gemini AI
 * @param {string} symptomText - User's symptom description
 * @param {string} language - Target language for response
 * @returns {Promise<Object>} - Analyzed symptom with suggestions
 */
export const analyzeSymptomWithAI = async (symptomText, language = 'en') => {
    try {
        const ai = getGeminiAI();
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
