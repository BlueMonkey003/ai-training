import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.model';

// Load environment variables
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

// Load correct .env file
if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env' });
} else {
    dotenv.config({ path: '.env.development' });
}

const runMigration = async () => {
    try {
        // Connect to MongoDB
        let mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        // Use production database in production
        if (process.env.NODE_ENV === 'production' && mongoUri.includes('/lunchmonkeys')) {
            mongoUri = mongoUri.replace('/lunchmonkeys', '/lunchmonkeys-prod');
            console.log('🏭 Using production database: lunchmonkeys-prod');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Count users without isActive field
        const usersWithoutIsActive = await User.countDocuments({
            isActive: { $exists: false }
        });

        console.log(`📊 Found ${usersWithoutIsActive} users without isActive field`);

        if (usersWithoutIsActive > 0) {
            // Update all users without isActive field
            const result = await User.updateMany(
                { isActive: { $exists: false } },
                { $set: { isActive: true } }
            );

            console.log(`✅ Updated ${result.modifiedCount} users with isActive: true`);
        } else {
            console.log('✅ All users already have isActive field');
        }

        // Show current stats
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = await User.countDocuments({ isActive: false });

        console.log('\n📊 Migration completed! Current stats:');
        console.log(`   Total users: ${totalUsers}`);
        console.log(`   Active users: ${activeUsers}`);
        console.log(`   Inactive users: ${inactiveUsers}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run migration
runMigration();
