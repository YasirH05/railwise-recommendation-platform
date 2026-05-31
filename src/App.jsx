import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Train } from 'lucide-react';
import Home from './pages/Home';
import Results from './pages/Results';
import './index.css';

// Placeholder components for 7-step journey (Weeks 1-2 UI structure)
const TrainDetails = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 4: Train Details</h2><p>Compare amenities and metrics.</p></div>;
const ClassSelection = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 5: Class/Seat Selection</h2><p>Choose Sleeper, 3AC, etc.</p></div>;
const PassengerDetails = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 6: Passenger Details</h2><p>Enter traveler info.</p></div>;
const BookingConfirmation = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 7: Booking Confirmation</h2><p>Your ticket is booked!</p></div>;

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <Link to="/" className="logo">
            <Train size={28} color="#60a5fa" />
            RAIL COMPASS
          </Link>
          <nav>
            <Link to="/" className="btn-secondary" style={{ marginRight: '1rem', padding: '8px 16px' }}>Home</Link>
            <button className="btn-primary" style={{ padding: '8px 16px' }}>Sign In</button>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results" element={<Results />} />
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
