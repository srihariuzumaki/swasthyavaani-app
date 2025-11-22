/**
 * OCR Microservice Client
 * HTTP client for calling the Python OCR microservice deployed on Railway
 */

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:5000';
const OCR_SERVICE_TIMEOUT = parseInt(process.env.OCR_SERVICE_TIMEOUT) || 30000;
const OCR_SERVICE_MAX_RETRIES = parseInt(process.env.OCR_SERVICE_MAX_RETRIES) || 2;

/**
 * Call OCR microservice to extract text from image
 * @param {string} imageBase64 - Base64 encoded image
 * @param {Array<string>} languages - Languages to detect
 * @param {boolean} preprocess - Whether to preprocess image
 * @param {string} scanType - Type of scan (label, handwritten, printed)
 * @returns {Promise<object>} OCR result
 */
export const callOcrService = async (imageBase64, languages = ['en', 'hi'], preprocess = true, scanType = 'label') => {
    let lastError = null;

    for (let attempt = 0; attempt <= OCR_SERVICE_MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`Retrying OCR service (attempt ${attempt + 1}/${OCR_SERVICE_MAX_RETRIES + 1}) after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            console.log(`Calling OCR service at ${OCR_SERVICE_URL} (attempt ${attempt + 1}/${OCR_SERVICE_MAX_RETRIES + 1})...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), OCR_SERVICE_TIMEOUT);

            const response = await fetch(`${OCR_SERVICE_URL}/ocr/extract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageBase64,
                    languages,
                    preprocess,
                    scanType
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OCR service error: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'OCR service returned unsuccessful response');
            }

            console.log(`OCR service extracted ${result.data.text.length} characters with ${result.data.confidence.toFixed(2)} confidence`);

            return {
                text: result.data.text,
                confidence: result.data.confidence,
                blocks: result.data.blocks || [],
                engine: result.data.engine,
                languages: result.data.languages,
                preprocessed: result.data.preprocessed
            };

        } catch (error) {
            console.error(`OCR service error (attempt ${attempt + 1}):`, error.message);
            lastError = error;

            // Don't retry on certain errors
            if (error.name === 'AbortError') {
                console.error('OCR service request timed out');
            } else if (error.message.includes('400')) {
                // Bad request, don't retry
                throw error;
            }

            if (attempt < OCR_SERVICE_MAX_RETRIES) {
                continue;
            }
        }
    }

    throw new Error(`OCR service failed after ${OCR_SERVICE_MAX_RETRIES + 1} attempts: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Check if OCR service is available
 * @returns {Promise<boolean>}
 */
export const isOcrServiceAvailable = async () => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${OCR_SERVICE_URL}/health`, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            console.log('OCR service is available:', data);
            return true;
        }

        return false;
    } catch (error) {
        console.error('OCR service health check failed:', error.message);
        return false;
    }
};

/**
 * Get OCR service info
 * @returns {Promise<object>}
 */
export const getOcrServiceInfo = async () => {
    try {
        const response = await fetch(`${OCR_SERVICE_URL}/`, {
            method: 'GET'
        });

        if (response.ok) {
            return await response.json();
        }

        return null;
    } catch (error) {
        console.error('Failed to get OCR service info:', error.message);
        return null;
    }
};
