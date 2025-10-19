import Medicine from '../models/Medicine.js';
import Symptom from '../models/Symptom.js';

export const seedMedicines = async () => {
    const medicines = [
        {
            name: 'Paracetamol',
            genericName: 'Acetaminophen',
            category: 'analgesic',
            description: 'Pain reliever and fever reducer',
            indications: ['headache', 'fever', 'body pain', 'toothache'],
            dosage: {
                adult: { min: '500mg', max: '1000mg', unit: 'mg', frequency: 'every 4-6 hours' },
                pediatric: { min: '10-15mg/kg', max: '15mg/kg', unit: 'mg', frequency: 'every 4-6 hours' }
            },
            sideEffects: ['nausea', 'stomach upset', 'liver damage (with overdose)'],
            contraindications: ['liver disease', 'alcoholism'],
            warnings: ['Do not exceed 4000mg per day', 'Consult doctor if fever persists'],
            storageInstructions: 'Store at room temperature, away from moisture',
            isPrescriptionRequired: false,
            searchKeywords: ['pain', 'fever', 'headache', 'acetaminophen']
        },
        {
            name: 'Ibuprofen',
            genericName: 'Ibuprofen',
            category: 'anti-inflammatory',
            description: 'Non-steroidal anti-inflammatory drug (NSAID)',
            indications: ['pain', 'inflammation', 'fever', 'arthritis'],
            dosage: {
                adult: { min: '200mg', max: '800mg', unit: 'mg', frequency: 'every 6-8 hours' },
                pediatric: { min: '5-10mg/kg', max: '10mg/kg', unit: 'mg', frequency: 'every 6-8 hours' }
            },
            sideEffects: ['stomach upset', 'heartburn', 'dizziness', 'stomach bleeding'],
            contraindications: ['stomach ulcers', 'heart disease', 'kidney disease'],
            warnings: ['Take with food', 'Do not use for more than 10 days'],
            storageInstructions: 'Store at room temperature',
            isPrescriptionRequired: false,
            searchKeywords: ['pain', 'inflammation', 'fever', 'arthritis']
        },
        {
            name: 'Cetirizine',
            genericName: 'Cetirizine',
            category: 'antihistamine',
            description: 'Antihistamine for allergy relief',
            indications: ['allergies', 'hay fever', 'hives', 'itchy skin'],
            dosage: {
                adult: { min: '10mg', max: '10mg', unit: 'mg', frequency: 'once daily' },
                pediatric: { min: '5mg', max: '5mg', unit: 'mg', frequency: 'once daily' }
            },
            sideEffects: ['drowsiness', 'dry mouth', 'headache'],
            contraindications: ['severe kidney disease'],
            warnings: ['May cause drowsiness', 'Avoid alcohol'],
            storageInstructions: 'Store at room temperature',
            isPrescriptionRequired: false,
            searchKeywords: ['allergy', 'hay fever', 'hives', 'antihistamine']
        },
        {
            name: 'Vitamin D3',
            genericName: 'Cholecalciferol',
            category: 'vitamin',
            description: 'Vitamin D supplement for bone health',
            indications: ['vitamin D deficiency', 'bone health', 'immune support'],
            dosage: {
                adult: { min: '1000 IU', max: '4000 IU', unit: 'IU', frequency: 'once daily' },
                pediatric: { min: '400 IU', max: '1000 IU', unit: 'IU', frequency: 'once daily' }
            },
            sideEffects: ['nausea', 'constipation', 'weakness'],
            contraindications: ['high calcium levels', 'kidney stones'],
            warnings: ['Take with food for better absorption'],
            storageInstructions: 'Store in cool, dry place',
            isPrescriptionRequired: false,
            searchKeywords: ['vitamin d', 'bone health', 'immune', 'supplement']
        }
    ];

    try {
        await Medicine.deleteMany({});
        await Medicine.insertMany(medicines);
        console.log('Medicines seeded successfully');
    } catch (error) {
        console.error('Error seeding medicines:', error);
    }
};

export const seedSymptoms = async () => {
    const symptoms = [
        {
            name: 'Headache',
            category: 'neurological',
            severity: 'mild',
            description: 'Pain or discomfort in the head or neck area',
            commonCauses: ['stress', 'dehydration', 'lack of sleep', 'eye strain'],
            suggestedMedicines: [
                { medicine: null, dosage: '500-1000mg', notes: 'Take with food' }
            ],
            homeRemedies: [
                'Rest in a dark, quiet room',
                'Apply cold compress to forehead',
                'Stay hydrated',
                'Gentle neck massage'
            ],
            whenToSeeDoctor: [
                'Severe headache with fever',
                'Sudden, severe headache',
                'Headache after head injury',
                'Headache with vision changes'
            ],
            searchKeywords: ['head pain', 'migraine', 'tension headache']
        },
        {
            name: 'Fever',
            category: 'immune',
            severity: 'moderate',
            description: 'Elevated body temperature above normal (98.6°F/37°C)',
            commonCauses: ['infection', 'viral illness', 'bacterial infection', 'inflammation'],
            suggestedMedicines: [
                { medicine: null, dosage: '500-1000mg every 4-6 hours', notes: 'For adults' }
            ],
            homeRemedies: [
                'Rest and stay hydrated',
                'Cool compress on forehead',
                'Lukewarm bath',
                'Light clothing'
            ],
            whenToSeeDoctor: [
                'Fever above 103°F (39.4°C)',
                'Fever lasting more than 3 days',
                'Fever with rash',
                'Fever with difficulty breathing'
            ],
            searchKeywords: ['high temperature', 'pyrexia', 'hot body']
        },
        {
            name: 'Cough',
            category: 'respiratory',
            severity: 'mild',
            description: 'Reflex action to clear airways of mucus and irritants',
            commonCauses: ['cold', 'flu', 'allergies', 'smoke', 'dry air'],
            suggestedMedicines: [
                { medicine: null, dosage: 'As directed', notes: 'Cough syrup for dry cough' }
            ],
            homeRemedies: [
                'Honey and warm water',
                'Steam inhalation',
                'Stay hydrated',
                'Use humidifier'
            ],
            whenToSeeDoctor: [
                'Cough with blood',
                'Cough lasting more than 3 weeks',
                'Cough with chest pain',
                'Cough with difficulty breathing'
            ],
            searchKeywords: ['dry cough', 'wet cough', 'chest cough']
        },
        {
            name: 'Nausea',
            category: 'digestive',
            severity: 'mild',
            description: 'Feeling of sickness with inclination to vomit',
            commonCauses: ['motion sickness', 'food poisoning', 'pregnancy', 'medication'],
            suggestedMedicines: [
                { medicine: null, dosage: 'As directed', notes: 'Anti-nausea medication' }
            ],
            homeRemedies: [
                'Ginger tea or ginger ale',
                'Small, frequent meals',
                'Avoid strong odors',
                'Stay hydrated with small sips'
            ],
            whenToSeeDoctor: [
                'Severe nausea with vomiting',
                'Nausea with severe abdominal pain',
                'Signs of dehydration',
                'Nausea lasting more than 2 days'
            ],
            searchKeywords: ['feeling sick', 'queasy', 'upset stomach']
        }
    ];

    try {
        await Symptom.deleteMany({});
        await Symptom.insertMany(symptoms);
        console.log('Symptoms seeded successfully');
    } catch (error) {
        console.error('Error seeding symptoms:', error);
    }
};

export const seedAll = async () => {
    await seedMedicines();
    await seedSymptoms();
    console.log('All data seeded successfully');
};
