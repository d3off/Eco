import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, MapPin, Activity, Wind, ShieldAlert, ShieldCheck, Shield, Award, Flame, BrainCircuit, Eye } from 'lucide-react';

const Dashboard = ({ emissions, anomalies }) => {
  const [forecast, setForecast] = useState([]);
  const [insights, setInsights] = useState([]);
  const [behaviorInsights, setBehaviorInsights] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');

  // Get unique regions
  const regions = [...new Set(emissions.map(e => e.region))];

  useEffect(() => {
    if (emissions.length > 0 && !selectedRegion) {
      setSelectedRegion(emissions[0].region);
    }
  }, [emissions, selectedRegion]);

  useEffect(() => {
    if (selectedRegion) {
      axios.get(`http://localhost:8000/api/forecast/${selectedRegion}`)
        .then(res => {
          setForecast(res.data.forecasts || []);
          setInsights(res.data.insights || []);
        })
        .catch(err => console.error("Forecast error:", err));
        
      axios.get(`http://localhost:8000/api/behavior/${selectedRegion}`)
        .then(res => {
          setBehaviorInsights(res.data.insights || []);
        })
        .catch(err => console.error("Behavior error:", err));
    }
  }, [selectedRegion, emissions]);

  // Prepare chart data (historical + forecast)
  const regionEmissions = emissions.filter(e => e.region === selectedRegion);
  const historicalData = [...regionEmissions].reverse().map(e => ({
    time: new Date(e.timestamp).toLocaleTimeString(),
    co2_hist: e.co2_level,
    no2_hist: e.no2_level,
    methane_hist: e.methane_level
  }));

  const forecastData = forecast.map(f => ({
    time: `+${f.step} step`,
    co2_fore: f.co2_level,
    no2_fore: f.no2_level,
    methane_fore: f.methane_level
  }));

  // To connect the lines, we can add the last historical point to the start of forecast data
  if (historicalData.length > 0 && forecastData.length > 0) {
      const lastHist = historicalData[historicalData.length - 1];
      forecastData.unshift({
          time: lastHist.time,
          co2_fore: lastHist.co2_hist,
          no2_fore: lastHist.no2_hist,
          methane_fore: lastHist.methane_hist
      });
  }

  const chartData = [...historicalData, ...forecastData];


  const latestEmission = regionEmissions.length > 0 ? regionEmissions[0] : null;
  const ecoScore = latestEmission ? latestEmission.eco_score : null;

  // Determine Eco Score Color
  const getEcoScoreDetails = (score) => {
    if (score === null) return { color: 'var(--text-muted)', icon: <Shield size={32} />, label: 'N/A' };
    if (score >= 75) return { color: 'var(--success)', icon: <ShieldCheck size={32} />, label: 'Safe' };
    if (score >= 50) return { color: 'var(--warning)', icon: <ShieldAlert size={32} />, label: 'Medium' };
    return { color: 'var(--danger)', icon: <AlertTriangle size={32} />, label: 'Dangerous' };
  };

  const scoreDetails = getEcoScoreDetails(ecoScore);

  // --- Leaderboard Logic ---
  const latestEmissionsByRegion = regions.map(r => {
    const regionData = emissions.filter(e => e.region === r);
    return regionData.length > 0 ? regionData[0] : null;
  }).filter(e => e !== null);

  const sortedRegions = [...latestEmissionsByRegion].sort((a, b) => b.eco_score - a.eco_score);
  
  // Top 10 Cleanest (highest score)
  const topCleanest = sortedRegions.slice(0, 10);
  // Top 10 Dirtiest (lowest score)
  const topDirtiest = [...sortedRegions].sort((a, b) => a.eco_score - b.eco_score).slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Region Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ color: 'var(--text-main)' }}>Region:</h2>
        <select 
          value={selectedRegion} 
          onChange={e => setSelectedRegion(e.target.value)}
          style={{ 
            background: 'var(--bg-panel)', 
            color: 'var(--accent-cyan)', 
            border: '1px solid var(--accent-cyan)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '1.1rem',
            outline: 'none'
          }}
        >
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        {/* Eco Score Widget */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: `4px solid ${scoreDetails.color}` }}>
          <div style={{ padding: '1rem', background: `${scoreDetails.color}22`, borderRadius: '12px', color: scoreDetails.color }}>
             {scoreDetails.icon}
          </div>
          <div>
             <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Eco Score</h3>
             <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: scoreDetails.color }}>
                {ecoScore ? ecoScore.toFixed(0) : '--'} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>/ 100</span>
             </div>
             <div style={{ fontSize: '0.8rem', color: scoreDetails.color }}>{scoreDetails.label}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '12px', color: 'var(--accent-cyan)' }}>
             <Activity size={32} />
          </div>
          <div>
             <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Latest CO2</h3>
             <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                {latestEmission ? latestEmission.co2_level.toFixed(1) : '--'} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>ppm</span>
             </div>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(138, 43, 226, 0.1)', borderRadius: '12px', color: 'var(--accent-purple)' }}>
             <Wind size={32} />
          </div>
          <div>
             <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Latest Methane</h3>
             <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                {latestEmission ? latestEmission.methane_level.toFixed(1) : '--'} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>ppb</span>
             </div>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Chart Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           {/* AI Insights Panel */}
           {insights.length > 0 && (
             <div className="glass-panel" style={{ 
                 background: 'rgba(0, 240, 255, 0.05)', 
                 borderLeft: '4px solid var(--accent-cyan)',
                 padding: '1rem',
                 display: 'flex',
                 alignItems: 'flex-start',
                 gap: '1rem'
             }}>
                <div style={{ color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                   <BrainCircuit size={24} />
                </div>
                <div>
                   <h3 style={{ fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>AI Insights</h3>
                   {insights.map((insight, idx) => (
                       <p key={idx} style={{ color: 'var(--text-main)', fontSize: '0.95rem', margin: 0, marginBottom: '0.2rem' }}>
                           {insight}
                       </p>
                   ))}
                </div>
             </div>
           )}

           <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
             <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--accent-cyan)' }}>Emission Trends & Forecast</h2>
           <div style={{ flex: 1, minHeight: 0 }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                 <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} />
                 <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={12} />
                 <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={12} />
                 <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                 <Legend />
                 <Line yAxisId="left" type="monotone" dataKey="co2_hist" name="CO2 (ppm)" stroke="var(--accent-cyan)" strokeWidth={2} dot={false} />
                 <Line yAxisId="left" type="monotone" dataKey="co2_fore" name="CO2 Forecast" stroke="var(--accent-cyan)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                 
                 <Line yAxisId="right" type="monotone" dataKey="methane_hist" name="Methane (ppb)" stroke="var(--accent-purple)" strokeWidth={2} dot={false} />
                 <Line yAxisId="right" type="monotone" dataKey="methane_fore" name="Methane Forecast" stroke="var(--accent-purple)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                 
                 <Line yAxisId="left" type="monotone" dataKey="no2_hist" name="NO2 (ppb)" stroke="var(--warning)" strokeWidth={2} dot={false} />
                 <Line yAxisId="left" type="monotone" dataKey="no2_fore" name="NO2 Forecast" stroke="var(--warning)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
               </LineChart>
             </ResponsiveContainer>
           </div>
           </div>

           {/* Behavior Analysis Panel */}
           {behaviorInsights.length > 0 && (
             <div className="glass-panel" style={{ 
                 background: 'rgba(138, 43, 226, 0.05)', 
                 borderLeft: '4px solid var(--accent-purple)',
                 padding: '1rem',
                 display: 'flex',
                 alignItems: 'flex-start',
                 gap: '1rem'
             }}>
                <div style={{ color: 'var(--accent-purple)', marginTop: '0.2rem' }}>
                   <Eye size={24} />
                </div>
                <div>
                   <h3 style={{ fontSize: '1rem', color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>Factory Behavior Analysis</h3>
                   {behaviorInsights.map((insight, idx) => (
                       <p key={idx} style={{ color: 'var(--text-main)', fontSize: '0.95rem', margin: 0, marginBottom: '0.2rem' }}>
                           {insight}
                       </p>
                   ))}
                </div>
             </div>
           )}

        </div>

        {/* Alerts Section */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
           <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <AlertTriangle size={20} />
             Critical Alerts
           </h2>
           <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {anomalies.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                  No anomalies detected.
                </div>
              ) : (
                anomalies.map(anomaly => (
                  <div key={anomaly.id} style={{ 
                      padding: '1rem', 
                      background: 'rgba(255, 51, 102, 0.05)', 
                      borderLeft: '4px solid var(--danger)',
                      borderRadius: '4px'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                       <span style={{ fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={14} /> {anomaly.emission.region}
                       </span>
                       <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                         {new Date(anomaly.emission.timestamp).toLocaleTimeString()}
                       </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--danger)' }}>{anomaly.description}</p>
                  </div>
                ))
              )}
           </div>
        </div>

      </div>

      {/* Global Eco Rankings */}
      <div style={{ marginTop: '1rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={24} color="var(--accent-cyan)" />
          Global Eco Rankings
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Top Cleanest */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} />
              Top Cleanest Regions 🟢
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {topCleanest.map((item, index) => (
                <div key={item.region} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.8rem', background: 'rgba(0, 255, 0, 0.05)', borderRadius: '8px',
                    borderLeft: '4px solid var(--success)'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-muted)' }}>#{index + 1}</span>
                    <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{item.region}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--success)' }}>
                    {item.eco_score.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Dirtiest */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Flame size={20} />
              Top Dirtiest Regions 🔴
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {topDirtiest.map((item, index) => (
                <div key={item.region} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.8rem', background: 'rgba(255, 0, 0, 0.05)', borderRadius: '8px',
                    borderLeft: '4px solid var(--danger)'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-muted)' }}>#{index + 1}</span>
                    <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{item.region}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--danger)' }}>
                    {item.eco_score.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;
