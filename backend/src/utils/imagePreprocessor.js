/**
 * Image Preprocessing Service
 * Enhances image quality before OCR for better accuracy
 * Uses Sharp for image processing
 */

import sharp from 'sharp';

/**
 * Preprocess image for optimal OCR results
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<string>} Enhanced base64 image
 */
export const preprocessImage = async (imageBase64) => {
    try {
        // Remove data URL prefix if present
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');

        // Apply preprocessing pipeline
        const processed = await sharp(buffer)
            // Convert to grayscale (better for OCR)
            .grayscale()
            // Enhance contrast using normalization
            .normalize()
            // Sharpen to make text clearer
            .sharpen()
            // Resize if too large (max 2000px width, maintain aspect ratio)
            .resize(2000, 2000, {
                fit: 'inside',
                withoutEnlargement: true
            })
            // Convert to PNG for better quality
            .png()
            .toBuffer();

        // Convert back to base64
        return processed.toString('base64');
    } catch (error) {
        console.error('Image preprocessing error:', error);
        // Return original if preprocessing fails
        return imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    }
};

/**
 * Advanced preprocessing with adaptive thresholding
 * Better for low-quality or uneven lighting
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<string>} Enhanced base64 image
 */
export const preprocessImageAdvanced = async (imageBase64) => {
    try {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');

        // Get image metadata
        const metadata = await sharp(buffer).metadata();

        // Apply advanced preprocessing
        const processed = await sharp(buffer)
            // Convert to grayscale
            .grayscale()
            // Apply Gaussian blur to reduce noise
            .blur(0.5)
            // Enhance contrast
            .normalize()
            // Sharpen edges
            .sharpen({
                sigma: 1.5,
                m1: 0.5,
                m2: 0.5,
                x1: 2,
                y1: 10
            })
            // Resize for optimal OCR (1600-2000px width)
            .resize(1800, 1800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            // Convert to high-quality PNG
            .png({ quality: 100, compressionLevel: 6 })
            .toBuffer();

        return processed.toString('base64');
    } catch (error) {
        console.error('Advanced preprocessing error:', error);
        // Fallback to basic preprocessing
        return preprocessImage(imageBase64);
    }
};

/**
 * Denoise image to remove grain and artifacts
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<string>} Denoised base64 image
 */
export const denoiseImage = async (imageBase64) => {
    try {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');

        const processed = await sharp(buffer)
            // Median filter effect through blur
            .median(3)
            // Convert to PNG
            .png()
            .toBuffer();

        return processed.toString('base64');
    } catch (error) {
        console.error('Denoise error:', error);
        return imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    }
};

/**
 * Enhance contrast using CLAHE-like approach
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<string>} Enhanced base64 image
 */
export const enhanceContrast = async (imageBase64) => {
    try {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');

        const processed = await sharp(buffer)
            .grayscale()
            // Normalize to stretch histogram
            .normalize()
            // Linear adjustment for better contrast
            .linear(1.2, -(128 * 0.2))
            .png()
            .toBuffer();

        return processed.toString('base64');
    } catch (error) {
        console.error('Contrast enhancement error:', error);
        return imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    }
};

/**
 * Auto-rotate image to correct orientation
 * Uses EXIF data if available
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<string>} Rotated base64 image
 */
export const autoRotateImage = async (imageBase64) => {
    try {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');

        const processed = await sharp(buffer)
            // Auto-rotate based on EXIF orientation
            .rotate()
            .png()
            .toBuffer();

        return processed.toString('base64');
    } catch (error) {
        console.error('Auto-rotate error:', error);
        return imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    }
};

/**
 * Full preprocessing pipeline for medicine labels
 * Combines all preprocessing steps
 * @param {string} imageBase64 - Base64 encoded image
 * @param {object} options - Preprocessing options
 * @returns {Promise<string>} Fully processed base64 image
 */
export const preprocessMedicineLabel = async (imageBase64, options = {}) => {
    const {
        denoise = true,
        enhanceContrast = true,
        autoRotate = true,
        advanced = false
    } = options;

    try {
        let processed = imageBase64;

        // Step 1: Auto-rotate if needed
        if (autoRotate) {
            processed = await autoRotateImage(processed);
        }

        // Step 2: Denoise if enabled
        if (denoise) {
            processed = await denoiseImage(processed);
        }

        // Step 3: Use advanced or basic preprocessing
        if (advanced) {
            processed = await preprocessImageAdvanced(processed);
        } else {
            processed = await preprocessImage(processed);
        }

        console.log('Medicine label preprocessing complete');
        return processed;
    } catch (error) {
        console.error('Full preprocessing pipeline error:', error);
        // Return basic preprocessing as fallback
        return preprocessImage(imageBase64);
    }
};
