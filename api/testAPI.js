import axios from 'axios';

const testAPI = async () => {
  try {
    const options = {
      method: 'GET',
      url: 'https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations',
      params: { 
        fromStationCode: 'ADI', 
        toStationCode: 'BCT', 
        dateOfJourney: '2026-05-31' 
      },
      headers: {
        'X-RapidAPI-Key': 'f7980d7056msh796945fb72f00ddp1e25b8jsn8af3d12bbcfe',
        'X-RapidAPI-Host': 'irctc1.p.rapidapi.com'
      }
    };
    const response = await axios.request(options);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (e) {
    console.error(e.message, e.response?.data);
  }
};

testAPI();
