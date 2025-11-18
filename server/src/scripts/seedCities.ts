import mongoose from 'mongoose';
import City from '../models/City';
import dotenv from 'dotenv';
import { SEED_CITIES } from '../data/seedCitiesData';

dotenv.config();

const seedCities = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cultural-exchange');
    console.log('Connected to MongoDB');

    await City.deleteMany({});
    console.log('Cleared existing cities');

    await City.insertMany(SEED_CITIES);
    console.log(`Seeded ${SEED_CITIES.length} cities`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedCities();
