import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
// import { Train } from 'lucide-react'; // Removed unused icon
import Home from './pages/Home';
import Results from './pages/Results';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './index.css';

// Placeholder components for 7-step journey (Weeks 1-2 UI structure)
const TrainDetails = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 4: Train Details</h2><p>Compare amenities and metrics.</p></div>;
const ClassSelection = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 5: Class/Seat Selection</h2><p>Choose Sleeper, 3AC, etc.</p></div>;
const PassengerDetails = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 6: Passenger Details</h2><p>Enter traveler info.</p></div>;
const BookingConfirmation = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 7: Booking Confirmation</h2><p>Your ticket is booked!</p></div>;

function App() {
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');

  const handleLogout = () => {
    localStorage.removeItem('userName');
    setUserName('');
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <Link to="/" className="logo">
            <img src="/logo.png" alt="Rail Compass Logo" style={{ width: '48px', height: '48px', marginRight: '8px' }} />
            RAIL COMPASS
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/" className="btn-secondary" style={{ marginRight: '1rem', padding: '8px 16px' }}>Home</Link>
            {userName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                  Welcome, {
                    (userName.includes('@') ? userName.split('@')[0] : userName).charAt(0).toUpperCase() + 
                    (userName.includes('@') ? userName.split('@')[0] : userName).slice(1)
                  }
                </span>
                <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Sign Out</button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary" style={{ padding: '8px 16px' }}>Sign In</Link>
            )}
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results" element={<Results />} />
            <Route path="/login" element={<Login setUserName={setUserName} />} />
            <Route path="/signup" element={<Signup setUserName={setUserName} />} />
            <Route path="/train/:id" element={<TrainDetails />} />
            <Route path="/class-selection/:id" element={<ClassSelection />} />
            <Route path="/passenger-details" element={<PassengerDetails />} />
            <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
