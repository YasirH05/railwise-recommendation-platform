import Train from '../models/Train.js';
import axios from 'axios';

const CITY_TO_STATION = {
  'new delhi': 'NDLS',
  'lucknow': 'LKO',
  'mumbai': 'BCT',
  'bangalore': 'SBC',
  'chennai': 'MAS',
  'kolkata': 'HWH',
  'hyderabad': 'SC',
  'ahmedabad': 'ADI',
  'pune': 'PUNE',
  'jaipur': 'JP',
  'goa': 'MAO',
  'kochi': 'ERS',
  'amritsar': 'ASR',
  'guwahati': 'GHY',
  'bhubaneswar': 'BBS',
  'kanpur': 'CNB',
  'nagpur': 'NGP',
  'indore': 'INDB',
  'patna': 'PNBE',
  'bhopal': 'BPL',
  'agra': 'AGC',
  'varanasi': 'BSB',
  'chandigarh': 'CDG'
};

// Helper to generate metrics based on train type
const generateSmartMetrics = (type, isDedicated) => {
  const base = {
    'Shatabdi': { rel: 9.2, comf: 8.5, food: 8.0 },
    'Rajdhani': { rel: 9.5, comf: 9.0, food: 8.5 },
    'Tejas': { rel: 9.0, comf: 9.5, food: 9.0 },
    'Superfast': { rel: 8.8, comf: 8.8, food: 7.0 },
    'Mail': { rel: 8.8, comf: 8.8, food: 7.0 },
    'Express': { rel: 7.5, comf: 8.2, food: 6.0 }
  };
  
  const stats = base[type] || base['Express'];
  
  let finalRel = stats.rel;
  if (isDedicated) {
    finalRel = Math.min(9.8, finalRel + 1.2); 
  }
  
  return {
    reliabilityRating: Number(finalRel.toFixed(1)),
    comfortRating: stats.comf,
    foodRating: stats.food
  };
};
// Helper to convert "6h 30m" to total minutes
const parseDuration = (durStr) => {
  const match = durStr.match(/(\d+)h\s*(\d+)m/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
};

// Helper to calculate daytime hours (08:00 to 20:00) consumed
const calculateDaytimeHours = (depStr, arrStr, durationMins) => {
  // Parsing "HH:MM"
  const parseTime = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h + m / 60;
  };
  
  let dep = parseTime(depStr);
  let arr = parseTime(arrStr);
  
  // If arrival is next day (arr < dep), we add 24 to arr
  if (arr < dep) arr += 24;
  
  let daytimeHours = 0;
  const startDay = 8; // 8 AM
  const endDay = 20; // 8 PM
  
  // A train can run from day 1 into day 2. We check overlaps.
  // Day 1 Daytime: 8 to 20
  // Day 2 Daytime: 32 to 44 (8+24 to 20+24)
  
  const checkOverlap = (s1, e1, s2, e2) => {
    const start = Math.max(s1, s2);
    const end = Math.min(e1, e2);
    return start < end ? end - start : 0;
  };
  
  daytimeHours += checkOverlap(dep, arr, startDay, endDay);
  daytimeHours += checkOverlap(dep, arr, startDay + 24, endDay + 24);
  
  return daytimeHours;
};

const apiCache = {}; // In-memory cache to prevent RapidAPI rate limits

