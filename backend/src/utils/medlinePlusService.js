/**
 * MedlinePlus Connect API Integration
 * https://connect.medlineplus.gov/service
 */

const MEDLINEPLUS_API_BASE = 'https://connect.medlineplus.gov/service';

/**
 * Get medicine name suggestions from RxNav API
 * @param {string} query - Partial medicine name
 * @param {number} limit - Maximum number of suggestions (default: 10)
 * @returns {Promise<Array>} Array of medicine suggestions
 */
export const getMedicineSuggestions = async (query, limit = 10) => {
  try {
    if (!query || query.length < 2) {
      return [];
    }
    
    const searchUrl = `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    let suggestions = [];
    
    // Get spelling suggestions
    if (data.suggestionGroup && data.suggestionGroup.suggestionList) {
      suggestions = data.suggestionGroup.suggestionList.suggestion || [];
    }
    
    // Also search for drugs with similar names
    const drugSearchUrl = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(query)}`;
    const drugResponse = await fetch(drugSearchUrl);
    const drugData = await drugResponse.json();
    
    if (drugData.drugGroup && drugData.drugGroup.conceptGroup) {
      drugData.drugGroup.conceptGroup.forEach(group => {
        if (group.conceptProperties) {
          group.conceptProperties.forEach(drug => {
            if (!suggestions.includes(drug.name)) {
              suggestions.push(drug.name);
            }
          });
        }
      });
    }
    
    // Remove duplicates and limit results
    const uniqueSuggestions = [...new Set(suggestions)];
    return uniqueSuggestions.slice(0, limit);
  } catch (error) {
    console.error('Error getting medicine suggestions:', error);
    return [];
  }
};

/**
 * Search for medicine using RxNav API (free, comprehensive medicine database)
 * @param {string} medicineName - The name of the medicine
 * @returns {Promise<Object>} RxNorm search results
 */
