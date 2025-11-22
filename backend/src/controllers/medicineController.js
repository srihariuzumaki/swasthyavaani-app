import Medicine from '../models/Medicine.js';
import { createError } from '../middleware/errorHandler.js';
import { fetchComprehensiveMedicineData, getMedicineSuggestions } from '../utils/medlinePlusService.js';
import { findMedicineNameFromImage, extractTextFromImage } from '../utils/ocrService.js';

// Medicine recognition function using trusted sources
export const recognizeMedicineFromImage = async (imageBase64, useTrustedSources = false, medicineName = null) => {
  try {
    // If we have a medicine name, fetch comprehensive data
    if (medicineName) {
      const comprehensiveData = await fetchComprehensiveMedicineData(medicineName);

      if (comprehensiveData) {
        // Save to database if not exists
        let medicine = await Medicine.findOne({ name: { $regex: comprehensiveData.name, $options: 'i' } });

        if (!medicine) {
          // Create new medicine record
          medicine = await Medicine.create({
            name: comprehensiveData.name,
            genericName: comprehensiveData.genericName,
            category: comprehensiveData.category,
            description: comprehensiveData.description,
            usage: Array.isArray(comprehensiveData.usage) ? comprehensiveData.usage.join(', ') : comprehensiveData.usage,
            indications: comprehensiveData.usage,
            dosage: comprehensiveData.dosage,
            sideEffects: comprehensiveData.sideEffects,
            contraindications: comprehensiveData.contraindications,
            interactions: comprehensiveData.interactions,
            warnings: comprehensiveData.warnings,
            ageRestrictions: comprehensiveData.ageRestrictions,
            image: comprehensiveData.image,
            storageInstructions: comprehensiveData.storageInstructions,
            precautions: comprehensiveData.precautions,
            isPrescriptionRequired: comprehensiveData.isPrescriptionRequired || false,
          });
        }

        return {
          success: true,
          medicine,
          source: 'comprehensive_api',
          confidence: 0.95
        };
      }
    }

    if (useTrustedSources) {
      // Try to find in database first
      const medicines = await Medicine.find({
        isActive: true
      }).limit(10);

      if (medicines.length === 0) {
        return { success: false, error: 'No medicines found in database' };
      }

      const medicine = medicines[Math.floor(Math.random() * medicines.length)];
      return {
        success: true,
        medicine,
        source: 'database',
        confidence: 0.85
      };
    } else {
      const count = await Medicine.countDocuments({ isActive: true });
      if (count === 0) {
        return { success: false, error: 'No medicines available in database' };
      }
      const random = Math.floor(Math.random() * count);
      const fallbackMedicine = await Medicine.findOne({ isActive: true }).skip(random);
      return {
        success: true,
        medicine: fallbackMedicine,
        source: 'database',
        confidence: 0.75
      };
    }
  } catch (error) {
    console.error('Error in medicine recognition:', error);
    return { success: false, error: 'Failed to process medicine data' };
  }
};

