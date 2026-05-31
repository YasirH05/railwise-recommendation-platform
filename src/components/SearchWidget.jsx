import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Search } from 'lucide-react';
import './SearchWidget.css';

const INDIAN_CITIES = [
  'New Delhi', 'Lucknow', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 
  'Hyderabad', 'Ahmedabad', 'Pune', 'Jaipur', 'Surat', 'Kanpur', 
  'Nagpur', 'Indore', 'Patna', 'Bhopal', 'Agra', 'Varanasi', 'Chandigarh',
  'Goa', 'Kochi', 'Amritsar', 'Guwahati', 'Bhubaneswar'
].sort();

export default function SearchWidget() {
  const [origin, setOrigin] = useState('New Delhi');
  const [destination, setDestination] = useState('Lucknow');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get today's date in YYYY-MM-DD format to prevent selecting past dates
  const today = new Date().toISOString().split('T')[0];

  const handleSearch = (e) => {
    e.preventDefault();
    if (origin.toLowerCase().trim() === destination.toLowerCase().trim()) {
      setError('Origin and Destination stations cannot be the exact same.');
      return;
    }
    setError('');
    // Simulate Step 2: "Loading/Analyzing" briefly
    navigate(`/results?origin=${origin}&destination=${destination}&date=${date}`);
  };

  return (
    <div className="search-widget glass-panel">
      <form onSubmit={handleSearch} className="search-form">
        {error && <div className="search-error" style={{ width: '100%', color: '#ef4444', textAlign: 'center', marginBottom: '15px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px', fontWeight: 'bold', gridColumn: '1 / -1' }}>{error}</div>}
        <div className="input-group">
          <MapPin className="input-icon" size={20} />
          <div className="input-field">
            <label>From</label>
            <input 
              type="text" 
              value={origin} 
              list="city-list"
              onChange={(e) => { setOrigin(e.target.value); setError(''); }} 
              placeholder="Origin Station"
              required
            />
          </div>
        </div>
        
        <div className="divider"></div>

        <div className="input-group">
          <MapPin className="input-icon" size={20} />
          <div className="input-field">
            <label>To</label>
            <input 
              type="text" 
              value={destination} 
              list="city-list"
              onChange={(e) => { setDestination(e.target.value); setError(''); }} 
              placeholder="Destination Station"
              required
            />
          </div>
        </div>

        <div className="divider"></div>

        <div className="input-group">
          <Calendar className="input-icon" size={20} />
          <div className="input-field">
            <label>Date</label>
            <input 
              type="date" 
              value={date} 
              min={today}
              onChange={(e) => setDate(e.target.value)} 
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary search-btn">
          <Search size={20} />
          Find Trains
        </button>

        <datalist id="city-list">
          {INDIAN_CITIES.map(city => <option key={city} value={city} />)}
        </datalist>
      </form>
    </div>
  );
}
