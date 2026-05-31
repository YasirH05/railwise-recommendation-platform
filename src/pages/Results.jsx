import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import TrainCard from '../components/TrainCard';
import './Results.css';

export default function Results() {
  const [searchParams] = useSearchParams();
  const origin = searchParams.get('origin') || 'New Delhi';
  const destination = searchParams.get('destination') || 'Lucknow';
  const date = searchParams.get('date');

  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);

  // Weights state
  const [weightDuration, setWeightDuration] = useState(0.35);
  const [weightDaytime, setWeightDaytime] = useState(0.25);
  const [weightBudget, setWeightBudget] = useState(0.20);
  const [weightReliability, setWeightReliability] = useState(0.10);
  const [weightComfort, setWeightComfort] = useState(0.05);
  const [weightFood, setWeightFood] = useState(0.05);

  const [preferredClass, setPreferredClass] = useState('All');

  useEffect(() => {
    const fetchTrains = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          origin,
          destination,
          date: date || '',
          weightDuration,
          weightDaytime,
          weightBudget,
          weightReliability,
          weightComfort,
          weightFood,
          preferredClass
        });

        // Simulate Analyzing delay for the wow factor
        setTimeout(async () => {
          // In production (Vercel), we use relative paths so it hits the serverless backend. Locally, we hit localhost:5000.
          const API_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';
          const res = await axios.get(`${API_URL}/api/trains?${queryParams}`);
          setTrains(res.data);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching trains:', error);
        setLoading(false);
      }
    };

    fetchTrains();
  }, [origin, destination, date, weightDuration, weightDaytime, weightBudget, weightReliability, weightComfort, weightFood, preferredClass]);

  return (
    <div className="page-container animate-fade-in">
      <div className="results-header">
        <div>
          <h2 className="route-title">{origin} to {destination}</h2>
          <p className="route-date">{date || 'Any Date'} • {trains.length} trains found</p>
        </div>
        
        <button className="btn-secondary filter-btn">
          <SlidersHorizontal size={18} />
          RailPilot Settings
        </button>
      </div>

      <div className="results-layout">
        <aside className="filters-sidebar glass-panel">
          <h3>Advanced Preferences</h3>
          <p className="text-muted text-sm mb-4">Customize the RailPilot algorithm weights.</p>
          
          <div className="class-selector mb-4">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Preferred Class Filter</label>
            <select 
              value={preferredClass} 
              onChange={e => setPreferredClass(e.target.value)}
              className="glass-input"
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
            >
              <option value="All" style={{ color: '#000' }}>All Classes (Auto-Budgeting)</option>
              <option value="1AC" style={{ color: '#000' }}>1AC (First AC)</option>
              <option value="2AC" style={{ color: '#000' }}>2AC (Second AC)</option>
              <option value="3AC" style={{ color: '#000' }}>3AC (Third AC)</option>
              <option value="3AE" style={{ color: '#000' }}>3AE (AC Economy)</option>
              <option value="CC" style={{ color: '#000' }}>CC (AC Chair Car)</option>
              <option value="EC" style={{ color: '#000' }}>EC (Executive Chair Car)</option>
              <option value="SL" style={{ color: '#000' }}>SL (Sleeper)</option>
              <option value="2S" style={{ color: '#000' }}>2S (Second Seating)</option>
            </select>
          </div>
          
          <div className="weight-slider mt-4">
            <label>Duration ({Math.round(weightDuration * 100)}%)</label>
            <p className="text-muted text-xs mb-2" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>Prioritizes trains that offer the shortest overall travel time.</p>
            <input type="range" min="0" max="1" step="0.05" value={weightDuration} onChange={e => setWeightDuration(parseFloat(e.target.value))} />
          </div>
          <div className="weight-slider">
            <label>Overnight Hours ({Math.round(weightDaytime * 100)}%)</label>
            <p className="text-muted text-xs mb-2" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>Rewards trains that travel during the night to save your daytime for productivity.</p>
            <input type="range" min="0" max="1" step="0.05" value={weightDaytime} onChange={e => setWeightDaytime(parseFloat(e.target.value))} />
          </div>
          <div className="weight-slider">
            <label>Budget ({Math.round(weightBudget * 100)}%)</label>
            <p className="text-muted text-xs mb-2" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>Evaluates the ticket fare against the overall journey value.</p>
            <input type="range" min="0" max="1" step="0.05" value={weightBudget} onChange={e => setWeightBudget(parseFloat(e.target.value))} />
          </div>
          <div className="weight-slider">
            <label>Reliability ({Math.round(weightReliability * 100)}%)</label>
            <p className="text-muted text-xs mb-2" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>Considers historical on-time departures and arrivals.</p>
            <input type="range" min="0" max="1" step="0.05" value={weightReliability} onChange={e => setWeightReliability(parseFloat(e.target.value))} />
          </div>
          <div className="weight-slider">
            <label>Comfort ({Math.round(weightComfort * 100)}%)</label>
            <p className="text-muted text-xs mb-2" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>Factors in coach quality, seating, and passenger reviews.</p>
            <input type="range" min="0" max="1" step="0.05" value={weightComfort} onChange={e => setWeightComfort(parseFloat(e.target.value))} />
          </div>
          <div className="weight-slider">
            <label>Food Quality ({Math.round(weightFood * 100)}%)</label>
            <p className="text-muted text-xs mb-2" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>Rates the availability and standard of pantry services.</p>
            <input type="range" min="0" max="1" step="0.05" value={weightFood} onChange={e => setWeightFood(parseFloat(e.target.value))} />
          </div>
        </aside>

        <div className="trains-list">
          {loading ? (
            <div className="loading-state" style={{ height: '300px' }}>
              <Loader2 className="spinner" size={48} />
              <h2>Recalculating RailPilot Scores...</h2>
            </div>
          ) : (
            <>
              {trains.map((train, index) => (
                <TrainCard key={train._id} train={train} rank={index + 1} preferredClass={preferredClass} />
              ))}
              {trains.length === 0 && (
                <div className="glass-panel empty-state">
                  <h3>No trains found</h3>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
