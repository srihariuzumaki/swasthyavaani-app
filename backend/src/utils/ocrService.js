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
    // Pattern: Brand name with dash and number (e.g., "PARACIP-500", "ARACIP-500")
    /\b([A-Z]+-\d+)\b/,
    // Pattern: Medicine Name + number (e.g., "Dolo 650", "Crocin 500")
    /\b([A-Z][a-z]+\s+\d+)\b/i,
    // Pattern: Brand name with numbers (e.g., "Dolo 650mg", "Crocin 500mg")
    /\b([A-Z][a-z]+\s+\d+mg?)\b/i,
    // Pattern: Brand name (e.g., "Dolo", "Crocin", "Paracetamol")
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
    // Pattern: All caps brand names (e.g., "PARACIP", "ARACIP")
    /\b([A-Z]{3,}(?:-[A-Z0-9]+)?)\b/,
  ];
  
  // Known medicine patterns and synonyms
  const medicineSynonyms = {
    'paracip': 'Paracetamol',
    'aracip': 'Paracetamol',
    'dolo': 'Paracetamol',
    'crocin': 'Paracetamol',
    'calpol': 'Paracetamol',
    'panadol': 'Paracetamol',
    'brocetamol': 'Paracetamol',
    'paraceramo': 'Paracetamol',
  };
  
  // First, extract all brand names with dashes and numbers (highest priority)
  const brandNamesWithDash = text.match(/\b([A-Z]{3,}-\d+)\b/g);
  if (brandNamesWithDash) {
    brandNamesWithDash.forEach(name => {
      const cleanName = name.trim();
      if (cleanName.length >= 5 && cleanName.length <= 30) {
        medicineNames.push(cleanName);
      }
    });
  }
  
  // Extract potential medicine names from text
  for (const line of lines) {
    // Skip very short lines (likely not medicine names)
    if (line.length < 3 || line.length > 100) continue;
    
    // Skip common non-medicine words/phrases
    const skipPhrases = [
      'tablet', 'capsule', 'take', 'use', 'dosage', 'before', 'after', 
      'food', 'meal', 'prescription', 'expires', 'manufactured', 'date', 
      'batch', 'mfg', 'exp', 'price', 'mrp', 'store', 'instructions',
      'composition', 'indications', 'side effects', 'warnings', 'tabel',
      'col', 'for', 'ing', 'altaxes', 'cp', 'nfd', 'aug', 'pxp', 'jul',
      'r.p', 'fortabs'
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
  
  // Normalize and expand medicine names using synonyms
  // IMPORTANT: Always keep original names - they work for ANY medicine
  const normalizedNames = [];
  for (const name of medicineNames) {
    const lowerName = name.toLowerCase().replace(/[-\s]/g, '');
    let foundSynonym = false;
    
    // Always add original name first (works for any medicine)
    normalizedNames.push(name);
    
    // Check for synonyms and add normalized versions as alternatives
    for (const [synonym, genericName] of Object.entries(medicineSynonyms)) {
      if (lowerName.includes(synonym)) {
        foundSynonym = true;
        // If name has number, add generic version (e.g., "PARACIP-500" -> also try "Paracetamol 500")
        if (/\d/.test(name)) {
          const number = name.match(/\d+/)?.[0] || '';
          const normalizedVersion = `${genericName} ${number}`.trim();
          // Add normalized version if different from original
          if (normalizedVersion.toLowerCase() !== name.toLowerCase()) {
            normalizedNames.push(normalizedVersion);
          }
          // Also try just generic name
          normalizedNames.push(genericName);
        } else {
          // Add generic name if different from original
          if (genericName.toLowerCase() !== name.toLowerCase()) {
            normalizedNames.push(genericName);
          }
        }
        break; // Found a match, no need to check other synonyms
      }
    }
  }
  
  // Remove duplicates and return unique medicine names
  const uniqueNames = [...new Set(normalizedNames)];
  
  // Prioritize names that contain numbers and dashes (likely brand names like "PARACIP-500")
  // IMPORTANT: Original extracted names are tried FIRST to work for ANY medicine
  uniqueNames.sort((a, b) => {
    // Highest priority: names with dash and number (e.g., "PARACIP-500", "DOLO-650")
    const aHasDashAndNumber = /-\d/.test(a);
    const bHasDashAndNumber = /-\d/.test(b);
    if (aHasDashAndNumber && !bHasDashAndNumber) return -1;
    if (!aHasDashAndNumber && bHasDashAndNumber) return 1;
    
    // Second priority: names with number (e.g., "Paracetamol 500", "Dolo 650")
    const aHasNumber = /\d/.test(a);
    const bHasNumber = /\d/.test(b);
    if (aHasNumber && !bHasNumber) return -1;
    if (!aHasNumber && bHasNumber) return 1;
    
    // Third priority: names that are all caps (likely brand names like "PARACIP", "DOLO")
    const aIsAllCaps = /^[A-Z]+(?:-\d+)?$/.test(a);
    const bIsAllCaps = /^[A-Z]+(?:-\d+)?$/.test(b);
    if (aIsAllCaps && !bIsAllCaps) return -1;
    if (!aIsAllCaps && bIsAllCaps) return 1;
    
    // Fourth priority: shorter names (likely brand names)
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
      // Try to extract any capitalized words that might be medicine names
      const capitalizedWords = extractedText.match(/\b([A-Z]{3,}(?:[-]\d+)?)\b/g);
      if (capitalizedWords && capitalizedWords.length > 0) {
        const candidate = capitalizedWords[0];
        console.log('Using capitalized word as medicine name:', candidate);
        return candidate;
      }
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

