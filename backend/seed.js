import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import { seedAll } from './src/utils/seedData.js';

// Load environment variables
dotenv.config();

const runSeeder = async () => {
    try {
        console.log('Starting database seeding...');
        await connectDB();
        await seedAll();
        console.log('Database seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
};

runSeeder();
