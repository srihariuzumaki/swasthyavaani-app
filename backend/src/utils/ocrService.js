import Tesseract from 'tesseract.js';

/**
 * Extract text from image using OCR
 * @param {string} imageBase64 - Base64 encoded image data (without data URL prefix)
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromImage = async (imageBase64) => {
  try {
    // Tesseract.js can work with base64 data URL or buffer
    // Create data URL from base64
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;
    
    console.log('Starting OCR processing...');
    
    // Perform OCR using Tesseract.js
    const { data: { text } } = await Tesseract.recognize(imageDataUrl, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    console.log('Extracted text from image:', text);
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
};

/**
 * Parse extracted text to find medicine names
 * @param {string} text - Text extracted from OCR
 * @returns {Array<string>} Potential medicine names
 */
export const extractMedicineNames = (text) => {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  const medicineNames = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Common medicine name patterns
  const medicinePatterns = [
    // Pattern: Medicine Name + number (e.g., "Dolo 650", "Crocin 500")
    /([A-Z][a-z]+\s+\d+)/,
    // Pattern: Brand name (e.g., "Dolo", "Crocin", "Paracetamol")
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    // Pattern: Generic name (e.g., "Paracetamol 650mg")
    /([A-Z][a-z]+(?:\s+\d+[a-z]+)?)/,
  ];
  
  // Extract potential medicine names from text
  for (const line of lines) {
    // Skip very short lines (likely not medicine names)
    if (line.length < 3 || line.length > 100) continue;
    
    // Skip common non-medicine words
    const skipWords = [
      'tablet', 'capsule', 'mg', 'ml', 'gram', 'take', 'use', 'dosage',
      'before', 'after', 'food', 'meal', 'prescription', 'expires',
      'manufactured', 'date', 'batch', 'mfg', 'exp', 'price', 'mrp'
    ];
    
    const lowerLine = line.toLowerCase();
    if (skipWords.some(word => lowerLine.includes(word) && lowerLine.length < 20)) {
      continue;
    }
    
    // Try to match medicine patterns
    for (const pattern of medicinePatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const potentialName = match[1].trim();
        // Filter out numbers only or very common words
        if (!/^\d+$/.test(potentialName) && potentialName.length >= 3) {
          medicineNames.push(potentialName);
        }
      }
    }
    
    // If no pattern matches, check if line looks like a medicine name
    // (starts with capital letter, reasonable length)
    if (medicineNames.length === 0 && /^[A-Z]/.test(line) && line.length >= 3 && line.length <= 50) {
      // Check if it contains a medicine-like structure
      const words = line.split(/\s+/);
      if (words.length <= 4) {
        medicineNames.push(line);
      }
    }
  }
  
  // Remove duplicates and return unique medicine names
  const uniqueNames = [...new Set(medicineNames)];
  
  // Prioritize names that contain numbers (likely dosage like "Dolo 650")
  uniqueNames.sort((a, b) => {
    const aHasNumber = /\d/.test(a);
    const bHasNumber = /\d/.test(b);
    if (aHasNumber && !bHasNumber) return -1;
    if (!aHasNumber && bHasNumber) return 1;
    return 0;
  });
  
  console.log('Extracted medicine names:', uniqueNames);
  return uniqueNames.slice(0, 5); // Return top 5 candidates
};

/**
 * Find the best medicine name match from extracted text
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<string|null>} Best matching medicine name or null
 */
export const findMedicineNameFromImage = async (imageBase64) => {
  try {
    // Extract text from image
    const extractedText = await extractTextFromImage(imageBase64);
    
    if (!extractedText || extractedText.trim().length === 0) {
      return null;
    }
    
    // Extract potential medicine names
    const medicineNames = extractMedicineNames(extractedText);
    
    if (medicineNames.length === 0) {
      return null;
    }
    
    // Return the first (most likely) medicine name
    return medicineNames[0];
  } catch (error) {
    console.error('Error finding medicine name from image:', error);
    return null;
  }
};

