import dotenv from 'dotenv';

dotenv.config();

const listModels = async () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('No API Key found');
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log('Error listing models:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

listModels();
