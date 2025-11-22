/**
 * Confidence Scoring Service
 * Calculates confidence scores for OCR results and extracted data
 */

/**
 * Calculate overall confidence score
 * @param {object} ocrResult - OCR result with text and confidence
 * @param {object} extractedData - Extracted structured data
 * @param {object} fuzzyMatch - Fuzzy match result (if available)
 * @returns {object} Confidence breakdown and overall score
 */
export const calculateOverallConfidence = (ocrResult, extractedData, fuzzyMatch = null) => {
    const scores = {
        ocrConfidence: 0,
        patternMatchScore: 0,
        fuzzyMatchScore: 0,
        dataCompletenessScore: 0,
        validationScore: 0,
    };

    // 1. OCR Confidence (30% weight)
    if (ocrResult && ocrResult.confidence) {
        scores.ocrConfidence = ocrResult.confidence * 100;
    }

    // 2. Pattern Match Score (25% weight)
    scores.patternMatchScore = calculatePatternMatchScore(extractedData);

    // 3. Fuzzy Match Score (20% weight)
    if (fuzzyMatch && fuzzyMatch.matched) {
        scores.fuzzyMatchScore = fuzzyMatch.score;
    } else if (extractedData && extractedData.medicineName) {
        // If we have a medicine name but no fuzzy match, give partial credit
        scores.fuzzyMatchScore = 50;
    }

    // 4. Data Completeness Score (15% weight)
    scores.dataCompletenessScore = calculateCompletenessScore(extractedData);

    // 5. Validation Score (10% weight)
    scores.validationScore = calculateValidationScore(extractedData);

    // Calculate weighted overall score
    const overallScore = (
        scores.ocrConfidence * 0.30 +
        scores.patternMatchScore * 0.25 +
        scores.fuzzyMatchScore * 0.20 +
        scores.dataCompletenessScore * 0.15 +
        scores.validationScore * 0.10
    );

    return {
        overall: Math.round(overallScore),
        breakdown: scores,
        level: getConfidenceLevel(overallScore),
        requiresConfirmation: overallScore < 80
    };
};

/**
 * Calculate pattern match score based on how many fields were extracted
 * @param {object} extractedData - Extracted structured data
 * @returns {number} Score 0-100
 */
const calculatePatternMatchScore = (extractedData) => {
    if (!extractedData) return 0;

    let score = 0;
    const weights = {
        medicineName: 40,  // Most important
        dosage: 20,
        expiryDate: 15,
        batchNumber: 10,
        manufacturer: 10,
        manufacturingDate: 5
    };

    // Check each field and add weighted score
    if (extractedData.medicineName) score += weights.medicineName;
    if (extractedData.dosage) score += weights.dosage;
    if (extractedData.expiryDate) score += weights.expiryDate;
    if (extractedData.batchNumber) score += weights.batchNumber;
    if (extractedData.manufacturer) score += weights.manufacturer;
    if (extractedData.manufacturingDate) score += weights.manufacturingDate;

    return score;
};

/**
 * Calculate data completeness score
 * @param {object} extractedData - Extracted structured data
 * @returns {number} Score 0-100
 */
const calculateCompletenessScore = (extractedData) => {
    if (!extractedData) return 0;

    const fields = [
        'medicineName',
        'dosage',
        'expiryDate',
        'batchNumber',
        'manufacturer',
        'manufacturingDate'
    ];

    const filledFields = fields.filter(field =>
        extractedData[field] && extractedData[field].length > 0
    ).length;

    return (filledFields / fields.length) * 100;
};

/**
 * Calculate validation score based on business rules
 * @param {object} extractedData - Extracted structured data
 * @returns {number} Score 0-100
 */
const calculateValidationScore = (extractedData) => {
    if (!extractedData) return 0;

    let score = 100;
    const penalties = [];

    // Check medicine name validity
    if (extractedData.medicineName) {
        if (extractedData.medicineName.length < 3) {
            score -= 30;
            penalties.push('Medicine name too short');
        }
        if (!/[A-Za-z]/.test(extractedData.medicineName)) {
            score -= 20;
            penalties.push('Medicine name has no letters');
        }
    } else {
        score -= 40;
        penalties.push('No medicine name');
    }

    // Check dosage format
    if (extractedData.dosage) {
        if (!/\d+\s*(mg|ml|g|mcg|iu|units?)/i.test(extractedData.dosage)) {
            score -= 15;
            penalties.push('Invalid dosage format');
        }
    }

    // Check expiry date format
    if (extractedData.expiryDate) {
        if (!/\d/.test(extractedData.expiryDate)) {
            score -= 15;
            penalties.push('Invalid expiry date format');
        }
    }

    // Check batch number format
    if (extractedData.batchNumber) {
        if (extractedData.batchNumber.length < 4 || extractedData.batchNumber.length > 15) {
            score -= 10;
            penalties.push('Unusual batch number length');
        }
    }

    return Math.max(0, score);
};

/**
 * Get confidence level from score
 * @param {number} score - Confidence score (0-100)
 * @returns {string} Confidence level
 */
export const getConfidenceLevel = (score) => {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
};

/**
 * Generate user-friendly prompt based on confidence
 * @param {object} extractedData - Extracted structured data
 * @param {object} confidence - Confidence scores
 * @returns {string} User prompt message
 */
export const generateUserPrompt = (extractedData, confidence) => {
    const level = confidence.level;

    if (level === 'high') {
        return `We found: ${extractedData.medicineName || 'Unknown medicine'}. Is this correct?`;
    }

    if (level === 'medium') {
        return `We think this might be: ${extractedData.medicineName || 'Unknown medicine'}. Please verify.`;
    }

    // Low confidence
    const fields = [];
    if (extractedData.medicineName) fields.push(`Medicine: ${extractedData.medicineName}`);
    if (extractedData.dosage) fields.push(`Dosage: ${extractedData.dosage}`);
    if (extractedData.expiryDate) fields.push(`Expiry: ${extractedData.expiryDate}`);

    if (fields.length > 0) {
        return `We extracted:\n${fields.join('\n')}\n\nPlease verify or correct this information.`;
    }

    return 'We couldn\'t extract clear information. Please enter the medicine details manually.';
};

/**
 * Determine if manual input is required
 * @param {object} confidence - Confidence scores
 * @returns {boolean} True if manual input needed
 */
export const requiresManualInput = (confidence) => {
    return confidence.overall < 50 || confidence.level === 'low';
};

/**
 * Get fields that need user verification
 * @param {object} extractedData - Extracted structured data
 * @param {object} confidence - Confidence scores
 * @returns {Array} List of field names that need verification
 */
export const getFieldsNeedingVerification = (extractedData, confidence) => {
    const fieldsToVerify = [];

    // Always verify medicine name if confidence is not high
    if (confidence.level !== 'high' && extractedData.medicineName) {
        fieldsToVerify.push('medicineName');
    }

    // Verify dosage if pattern match score is low
    if (confidence.breakdown.patternMatchScore < 60 && extractedData.dosage) {
        fieldsToVerify.push('dosage');
    }

    // Verify expiry date if validation score is low
    if (confidence.breakdown.validationScore < 70 && extractedData.expiryDate) {
        fieldsToVerify.push('expiryDate');
    }

    return fieldsToVerify;
};
