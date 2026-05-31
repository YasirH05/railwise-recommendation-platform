import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import Train from '../models/Train.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/railwise';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 

// List of major city pairs to seed if doing a massive run
const ROUTES = [
  { origin: 'NDLS', destination: 'BCT' }, // Delhi to Mumbai
  { origin: 'SBC', destination: 'MAS' },  // Bangalore to Chennai
  { origin: 'HWH', destination: 'NDLS' }, // Kolkata to Delhi
  { origin: 'NDLS', destination: 'LKO' }  // Delhi to Lucknow
];

// RailPilot Smart Metric Generator
// Public APIs don't provide comfort/food ratings. We generate highly realistic ones based on the train type.
const generateSmartMetrics = (trainName) => {
  const name = trainName.toLowerCase();
  
  if (name.includes('rajdhani') || name.includes('shatabdi') || name.includes('vande bharat') || name.includes('tejas')) {
    return {
      reliabilityRating: parseFloat((8.5 + Math.random() * 1.5).toFixed(1)), // 8.5 to 10
      comfortRating: parseFloat((8.5 + Math.random() * 1.5).toFixed(1)),
      foodRating: parseFloat((8.0 + Math.random() * 2.0).toFixed(1))
    };
  } else if (name.includes('duronto') || name.includes('garib rath') || name.includes('humsafar')) {
    return {
      reliabilityRating: parseFloat((7.5 + Math.random() * 2.0).toFixed(1)), // 7.5 to 9.5
      comfortRating: parseFloat((7.5 + Math.random() * 1.5).toFixed(1)),
      foodRating: parseFloat((6.0 + Math.random() * 2.0).toFixed(1))
    };
  } else {
    // Standard Express/Mail
    return {
      reliabilityRating: parseFloat((5.0 + Math.random() * 3.5).toFixed(1)), // 5.0 to 8.5
      comfortRating: parseFloat((5.0 + Math.random() * 3.0).toFixed(1)),
      foodRating: parseFloat((4.0 + Math.random() * 3.0).toFixed(1))
    };
  }
};

// Function to fetch real data from an API
const fetchTrainsFromAPI = async (origin, destination) => {
  if (!RAPIDAPI_KEY) {
    console.log(`⚠️ No RAPIDAPI_KEY found in .env. Falling back to generating realistic extensive mock data for ${origin} -> ${destination}...`);
    return generateFallbackData(origin, destination);
  }

  try {
    // This is a standard endpoint structure for Indian Railways APIs on RapidAPI (like IRCTC API)
    // To use real data, you just plug in your key.
    const options = {
      method: 'GET',
      url: 'https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations',
      params: { fromStationCode: origin, toStationCode: destination },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'irctc1.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    
    // Transform the raw API response to match our Train schema
    const rawTrains = response.data.data || [];
    
    return rawTrains.map(t => {
      const metrics = generateSmartMetrics(t.train_name);
      return {
        trainNumber: t.train_number,
        trainName: t.train_name,
        departureStation: origin,
        arrivalStation: destination,
        departureTime: t.from_std, // e.g., "16:45"
        arrivalTime: t.to_sta, // e.g., "23:35"
        duration: t.duration, // e.g., "6h 50m"
        price: Math.floor(Math.random() * 1500) + 500, // API usually requires a separate call for fare, we mock fare for speed
        availableSeats: Math.floor(Math.random() * 200),
        metrics
      };
    });

  } catch (error) {
    console.error(`❌ API Error for ${origin} -> ${destination}:`, error.message);
    console.log(`Falling back to realistic mock data...`);
    return generateFallbackData(origin, destination);
  }
};

// Fallback generator when API is unavailable or key is missing
const generateFallbackData = (origin, destination) => {
  const trainTypes = [
    { name: 'Rajdhani Express', priceRange: [2000, 4000], durRange: [15, 18] },
    { name: 'Shatabdi Express', priceRange: [1500, 2500], durRange: [6, 8] },
    { name: 'Vande Bharat Express', priceRange: [1800, 3000], durRange: [5, 7] },
    { name: 'Superfast Express', priceRange: [800, 1500], durRange: [18, 24] },
    { name: 'Mail', priceRange: [500, 1000], durRange: [22, 28] },
    { name: 'Garib Rath', priceRange: [700, 1200], durRange: [16, 20] }
  ];

  const generateTime = () => {
    const h = Math.floor(Math.random() * 24).toString().padStart(2, '0');
    const m = (Math.floor(Math.random() * 4) * 15).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  let fallbackTrains = [];
  // Generate 5-8 trains per route
  const numTrains = Math.floor(Math.random() * 4) + 5; 
  
  for(let i = 0; i < numTrains; i++) {
    const type = trainTypes[Math.floor(Math.random() * trainTypes.length)];
    const durationHours = Math.floor(Math.random() * (type.durRange[1] - type.durRange[0] + 1)) + type.durRange[0];
    const durationMins = Math.floor(Math.random() * 4) * 15;
    
    fallbackTrains.push({
      trainNumber: `${Math.floor(10000 + Math.random() * 90000)}`,
      trainName: `${origin} - ${destination} ${type.name}`,
      departureStation: origin,
      arrivalStation: destination,
      departureTime: generateTime(),
      arrivalTime: generateTime(),
      duration: `${durationHours}h ${durationMins}m`,
      price: Math.floor(Math.random() * (type.priceRange[1] - type.priceRange[0] + 1)) + type.priceRange[0],
      availableSeats: Math.floor(Math.random() * 300),
      metrics: generateSmartMetrics(type.name)
    });
  }
  return fallbackTrains;
};

const runIngestion = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    let totalUpserted = 0;

    for (const route of ROUTES) {
      console.log(`\n⏳ Fetching data for route: ${route.origin} -> ${route.destination}...`);
      const trains = await fetchTrainsFromAPI(route.origin, route.destination);
      
      for (const trainData of trains) {
        // Upsert: Update if trainNumber and route exists, otherwise Insert
        await Train.findOneAndUpdate(
          { trainNumber: trainData.trainNumber, departureStation: trainData.departureStation },
          { $set: trainData },
          { upsert: true, new: true }
        );
      }
      totalUpserted += trains.length;
      console.log(`✅ Upserted ${trains.length} trains for ${route.origin} -> ${route.destination}`);
    }

    console.log(`\n🎉 Ingestion Complete! Total trains processed: ${totalUpserted}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal Ingestion Error:', error);
    process.exit(1);
  }
};

runIngestion();
