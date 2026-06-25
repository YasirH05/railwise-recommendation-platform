import {
  stationsList,
  stationsMap,
  trainsMap,
  schedulesByTrain,
  stationToTrains,
  getStationCodes
} from '../utils/dataLoader.js';
import { rankTrains } from '../utils/smartScore.js';

// Helper to convert time string "HH:MM:SS" to minutes
const timeToMins = (timeStr) => {
  if (!timeStr || timeStr === 'None') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h * 60) + m;
};

// Calculate total duration in minutes
const calculateDurationMins = (startDay, startTime, endDay, endTime) => {
  const sDay = startDay || 1;
  const eDay = endDay || 1;
  const sTime = timeToMins(startTime);
  const eTime = timeToMins(endTime);

  let totalMins = (eDay - sDay) * 24 * 60;
  totalMins += (eTime - sTime);
  
  return totalMins > 0 ? totalMins : 0;
};

// Calculate daytime hours (08:00 to 20:00) consumed
const calculateDaytimeHours = (startDay, startTime, endDay, endTime) => {
  const sDay = startDay || 1;
  const eDay = endDay || 1;
  const sTimeHour = timeToMins(startTime) / 60;
  const eTimeHour = timeToMins(endTime) / 60;

  const dep = ((sDay - 1) * 24) + sTimeHour;
  const arr = ((eDay - 1) * 24) + eTimeHour;

  let daytimeHours = 0;
  // Check overlapping with every possible day
  for (let d = 0; d <= Math.max(sDay, eDay) + 1; d++) {
    const startDayTime = (d * 24) + 8; // 8 AM
    const endDayTime = (d * 24) + 20; // 8 PM
    
    const overlapStart = Math.max(dep, startDayTime);
    const overlapEnd = Math.min(arr, endDayTime);
    
    if (overlapStart < overlapEnd) {
      daytimeHours += (overlapEnd - overlapStart);
    }
  }
  return daytimeHours;
};

const formatDuration = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const getDummyPrices = (durationMins, type) => {
  const hours = durationMins / 60;
  // A standard Express train base fare: ~45 INR per hour for Sleeper.
  let baseSleeper = Math.max(120, Math.floor(hours * 45)); 
  
  let prices = {};
  
  if (type === 'Rajdhani' || type === 'Shatabdi' || type === 'Vande Bharat' || type === 'Tejas') {
    // Premium trains don't have Sleeper class usually.
    if (type === 'Shatabdi' || type === 'Vande Bharat' || type === 'Tejas') {
      prices['CC'] = Math.floor(hours * 130);
      prices['EC'] = Math.floor(hours * 250);
    } else if (type === 'Rajdhani') {
      prices['3AC'] = Math.floor(hours * 140);
      prices['2AC'] = Math.floor(hours * 200);
      prices['1AC'] = Math.floor(hours * 320);
    }
  } else {
    // Standard Express, Superfast, Mail
    let mult = type === 'Superfast' ? 1.15 : 1.0;
    if (type === 'Pass' || type === 'MEMU') mult = 0.5;

    prices['SL'] = Math.floor(baseSleeper * mult);
    prices['3AC'] = Math.floor(baseSleeper * 2.6 * mult);
    prices['2AC'] = Math.floor(baseSleeper * 3.8 * mult);
    prices['1AC'] = Math.floor(baseSleeper * 6.0 * mult);
    prices['CC'] = Math.floor(baseSleeper * 2.2 * mult);
  }

  // Ensure minimum realistic fares
  for (let cls in prices) {
    if (cls === 'SL' && prices[cls] < 120) prices[cls] = 120;
    if (cls === '3AC' && prices[cls] < 450) prices[cls] = 450;
    if (cls === '2AC' && prices[cls] < 700) prices[cls] = 700;
    if (cls === '1AC' && prices[cls] < 1200) prices[cls] = 1200;
    if (cls === 'CC' && prices[cls] < 350) prices[cls] = 350;
    if (cls === 'EC' && prices[cls] < 700) prices[cls] = 700;
  }

  return prices;
};

