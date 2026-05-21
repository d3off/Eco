import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Factory, Home, Briefcase, Rocket } from 'lucide-react';

const EcoMap = ({ emissions }) => {
  // Get unique regions
  const regions = [...new Set(emissions.map(e => e.region))];

  // Get latest emission for EACH region
  const latestEmissionsByRegion = regions.map(r => {
    const regionData = emissions.filter(e => e.region === r);
    return regionData.length > 0 ? regionData[0] : null;
  }).filter(e => e !== null);

  // Map settings
  const getIcon = (region) => {
      if (region.includes("Industrial")) return <Factory size={32} />;
      if (region.includes("Residential")) return <Home size={32} />;
      if (region.includes("Commercial")) return <Briefcase size={32} />;
      return <Rocket size={32} />;
  }

  const getPosition = (region) => {
      if (region.includes("A-1")) return { top: '20%', left: '25%' };
      if (region.includes("B-7")) return { top: '30%', left: '75%' };
      if (region.includes("C-4")) return { top: '70%', left: '30%' };
      return { top: '60%', left: '70%' }; // Station Alpha
  }

  const getStatus = (score) => {
    if (score >= 75) return { color: 'var(--success)', glow: 'rgba(0, 255, 0, 0.5)', status: 'Safe', icon: <ShieldCheck size={16}/> };
    if (score >= 50) return { color: 'var(--warning)', glow: 'rgba(255, 165, 0, 0.5)', status: 'Warning', icon: <ShieldAlert size={16}/> };
    return { color: 'var(--danger)', glow: 'rgba(255, 0, 0, 0.8)', status: 'Danger', icon: <AlertTriangle size={16}/> };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--accent-cyan)' }}>Общественная прозрачность (Карта Загрязнений)</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Наблюдение за секторами в реальном времени. Красные зоны требуют немедленного внимания общественности и служб безопасности.
      </p>

      {/* Map Container */}
      <div className="glass-panel" style={{ 
          flex: 1, 
          position: 'relative', 
          background: 'radial-gradient(circle at center, #1a2332 0%, #0d1117 100%)',
          overflow: 'hidden',
          border: '1px solid rgba(0, 240, 255, 0.2)'
      }}>
        {/* Radar grid lines */}
        <div style={{
            position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0, 240, 255, 0.1)'
        }} />
        <div style={{
            position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: 'rgba(0, 240, 255, 0.1)'
        }} />
        <div style={{
            position: 'absolute', top: '50%', left: '50%', width: '60%', height: '60%', 
            transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '1px solid rgba(0, 240, 255, 0.1)'
        }} />
        <div style={{
            position: 'absolute', top: '50%', left: '50%', width: '30%', height: '30%', 
            transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '1px solid rgba(0, 240, 255, 0.1)'
        }} />

        {/* Nodes */}
        {latestEmissionsByRegion.map(item => {
          const statusDetails = getStatus(item.eco_score);
          const pos = getPosition(item.region);
          
          // Determine animation for danger
          const isDanger = item.eco_score < 50;
          const animationClass = isDanger ? 'pulse-danger' : '';

          return (
            <div key={item.region} style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 10
            }}>
              {/* Node Circle */}
              <div 
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: `${statusDetails.color}22`,
                  border: `2px solid ${statusDetails.color}`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: statusDetails.color,
                  boxShadow: `0 0 20px ${statusDetails.glow}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {getIcon(item.region)}
              </div>

              {/* Info Card */}
              <div style={{
                  marginTop: '1rem',
                  background: 'rgba(13, 17, 23, 0.8)',
                  border: `1px solid ${statusDetails.color}`,
                  padding: '0.8rem',
                  borderRadius: '8px',
                  backdropFilter: 'blur(4px)',
                  textAlign: 'center',
                  minWidth: '150px'
              }}>
                 <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                     {item.region}
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: statusDetails.color, fontWeight: 'bold' }}>
                    {statusDetails.icon}
                    <span>Eco Score: {item.eco_score.toFixed(0)}</span>
                 </div>
                 {isDanger && (
                     <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 'bold' }}>
                        ВНИМАНИЕ! ТОКСИЧНО!
                     </div>
                 )}
              </div>
            </div>
          );
        })}

        {/* CSS for pulsing danger nodes - inline style hack */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulseDanger {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(255, 0, 0, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
          }
          .pulse-danger {
            animation: pulseDanger 1.5s infinite;
          }
        `}} />
      </div>
    </div>
  );
};

export default EcoMap;
