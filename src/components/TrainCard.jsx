import { useNavigate } from 'react-router-dom';
import { Clock, IndianRupee, Zap, Info, Award } from 'lucide-react';
import './TrainCard.css';

export default function TrainCard({ train, rank, preferredClass }) {
  const navigate = useNavigate();

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-average';
  };

  return (
    <div className={`train-card glass-panel animate-fade-in ${rank === 1 ? 'top-recommendation' : ''}`} onClick={() => navigate(`/train/${train._id}`)}>
      {rank === 1 && (
        <div className="top-badge">
          <Award size={16} /> Best Overall Match
        </div>
      )}
      
      <div className="train-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3>{train.trainName}</h3>
            {train.isDedicatedRoute && (
              <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(79, 70, 229, 0.2)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Direct Origin
              </span>
            )}
          </div>
          <span className="train-number">#{train.trainNumber}</span>
        </div>
        
        <div className={`ai-score-badge ${getScoreColorClass(train.aiScore)}`}>
          <div className="score-value">{train.aiScore}</div>
          <div className="score-label">RailCompass<br/>Score</div>
        </div>
      </div>

      <div className="train-body">
        <div className="journey-info">
          <div className="time-station">
            <span className="time">{train.departureTime}</span>
            <span className="station">{train.departureStation}</span>
          </div>
          <div className="duration-line">
            <Clock size={14} />
            <span>{train.duration}</span>
            <div className="line"></div>
          </div>
          <div className="time-station text-right">
            <span className="time">{train.arrivalTime}</span>
            <span className="station">{train.arrivalStation}</span>
          </div>
        </div>

        <div className="class-fares">
          <div className="chips-container">
            {train.prices && Object.entries(train.prices).map(([cls, fare]) => (
              <div key={cls} className={`class-chip ${preferredClass === cls ? 'preferred' : ''}`}>
                <span className="class-name">{cls}</span>
                <span className="class-fare">₹{fare}</span>
              </div>
            ))}
          </div>
          <div className="seats mt-2 text-right">
            {train.availableSeats} seats left
          </div>
        </div>
      </div>

      <div className="train-footer" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <div className="match-reason">
          <Zap size={16} className="text-secondary" />
          <span>{train.matchReason}</span>
        </div>
        
        {train.isUnorthodox && (
          <div className="warning-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Info size={14} />
            <span>Unorthodox Arrival (No Cabs)</span>
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="metrics-preview" style={{ display: 'flex', gap: '8px' }}>
            <div className="metric" title="Reliability">Rel <span>{train.metrics?.reliabilityRating}</span></div>
            <div className="metric" title="Comfort">Comf <span>{train.metrics?.comfortRating}</span></div>
            <div className="metric" title="Food">Food <span>{train.hasPantry === false ? 'N/A' : train.metrics?.foodRating}</span></div>
          </div>
          
          <button 
            className="irctc-book-btn"
            onClick={(e) => {
              e.stopPropagation(); // Prevents the card's overall click event
              window.open('https://www.irctc.co.in/nget/train-search', '_blank', 'noopener,noreferrer');
            }}
            style={{ padding: '6px 12px', background: 'rgba(255, 120, 30, 0.9)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: '0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            onMouseOver={(e) => e.target.style.background = '#ff781e'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 120, 30, 0.9)'}
          >
            Book on IRCTC ↗
          </button>
        </div>
      </div>
    </div>
  );
}
