// OCR.space API - Free and reliable OCR service
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || 'helloworld'; // Free tier key
const OCR_SPACE_API_URL = 'https://api.ocr.space/parse/image';

/**
 * Extract text from image using OCR.space API with timeout and retry logic
 * @param {string} imageBase64 - Base64 encoded image data (without data URL prefix)
 * @param {number} maxRetries - Maximum number of retry attempts (default: 2)
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromImage = async (imageBase64, maxRetries = 2) => {
  // Compress image if it's too large for OCR API (1024 KB limit)
  let optimizedImage = imageBase64;
  const MAX_SIZE_KB = 900; // Target 900 KB to have buffer below 1024 KB limit
  const estimatedSizeKB = (imageBase64.length * 3) / 4 / 1024; // Base64 to bytes to KB

  if (estimatedSizeKB > MAX_SIZE_KB) {
    console.log(`Image is large (${Math.round(estimatedSizeKB)} KB), compressing to meet OCR size limit...`);

    try {
      const sharp = (await import('sharp')).default;
      const buffer = Buffer.from(imageBase64, 'base64');

      // Calculate compression quality needed
      const compressionRatio = MAX_SIZE_KB / estimatedSizeKB;
      const quality = Math.max(30, Math.min(90, Math.round(compressionRatio * 85)));

      console.log(`Compressing with ${quality}% quality...`);

      // Resize and compress
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
      console.log('Attempting to proceed with original image...');
    }
  }

  const TIMEOUT_MS = 45000; // 45 seconds timeout

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`Retrying OCR attempt ${attempt + 1}/${maxRetries + 1} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      console.log(`Starting OCR processing attempt ${attempt + 1}/${maxRetries + 1}...`);
      console.log(`Image base64 length: ${imageBase64.length}`);

      // Create form data for OCR.space API
      const formData = new URLSearchParams();
      formData.append('apikey', OCR_SPACE_API_KEY);
      formData.append('base64Image', `data:image/jpeg;base64,${optimizedImage}`);
      formData.append('OCREngine', attempt === 0 ? '2' : '1'); // Try Engine 1 on retries (faster)
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true'); // Enable scaling for faster processing

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OCR request timeout')), TIMEOUT_MS);
      });

      // Create fetch promise
      const fetchPromise = fetch(OCR_SPACE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        let errorText;
        try {
          errorText = await Promise.race([response.text(), timeoutPromise]);
        } catch (err) {
          if (attempt < maxRetries) {
            console.log('Response reading timeout, will retry...');
            continue;
          }
          throw new Error('OCR API response timeout');
        }

        console.error('OCR.space API error:', response.status, response.statusText);
        console.error('Error details:', errorText);

        // If it's a timeout error or rate limit, retry
        if (response.status === 429 || errorText.includes('timeout') || errorText.includes('E101')) {
          if (attempt < maxRetries) {
            console.log('Rate limit or timeout detected, will retry...');
            continue;
          }
          throw new Error(`OCR API timeout/rate limit: ${response.status}`);
        }

        // For other errors, retry if we have attempts left
        if (attempt < maxRetries) {
          continue;
        }
        throw new Error(`OCR API returned status ${response.status}: ${errorText.substring(0, 200)}`);
      }

      // Race between JSON parsing and timeout
      let data;
      try {
        data = await Promise.race([response.json(), timeoutPromise]);
      } catch (err) {
        if (attempt < maxRetries) {
          console.log('JSON parsing timeout, will retry...');
          continue;
        }
        throw new Error('OCR API response parsing timeout');
      }

      // Check for API errors
      if (data.ErrorMessage && data.ErrorMessage.length > 0) {
        const errorMsg = data.ErrorMessage[0];
        console.error('OCR.space API error:', data.ErrorMessage);

        // Handle timeout error
        if (errorMsg.includes('E101') || errorMsg.includes('timeout') || errorMsg.includes('Timed out')) {
          if (attempt < maxRetries) {
            console.log('OCR timeout detected, will retry...');
            continue;
          }
          throw new Error(`OCR API timeout: ${errorMsg}. Please try again with a smaller or clearer image.`);
        }

        // For other API errors, throw immediately
        if (attempt < maxRetries && (errorMsg.includes('rate limit') || errorMsg.includes('quota'))) {
          continue; // Retry on rate limits
        }
        throw new Error(`OCR API error: ${errorMsg}`);
      }

      // Extract text from response
      if (data.ParsedResults && data.ParsedResults.length > 0) {
        const extractedText = data.ParsedResults[0].ParsedText;
        if (extractedText && extractedText.trim().length > 0) {
          console.log('Extracted text from image:', extractedText.substring(0, 200));
          return extractedText.trim();
        }
      }

      // If no parsed text, try to get text from text overlay
      if (data.TextOverlay && data.TextOverlay.Lines) {
        const lines = data.TextOverlay.Lines.map(line => line.LineText).filter(text => text);
        if (lines.length > 0) {
          const extractedText = lines.join('\n');
          console.log('Extracted text from overlay:', extractedText.substring(0, 200));
          return extractedText.trim();
        }
      }

      // If no text found and this is not the last attempt, retry
      if (attempt < maxRetries) {
        console.log('No text extracted, retrying...');
        continue;
      }

      throw new Error('No text extracted from image after all attempts');

    } catch (error) {
      console.error(`OCR Error (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);

      // If it's a timeout and we have retries left, continue to next attempt
      if ((error.message.includes('timeout') || error.message.includes('E101') || error.message.includes('Timed out')) && attempt < maxRetries) {
        continue;
      }

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw new Error(`Failed to extract text from image after ${maxRetries + 1} attempts: ${error.message}`);
      }
    }
  }

  throw new Error('OCR failed after all retry attempts');
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

