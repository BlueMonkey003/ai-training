import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { User } from '../models/User.model';
import path from 'path';

// Load environment variables BEFORE setting NODE_ENV
// Try multiple locations
const possibleEnvFiles = [
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../.env.development'),
    path.join(__dirname, '../../.env.local'),
    '.env',
    '.env.development'
];

let envLoaded = false;
for (const envFile of possibleEnvFiles) {
    const result = dotenv.config({ path: envFile });
    if (!result.error) {
        console.log(`✅ Loaded environment from: ${envFile}`);
        envLoaded = true;
        break;
    }
}

if (!envLoaded) {
    console.error('❌ No .env file found! Please create .env or .env.development');
    process.exit(1);
}

const seedProduction = async () => {
    try {
        // Connect to MongoDB - will use lunchmonkeys-prod
        let mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            console.error('❌ MONGO_URI not found in environment variables');
            process.exit(1);
        }

        // Always use production database for this script
        if (mongoUri.includes('/lunchmonkeys')) {
            mongoUri = mongoUri.replace('/lunchmonkeys', '/lunchmonkeys-prod');
        }
        console.log("🏭 Connecting to production database: lunchmonkeys-prod");

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'algemeen@bluemonkeysit.nl' });
        if (existingAdmin) {
            console.log('⚠️ Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const admin = await User.create({
            name: 'Admin Blue Monkeys',
            email: 'algemeen@bluemonkeysit.nl',
            passwordHash: hashedPassword,
            role: 'admin'
        });

        console.log('✅ Admin user created:', admin.email);
        console.log('⚠️ IMPORTANT: Change the admin password after first login!');

        // Collections will be created automatically when first document is inserted
        console.log('\n📊 Database structure will be created automatically:');
        console.log('- users ✅ (admin created)');
        console.log('- restaurants (will be created when first restaurant is added)');
        console.log('- orders (will be created when first order is placed)');
        console.log('- orderitems (will be created with first order)');
        console.log('- notifications (will be created when first notification is sent)');

        console.log('\n🎉 Production database initialized successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding production:', error);
        process.exit(1);
    }
};

// Add confirmation for safety
console.log('\n⚠️  WARNING: This will seed the PRODUCTION database!');
console.log(`📍 Target database: lunchmonkeys-prod`);
console.log('Are you sure you want to continue?');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

setTimeout(() => {
    seedProduction();
}, 5000);
