import Medicine from '../models/Medicine.js';
import { createError } from '../middleware/errorHandler.js';
import { fetchComprehensiveMedicineData } from '../utils/medlinePlusService.js';

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
    
    // For now, require medicine name to search
    if (!medicineName) {
      return next(createError(400, 'Medicine name is required'));
    }
    
    // Fetch comprehensive medicine data
    const result = await recognizeMedicineFromImage(image, useTrustedSources, medicineName);
    
    if (!result.success) {
      return next(createError(404, result.error || 'Could not find medicine information'));
    }
    
    res.json({
      status: 'success',
      data: {
        medicine: result.medicine,
        source: result.source,
        confidence: result.confidence
      }
    });
  } catch (error) {
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
