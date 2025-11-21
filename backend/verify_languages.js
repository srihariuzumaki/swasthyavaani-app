import dotenv from 'dotenv';

dotenv.config();

const verifyLanguages = async () => {
    try {
        const { fetchMedicineTranslation } = await import('./src/utils/medlinePlusService.js');

        // Test a few diverse languages
        const languages = [
            { code: 'ta', name: 'Tamil' },
            { code: 'te', name: 'Telugu' },
            { code: 'bn', name: 'Bengali' }
        ];

        console.log('Starting multi-language verification...');

        for (const lang of languages) {
            console.log(`\nTesting ${lang.name} (${lang.code})...`);
            const data = await fetchMedicineTranslation('Paracetamol', lang.code);

            if (data) {
                console.log(`✅ ${lang.name} Success!`);
                console.log(`Name: ${data.name}`);
                console.log(`Usage: ${JSON.stringify(data.usage).substring(0, 100)}...`);
            } else {
                console.log(`❌ ${lang.name} Failed: No data returned.`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
};

verifyLanguages();
