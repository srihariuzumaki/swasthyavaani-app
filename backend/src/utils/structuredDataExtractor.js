/**
 * Structured Data Extractor
 * Pattern-based extraction of structured information from OCR text
 */

/**
 * Extract medicine names using pattern matching
 */
export const extractMedicineNames = (text) => {
    if (!text || text.trim().length === 0) {
        return [];
    }

    const medicineNames = [];
    const lines = text.split('\n');

    // Common medicine name patterns
    const patterns = [
        // Brand names with numbers (e.g., "DOLO 650", "CROCIN 500")
        /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+\d+(?:mg|ML|MG)?)\b/g,
        // All caps words (likely brand names)
        /\b([A-Z]{3,}(?:\s+[A-Z]{3,})*)\b/g,
        // Capitalized words followed by dosage
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:\d+\s*(?:mg|ml|g|mcg))/gi,
    ];

    for (const line of lines) {
        for (const pattern of patterns) {
            const matches = line.match(pattern);
            if (matches) {
                medicineNames.push(...matches);
            }
        }
    }

    // Remove duplicates and filter
    const uniqueNames = [...new Set(medicineNames)]
        .filter(name => name.length > 2)
        .filter(name => !isCommonWord(name));

    return uniqueNames;
};

/**
 * Extract dosage information
 */
export const extractDosage = (text) => {
    const dosagePatterns = [
        /(\d+\s*(?:mg|ml|g|mcg|iu|units?))/gi,
        /(?:dosage|dose):\s*([^\n]+)/gi,
    ];

    for (const pattern of dosagePatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[0].trim();
        }
    }

    return null;
};

/**
 * Extract expiry date
 */
export const extractExpiryDate = (text) => {
    const expiryPatterns = [
        /(?:exp(?:iry)?|use before|best before)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi,
        /(?:exp(?:iry)?|use before|best before)[\s:]*([A-Z]{3}[-/\s]\d{2,4})/gi,
        /(\d{1,2}[-/]\d{4})/g, // MM/YYYY or MM-YYYY
    ];

    for (const pattern of expiryPatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[0].replace(/^(?:exp(?:iry)?|use before|best before)[\s:]*/gi, '').trim();
        }
    }

    return null;
};

/**
 * Extract batch number
 */
export const extractBatchNumber = (text) => {
    const batchPatterns = [
        /(?:batch|lot|b\.?no\.?)[\s:]*([A-Z0-9]+)/gi,
        /\b(BATCH[A-Z0-9]+)\b/gi,
    ];

    for (const pattern of batchPatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[0].replace(/^(?:batch|lot|b\.?no\.?)[\s:]*/gi, '').trim();
        }
    }

    return null;
};

/**
 * Extract manufacturer information
 */
export const extractManufacturer = (text) => {
    const manufacturerPatterns = [
        /(?:mfg|manufactured by|mfd by|manufacturer)[\s:]*([^\n]+)/gi,
        /(?:marketed by|distributed by)[\s:]*([^\n]+)/gi,
    ];

    for (const pattern of manufacturerPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    return null;
};

/**
 * Auto-detect scan type based on text patterns
 */
export const autoDetectScanType = (text, features = {}) => {
    if (!text) return 'label';

    const lowerText = text.toLowerCase();

    // Check for prescription indicators
    const prescriptionIndicators = [
        'rx', 'prescription', 'doctor', 'dr.', 'patient',
        'diagnosis', 'sig:', 'disp:', 'refills',
    ];

    const hasPrescrip = prescriptionIndicators.some(indicator =>
        lowerText.includes(indicator)
    );

    if (hasPrescrip) {
        // Check if handwritten (based on features or text characteristics)
        if (features.handwritten || features.confidence < 0.7) {
            return 'handwritten';
        }
        return 'printed';
    }

    // Default to label
    return 'label';
};

/**
 * Extract all structured data from text
 */
export const extractAllStructuredData = (text, features = {}) => {
    if (!text) {
        return null;
    }

    const medicineNames = extractMedicineNames(text);

    return {
        medicineName: medicineNames[0] || null,
        alternativeNames: medicineNames.slice(1, 5),
        dosage: extractDosage(text),
        expiryDate: extractExpiryDate(text),
        batchNumber: extractBatchNumber(text),
        manufacturer: extractManufacturer(text),
    };
};

/**
 * Helper: Check if word is a common non-medicine word
 */
const isCommonWord = (word) => {
    const commonWords = [
        'THE', 'AND', 'FOR', 'WITH', 'NOT', 'BUT', 'CAN', 'WILL',
        'TABLETS', 'CAPSULES', 'SYRUP', 'INJECTION', 'CREAM', 'OINTMENT',
        'MEDICINE', 'DRUG', 'PHARMACEUTICAL', 'HEALTHCARE', 'MEDICAL',
        'PACK', 'STRIP', 'BOTTLE', 'BOX', 'CONTAINER',
        'MFG', 'EXP', 'BATCH', 'LOT', 'DATE', 'INDIA', 'LIMITED', 'LTD',
    ];

    return commonWords.includes(word.toUpperCase());
};
