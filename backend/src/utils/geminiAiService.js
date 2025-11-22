import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ENABLE_AI_VALIDATION = process.env.ENABLE_AI_VALIDATION === 'true';

let genAI = null;
let model = null;

/**
 * Initialize Gemini AI
 */
const initializeGemini = () => {
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not found. AI validation will be disabled.');
        return false;
    }

    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('Gemini AI initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
        return false;
    }
};

/**
 * Extract text from image using Gemini Pro Vision (FREE - No billing required!)
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} scanType - Type of scan (label, handwritten, printed)
 * @returns {Promise<{text: string, confidence: number, blocks: Array}>}
 */
export const extractTextFromImageWithGemini = async (imageBase64, scanType = 'label') => {
    try {
        if (!GEMINI_API_KEY) {
            throw new Error('Gemini API key not available');
        }

        if (!genAI) {
            genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        }

        // Use gemini-pro-vision for image analysis
        const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Clean base64 string
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

        const prompt = `You are an expert OCR system specialized in reading medicine labels and prescriptions.
Extract ALL text from this image accurately. Pay special attention to:
- Medicine names (brand and generic)
- Dosage information (mg, ml, etc.)
- Expiry dates
- Batch numbers
- Manufacturer names
- Any other text visible on the ${scanType}

Return the extracted text exactly as it appears, maintaining the original layout and line breaks.
Be very accurate with numbers, dates, and medicine names.`;

        const imagePart = {
            inlineData: {
                data: cleanBase64,
                mimeType: 'image/jpeg',
            },
        };

        const result = await visionModel.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        if (!text || text.trim().length === 0) {
            return {
                text: '',
                confidence: 0,
                blocks: [],
            };
        }

        console.log(`Gemini Vision extracted ${text.length} characters from ${scanType}`);

        return {
            text: text.trim(),
            confidence: 0.85, // Gemini is quite accurate
            blocks: [],
            engine: 'gemini-vision',
        };
    } catch (error) {
        console.error('Gemini Vision OCR error:', error);
        throw new Error(`Gemini Vision failed: ${error.message}`);
    }
};

/**
 * Validate and enhance OCR-extracted text using Gemini AI
 * @param {string} rawText - Raw text from OCR
 * @param {string} scanType - Type of scan (label, handwritten, printed)
 * @param {string} language - Target language for validation
 * @returns {Promise<{validated: boolean, correctedText: string, confidence: number, suggestions: Array}>}
 */
export const validateOcrText = async (rawText, scanType = 'label', language = 'en') => {
    if (!ENABLE_AI_VALIDATION || !rawText || rawText.trim().length === 0) {
        return {
            validated: false,
            correctedText: rawText,
            confidence: 0.5,
            suggestions: [],
        };
    }

    try {
        if (!model) {
            const initialized = initializeGemini();
            if (!initialized) {
                return {
                    validated: false,
                    correctedText: rawText,
                    confidence: 0.5,
                    suggestions: [],
                };
            }
        }

        const prompt = `You are an expert in pharmaceutical text recognition and validation. 
Analyze the following OCR-extracted text from a ${scanType} and:
1. Correct any OCR errors or misread characters
2. Identify medicine names, dosages, and important information
3. Provide confidence score (0-1) for the corrected text
4. Suggest improvements if needed

OCR Text:
${rawText}

Respond in JSON format:
{
  "correctedText": "corrected version of the text",
  "confidence": 0.95,
  "medicineName": "identified medicine name if any",
  "dosage": "identified dosage if any",
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('Gemini AI response not in expected format');
            return {
                validated: false,
                correctedText: rawText,
                confidence: 0.5,
                suggestions: [],
            };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            validated: true,
            correctedText: parsed.correctedText || rawText,
            confidence: parsed.confidence || 0.7,
            medicineName: parsed.medicineName,
            dosage: parsed.dosage,
            suggestions: parsed.suggestions || [],
        };
    } catch (error) {
        console.error('Gemini AI validation error:', error);
        return {
            validated: false,
            correctedText: rawText,
            confidence: 0.5,
            suggestions: [],
        };
    }
};

/**
 * Extract structured medicine information using Gemini AI
 * @param {string} text - Text to analyze
 * @param {string} language - Target language
 * @returns {Promise<{medicineName: string, genericName: string, dosage: object, expiryDate: string, batchNumber: string, manufacturer: string}>}
 */
export const extractStructuredData = async (text, language = 'en') => {
    if (!ENABLE_AI_VALIDATION || !text || text.trim().length === 0) {
        return null;
    }

    try {
        if (!model) {
            const initialized = initializeGemini();
            if (!initialized) {
                return null;
            }
        }

        const prompt = `You are an expert in pharmaceutical information extraction.
Extract structured information from the following medicine label/prescription text:

Text:
${text}

Extract and return in JSON format:
{
  "medicineName": "brand name of medicine",
  "genericName": "generic/chemical name",
  "dosage": {
    "amount": "dosage amount",
    "unit": "mg/ml/etc",
    "form": "tablet/capsule/syrup"
  },
  "expiryDate": "expiry date in YYYY-MM-DD format if found",
  "batchNumber": "batch/lot number if found",
  "manufacturer": "manufacturer name if found",
  "confidence": 0.95
}

Return only the JSON object, no additional text.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        // Parse JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('Gemini AI structured data response not in expected format');
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Gemini AI extracted structured data:', parsed);

        return parsed;
    } catch (error) {
        console.error('Gemini AI structured data extraction error:', error);
        return null;
    }
};

/**
 * Auto-detect scan type using Gemini AI
 * @param {string} text - Extracted text
 * @param {object} features - Document features from Vision API
 * @returns {Promise<{scanType: string, confidence: number}>}
 */
export const detectScanType = async (text, features = {}) => {
    if (!ENABLE_AI_VALIDATION || !text) {
        return {
            scanType: 'label',
            confidence: 0.5,
        };
    }

    try {
        if (!model) {
            const initialized = initializeGemini();
            if (!initialized) {
                return {
                    scanType: features.layout || 'label',
                    confidence: 0.5,
                };
            }
        }

        const prompt = `Analyze the following text and determine if it's from:
1. A medicine label/packaging (usually has brand name, dosage, manufacturer)
2. A handwritten prescription (doctor's handwriting, patient name, Rx)
3. A printed prescription (typed/computer-generated prescription)

Text:
${text}

Additional features:
- Has handwriting indicators: ${features.hasHandwriting || false}
- Text density: ${features.textDensity || 0}

Respond in JSON format:
{
  "scanType": "label" | "handwritten" | "printed",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return {
                scanType: 'label',
                confidence: 0.5,
            };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            scanType: parsed.scanType || 'label',
            confidence: parsed.confidence || 0.7,
            reasoning: parsed.reasoning,
        };
    } catch (error) {
        console.error('Gemini AI scan type detection error:', error);
        return {
            scanType: 'label',
            confidence: 0.5,
        };
    }
};

/**
 * Check if Gemini AI is available
 * @returns {boolean}
 */
export const isGeminiAvailable = () => {
    return ENABLE_AI_VALIDATION && !!GEMINI_API_KEY;
};
