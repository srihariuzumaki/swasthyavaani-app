/**
 * Advanced OCR Service
 * Open-source OCR pipeline using EasyOCR + image preprocessing
 * No billing required - completely free!
 */

import { extractTextWithEasyOCR, isEasyOCRAvailable } from './easyOcrService.js';
import { validateOcrText, extractStructuredData as geminiExtractStructuredData, detectScanType as geminiDetectScanType, isGeminiAvailable } from './geminiAiService.js';
import { extractAllStructuredData, autoDetectScanType } from './structuredDataExtractor.js';
import { preprocessMedicineLabel } from './imagePreprocessor.js';

const OCR_CONFIDENCE_THRESHOLD = parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD) || 0.7;

/**
 * Extract text from image using dual-engine strategy
 * Primary: Gemini Vision (FREE!)
 * Fallback: EasyOCR
 * 
 * @param {string} imageBase64 - Base64 encoded image data (without data URL prefix)
 * @param {string} scanType - Optional scan type hint: 'label', 'handwritten', 'printed', or 'auto'
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<{text: string, confidence: number, engine: string, features: object}>}
 */
export const extractTextFromImage = async (imageBase64, scanType = 'auto', maxRetries = 2) => {
  let lastError = null;

  // Validate image data
  if (!imageBase64 || imageBase64.trim().length === 0) {
    throw new Error('Image data is empty or invalid');
  }

  // Compress image if too large
  let optimizedImage = imageBase64;
  const MAX_SIZE_KB = 900;
  const estimatedSizeKB = (imageBase64.length * 3) / 4 / 1024;

  if (estimatedSizeKB > MAX_SIZE_KB) {
    console.log(`Image is large (${Math.round(estimatedSizeKB)} KB), compressing...`);
    try {
      const sharp = (await import('sharp')).default;
      const buffer = Buffer.from(imageBase64, 'base64');
      const compressionRatio = MAX_SIZE_KB / estimatedSizeKB;
      const quality = Math.max(30, Math.min(90, Math.round(compressionRatio * 85)));

      const compressedBuffer = await sharp(buffer)
        .resize(1600, 1600, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toBuffer();

      optimizedImage = compressedBuffer.toString('base64');
      const newSizeKB = (optimizedImage.length * 3) / 4 / 1024;
      console.log(`Compressed image from ${Math.round(estimatedSizeKB)} KB to ${Math.round(newSizeKB)} KB`);
    } catch (compressionError) {
      console.error('Image compression failed:', compressionError.message);
    }
  }

  // Preprocess image for better OCR accuracy
  console.log('Preprocessing image for OCR...');
  try {
    optimizedImage = await preprocessMedicineLabel(optimizedImage, {
      denoise: true,
      enhanceContrast: true,
      autoRotate: true,
      advanced: false // Set to true for very low quality images
    });
    console.log('Image preprocessing complete');
  } catch (preprocessError) {
    console.error('Preprocessing failed, using original image:', preprocessError.message);
  }

  // Use EasyOCR as primary OCR engine (FREE & open-source!)
  if (await isEasyOCRAvailable()) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Retrying EasyOCR (attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.log(`Attempting EasyOCR (attempt ${attempt + 1}/${maxRetries + 1})...`);

        const result = await extractTextWithEasyOCR(optimizedImage, ['en']);

        if (result.text && result.text.trim().length > 0) {
          console.log(`EasyOCR extracted ${result.text.length} characters with ${result.confidence.toFixed(2)} confidence`);
          return {
            text: result.text,
            confidence: result.confidence,
            engine: 'easyocr',
            features: {},
            blocks: result.blocks || [],
          };
        }

        if (attempt < maxRetries) {
          console.log('No text extracted, retrying...');
          continue;
        }
      } catch (error) {
        console.error(`EasyOCR error (attempt ${attempt + 1}):`, error.message);
        lastError = error;

        if (attempt < maxRetries) {
          continue;
        }
      }
    }
  } else {
    console.log('EasyOCR not available');
  }

  // If OCR failed
  throw new Error(
    lastError
      ? `OCR failed: ${lastError.message}`
      : 'EasyOCR is not available. Please ensure Python and EasyOCR are installed.'
  );
};

/**
 * Find medicine name from extracted text
 * Uses pattern matching and AI validation
 * 
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} scanType - Scan type hint
 * @returns {Promise<string|null>} Best matching medicine name
 */