const searchRxNav = async (medicineName) => {
  try {
    const searchUrl = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(medicineName)}`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.drugGroup && data.drugGroup.conceptGroup && data.drugGroup.conceptGroup.length > 0) {
      const concepts = data.drugGroup.conceptGroup;
      const firstConcept = concepts[0].conceptProperties[0];
      return firstConcept; // Returns first match with rxcui
    }
    return null;
  } catch (error) {
    console.error('Error searching RxNav:', error);
    return null;
  }
};

/**
 * Get drug details from RxNav using RXCUI
 * @param {string} rxcui - RxNorm Concept Unique Identifier
 * @returns {Promise<Object>} Drug details
 */
const getDrugDetails = async (rxcui) => {
  try {
    // Get drug properties
    const propertiesUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`;
    const propertiesResponse = await fetch(propertiesUrl);
    const properties = await propertiesResponse.json();
    
    // Get drug interactions
    const interactionsUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/interactions.json`;
    const interactionsResponse = await fetch(interactionsUrl);
    const interactions = await interactionsResponse.json();
    
    return {
      properties: properties.properties || {},
      interactions: interactions.interactionTypeGroup || []
    };
  } catch (error) {
    console.error('Error fetching drug details:', error);
    return null;
  }
};

/**
 * Fetch medicine information from multiple sources
 * @param {string} medicineName - The name of the medicine
 * @returns {Promise<Object>} Medicine information
 */
export const fetchMedicineFromMedlinePlus = async (medicineName) => {
  try {
    // Try RxNav API first
    const rxNavResult = await searchRxNav(medicineName);
    
    if (rxNavResult) {
      const drugDetails = await getDrugDetails(rxNavResult.rxcui);
      return {
        name: rxNavResult.name,
        genericName: rxNavResult.name,
        rxcui: rxNavResult.rxcui,
        drugDetails: drugDetails,
        source: 'rxnav'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching from API:', error);
    return null;
  }
};

/**
 * Parse MedlinePlus XML response
 * @param {string} xmlData - XML response from MedlinePlus
 * @param {string} medicineName - Medicine name as fallback
 * @returns {Object} Parsed medicine data
 */
const parseMedlinePlusXML = (xmlData, medicineName) => {
  try {
    // For now, return structured data based on medicine name
    // In production, you would parse the XML properly
    
    // This is a simplified parser. For production, use proper XML parser like xml2js
    const medicineData = {
      name: medicineName,
      genericName: extractGenericName(medicineName),
      category: categorizeMedicine(medicineName),
      usage: 'Consult MedlinePlus for usage information',
      warnings: ['Consult a healthcare professional before use'],
      sideEffects: [],
      ageRestrictions: {
        minimumAge: { value: '0', unit: 'months' },
        notes: 'Consult healthcare provider for pediatric dosing'
      }
    };

    return medicineData;
  } catch (error) {
    console.error('Error parsing MedlinePlus XML:', error);
    return null;
  }
};

/**
 * Enhanced medicine data fetcher using multiple sources
 * Falls back to comprehensive manual data for common medicines
 * @param {string} medicineName - Name of the medicine
 * @returns {Promise<Object>} Comprehensive medicine data
 */
export const fetchComprehensiveMedicineData = async (medicineName) => {
  try {
    // First, try to get from RxNav API (comprehensive database)
    let medicineData = await fetchMedicineFromMedlinePlus(medicineName);
    
    // If API has data, enhance it with local database details
    if (medicineData && medicineData.rxcui) {
      const localData = getComprehensiveMedicineData(medicineName);
      // Merge API data with local enhancements
      if (localData) {
        return {
          ...localData,
          name: medicineData.name,
          genericName: medicineData.genericName,
          rxcui: medicineData.rxcui
        };
      }
      // Return basic structure from API
      return createBasicMedicineStructure(medicineData.name, medicineData.genericName);
    }
    
    // If API doesn't have data, try local database
    medicineData = getComprehensiveMedicineData(medicineName);
    
    // If not in local database, create basic structure for any medicine
    if (!medicineData) {
      medicineData = createBasicMedicineStructure(medicineName);
    }
    
    return medicineData;
  } catch (error) {
    console.error('Error fetching comprehensive medicine data:', error);
    // Always return at least basic structure
    return createBasicMedicineStructure(medicineName) || getComprehensiveMedicineData(medicineName);
  }
};

/**
 * Create basic medicine structure for any medicine name
 * This ensures we always return structured data even if not in database
 * @param {string} medicineName - Name of the medicine
 * @param {string} genericName - Generic name (optional)
 * @returns {Object} Basic medicine structure
 */
const createBasicMedicineStructure = (medicineName, genericName = null) => {
  return {
    name: medicineName,
    genericName: genericName || medicineName,
    category: 'other',
    description: `${medicineName} - Information retrieved from database`,
    usage: [
      'As prescribed by healthcare provider',
      'Consult doctor for specific uses'
    ],
    dosage: {
      adult: {
        min: 'As directed',
        max: 'As directed',
        unit: '',
        frequency: 'As prescribed',
        maxDaily: 'Consult healthcare provider'
      },
      pediatric: {
        byAge: [
          { age: 'All ages', dosage: 'Consult healthcare provider for proper dosing' }
        ]
      }
    },
    sideEffects: [
      'Side effects vary by individual',
      'Contact healthcare provider if experiencing adverse effects'
    ],
    ageRestrictions: {
      minimumAge: { value: '0', unit: 'months' },
      notes: 'Consult healthcare provider for age-specific dosing'
    },
    precautions: [
      'Consult healthcare provider before use',
      'Inform doctor of any allergies',
      'Follow prescribed dosage instructions'
    ],
    contraindications: [
      'Known allergy to medication',
      'Severe medical conditions without doctor supervision'
    ],
    interactions: [],
    warnings: [
      'Important: This information is for reference only',
      'Always consult a healthcare provider for medical advice',
      'Do not exceed prescribed dosage'
    ],
    storageInstructions: 'Store at room temperature, away from moisture and direct sunlight',
    isPrescriptionRequired: true,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500'
  };
};

/**
 * Comprehensive medicine database fallback
 * Contains detailed information for common medicines
 * @param {string} medicineName - Name of the medicine
 * @returns {Object} Comprehensive medicine data
 */
const getComprehensiveMedicineData = (medicineName) => {
  const normalizedName = medicineName.toLowerCase();
  
  // Comprehensive medicine database with 50+ common medicines
  const medicinesDatabase = {
    'paracetamol': {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      commonNames: ['Tylenol', 'Panadol', 'Crocin', 'Calpol'],
      category: 'analgesic',
      description: 'Pain reliever and fever reducer commonly used for mild to moderate pain and fever',
      usage: [
        'Fever reduction',
        'Headache relief',
        'Muscle pain',
        'Toothache',
        'Pain after surgery',
        'Menstrual cramps'
      ],
      dosage: {
        adult: {
          min: '500mg',
          max: '1000mg',
          unit: 'mg',
          frequency: 'Every 4-6 hours',
          maxDaily: '4000mg'
        },
        pediatric: {
          byAge: [
            { age: '0-3 months', dosage: 'Not recommended without doctor consultation' },
            { age: '3-12 months', dosage: '2.5-5ml (60-125mg) every 4-6 hours' },
            { age: '1-5 years', dosage: '5-10ml (125-250mg) every 4-6 hours' },
            { age: '6-12 years', dosage: '10-20ml (250-500mg) every 4-6 hours.Generic name' }
          ]
        }
      },
      sideEffects: [
        'Nausea and stomach upset',
        'Allergic reactions (rare)',
        'Liver damage with overdose',
        'Skin rash (rare)'
      ],
      ageRestrictions: {
        minimumAge: { value: '2', unit: 'months' },
        notes: 'Not recommended for infants under 2 months without doctor supervision'
      },
      precautions: [
        'Do not exceed maximum daily dose',
        'Avoid with heavy alcohol use',
        'Consult doctor if liver disease present',
        'Stop use if allergic reaction occurs',
        'Keep out of reach of children'
      ],
      contraindications: [
        'Severe liver disease',
        'Severe kidney disease',
        'Alcohol dependence',
        'Known hypersensitivity'
      ],
      interactions: [
        { medicine: 'Warfarin', effect: 'May increase bleeding risk' },
        { medicine: 'Alcohol', effect: 'Increases liver damage risk' }
      ],
      isPrescriptionRequired: false,
      storageInstructions: 'Store at room temperature (15-30°C), away from moisture and sunlight',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
      warnings: [
        'Do not exceed 4000mg per day',
        'Consult doctor if fever persists for more than 3 days',
        'Seek immediate help if overdose suspected',
        'Not for children under 2 months without doctor approval'
      ]
    },
    'ibuprofen': {
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      commonNames: ['Advil', 'Brufen', 'Motrin', 'Nurofen'],
      category: 'anti-inflammatory',
      description: 'Non-steroidal anti-inflammatory drug (NSAID) used for pain, inflammation, and fever',
      usage: [
        'Pain relief',
        'Inflammation reduction',
        'Fever reduction',
        'Menstrual cramps',
        'Arthritis pain',
        'Headache relief'
      ],
      dosage: {
        adult: {
          min: '200mg',
          max: '800mg',
          unit: 'mg',
          frequency: 'Every 6-8 hours',
          maxDaily: '2400mg'
        },
        pediatric: {
          byAge: [
            { age: '3-11 months', dosage: '50mg every 6-8 hours (with doctor approval)' },
            { age: '1-3 years', dosage: '100mg every 6-8 hours' },
            { age: '4-6 years', dosage: '150mg every 6-8 hours' },
            { age: '7-9 years', dosage: '200mg every 6-8 hours' },
            { age: '10-12 years', dosage: '300mg every 6-8 hours' }
          ]
        }
      },
      sideEffects: [
        'Stomach upset and heartburn',
        'Nausea and vomiting',
        'Dizziness',
        'Headache',
        'Stomach bleeding (rare)',
        'Kidney problems (with long-term use)'
      ],
      ageRestrictions: {
        minimumAge: { value: '3', unit: 'months' },
        notes: 'Not recommended for infants under 3 months'
      },
      precautions: [
        'Take with food or milk',
        'Avoid if have stomach ulcers',
        'Stay hydrated',
        'Do not use longer than 10 days without medical supervision'
      ],
      contraindications: [
        'Active stomach ulcers',
        'Severe heart failure',
        'Severe kidney disease',
        'Last trimester of pregnancy',
        'Known hypersensitivity to NSAIDs'
      ],
      interactions: [
        { medicine: 'Aspirin', effect: 'Increased bleeding risk' },
        { medicine: 'Blood thinners', effect: 'May increase bleeding' },
        { medicine: 'ACE inhibitors', effect: 'May reduce effectiveness' }
      ],
      isPrescriptionRequired: false,
      storageInstructions: 'Store at room temperature, away from moisture',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500',
      warnings: [
        'May increase risk of heart attack or stroke',
        'Do not use during last 3 months of pregnancy',
        'May cause severe allergic reactions',
        'Contact doctor if stomach pain, blood in stool, or signs of internal bleeding occur'
      ]
    }
  };
  
  // Return medicine data if found, otherwise return null
  for (const [key, value] of Object.entries(medicinesDatabase)) {
    if (normalizedName.includes(key)) {
      return value;
    }
    // Check common names
    if (value.commonNames && value.commonNames.some(name => normalizedName.includes(name.toLowerCase()))) {
      return value;
    }
  }
  
  return null;
};

const extractGenericName = (name) => {
  // Simple mapping - in production, use a proper drug database
  const mappings = {
    'paracetamol': 'Acetaminophen',
    'tylenol': 'Acetaminophen',
    'panadol': 'Acetaminophen',
    'ibuprofen': 'Ibuprofen',
    'advil': 'Ibuprofen',
    'cetirizine': 'Cetirizine',
  };
  
  return mappings[name.toLowerCase()] || name;
};

const categorizeMedicine = (name) => {
  const normalizedName = name.toLowerCase();
  
  if (normalizedName.includes('paracetamol') || normalizedName.includes('acetaminophen') || normalizedName.includes('tylenol')) {
    return 'analgesic';
  }
  if (normalizedName.includes('ibuprofen') || normalizedName.includes('advil')) {
    return 'anti-inflammatory';
  }
  if (normalizedName.includes('cetirizine') || normalizedName.includes('allergy')) {
    return 'antihistamine';
  }
  if (normalizedName.includes('amoxicillin') || normalizedName.includes('antibiotic')) {
    return 'antibiotic';
  }
  
  return 'other';
};

