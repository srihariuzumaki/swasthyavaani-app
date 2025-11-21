import dotenv from 'dotenv';

dotenv.config();

const verify = async () => {
    try {
        // Dynamic import to ensure env vars are loaded first
        const { fetchComprehensiveMedicineData } = await import('./src/utils/medlinePlusService.js');

        console.log('Testing rich medicine data fetch for "Azithromycin"...');
        const data = await fetchComprehensiveMedicineData('Azithromycin');

        console.log('--- Result ---');
        console.log('Name:', data.name);
        console.log('Dosage:', JSON.stringify(data.dosage, null, 2));
        console.log('Age Restrictions:', JSON.stringify(data.ageRestrictions, null, 2));

        // Check for generic values
        const dosageStr = JSON.stringify(data.dosage);
        const isGenericDosage = dosageStr.includes('As directed') || dosageStr.includes('As prescribed');

        const ageStr = JSON.stringify(data.ageRestrictions);
        const isGenericAge = ageStr.includes('0 months') || ageStr.includes('Consult healthcare provider for age-specific dosing');

        if (!isGenericDosage && !isGenericAge) {
            console.log('✅ SUCCESS: Retrieved SPECIFIC dosage and age info.');
        } else {
            console.log('⚠️ WARNING: Still seeing generic values.');
            if (isGenericDosage) console.log('- Dosage is generic');
            if (isGenericAge) console.log('- Age restriction is generic');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
};

verify();
