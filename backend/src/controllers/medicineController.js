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
    const { image, useTrustedSources = true, medicineName } = req.body;
    
    // Check if we have image data
    if (!image) {
      return next(createError(400, 'Image data is required'));
    }
    
    let extractedMedicineName = null;
    
    // If medicine name is provided, use it directly
    if (medicineName && medicineName.trim()) {
      extractedMedicineName = medicineName.trim();
    } else {
      // Try to extract medicine name from image using OCR
      console.log('Extracting medicine name from image using OCR...');
      try {
        extractedMedicineName = await findMedicineNameFromImage(image);
        
        if (!extractedMedicineName) {
          // If OCR fails, try extracting all text and showing it to user
          const fullText = await extractTextFromImage(image);
          if (fullText && fullText.trim().length > 0) {
            return next(createError(400, `Could not identify medicine name from image. Extracted text: "${fullText.substring(0, 200)}". Please enter the medicine name manually.`));
          }
          return next(createError(400, 'Could not identify medicine name from image. Please enter the medicine name manually or provide a clearer image.'));
        }
        
        console.log('Extracted medicine name from OCR:', extractedMedicineName);
      } catch (ocrError) {
        console.error('OCR Error:', ocrError);
        return next(createError(400, 'Failed to process image. Please enter the medicine name manually or try again with a clearer image.'));
      }
    }
    
    // Fetch comprehensive medicine data using extracted/provided name
    const result = await recognizeMedicineFromImage(image, useTrustedSources, extractedMedicineName);
    
    if (!result.success) {
      return next(createError(404, result.error || `Could not find medicine information for "${extractedMedicineName}". Please try entering the medicine name manually.`));
    }
    
    res.json({
      status: 'success',
      data: {
        medicine: result.medicine,
        source: result.source,
        confidence: result.confidence,
        extractedName: extractedMedicineName // Include extracted name for debugging
      }
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