export const findMedicineNameFromImage = async (imageBase64, scanType = 'auto') => {
  try {
    // Extract text using OCR
    const ocrResult = await extractTextFromImage(imageBase64, scanType);

    if (!ocrResult.text || ocrResult.text.trim().length === 0) {
      console.log('No text extracted from image');
      return null;
    }

    // Validate and enhance with Gemini AI if available
    let validatedText = ocrResult.text;
    let aiMedicineName = null;

    if (isGeminiAvailable()) {
      try {
        const validation = await validateOcrText(ocrResult.text, scanType);
        if (validation.validated && validation.confidence > OCR_CONFIDENCE_THRESHOLD) {
          validatedText = validation.correctedText;
          aiMedicineName = validation.medicineName;
          console.log('AI validation improved text quality');
        }
      } catch (aiError) {
        console.error('AI validation error:', aiError.message);
      }
    }

    // Extract structured data
    const structuredData = extractAllStructuredData(validatedText, ocrResult.features);

    // Prefer AI-extracted medicine name if available
    const medicineName = aiMedicineName || structuredData?.medicineName;

    if (medicineName) {
      console.log('Selected medicine name:', medicineName);
      return medicineName;
    }

    console.log('Could not extract medicine name from text');
    return null;
  } catch (error) {
    console.error('Error finding medicine name from image:', error);
    return null;
  }
};

/**
 * Extract comprehensive medicine information from image
 * Combines OCR, pattern matching, and AI validation
 * 
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} scanType - Scan type: 'auto', 'label', 'handwritten', 'printed'
 * @param {string} language - Target language for validation
 * @returns {Promise<object>} Comprehensive medicine information
 */
export const extractMedicineInformation = async (imageBase64, scanType = 'auto', language = 'en') => {
  try {
    console.log('Starting comprehensive medicine information extraction...');

    // Step 1: Extract text using OCR
    const ocrResult = await extractTextFromImage(imageBase64, scanType);

    if (!ocrResult.text || ocrResult.text.trim().length === 0) {
      throw new Error('No text could be extracted from the image');
    }

    console.log(`OCR completed with ${ocrResult.engine} engine`);

    // Step 2: Auto-detect scan type if needed
    let detectedScanType = scanType;
    if (scanType === 'auto') {
      // Use pattern-based detection
      detectedScanType = autoDetectScanType(ocrResult.text, ocrResult.features);

      // Enhance with AI detection if available
      if (isGeminiAvailable()) {
        try {
          const aiDetection = await geminiDetectScanType(ocrResult.text, ocrResult.features);
          if (aiDetection.confidence > 0.7) {
            detectedScanType = aiDetection.scanType;
            console.log(`AI detected scan type: ${detectedScanType} (confidence: ${aiDetection.confidence})`);
          }
        } catch (error) {
          console.error('AI scan type detection error:', error.message);
        }
      }
    }

    // Step 3: Validate and correct text with AI
    let validatedText = ocrResult.text;
    let aiValidation = null;

    if (isGeminiAvailable()) {
      try {
        aiValidation = await validateOcrText(ocrResult.text, detectedScanType, language);
        if (aiValidation.validated && aiValidation.confidence > OCR_CONFIDENCE_THRESHOLD) {
          validatedText = aiValidation.correctedText;
          console.log('AI validation completed successfully');
        }
      } catch (error) {
        console.error('AI validation error:', error.message);
      }
    }

    // Step 4: Extract structured data using pattern matching
    const patternData = extractAllStructuredData(validatedText, ocrResult.features);

    // Step 5: Extract structured data using AI
    let aiStructuredData = null;
    if (isGeminiAvailable()) {
      try {
        aiStructuredData = await geminiExtractStructuredData(validatedText, language);
        console.log('AI structured data extraction completed');
      } catch (error) {
        console.error('AI structured data extraction error:', error.message);
      }
    }

    // Step 6: Merge and prioritize data from different sources
    const mergedData = {
      // Prefer AI-extracted medicine name, fallback to pattern matching
      medicineName: aiStructuredData?.medicineName || aiValidation?.medicineName || patternData?.medicineName,
      genericName: aiStructuredData?.genericName || null,

      // Dosage information
      dosage: aiStructuredData?.dosage || patternData?.dosage,

      // Additional structured data
      expiryDate: aiStructuredData?.expiryDate || patternData?.expiryDate,
      batchNumber: aiStructuredData?.batchNumber || patternData?.batchNumber,
      manufacturer: aiStructuredData?.manufacturer || patternData?.manufacturer,

      // Metadata
      scanType: detectedScanType,
      ocrEngine: ocrResult.engine,
      ocrConfidence: ocrResult.confidence,
      aiValidated: aiValidation?.validated || false,
      aiConfidence: aiValidation?.confidence || aiStructuredData?.confidence || 0,

      // Raw data for debugging
      rawText: ocrResult.text,
      validatedText: validatedText !== ocrResult.text ? validatedText : undefined,
      alternativeNames: patternData?.alternativeNames || [],
    };

    console.log('Medicine information extraction completed:', {
      medicineName: mergedData.medicineName,
      scanType: mergedData.scanType,
      engine: mergedData.ocrEngine,
      aiValidated: mergedData.aiValidated,
    });

    return mergedData;
  } catch (error) {
    console.error('Error extracting medicine information:', error);
    throw error;
  }
};

// Export legacy function name for backward compatibility (will be removed)
export const extractMedicineNames = (text) => {
  const structuredData = extractAllStructuredData(text);
  return structuredData?.alternativeNames || [];
};
