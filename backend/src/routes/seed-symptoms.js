import { seedSymptoms } from '../utils/seedSymptoms.js';

export default async function handler(req, res) {
    // Only allow in development or with secret key
    const secret = req.query.secret;

    if (process.env.NODE_ENV === 'production' && secret !== process.env.SEED_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await seedSymptoms();
        res.status(200).json({
            success: true,
            message: 'Symptoms seeded successfully!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
