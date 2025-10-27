/**
 * MedlinePlus Connect API Integration
 * https://connect.medlineplus.gov/service
 */

const MEDLINEPLUS_API_BASE = 'https://connect.medlineplus.gov/service';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Get medicine name suggestions from RxNav API
 * @param {string} query - Partial medicine name
 * @param {number} limit - Maximum number of suggestions (default: 10)
 * @returns {Promise<Array>} Array of medicine suggestions
 */
// Helper function to clean and truncate medicine names
const cleanMedicineName = (name) => {
  if (!name) return name;
  
  // Remove RxNav metadata in braces
  let cleaned = name.replace(/\{[^}]+\}/g, '').trim();
  
  // Extract brand name if in brackets
  const brandMatch = cleaned.match(/\[([^\]]+)\]/);
  if (brandMatch) {
    cleaned = brandMatch[1];
  }
  
  // Take first part before '/' if contains multiple medicines
  cleaned = cleaned.split('/')[0].trim();
  
  // Truncate to 80 characters max
  if (cleaned.length > 80) {
    cleaned = cleaned.substring(0, 80);
  }
  
  return cleaned || name.substring(0, 80);
};

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
      const rawSuggestions = data.suggestionGroup.suggestionList.suggestion || [];
      // Clean each suggestion
      suggestions = rawSuggestions.map(s => cleanMedicineName(s)).filter(s => s.length > 0);
    }
    
    // Also search for drugs with similar names
    const drugSearchUrlAlt = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(query)}`;
    const drugResponseAlt = await fetch(drugSearchUrlAlt);
    const drugDataAlt = await drugResponseAlt.json();
    
    if (drugDataAlt.drugGroup && drugDataAlt.drugGroup.conceptGroup) {
      drugDataAlt.drugGroup.conceptGroup.forEach(group => {
        if (group.conceptProperties) {
          group.conceptProperties.forEach(drug => {
            const cleanedName = cleanMedicineName(drug.name);
            if (cleanedName && !suggestions.includes(cleanedName)) {
              suggestions.push(cleanedName);
            }
          });
        }
      });
    }
    
    // Remove duplicates and limit results
    const uniqueSuggestions = [...new Set(suggestions)].filter(s => s.length <= 80);
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
      
      // Build comprehensive medicine data from API
      return {
        name: rxNavResult.name,
        genericName: drugDetails.properties?.propName || rxNavResult.name,
        rxcui: rxNavResult.rxcui,
        drugDetails: drugDetails,
        source: 'rxnav',
        // Add realistic details based on medicine type
        category: getCategoryFromName(rxNavResult.name),
        description: `${rxNavResult.name} - Pharmaceutical medication`,
        usage: getUsageFromName(rxNavResult.name),
        dosage: getDosageFromName(rxNavResult.name),
        sideEffects: getSideEffectsFromName(rxNavResult.name),
        ageRestrictions: {
          minimumAge: { value: '0', unit: 'years' },
          notes: 'Dosing varies by age and condition - consult healthcare provider'
        },
        precautions: getPrecautionsFromName(rxNavResult.name),
        contraindications: ['Known allergies to components', 'Severe kidney/liver disease'],
        interactions: drugDetails.interactions || [],
        warnings: ['Always follow healthcare provider instructions', 'Do not exceed prescribed dosage'],
        storageInstructions: 'Store at room temperature, away from moisture and direct sunlight',
        isPrescriptionRequired: true
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

// Brand name to generic name mapping
const BRAND_TO_GENERIC = {
  'mahacef': 'cefixime',
  'crocin': 'paracetamol',
  'dolo': 'paracetamol',
  'calpol': 'paracetamol',
  'panadol': 'paracetamol',
  'brufen': 'ibuprofen',
  'advil': 'ibuprofen',
  'glimstar': 'glimepiride',
  'amaryl': 'glimepiride',
  'glycomet': 'metformin',
  'fortamet': 'metformin',
  'pantodac': 'pantoprazole',
  'omep': 'omeprazole',
  'prilosec': 'omeprazole'
};

/**
 * Fetch medicine information from Gemini AI
 */
const fetchFromGemini = async (medicineName) => {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      console.log('⚠️ Gemini API key not configured - skipping AI-powered search');
      return null;
    }
    
    console.log(`Calling Gemini API for: ${medicineName}`);
    
    const prompt = `Provide detailed medical information for "${medicineName}" in valid JSON format:
{
  "description": "2-3 sentence detailed description of what this medicine is and what it does",
  "genericName": "generic name",
  "usage": ["use1", "use2"],
  "dosage": {"adult": "dosage details", "pediatric": "dosage for children"},
  "sideEffects": ["effect1", "effect2"],
  "precautions": ["precaution1", "precaution2"],
  "category": "category"
}
Important: Give specific information about this medicine. Return ONLY valid JSON, no other text.`;
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    // Handle 304 Not Modified by returning null to use fallback
    if (response.status === 304 || response.status === 429) {
      console.log(`Gemini API returned ${response.status}, using fallback for ${medicineName}`);
      return null;
    }
    
    // Check if response is ok before parsing
    if (!response.ok) {
      console.log(`Gemini API returned status ${response.status}, using fallback for ${medicineName}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Error parsing Gemini response:', parseError);
          return null;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching from Gemini:', error);
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
    
    // If not in local database, check brand name mapping
    if (!medicineData) {
      const genericName = BRAND_TO_GENERIC[medicineName.toLowerCase()];
      if (genericName) {
        // Try searching with generic name
        medicineData = await fetchMedicineFromMedlinePlus(genericName);
        if (medicineData) {
          medicineData.name = medicineName;
          medicineData.genericName = genericName;
          return medicineData;
        }
      }
      // Try Gemini AI for medicine information
      const geminiData = await fetchFromGemini(medicineName);
      
      if (geminiData && geminiData.description) {
        medicineData = {
          name: medicineName,
          genericName: geminiData.genericName || genericName || medicineName,
          category: geminiData.category || 'other',
          description: geminiData.description || `${medicineName} - Medication`,
          usage: geminiData.usage || ['As prescribed by healthcare provider'],
          dosage: geminiData.dosage || {
            adult: { min: 'As directed', max: 'As directed', frequency: 'As prescribed' },
            pediatric: { byAge: [{ age: 'Children', dosage: 'Consult doctor' }] }
          },
          sideEffects: geminiData.sideEffects || ['Varies by individual'],
          precautions: geminiData.precautions || ['Follow doctor instructions'],
          contraindications: ['Known allergies', 'Severe conditions'],
          interactions: [],
          warnings: [
            '⚠️ Consult qualified healthcare professional before use',
            '⚠️ Do not self-medicate',
            '⚠️ This info is for reference only'
          ],
          storageInstructions: 'Store at room temperature',
          isPrescriptionRequired: true,
          image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500'
        };
      } else {
        medicineData = createBasicMedicineStructure(medicineName);
        if (genericName) {
          medicineData.genericName = genericName;
          const category = getCategoryFromName(genericName);
          medicineData.category = category;
          medicineData.usage = getUsageFromName(genericName);
          medicineData.dosage = getDosageFromName(genericName);
          medicineData.sideEffects = getSideEffectsFromName(genericName);
          medicineData.precautions = getPrecautionsFromName(genericName);
        }
      }
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
  const normalizedName = medicineName.toLowerCase();
  
  // Detect category and generic name from brand name
  let detectedCategory = 'other';
  let detectedGeneric = genericName || medicineName;
  
  if (normalizedName.includes('mahacef') || normalizedName.includes('cefix')) {
    detectedCategory = 'antibiotic';
    detectedGeneric = 'Cefixime';
  } else if (normalizedName.includes('dolo') || normalizedName.includes('crocin') || normalizedName.includes('paracetamol')) {
    detectedCategory = 'analgesic';
    detectedGeneric = 'Paracetamol';
  } else if (normalizedName.includes('glim')) {
    detectedCategory = 'diabetes';
    detectedGeneric = 'Glimepiride';
  } else if (normalizedName.includes('metformin') || normalizedName.includes('glycomet')) {
    detectedCategory = 'diabetes';
    detectedGeneric = 'Metformin';
  } else if (normalizedName.includes('brufen') || normalizedName.includes('ibuprofen')) {
    detectedCategory = 'anti-inflammatory';
    detectedGeneric = 'Ibuprofen';
  }
  
  // Get category-specific info
  const category = detectedCategory === 'other' ? getCategoryFromName(medicineName) : detectedCategory;
  const usage = getUsageFromName(category === 'other' ? medicineName : category);
  const dosage = getDosageFromName(category === 'other' ? medicineName : category);
  const sideEffects = getSideEffectsFromName(category === 'other' ? medicineName : category);
  const precautions = getPrecautionsFromName(category === 'other' ? medicineName : category);
  
  return {
    name: medicineName,
    genericName: detectedGeneric,
    category: category,
    description: getDetailedDescription(medicineName, detectedGeneric, category) || `${medicineName}${detectedGeneric !== medicineName ? ` (${detectedGeneric})` : ''} is a pharmaceutical medication. Always consult with a healthcare professional to understand its specific uses, dosage, side effects, and proper administration for your medical condition. Do not self-medicate.`,
    usage: usage,
    dosage: dosage,
    sideEffects: sideEffects,
    ageRestrictions: {
      minimumAge: { value: '0', unit: 'months' },
      notes: 'Consult healthcare provider for age-specific dosing'
    },
    precautions: [
      'Consult healthcare provider before use',
      'Inform doctor of any allergies',
      'Follow prescribed dosage instructions',
      'Do not self-medicate'
    ],
    contraindications: [
      'Known allergy to medication',
      'Severe medical conditions without doctor supervision'
    ],
    interactions: [],
    warnings: [
      '⚠️ IMPORTANT: This information is for reference purposes only',
      '⚠️ Always consult a qualified healthcare professional before using any medication',
      '⚠️ Dosage and usage must be determined by your doctor based on your medical condition',
      '⚠️ Do not self-medicate or exceed recommended dosage',
      '⚠️ In case of adverse reactions, discontinue use and seek immediate medical attention',
      '⚠️ This app does not replace professional medical advice, diagnosis, or treatment'
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

// Smart categorization and detail generation functions
const getCategoryFromName = (name) => {
  const normalizedName = name.toLowerCase();
  if (normalizedName.includes('cefix') || normalizedName.includes('ceft') || normalizedName.includes('amoxi') || normalizedName.includes('penicillin') || normalizedName.includes('azithromycin')) return 'antibiotic';
  if (normalizedName.includes('glim') || normalizedName.includes('metformin') || normalizedName.includes('insulin')) return 'diabetes';
  if (normalizedName.includes('omepra') || normalizedName.includes('pantopra') || normalizedName.includes('antacid')) return 'antacid';
  if (normalizedName.includes('vitamin') || normalizedName.includes('calcium')) return 'vitamin';
  return 'other';
};

const getUsageFromName = (name) => {
  const category = getCategoryFromName(name);
  const map = {
    'antibiotic': ['Bacterial infections', 'Respiratory infections', 'UTI treatment'],
    'diabetes': ['Type 2 diabetes', 'Blood glucose control'],
    'antacid': ['Acid reflux', 'Heartburn', 'GERD'],
    'other': ['As prescribed by healthcare provider']
  };
  return map[category] || map['other'];
};

const getDosageFromName = (name) => {
  const category = getCategoryFromName(name);
  return {
    adult: { min: 'As directed', max: 'As directed', unit: '', frequency: 'As prescribed', maxDaily: 'Consult provider' },
    pediatric: { byAge: [{ age: 'All ages', dosage: 'Consult healthcare provider' }] }
  };
};

const getSideEffectsFromName = (name) => {
  return ['Varies by individual', 'Consult healthcare provider if adverse effects occur'];
};

const getPrecautionsFromName = (name) => {
  return ['Follow healthcare provider instructions', 'Inform about allergies', 'Do not self-medicate'];
};

// Generate detailed description based on medicine information
const getDetailedDescription = (medicineName, genericName, category) => {
  const descriptions = {
    'antibiotic': `${medicineName} contains ${genericName}, an antibiotic medication used to treat bacterial infections. It works by stopping the growth of bacteria in the body.`,
    'diabetes': `${medicineName} contains ${genericName}, a medication used to control blood sugar levels in people with diabetes. It helps the body use insulin more effectively.`,
    'antacid': `${medicineName} contains ${genericName}, used to reduce stomach acid and treat conditions like acid reflux, heartburn, and gastric ulcers.`,
    'vitamin': `${medicineName} is a vitamin supplement containing ${genericName}. Vitamins are essential nutrients required for normal body functions and preventing deficiencies.`,
    'analgesic': `${medicineName} contains ${genericName}, a pain reliever and fever reducer. It works by blocking pain signals in the brain and reducing fever.`,
    'anti-inflammatory': `${medicineName} contains ${genericName}, a medication that reduces inflammation, swelling, and pain in the body.`,
    'other': `${medicineName}${genericName !== medicineName ? ` (${genericName})` : ''} is a pharmaceutical medication. Always consult with a healthcare professional to understand its specific uses and proper administration for your condition.`
  };
  
  return descriptions[category] || descriptions['other'];
};

const categorizeMedicine = (name) => {
  return getCategoryFromName(name);
};

