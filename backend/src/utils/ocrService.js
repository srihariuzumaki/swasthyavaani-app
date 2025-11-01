const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
// Use same endpoint as medlinePlusService - gemini-1.5-flash supports vision
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Extract text from image using Gemini Vision API
 * @param {string} imageBase64 - Base64 encoded image data (without data URL prefix)
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromImage = async (imageBase64) => {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      throw new Error('Gemini API key is not configured');
    }
    
    console.log('Starting OCR processing using Gemini Vision API...');
    
    const prompt = `Extract all text visible in this medicine packaging image. Return ONLY the text content found in the image, nothing else. Focus on medicine names, dosage information, and any other text visible on the packaging.`;
    
    // Detect image MIME type from base64 (first bytes indicate format)
    let mimeType = 'image/jpeg'; // default
    if (imageBase64.startsWith('iVBORw0KGgo')) {
      mimeType = 'image/png';
    } else if (imageBase64.startsWith('/9j/') || imageBase64.startsWith('data:image/jpeg')) {
      mimeType = 'image/jpeg';
    } else if (imageBase64.startsWith('R0lGODlh')) {
      mimeType = 'image/gif';
    } else if (imageBase64.startsWith('UklGR')) {
      mimeType = 'image/webp';
    }
    
    console.log(`Detected image type: ${mimeType}, base64 length: ${imageBase64.length}`);
    
    // Try different endpoint formats - Gemini 1.5 Flash supports vision
    const apiUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    
    console.log('Calling Gemini API:', apiUrl.replace(GEMINI_API_KEY, 'HIDDEN'));
    
    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64
            }
          }
        ]
      }]
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, response.statusText);
      console.error('Error details:', errorText);
      
      // If 404, try with different endpoint formats
      if (response.status === 404) {
        console.log('404 error - trying alternative endpoint formats...');
        
        // Try alternative endpoints
        const alternativeEndpoints = [
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent'
        ];
        
        for (const endpoint of alternativeEndpoints) {
          try {
            const altUrl = `${endpoint}?key=${GEMINI_API_KEY}`;
            console.log(`Trying alternative endpoint: ${endpoint}`);
            const altResponse = await fetch(altUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            });
            
            if (altResponse.ok) {
              const altData = await altResponse.json();
              if (altData.candidates && altData.candidates[0] && altData.candidates[0].content) {
                const text = altData.candidates[0].content.parts[0].text;
                console.log(`Extracted text from image (using ${endpoint}):`, text);
                return text;
              }
            }
          } catch (altError) {
            console.error(`Alternative endpoint ${endpoint} failed:`, altError.message);
          }
        }
      }
      
      throw new Error(`OCR API returned status ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Gemini API error in response:', data.error);
      throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
    }
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      console.log('Extracted text from image:', text);
      return text;
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

