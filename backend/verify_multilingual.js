import dotenv from 'dotenv';

dotenv.config();

const verify = async () => {
    try {
        // Dynamic import
        const { fetchMedicineTranslation } = await import('./src/utils/medlinePlusService.js');

        console.log('Testing Hindi translation fetch for "Paracetamol"...');
        const data = await fetchMedicineTranslation('Paracetamol', 'hi');

        if (!data) {
            console.log('❌ FAILED: No data returned.');
            return;
        }

        console.log('--- Result ---');
        console.log('Name:', data.name);
        console.log('Description:', data.description ? data.description.substring(0, 100) + '...' : 'N/A');
        console.log('Usage:', JSON.stringify(data.usage));

        // Check for Hindi characters (Devanagari range: \u0900-\u097F)
        const hasHindi = /[\u0900-\u097F]/.test(JSON.stringify(data));

        if (hasHindi) {
            console.log('✅ SUCCESS: Retrieved data with Hindi characters.');
        } else {
            console.log('⚠️ WARNING: Data returned but no Hindi characters found. It might be in English.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
};

verify();
