import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USE_EASYOCR_FALLBACK = process.env.USE_EASYOCR_FALLBACK === 'true';

/**
 * Extract text from image using EasyOCR (Python-based)
 * @param {string} imageBase64 - Base64 encoded image
 * @param {Array<string>} languages - Languages to detect (default: ['en'])
 * @returns {Promise<{text: string, confidence: number}>}
 */
export const extractTextWithEasyOCR = async (imageBase64, languages = ['en']) => {
    if (!USE_EASYOCR_FALLBACK) {
        throw new Error('EasyOCR fallback is disabled');
    }

    return new Promise((resolve, reject) => {
        try {
            // Path to Python script for EasyOCR
            const pythonScript = path.join(__dirname, 'easyocr_script.py');

            // Spawn Python process
            const python = spawn('python', [
                pythonScript,
                '--languages', languages.join(','),
                '--image', imageBase64,
            ]);

            let outputData = '';
            let errorData = '';

            python.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    console.error('EasyOCR Python script error:', errorData);
                    reject(new Error(`EasyOCR failed with code ${code}: ${errorData}`));
                    return;
                }

                try {
                    const result = JSON.parse(outputData);
                    resolve({
                        text: result.text || '',
                        confidence: result.confidence || 0.6,
                    });
                } catch (parseError) {
                    console.error('Failed to parse EasyOCR output:', parseError);
                    reject(new Error('Failed to parse EasyOCR output'));
                }
            });

            // Timeout after 60 seconds
            setTimeout(() => {
                python.kill();
                reject(new Error('EasyOCR timeout'));
            }, 60000);
        } catch (error) {
            console.error('EasyOCR error:', error);
            reject(error);
        }
    });
};

/**
 * Check if EasyOCR is available
 * @returns {Promise<boolean>}
 */
export const isEasyOCRAvailable = async () => {
    if (!USE_EASYOCR_FALLBACK) {
        return false;
    }

    return new Promise((resolve) => {
        const python = spawn('python', ['-c', 'import easyocr; print("OK")']);

        python.on('close', (code) => {
            resolve(code === 0);
        });

        python.on('error', () => {
            resolve(false);
        });

        setTimeout(() => {
            python.kill();
            resolve(false);
        }, 5000);
    });
};