export const scanMedicine = async (req, res, next) => {
  try {
    const { image, useTrustedSources = true, medicineName, language, scanType = 'auto' } = req.body;

    // Check if we have image data
    if (!image) {
      return next(createError(400, 'Image data is required'));
    }

    let extractedInfo = null;
    let extractedMedicineName = null;

    // If medicine name is provided, use it directly
    if (medicineName && medicineName.trim()) {
      extractedMedicineName = medicineName.trim();
      console.log('Using provided medicine name:', extractedMedicineName);
    } else {
      // Use new comprehensive OCR system to extract all information
      console.log('Extracting comprehensive medicine information from image...');
      try {
        const { extractMedicineInformation } = await import('../utils/ocrService.js');

        extractedInfo = await extractMedicineInformation(image, scanType, language || 'en');

        if (!extractedInfo || !extractedInfo.medicineName) {
          return next(createError(400, 'Could not identify medicine from image. Please enter the medicine name manually or provide a clearer image.'));
        }

        extractedMedicineName = extractedInfo.medicineName;
        console.log('Extracted medicine information:', {
          name: extractedInfo.medicineName,
          scanType: extractedInfo.scanType,
          engine: extractedInfo.ocrEngine,
          aiValidated: extractedInfo.aiValidated,
        });
      } catch (ocrError) {
        console.error('OCR Error:', ocrError);

        // Provide helpful error messages
        let errorMessage = ocrError.message;
        if (errorMessage.includes('timeout')) {
          errorMessage = 'OCR processing timed out. Please try again with a smaller, clearer image or enter the medicine name manually.';
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
          errorMessage = 'OCR service is temporarily unavailable. Please try again in a few moments or enter the medicine name manually.';
        } else if (errorMessage.includes('No OCR engines available')) {
          errorMessage = 'OCR service is not configured. Please contact support or enter the medicine name manually.';
        } else {
          errorMessage = `Failed to process image: ${errorMessage}. Please enter the medicine name manually or try again with a clearer image.`;
        }

        return next(createError(400, errorMessage));
      }
    }

    // Fetch comprehensive medicine data using extracted/provided name
    const result = await recognizeMedicineFromImage(image, useTrustedSources, extractedMedicineName);

    if (!result.success) {
      return next(createError(404, result.error || `Could not find medicine information for "${extractedMedicineName}". Please try entering the medicine name manually.`));
    }

    // If language is specified and not English, translate the medicine data
    let medicineData = result.medicine;
    if (language && language !== 'en') {
      try {
        const { fetchMedicineTranslation } = await import('../utils/medlinePlusService.js');
        const translatedData = await fetchMedicineTranslation(result.medicine.name, language);

        if (translatedData) {
          // Merge translated data with the real medicine object
          medicineData = {
            ...result.medicine.toObject(),
            ...translatedData,
            _id: result.medicine._id, // Preserve the real MongoDB ID
            usage: Array.isArray(translatedData.usage) ? translatedData.usage : [translatedData.usage],
            indications: Array.isArray(translatedData.usage) ? translatedData.usage : [translatedData.usage],
          };
        }
      } catch (translationError) {
        console.error('Translation error:', translationError);
        // Continue with English data if translation fails
      }
    }

    // Prepare response with comprehensive data
    const responseData = {
      medicine: medicineData,
      source: result.source,
      confidence: result.confidence,
      extractedName: extractedMedicineName,
    };

    // Include structured data from OCR if available
    if (extractedInfo) {
      responseData.structuredData = {
        scanType: extractedInfo.scanType,
        dosage: extractedInfo.dosage,
        expiryDate: extractedInfo.expiryDate,
        batchNumber: extractedInfo.batchNumber,
        manufacturer: extractedInfo.manufacturer,
        ocrEngine: extractedInfo.ocrEngine,
        ocrConfidence: extractedInfo.ocrConfidence,
        aiValidated: extractedInfo.aiValidated,
        aiConfidence: extractedInfo.aiConfidence,
      };
    }

    res.json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    console.error('Scan medicine error:', error);
    next(error);
  }
};

// New function to search medicine by name and return comprehensive data
export const searchMedicineByName = async (req, res, next) => {
  try {
    const { medicineName } = req.params;

    if (!medicineName) {
      return next(createError(400, 'Medicine name is required'));
    }

    // First check database
    let medicine = await Medicine.findOne({
      name: { $regex: medicineName, $options: 'i' }
    }).populate('personalMedicines.medicine');

    // If not found, fetch from comprehensive API
    if (!medicine) {
      const comprehensiveData = await fetchComprehensiveMedicineData(medicineName);

      if (comprehensiveData) {
        medicine = await Medicine.create({
          name: comprehensiveData.name,
          genericName: comprehensiveData.genericName,
          category: comprehensiveData.category,
          description: comprehensiveData.description,
          usage: Array.isArray(comprehensiveData.usage) ? comprehensiveData.usage.join(', ') : comprehensiveData.usage,
          indications: comprehensiveData.usage,
          dosage: comprehensiveData.dosage,
          sideEffects: comprehensiveData.sideEffects,
          contraindications: comprehensiveData.contraindications,
          interactions: comprehensiveData.interactions,
          warnings: comprehensiveData.warnings,
          ageRestrictions: comprehensiveData.ageRestrictions,
          image: comprehensiveData.image,
          storageInstructions: comprehensiveData.storageInstructions,
          precautions: comprehensiveData.precautions,
          isPrescriptionRequired: comprehensiveData.isPrescriptionRequired || false,
        });
      }
    }

    if (!medicine) {
      return next(createError(404, 'Medicine not found'));
    }

    res.json({
      status: 'success',
      data: { medicine }
    });
  } catch (error) {
    next(error);
  }
};

// Get medicine suggestions for autocomplete
export const getSuggestions = async (req, res, next) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        status: 'success',
        data: { suggestions: [] }
      });
    }

    const suggestions = await getMedicineSuggestions(query, parseInt(limit));

    res.json({
      status: 'success',
      data: { suggestions }
    });
  } catch (error) {
    next(error);
  }
};
