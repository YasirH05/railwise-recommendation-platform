import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Train from '../models/Train.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/railwise';

const sampleTrains = [
  {
    trainNumber: '12004',
    trainName: 'New Delhi - Lucknow Swarna Shatabdi Express',
    departureStation: 'New Delhi (NDLS)',
    arrivalStation: 'Lucknow (LKO)',
    departureTime: '06:10',
    arrivalTime: '12:40',
    duration: '6h 30m',
    price: 1350,
    availableSeats: 45,
    metrics: { reliabilityRating: 9.5, comfortRating: 9, foodRating: 9 } // Premium daytime
  },
  {
    trainNumber: '12430',
    trainName: 'New Delhi - Lucknow AC Superfast Express',
    departureStation: 'New Delhi (NDLS)',
    arrivalStation: 'Lucknow (LKO)',
    departureTime: '23:25',
    arrivalTime: '07:25',
    duration: '8h 00m',
    price: 1100,
    availableSeats: 12,
    metrics: { reliabilityRating: 8.5, comfortRating: 8, foodRating: 5 } // Premium overnight
  },
  {
    trainNumber: '12230',
    trainName: 'Lucknow Mail',
    departureStation: 'New Delhi (NDLS)',
    arrivalStation: 'Lucknow (LKO)',
    departureTime: '22:00',
    arrivalTime: '06:50',
    duration: '8h 50m',
    price: 950,
    availableSeats: 120,
    metrics: { reliabilityRating: 9, comfortRating: 8.5, foodRating: 4 } // Highly reliable overnight
  },
  {
    trainNumber: '12420',
    trainName: 'Gomti Express',
    departureStation: 'New Delhi (NDLS)',
    arrivalStation: 'Lucknow (LKO)',
    departureTime: '12:20',
    arrivalTime: '21:25',
    duration: '9h 05m',
    price: 750,
    availableSeats: 60,
    metrics: { reliabilityRating: 7, comfortRating: 6.5, foodRating: 5 } // Consumes mostly daytime
  },
  {
    trainNumber: '14206',
    trainName: 'Ayodhya Express',
    departureStation: 'New Delhi (NDLS)',
    arrivalStation: 'Lucknow (LKO)',
    departureTime: '18:20',
    arrivalTime: '03:35',
    duration: '9h 15m',
    price: 650,
    availableSeats: 30,
    metrics: { reliabilityRating: 6.5, comfortRating: 6, foodRating: 4 } // Standard express
  },
  {
    trainNumber: '15026',
    trainName: 'Anand Vihar - Gorakhpur Express',
    departureStation: 'Anand Vihar (ANVT)',
    arrivalStation: 'Lucknow (LKO)',
    departureTime: '13:05',
    arrivalTime: '22:50',
    duration: '9h 45m',
    price: 600,
    availableSeats: 250,
    metrics: { reliabilityRating: 6, comfortRating: 5.5, foodRating: 3 } // Long duration, daytime
  },
  {
    trainNumber: '22412',
    trainName: 'Arunachal AC SF Express',
    departureStation: 'Anand Vihar (ANVT)',
    arrivalStation: 'Lucknow (LKO)',
    departureTime: '16:45',
    arrivalTime: '23:35',
    duration: '6h 50m',
    price: 1250,
    availableSeats: 5,
    metrics: { reliabilityRating: 8.5, comfortRating: 8, foodRating: 6 } // Fast but evening/night
  },
  {
    trainNumber: '12356',
    trainName: 'Archana Express',
    departureStation: 'New Delhi (NDLS)',
    arrivalStation: 'Lucknow (LKO)',
    departureTime: '20:10',
    arrivalTime: '06:15',
    duration: '10h 05m',
    price: 800,
    availableSeats: 42,
    metrics: { reliabilityRating: 6.5, comfortRating: 6, foodRating: 4 } // Late evening
  },
  {
    trainNumber: '12498',
    trainName: 'Shane Punjab',
    departureStation: 'New Delhi (NDLS)',
    arrivalStation: 'Lucknow (LKO)',
    departureTime: '19:30',
    arrivalTime: '05:00',
    duration: '9h 30m',
    price: 900,
    availableSeats: 18,
    metrics: { reliabilityRating: 7.5, comfortRating: 7, foodRating: 5 } // Evening overnight
  },
  {
    trainNumber: '22436',
    trainName: 'Vande Bharat Express',
    departureStation: 'New Delhi (NDLS)',
    arrivalStation: 'Lucknow (LKO)',
    departureTime: '06:00',
    arrivalTime: '11:00',
    duration: '5h 00m',
    price: 1800,
    availableSeats: 200,
    metrics: { reliabilityRating: 9.8, comfortRating: 9.5, foodRating: 9 } // Very fast, premium, consumes daytime
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Train.deleteMany({});
    console.log('Cleared existing trains');

    await Train.insertMany(sampleTrains);
    console.log('Successfully seeded 10 Delhi to Lucknow trains!');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
};

seedDB();
