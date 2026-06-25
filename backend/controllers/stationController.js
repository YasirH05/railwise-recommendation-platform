import { stationsList } from '../utils/dataLoader.js';

export const searchStations = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const searchQuery = q.toLowerCase();
    
    // We already have stationsList loaded in memory!
    const stations = stationsList.filter(s => 
      s.name.toLowerCase().includes(searchQuery) || 
      s.code.toLowerCase().includes(searchQuery)
    ).map(s => ({
      stationCode: s.code,
      stationName: s.name
    })).slice(0, 20); // Limit to 20 for fast response

    res.json(stations);
  } catch (error) {
    console.error('Error in searchStations:', error);
    res.status(500).json({ message: 'Server error searching stations' });
  }
};
