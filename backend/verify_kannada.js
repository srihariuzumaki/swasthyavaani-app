import dotenv from 'dotenv';

dotenv.config();

const verifyKannada = async () => {
    try {
        const { fetchMedicineTranslation } = await import('./src/utils/medlinePlusService.js');

        console.log('Testing Kannada (kn) translation for Paracetamol...\n');

        const data = await fetchMedicineTranslation('Paracetamol', 'kn');

        if (data) {
            console.log('✅ Kannada translation successful!');
            console.log('Name:', data.name);
            console.log('Description (first 100 chars):', data.description?.substring(0, 100));
            console.log('Usage:', JSON.stringify(data.usage).substring(0, 100));
        } else {
            console.log('❌ Kannada translation failed: No data returned');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
};

verifyKannada();
