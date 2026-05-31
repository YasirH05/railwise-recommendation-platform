import SearchWidget from '../components/SearchWidget';
import './Home.css';

export default function Home() {
  return (
    <div className="home-container animate-fade-in">
      <div className="hero-section">
        <div className="hero-content">
          <div className="badge">✨ AI-Powered Recommendations</div>
          <h1>
            Find the <span className="highlight-text">Perfect Train</span><br />
            for your Journey
          </h1>
          <p className="subtitle">
            RAIL COMPASS analyzes duration, daytime efficiency, budget, and reliability to recommend the best train tailored specifically to your needs.
          </p>
          
          <SearchWidget />
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
    </div>
  );
}