export const getTrains = async (req, res) => {
  try {
    const { origin, destination, date, preferredClass } = req.query;
    
    // Default RailPilot weights
    const weights = {
      duration: parseFloat(req.query.weightDuration) || 0.35,
      daytime: parseFloat(req.query.weightDaytime) || 0.25,
      budget: parseFloat(req.query.weightBudget) || 0.20,
      reliability: parseFloat(req.query.weightReliability) || 0.10,
      comfort: parseFloat(req.query.weightComfort) || 0.05,
      food: parseFloat(req.query.weightFood) || 0.05
    };

    let filter = {};
    if (origin) filter.departureStation = new RegExp(origin, 'i');
    if (destination) filter.arrivalStation = new RegExp(destination, 'i');

    let trains = [];
    const o = origin?.toLowerCase() || '';
    const d = destination?.toLowerCase() || '';

    // NEW LIVE API FETCH PIPELINE
    if (process.env.RAPIDAPI_KEY && CITY_TO_STATION[o] && CITY_TO_STATION[d]) {
      const cacheKey = `${CITY_TO_STATION[o]}-${CITY_TO_STATION[d]}-${date || new Date().toISOString().split('T')[0]}`;
      
      try {
        let rawLiveTrains = [];
        
        // 1. Check Cache
        if (apiCache[cacheKey] && apiCache[cacheKey].timestamp > Date.now() - 15 * 60 * 1000) {
          console.log(`\n⚡ Serving LIVE trains from Cache for ${cacheKey}...`);
          rawLiveTrains = apiCache[cacheKey].data;
        } else {
          // 2. Fetch API
          console.log(`\n📡 Fetching LIVE trains from IRCTC RapidAPI for ${CITY_TO_STATION[o]} -> ${CITY_TO_STATION[d]}...`);
          const options = {
            method: 'GET',
            url: 'https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations',
            params: { 
              fromStationCode: CITY_TO_STATION[o], 
              toStationCode: CITY_TO_STATION[d],
              dateOfJourney: date || new Date().toISOString().split('T')[0]
            },
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'irctc1.p.rapidapi.com'
            }
          };
          const response = await axios.request(options);
          rawLiveTrains = response.data.data || [];
          
          // Save to cache
          if (rawLiveTrains.length > 0) {
            apiCache[cacheKey] = { data: rawLiveTrains, timestamp: Date.now() };
          }
        }
        
        trains = rawLiveTrains.map((t, idx) => {
           let type = 'Express';
           const tname = t.train_name.toLowerCase();
           if (tname.includes('rajdhani')) type = 'Rajdhani';
           else if (tname.includes('shatabdi')) type = 'Shatabdi';
           else if (tname.includes('tejas')) type = 'Tejas';
           else if (tname.includes('superfast') || tname.includes('sf')) type = 'Superfast';
           else if (tname.includes('mail')) type = 'Mail';
           
           // True Dedicated Route Detection mathematically verified from API response
           const isDedicated = (t.train_src === CITY_TO_STATION[o] && t.train_dstn === CITY_TO_STATION[d]);
           
           return {
             _id: `live_${t.train_number}`,
             trainNumber: t.train_number,
             trainName: t.train_name,
             departureStation: origin,
             arrivalStation: destination,
             departureTime: t.from_std,
             arrivalTime: t.to_sta,
             duration: t.duration,
             prices: { SL: 450, '3AC': 1200, '2AC': 1800, '1AC': 3000, CC: 1000, EC: 2000 },
             availableSeats: Math.floor(Math.random() * 200),
             metrics: generateSmartMetrics(type, isDedicated),
             isDedicatedRoute: isDedicated
           };
        });
        if (trains.length > 0) console.log(`✅ Successfully loaded ${trains.length} live trains!`);
      } catch (err) {
        console.error("❌ Live API Fetch Failed (Rate limit or error). Falling back to mock generator...", err.message);
      }
    }

    if (trains.length === 0) {
      try {
        trains = await Train.find(filter);
      } catch (e) {
        console.log("DB connection error, using in-memory mock data.");
      }
    }
    
    // In-memory fallback if DB is empty or disconnected or Live API failed
    if (trains.length === 0) {

      let fallbackTrains = [];

      const o = origin?.toLowerCase() || '';
      const d = destination?.toLowerCase() || '';

      if (o.includes('delhi') && d.includes('lucknow')) {
        fallbackTrains = [
          { _id: '1', trainNumber: '12004', trainName: 'Swarna Shatabdi', departureStation: 'New Delhi', arrivalStation: 'Lucknow', departureTime: '06:10', arrivalTime: '12:55', duration: '6h 45m', prices: { CC: 965, EC: 1965 }, availableSeats: 45, metrics: generateSmartMetrics('Shatabdi', true), isDedicatedRoute: true },
          { _id: '2', trainNumber: '12430', trainName: 'AC Superfast Exp', departureStation: 'New Delhi', arrivalStation: 'Lucknow', departureTime: '23:25', arrivalTime: '07:25', duration: '8h 00m', prices: { '3AC': 950, '2AC': 1350, '1AC': 2250 }, availableSeats: 12, metrics: generateSmartMetrics('Superfast', true), isDedicatedRoute: true },
          { _id: '3', trainNumber: '12230', trainName: 'Lucknow Mail', departureStation: 'New Delhi', arrivalStation: 'Lucknow', departureTime: '22:00', arrivalTime: '06:40', duration: '8h 40m', prices: { SL: 335, '3AC': 890, '2AC': 1250, '1AC': 2100 }, availableSeats: 120, metrics: generateSmartMetrics('Mail', true), isDedicatedRoute: true },
          { _id: '4', trainNumber: '12420', trainName: 'Gomti Express', departureStation: 'New Delhi', arrivalStation: 'Lucknow', departureTime: '12:20', arrivalTime: '21:30', duration: '9h 10m', prices: { '2S': 180, CC: 650, '1AC': 1600 }, availableSeats: 210, metrics: generateSmartMetrics('Express', true), isDedicatedRoute: true },
          { _id: '5', trainNumber: '82502', trainName: 'Tejas Express', departureStation: 'New Delhi', arrivalStation: 'Lucknow', departureTime: '15:30', arrivalTime: '22:05', duration: '6h 35m', prices: { CC: 1250, EC: 2450 }, availableSeats: 65, metrics: generateSmartMetrics('Tejas', true), isDedicatedRoute: true },
          { _id: '6', trainNumber: '14206', trainName: 'Ayodhya Express', departureStation: 'New Delhi', arrivalStation: 'Lucknow', departureTime: '18:20', arrivalTime: '03:30', duration: '9h 10m', prices: { SL: 315, '3AC': 850, '2AC': 1200, '1AC': 2000 }, availableSeats: 15, metrics: generateSmartMetrics('Express', false), isDedicatedRoute: false },
          { _id: '7', trainNumber: '12556', trainName: 'Gorakhdham Exp', departureStation: 'New Delhi', arrivalStation: 'Lucknow', departureTime: '21:25', arrivalTime: '05:00', duration: '7h 35m', prices: { SL: 325, '3AC': 860, '2AC': 1220, '1AC': 2050 }, availableSeats: 5, metrics: generateSmartMetrics('Express', false), isDedicatedRoute: false },
          { _id: '8', trainNumber: '12226', trainName: 'Kaifiyat Express', departureStation: 'New Delhi', arrivalStation: 'Lucknow', departureTime: '20:25', arrivalTime: '03:45', duration: '7h 20m', prices: { SL: 330, '3AC': 870, '2AC': 1230, '1AC': 2080 }, availableSeats: 48, metrics: generateSmartMetrics('Express', false), isDedicatedRoute: false }
        ];
      } else if (o.includes('lucknow') && d.includes('delhi')) {
        fallbackTrains = [
          { _id: '1', trainNumber: '12003', trainName: 'Swarna Shatabdi', departureStation: 'Lucknow', arrivalStation: 'New Delhi', departureTime: '15:30', arrivalTime: '22:25', duration: '6h 55m', prices: { CC: 965, EC: 1965 }, availableSeats: 45, metrics: generateSmartMetrics('Shatabdi', true), isDedicatedRoute: true },
          { _id: '2', trainNumber: '12429', trainName: 'AC Superfast Exp', departureStation: 'Lucknow', arrivalStation: 'New Delhi', departureTime: '23:30', arrivalTime: '07:30', duration: '8h 00m', prices: { '3AC': 950, '2AC': 1350, '1AC': 2250 }, availableSeats: 12, metrics: generateSmartMetrics('Superfast', true), isDedicatedRoute: true },
          { _id: '3', trainNumber: '12229', trainName: 'Lucknow Mail', departureStation: 'Lucknow', arrivalStation: 'New Delhi', departureTime: '22:00', arrivalTime: '06:55', duration: '8h 55m', prices: { SL: 335, '3AC': 890, '2AC': 1250, '1AC': 2100 }, availableSeats: 120, metrics: generateSmartMetrics('Mail', true), isDedicatedRoute: true },
          { _id: '4', trainNumber: '82501', trainName: 'Tejas Express', departureStation: 'Lucknow', arrivalStation: 'New Delhi', departureTime: '06:10', arrivalTime: '12:25', duration: '6h 15m', prices: { CC: 1250, EC: 2450 }, availableSeats: 65, metrics: generateSmartMetrics('Tejas', true), isDedicatedRoute: true },
          { _id: '5', trainNumber: '14205', trainName: 'Ayodhya Express', departureStation: 'Lucknow', arrivalStation: 'New Delhi', departureTime: '19:45', arrivalTime: '04:20', duration: '8h 35m', prices: { SL: 315, '3AC': 850, '2AC': 1200, '1AC': 2000 }, availableSeats: 15, metrics: generateSmartMetrics('Express', false), isDedicatedRoute: false },
          { _id: '6', trainNumber: '12555', trainName: 'Gorakhdham Exp', departureStation: 'Lucknow', arrivalStation: 'New Delhi', departureTime: '21:35', arrivalTime: '05:30', duration: '7h 55m', prices: { SL: 325, '3AC': 860, '2AC': 1220, '1AC': 2050 }, availableSeats: 5, metrics: generateSmartMetrics('Express', false), isDedicatedRoute: false }
        ];
      } else {
        // Dynamic Generator for ANY other route!
        for (let i = 1; i <= 6; i++) {
          const types = ['Express', 'Superfast', 'Shatabdi', 'Mail'];
          const type = types[Math.floor(Math.random() * types.length)];
          const depH = Math.floor(Math.random() * 24);
          const durH = Math.floor(Math.random() * 12) + 4;
          const arrH = (depH + durH) % 24;
          
          fallbackTrains.push({
            _id: `${i}`, trainNumber: `${10000 + Math.floor(Math.random() * 90000)}`,
            trainName: `${origin || 'City A'} - ${destination || 'City B'} ${type}`,
            departureStation: origin || 'City A', arrivalStation: destination || 'City B',
            departureTime: `${depH.toString().padStart(2, '0')}:15`,
            arrivalTime: `${arrH.toString().padStart(2, '0')}:45`,
            duration: `${durH}h 30m`, prices: { SL: 400, '3AC': 1100, '2AC': 1600 },
            availableSeats: Math.floor(Math.random() * 100),
            metrics: generateSmartMetrics(type, i % 3 === 0), isDedicatedRoute: i % 3 === 0
          });
        }
      }
      trains = fallbackTrains;
    }

    // Step 1: Extract, filter, and compute base metrics for normalization
    let rawTrains = trains
      .map(t => {
        const trainObj = typeof t.toObject === 'function' ? t.toObject() : t;
        
        // Filter by preferred class if it's set
        if (preferredClass && preferredClass !== 'All' && !trainObj.prices[preferredClass]) {
          return null;
        }

        // Determine which price to use for the "Budget Score" comparison
        let budgetPrice = 0;
        if (preferredClass && preferredClass !== 'All') {
          budgetPrice = trainObj.prices[preferredClass];
        } else {
          // If no specific class is preferred, use a standard baseline for fair budget comparison
          const baselineOrder = ['3AC', 'CC', 'SL', '2S', '2AC', '1AC', 'EC'];
          for (const cls of baselineOrder) {
            if (trainObj.prices[cls]) {
              budgetPrice = trainObj.prices[cls];
              break;
            }
          }
        }

        const durMins = parseDuration(trainObj.duration);
        const daytime = calculateDaytimeHours(trainObj.departureTime, trainObj.arrivalTime, durMins);
        
        return {
          ...trainObj,
          durMins,
          daytime,
          budgetPrice
        };
      })
      .filter(t => t !== null); // Remove trains that didn't match the preferred class

    if (rawTrains.length === 0) {
      return res.json([]);
    }

    const minDur = Math.min(...rawTrains.map(t => t.durMins));
    const maxDur = Math.max(...rawTrains.map(t => t.durMins));
    
    const minDaytime = Math.min(...rawTrains.map(t => t.daytime));
    const maxDaytime = Math.max(...rawTrains.map(t => t.daytime));
    
    const minPrice = Math.min(...rawTrains.map(t => t.budgetPrice));
    const maxPrice = Math.max(...rawTrains.map(t => t.budgetPrice));

    // Step 2: Normalize and Score (0-100)
    let scoredTrains = rawTrains.map(t => {
      const durationScore = maxDur === minDur ? 100 : 100 - (((t.durMins - minDur) / (maxDur - minDur)) * 100);
      const daytimeScore = maxDaytime === minDaytime ? 100 : 100 - (((t.daytime - minDaytime) / (maxDaytime - minDaytime)) * 100);
      const budgetScore = maxPrice === minPrice ? 100 : 100 - (((t.budgetPrice - minPrice) / (maxPrice - minPrice)) * 100);
      
      const reliabilityScore = t.metrics.reliabilityRating * 10;
      const comfortScore = t.metrics.comfortRating * 10;
      
      let foodScore = 0;
      let hasPantry = true;
      
      const [depH] = t.departureTime.split(':').map(Number);
      const [arrH2] = t.arrivalTime.split(':').map(Number);
      
      // If departs >= 10 PM and arrives <= 10 AM, pantry is not needed
      const isOvernightNoFoodNeeded = (depH >= 22 || depH < 4) && (arrH2 <= 10);
      
      if (isOvernightNoFoodNeeded) {
        hasPantry = false;
        foodScore = 100; // Perfect score because the lack of food doesn't inconvenience the user
      } else if (t.metrics?.foodRating) {
        foodScore = t.metrics.foodRating * 10;
      }

      // Ensure sum of weights is mathematically correct just in case
      const totalWeight = weights.duration + weights.daytime + weights.budget + weights.reliability + weights.comfort + weights.food;
      
      let finalScore = 
        (durationScore * (weights.duration / totalWeight)) +
        (daytimeScore * (weights.daytime / totalWeight)) +
        (budgetScore * (weights.budget / totalWeight)) +
        (reliabilityScore * (weights.reliability / totalWeight)) +
        (comfortScore * (weights.comfort / totalWeight)) +
        (foodScore * (weights.food / totalWeight));

      // Unorthodox Arrival Check (1 AM to 6 AM)
      const [arrH] = t.arrivalTime.split(':').map(Number);
      const isUnorthodox = arrH >= 1 && arrH < 6;
      
      if (isUnorthodox) {
        finalScore -= 15; // 15 point penalty for bad arrival time
      }

      // Dedicated Route Bonus (Originating & Terminating matches)
      if (t.isDedicatedRoute) {
        finalScore += 18; // 18 point bonus for dedicated end-to-end routes
      }

      // Long-Haul Dynamic Modifier (> 16 hours)
      const isLongHaul = t.durMins > 16 * 60;
      if (isLongHaul) {
        // Boost score based on Comfort (makes comfort heavily outweigh duration penalty)
        finalScore += (comfortScore * 0.15);
      }

      // Determine match reason
      let matchReason = "Solid all-around option";
      if (t.isDedicatedRoute && finalScore > 85) matchReason = "Dedicated End-to-End Route";
      else if (isLongHaul && comfortScore >= 80) matchReason = "Premium Long-Haul Experience";
      else if (durationScore > 90 && weights.duration > 0.2) matchReason = "Fastest route available";
      else if (daytimeScore > 90 && weights.daytime > 0.15) matchReason = "Saves your daytime hours";
      else if (budgetScore > 90 && weights.budget > 0.15) matchReason = `Best value for money (${preferredClass && preferredClass !== 'All' ? preferredClass : 'Standard'})`;
      else if (finalScore > 85) matchReason = "Top RailPilot Recommendation";

      return {
        ...t,
        aiScore: Math.max(0, Math.round(finalScore)),
        matchReason,
        isUnorthodox,
        hasPantry
      };
    });

    // Step 3: Rank
    scoredTrains.sort((a, b) => b.aiScore - a.aiScore);

    res.json(scoredTrains);
  } catch (error) {
    console.error("Error fetching trains:", error);
    res.status(500).json({ message: 'Server error fetching trains' });
  }
};

export const getTrainById = async (req, res) => {
  try {
    const train = await Train.findById(req.params.id);
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    res.json(train);
  } catch (error) {
    console.error("Error fetching train by id:", error);
    res.status(500).json({ message: 'Server error fetching train' });
  }
};