export const getTrains = async (req, res) => {
  try {
    const { origin, destination, date, preferredClass } = req.query;
    
    const originCodes = getStationCodes(origin);
    const destCodes = getStationCodes(destination);

    if (originCodes.length === 0 || destCodes.length === 0) {
      return res.json([]);
    }

    // Create a unique set of train numbers that pass through at least one origin code
    const candidateTrains = new Set();
    for (const oCode of originCodes) {
      const trains = stationToTrains[oCode];
      if (trains) {
        for (const t of trains) {
          candidateTrains.add(t);
        }
      }
    }

    let results = [];

    // Iterate through the candidates and check for valid pairings
    for (const tNum of candidateTrains) {
      const schedule = schedulesByTrain[tNum];
      if (!schedule) continue;

      // Find all indices of origin and destination codes for this train
      const oIndices = [];
      const dIndices = [];
      
      schedule.forEach((s, idx) => {
        if (originCodes.includes(s.station_code)) oIndices.push({ idx, code: s.station_code });
        if (destCodes.includes(s.station_code)) dIndices.push({ idx, code: s.station_code });
      });

      if (oIndices.length === 0 || dIndices.length === 0) continue;

      // Find a valid pair where origin comes before destination
      let bestPair = null;
      for (const o of oIndices) {
        for (const d of dIndices) {
          if (o.idx < d.idx) {
            if (!bestPair || (d.idx - o.idx < bestPair.d.idx - bestPair.o.idx)) {
              // Pick the one with shortest path between nodes if a train hits multiple stations in the city
              bestPair = { o, d };
            }
          }
        }
      }

      if (bestPair) {
        const oStop = schedule[bestPair.o.idx];
        const dStop = schedule[bestPair.d.idx];
        const actualOriginCode = bestPair.o.code;
        const actualDestCode = bestPair.d.code;
        const trainDetails = trainsMap[tNum];

        // Some stops have 'None' for departure if they are terminating, etc.
        const depTime = oStop.departure !== 'None' ? oStop.departure : oStop.arrival;
        const arrTime = dStop.arrival !== 'None' ? dStop.arrival : dStop.departure;

        if (!depTime || !arrTime || depTime === 'None' || arrTime === 'None') continue;

        const durMins = calculateDurationMins(oStop.day, depTime, dStop.day, arrTime);
        const daytime = calculateDaytimeHours(oStop.day, depTime, dStop.day, arrTime);

        // Determine type based on name or fallback
        let trainType = trainDetails?.type || 'Express';
        if (trainDetails?.name) {
          const tname = trainDetails.name.toLowerCase();
          if (tname.includes('vande bharat')) trainType = 'Vande Bharat';
          else if (tname.includes('rajdhani')) trainType = 'Rajdhani';
          else if (tname.includes('shatabdi')) trainType = 'Shatabdi';
          else if (tname.includes('tejas')) trainType = 'Tejas';
          else if (tname.includes('sf') || tname.includes('superfast')) trainType = 'Superfast';
          else if (tname.includes('mail')) trainType = 'Mail';
        }

        results.push({
          _id: tNum,
          trainNumber: tNum,
          trainName: trainDetails?.name || oStop.train_name,
          departureStation: stationsMap[actualOriginCode]?.name || actualOriginCode,
          arrivalStation: stationsMap[actualDestCode]?.name || actualDestCode,
          departureTime: depTime.substring(0, 5), // "12:30"
          arrivalTime: arrTime.substring(0, 5),
          durMins,
          daytime,
          duration: formatDuration(durMins),
          type: trainType,
          prices: getDummyPrices(durMins, trainType),
          availableSeats: Math.floor(Math.random() * 200) + 10,
          isDedicatedRoute: (bestPair.o.idx === 0 && bestPair.d.idx === schedule.length - 1)
        });
      }
    }

    // Rank the results
    const rankedTrains = rankTrains(results, req.query, preferredClass);

    res.json(rankedTrains);
  } catch (error) {
    console.error("Error fetching trains:", error);
    res.status(500).json({ message: 'Server error fetching trains' });
  }
};

export const getTrainById = async (req, res) => {
  try {
    const tNum = req.params.id;
    const train = trainsMap[tNum];
    const schedule = schedulesByTrain[tNum];
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    res.json({ ...train, schedule });
  } catch (error) {
    console.error("Error fetching train by id:", error);
    res.status(500).json({ message: 'Server error fetching train' });
  }
};
