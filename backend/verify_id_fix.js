import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const verifyIdFix = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const { fetchComprehensiveMedicineData, fetchMedicineTranslation } = await import('./src/utils/medlinePlusService.js');
        const Medicine = (await import('./src/models/Medicine.js')).default;

        const search = 'Paracetamol';
        const lang = 'hi';

        console.log(`Simulating search for "${search}" in "${lang}"...`);

        const medicineData = await fetchComprehensiveMedicineData(search);

        if (medicineData && medicineData.name) {
            let medicine = await Medicine.findOne({
                name: { $regex: medicineData.name, $options: 'i' }
            });

            if (!medicine) {
                console.log('Creating new medicine...');
                medicine = await Medicine.create({
                    name: medicineData.name.substring(0, 100),
                    category: medicineData.category || 'other',
                    description: medicineData.description,
                });
            } else {
                console.log('Found existing medicine:', medicine._id);
            }

            const translatedData = await fetchMedicineTranslation(medicine.name, lang);

            const responseMedicine = {
                ...medicine.toObject(),
                ...translatedData,
                _id: medicine._id // This is what we are verifying
            };

            console.log('--- Result ---');
            console.log('Name:', responseMedicine.name);
            console.log('ID:', responseMedicine._id);

            if (String(responseMedicine._id).startsWith('temp_')) {
                console.log('❌ FAILED: ID is temporary.');
            } else {
                console.log('✅ SUCCESS: ID is valid.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

verifyIdFix();
