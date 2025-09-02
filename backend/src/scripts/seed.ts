import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.model';
import { Restaurant } from '../models/Restaurant.model';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('MongoDB verbonden');

    // Clear existing data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    console.log('Database geleegd');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@lunchmonkeys.nl',
      passwordHash: 'admin123', // wordt automatisch gehashed
      role: 'admin'
    });
    console.log('Admin gebruiker aangemaakt:', admin.email);

    // Create employee users
    const employee1 = await User.create({
      name: 'Jan Jansen',
      email: 'jan@lunchmonkeys.nl',
      passwordHash: 'test123',
      role: 'employee'
    });

    const employee2 = await User.create({
      name: 'Marie de Vries',
      email: 'marie@lunchmonkeys.nl',
      passwordHash: 'test123',
      role: 'employee'
    });
    console.log('Test medewerkers aangemaakt');

    // Create sample restaurants
    const restaurants = await Restaurant.create([
      {
        name: 'De Italiaan',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
        websiteUrl: 'https://example.com/italiaan',
        menuUrl: 'https://example.com/italiaan/menu',
        createdBy: admin._id
      },
      {
        name: 'Sushi Palace',
        imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
        websiteUrl: 'https://example.com/sushi',
        createdBy: admin._id
      },
      {
        name: 'Burger King',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        websiteUrl: 'https://www.burgerking.nl',
        menuUrl: 'https://www.burgerking.nl/menu',
        createdBy: admin._id
      }
    ]);
    console.log(`${restaurants.length} restaurants aangemaakt`);

    console.log('\n✅ Seed data succesvol aangemaakt!');
    console.log('\nTest accounts:');
    console.log('- Admin: admin@lunchmonkeys.nl / admin123');
    console.log('- Employee 1: jan@lunchmonkeys.nl / test123');
    console.log('- Employee 2: marie@lunchmonkeys.nl / test123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedData();
