// OCR.space API - Free and reliable OCR service
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || 'helloworld'; // Free tier key
const OCR_SPACE_API_URL = 'https://api.ocr.space/parse/image';

/**
 * Extract text from image using OCR.space API (reliable free OCR service)
 * @param {string} imageBase64 - Base64 encoded image data (without data URL prefix)
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromImage = async (imageBase64) => {
  try {
    console.log('Starting OCR processing using OCR.space API...');
    console.log(`Image base64 length: ${imageBase64.length}`);
    
    // Create form data for OCR.space API
    const formData = new URLSearchParams();
    formData.append('apikey', OCR_SPACE_API_KEY);
    formData.append('base64Image', `data:image/jpeg;base64,${imageBase64}`);
    formData.append('OCREngine', '2'); // Engine 2 for better accuracy
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    
    const response = await fetch(OCR_SPACE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OCR.space API error:', response.status, response.statusText);
      console.error('Error details:', errorText);
      throw new Error(`OCR API returned status ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    const data = await response.json();
    
    if (data.ErrorMessage && data.ErrorMessage.length > 0) {
      console.error('OCR.space API error:', data.ErrorMessage);
      throw new Error(`OCR API error: ${data.ErrorMessage[0]}`);
    }
    
    if (data.ParsedResults && data.ParsedResults.length > 0) {
      const extractedText = data.ParsedResults[0].ParsedText;
      if (extractedText && extractedText.trim().length > 0) {
        console.log('Extracted text from image:', extractedText);
        return extractedText.trim();
      }
    }
    
    // If no parsed text, try to get text from text overlay
    if (data.TextOverlay && data.TextOverlay.Lines) {
      const lines = data.TextOverlay.Lines.map(line => line.LineText).filter(text => text);
      if (lines.length > 0) {
        const extractedText = lines.join('\n');
        console.log('Extracted text from overlay:', extractedText);
        return extractedText.trim();
      }
    }
    
    throw new Error('No text extracted from image');
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
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
  
  // Split text into lines and words
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const words = text.split(/\s+/).filter(word => word.length >= 2);
  
  // Common medicine name patterns
  const medicinePatterns = [
    // Pattern: Medicine Name + number (e.g., "Dolo 650", "Crocin 500")
    /\b([A-Z][a-z]+\s+\d+)\b/i,
    // Pattern: Brand name with numbers (e.g., "Dolo 650mg", "Crocin 500mg")
    /\b([A-Z][a-z]+\s+\d+mg?)\b/i,
    // Pattern: Brand name (e.g., "Dolo", "Crocin", "Paracetamol")
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
  ];
  
  // Extract potential medicine names from text
  for (const line of lines) {
    // Skip very short lines (likely not medicine names)
    if (line.length < 3 || line.length > 100) continue;
    
    // Skip common non-medicine words/phrases
    const skipPhrases = [
      'tablet', 'capsule', 'take', 'use', 'dosage', 'before', 'after', 
      'food', 'meal', 'prescription', 'expires', 'manufactured', 'date', 
      'batch', 'mfg', 'exp', 'price', 'mrp', 'store', 'instructions',
      'composition', 'indications', 'side effects', 'warnings'
    ];
    
    const lowerLine = line.toLowerCase();
    if (skipPhrases.some(phrase => lowerLine.includes(phrase) && lowerLine.length < 30)) {
      continue;
    }
    
    // Try to match medicine patterns
    for (const pattern of medicinePatterns) {
      const matches = line.matchAll(new RegExp(pattern, 'g'));
      for (const match of matches) {
        if (match && match[1]) {
          const potentialName = match[1].trim();
          // Filter out numbers only, very short names, or common words
          if (!/^\d+$/.test(potentialName) && 
              potentialName.length >= 3 && 
              potentialName.length <= 50 &&
              !skipPhrases.some(phrase => potentialName.toLowerCase().includes(phrase))) {
            medicineNames.push(potentialName);
          }
        }
      }
    }
    
    // If line looks like a medicine name (starts with capital, reasonable length)
    if (/^[A-Z]/.test(line) && line.length >= 3 && line.length <= 50) {
      const words = line.split(/\s+/);
      // If it's a short phrase (1-4 words) and doesn't contain skip phrases
      if (words.length <= 4 && !skipPhrases.some(phrase => lowerLine.includes(phrase))) {
        // Check if it contains medicine-like structure
        const hasMedicineLikePattern = /^[A-Z][a-z]+(\s+\d+)?(\s+[A-Z][a-z]+)*$/i.test(line);
        if (hasMedicineLikePattern) {
          medicineNames.push(line);
        }
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
    
    // Prioritize shorter names (likely brand names)
    return a.length - b.length;
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
    // Extract text from image using Gemini Vision API
    const extractedText = await extractTextFromImage(imageBase64);
    
    if (!extractedText || extractedText.trim().length === 0) {
      console.log('No text extracted from image');
      return null;
    }
    
    // Extract potential medicine names
    const medicineNames = extractMedicineNames(extractedText);
    
    if (medicineNames.length === 0) {
      console.log('Could not extract medicine name from text:', extractedText);
      return null;
    }
    
    // Return the first (most likely) medicine name
    console.log('Selected medicine name:', medicineNames[0]);
    return medicineNames[0];
  } catch (error) {
    console.error('Error finding medicine name from image:', error);
    return null;
  }
};

