/**
 * Structured Data Extractor
 * Pattern-based extraction of structured information from OCR text
 * Enhanced with fuzzy matching and validation
 */

import * as fuzz from 'fuzzball';
import { parse, isValid, isFuture, isPast, format } from 'date-fns';

/**
 * Check if text is a manufacturer name
 */
const isManufacturerName = (text) => {
    const manufacturerKeywords = [
        'pharma', 'ltd', 'limited', 'laboratories', 'lab', 'pvt',
        'inc', 'corporation', 'corp', 'company', 'co',
        'healthcare', 'biotech', 'life sciences', 'therapeutics',
        'mankind', 'cipla', 'sun', 'lupin', 'dr reddy', 'torrent',
        'alkem', 'glenmark', 'abbott', 'pfizer', 'novartis'
    ];

    const lowerText = text.toLowerCase();
    return manufacturerKeywords.some(keyword => lowerText.includes(keyword));
};

/**
 * Extract medicine names using pattern matching
 */
export const extractMedicineNames = (text) => {
    if (!text || text.trim().length === 0) {
        return [];
    }

    const medicineNames = [];
    const lines = text.split('\n');

    // Enhanced medicine name patterns
    const patterns = [
        // Brand names with numbers and units (e.g., "GLIMESTAR M1", "DOLO 650")
        /\b([A-Z][A-Za-z]+(?:\s+[A-Z]\d+|\s+\d+)?(?:\s+\d+(?:mg|ML|MG)?)?)\b/g,
        // All caps words (likely brand names) - but not too long
        /\b([A-Z]{3,15}(?:\s+[A-Z]\d+)?)\b/g,
        // Capitalized words followed by dosage
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?:\s+\d+\s*(?:mg|ml|g|mcg))/gi,
    ];

    for (const line of lines) {
        // Skip lines that clearly contain manufacturer info
        if (isManufacturerName(line)) {
            continue;
        }

        for (const pattern of patterns) {
            const matches = line.match(pattern);
            if (matches) {
                for (const match of matches) {
                    // Filter out manufacturer names
                    if (!isManufacturerName(match)) {
                        medicineNames.push(match.trim());
                    }
                }
            }
        }
    }

    // Remove duplicates and filter
    const uniqueNames = [...new Set(medicineNames)]
        .filter(name => name.length > 2)
        .filter(name => !isCommonWord(name))
        .filter(name => !isManufacturerName(name));

    // Score and sort by likelihood of being a medicine name
    const scored = uniqueNames.map(name => ({
        name,
        score: scoreMedicineName(name, text)
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.map(item => item.name);
};

/**
 * Score how likely a name is to be a medicine name
 */
const scoreMedicineName = (name, fullText) => {
    let score = 0;

    // Prefer names that appear early in text
    const position = fullText.indexOf(name);
    if (position < fullText.length / 3) score += 3;

    // Prefer shorter names (brand names are usually concise)
    if (name.length < 20) score += 2;
    if (name.length < 15) score += 1;

    // Prefer names with numbers (like M1, 650)
    if (/\d/.test(name)) score += 2;

    // Prefer all caps or title case
    if (name === name.toUpperCase()) score += 2;

    // Penalize if contains manufacturer keywords
    if (isManufacturerName(name)) score -= 10;

    return score;
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
 * Extract expiry date with multiple format support
 */
export const extractExpiryDate = (text) => {
    const expiryPatterns = [
        // With keywords
        /(?:exp(?:iry)?|use before|best before|expiry date|exp date)[\s:.]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/gi,
        /(?:exp(?:iry)?|use before|best before)[\s:.]*(\d{1,2}[-/.]\d{4})/gi,
        /(?:exp(?:iry)?|use before|best before)[\s:.]*([A-Z]{3}[-/.\s]\d{2,4})/gi,
        // Without keywords (common formats)
        /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/g, // DD/MM/YYYY
        /(\d{1,2}[-/.]\d{4})/g, // MM/YYYY
        /([A-Z]{3}[-/.\s]\d{2,4})/g, // MMM-YYYY
    ];

    for (const pattern of expiryPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            for (const match of matches) {
                const cleaned = match.replace(/^(?:exp(?:iry)?|use before|best before|expiry date|exp date)[\s:.]*/gi, '').trim();
                // Validate it's a future date
                const parsedDate = parseDate(cleaned);
                if (parsedDate && isFuture(parsedDate)) {
                    return cleaned;
                }
            }
        }
    }

    return null;
};

/**
 * Extract manufacturing date
 */
export const extractManufacturingDate = (text) => {
    const mfgPatterns = [
        /(?:mfg|mfd|manufactured|manufacturing date|mfg date)[\s:.]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/gi,
        /(?:mfg|mfd|manufactured)[\s:.]*(\d{1,2}[-/.]\d{4})/gi,
        /(?:mfg|mfd|manufactured)[\s:.]*([A-Z]{3}[-/.\s]\d{2,4})/gi,
    ];

    for (const pattern of mfgPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            for (const match of matches) {
                const cleaned = match.replace(/^(?:mfg|mfd|manufactured|manufacturing date|mfg date)[\s:.]*/gi, '').trim();
                // Validate it's a past date
                const parsedDate = parseDate(cleaned);
                if (parsedDate && isPast(parsedDate)) {
                    return cleaned;
                }
            }
        }
    }

    return null;
};

/**
 * Extract batch number
 */
export const extractBatchNumber = (text) => {
    const batchPatterns = [
        /(?:batch|lot|b\.?no\.?|batch no|lot no)[\s:.]*(\w{4,})/gi,
        /\b(BATCH\w+)\b/gi,
        /\b(LOT\w+)\b/gi,
    ];

    for (const pattern of batchPatterns) {
        const match = text.match(pattern);
        if (match) {
            const cleaned = match[0].replace(/^(?:batch|lot|b\.?no\.?|batch no|lot no)[\s:.]*/gi, '').trim();
            // Batch numbers are usually 6-12 characters
            if (cleaned.length >= 4 && cleaned.length <= 15) {
                return cleaned;
            }
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
 * Fuzzy match medicine name against database
 * @param {string} ocrName - Name extracted from OCR
 * @param {Array} database - Array of known medicine names
 * @param {number} threshold - Minimum similarity score (0-100)
 * @returns {object} Best match with score
 */
export const fuzzyMatchMedicineName = (ocrName, database, threshold = 70) => {
    if (!ocrName || !database || database.length === 0) {
        return { name: ocrName, score: 0, matched: false };
    }

    const results = fuzz.extract(ocrName, database, {
        scorer: fuzz.token_set_ratio,
        limit: 5,
        cutoff: threshold
    });

    if (results.length > 0) {
        const bestMatch = results[0];
        return {
            name: bestMatch[0],
            score: bestMatch[1],
            matched: true,
            alternatives: results.slice(1, 3).map(r => ({ name: r[0], score: r[1] }))
        };
    }

    return { name: ocrName, score: 0, matched: false };
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
        manufacturingDate: extractManufacturingDate(text),
        batchNumber: extractBatchNumber(text),
        manufacturer: extractManufacturer(text),
    };
};

/**
 * Parse date string into Date object
 * Supports multiple formats
 */
const parseDate = (dateStr) => {
    if (!dateStr) return null;

    const formats = [
        'dd/MM/yyyy',
        'dd-MM-yyyy',
        'dd.MM.yyyy',
        'MM/yyyy',
        'MM-yyyy',
        'MMM-yyyy',
        'MMM yyyy',
        'dd/MM/yy',
        'dd-MM-yy',
    ];

    for (const formatStr of formats) {
        try {
            const parsed = parse(dateStr, formatStr, new Date());
            if (isValid(parsed)) {
                return parsed;
            }
        } catch (e) {
            // Try next format
        }
    }

    return null;
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
