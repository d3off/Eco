import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppDataProvider } from './context/AppDataContext';
import Navbar from './components/layout/Navbar';
import PublicMap from './pages/PublicMap';
import EcoRanking from './pages/EcoRanking';
import PredictionDashboard from './pages/PredictionDashboard';
import BehaviorAnalysis from './pages/BehaviorAnalysis';
import ProfessionalMonitoring from './pages/ProfessionalMonitoring';
import HazardPage from './pages/HazardPage';

function App() {
  return (
    <AppDataProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main style={{ padding: '0 2rem 2rem 2rem' }}>
            <Routes>
              <Route path="/"           element={<PublicMap />} />
              <Route path="/ranking"    element={<EcoRanking />} />
              <Route path="/prediction" element={<PredictionDashboard />} />
              <Route path="/behavior"   element={<BehaviorAnalysis />} />
              <Route path="/promonitoring" element={<ProfessionalMonitoring />} />
              <Route path="/hazard"       element={<HazardPage />} />
              <Route path="*"           element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppDataProvider>
  );
}

export default App;
