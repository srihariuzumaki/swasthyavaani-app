import vision from '@google-cloud/vision';

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;

// Initialize Vision API client
let visionClient = null;

/**
 * Initialize Google Vision API client
 */
const initializeVisionClient = () => {
    if (!GOOGLE_VISION_API_KEY) {
        console.warn('Google Vision API key not found. Vision API will be unavailable.');
        return null;
    }

    try {
        // Initialize with API key directly (not keyFilename)
        // For API key authentication, we need to use a different approach
        visionClient = new vision.ImageAnnotatorClient({
            apiKey: GOOGLE_VISION_API_KEY,
        });
        console.log('Google Vision API client initialized successfully');
        return visionClient;
    } catch (error) {
        console.error('Failed to initialize Google Vision API client:', error);
        return null;
    }
};

/**
 * Extract text from image using Google Vision API
 * @param {string} imageBase64 - Base64 encoded image data (without data URL prefix)
 * @param {string} scanType - Type of scan: 'label', 'handwritten', 'printed'
 * @returns {Promise<{text: string, confidence: number, blocks: Array}>} Extracted text with metadata
 */
export const extractTextWithVision = async (imageBase64, scanType = 'label') => {
    try {
        // Initialize client if not already done
        if (!visionClient) {
            visionClient = initializeVisionClient();
        }

        if (!visionClient) {
            throw new Error('Google Vision API client not available');
        }

        // Prepare image for Vision API
        const image = {
            content: imageBase64,
        };

        // Choose detection method based on scan type
        let response;
        if (scanType === 'handwritten') {
            // Use document text detection for handwritten text
            [response] = await visionClient.documentTextDetection(image);
        } else {
            // Use text detection for printed text (labels, prescriptions)
            [response] = await visionClient.textDetection(image);
        }

        const detections = response.textAnnotations;

        if (!detections || detections.length === 0) {
            return {
                text: '',
                confidence: 0,
                blocks: [],
            };
        }

        // First annotation contains the entire detected text
        const fullText = detections[0].description || '';

        // Calculate average confidence from all detections
        let totalConfidence = 0;
        let confidenceCount = 0;

        const blocks = detections.slice(1).map(detection => {
            if (detection.confidence !== undefined) {
                totalConfidence += detection.confidence;
                confidenceCount++;
            }

            return {
                text: detection.description,
                confidence: detection.confidence || 0,
                boundingBox: detection.boundingPoly,
            };
        });

        const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.8;

        console.log(`Vision API extracted ${fullText.length} characters with ${averageConfidence.toFixed(2)} confidence`);

        return {
            text: fullText.trim(),
            confidence: averageConfidence,
            blocks,
        };
    } catch (error) {
        console.error('Google Vision API error:', error);
        throw new Error(`Vision API failed: ${error.message}`);
    }
};

/**
 * Detect document features (useful for scan type auto-detection)
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<{hasHandwriting: boolean, textDensity: number, layout: string}>}
 */
export const detectDocumentFeatures = async (imageBase64) => {
    try {
        if (!visionClient) {
            visionClient = initializeVisionClient();
        }

        if (!visionClient) {
            throw new Error('Google Vision API client not available');
        }

        const image = { content: imageBase64 };

        // Use document text detection to get detailed analysis
        const [result] = await visionClient.documentTextDetection(image);
        const fullTextAnnotation = result.fullTextAnnotation;

        if (!fullTextAnnotation) {
            return {
                hasHandwriting: false,
                textDensity: 0,
                layout: 'unknown',
            };
        }

        // Analyze pages and blocks to determine document characteristics
        const pages = fullTextAnnotation.pages || [];
        let totalBlocks = 0;
        let handwritingIndicators = 0;

        pages.forEach(page => {
            page.blocks?.forEach(block => {
                totalBlocks++;
                // Check for handwriting indicators (lower confidence, irregular spacing)
                if (block.confidence && block.confidence < 0.7) {
                    handwritingIndicators++;
                }
            });
        });

        const hasHandwriting = handwritingIndicators / Math.max(totalBlocks, 1) > 0.3;
        const textDensity = totalBlocks / Math.max(pages.length, 1);

        // Determine layout type
        let layout = 'label'; // Default
        if (textDensity > 10) {
            layout = 'prescription'; // Dense text suggests prescription
        }
        if (hasHandwriting) {
            layout = 'handwritten';
        }

        return {
            hasHandwriting,
            textDensity,
            layout,
        };
    } catch (error) {
        console.error('Document feature detection error:', error);
        return {
            hasHandwriting: false,
            textDensity: 0,
            layout: 'unknown',
        };
    }
};

/**
 * Check if Google Vision API is available
 * @returns {boolean}
 */
export const isVisionApiAvailable = () => {
    return !!GOOGLE_VISION_API_KEY;
};
