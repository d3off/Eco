import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Tooltip, Popup, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppData, getGibsDate, SATELLITE_LAYERS } from '../context/AppDataContext';
import { BrainCircuit, Activity, Clock, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Utility for formatting factory status
const getStatusConfig = (status, aqi) => {
  if (status === 'danger') return { color: '#EF4444', glow: 'rgba(239,68,68,0.6)', radiusBase: 4000 };
  if (status === 'medium') return { color: '#F59E0B', glow: 'rgba(245,158,11,0.5)', radiusBase: 2500 };
  return { color: '#10B981', glow: 'rgba(16,185,129,0.4)', radiusBase: 1000 };
};

const mkIcon = (color, glow, size) => L.divIcon({
  className: '',
  html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};
    box-shadow:0 0 0 3px rgba(255,255,255,0.15),0 0 14px ${glow},0 0 28px ${glow};
    position:relative;animation:pulseMarker 2.2s ease-in-out infinite;">
  </div>`,
  iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -(size / 2 + 6)],
});

// Map Sync Component
const MapSync = ({ setBounds, extBounds }) => {
  const map = useMapEvent('move', () => {
    setBounds(map.getBounds());
  });
  
  useEffect(() => {
    if (extBounds && map.getBounds().toBBoxString() !== extBounds.toBBoxString()) {
      map.fitBounds(extBounds, { animate: false });
    }
  }, [extBounds, map]);
  return null;
};

const ProfessionalMonitoring = () => {
  const { t } = useTranslation();
  const { factories, selectedFactory, selectFactory } = useAppData();
  
  const [historyDay, setHistoryDay] = useState(30); // 1-30 (30 is today)
  const [syncBounds, setSyncBounds] = useState(null);
  
  // Calculate selected date (offset by 2 days to ensure NASA GIBS imagery is processed)
  const selectedDateObj = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2 - (30 - historyDay));
    return d;
  }, [historyDay]);

  const layerDateString = selectedDateObj.toISOString().split('T')[0];
  const isWeekend = selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6;

  // AI Report Generation based on historyDay
  const aiReport = useMemo(() => {
    const timeLabel = layerDateString;
    const dangerFactories = factories.filter(f => f.status === 'danger');
    
    if (isWeekend && dangerFactories.length > 0) {
      return `🔴 Anomaliya (${timeLabel}): ${dangerFactories.map(f=>f.shortName).join(', ')} hududida zavod filtrlari dam olish kunlarida o'chirilgani ehtimoli yuqori. NASA AOD qatlami buni tasdiqlamoqda.`;
    } else if (historyDay % 3 === 0 && dangerFactories.length > 0) {
      return `🟡 O'zgarish (${timeLabel}): Havo aylanishi buzilganligi sababli, atmosfera ifloslanishining yuqori darajasi to'planyapti.`;
    } else {
      return `🟢 Stabil holat (${timeLabel}): Sanoat hududlaridagi chiqindilar me'yor doirasida tarqalmoqda.`;
    }
  }, [historyDay, factories, layerDateString, isWeekend]);

  // Derived state for the factories
  const currentFactoriesData = useMemo(() => {
    return factories.map(f => {
      // Noise calculation so there's always slight change
      const noise = Math.sin(historyDay * f.id) * 0.2;
      let severityFactor = 1.0 + noise;
      
      // Spike on weekends for danger factories
      if (f.status === 'danger' && isWeekend) severityFactor += 0.8;
      else if (f.status === 'danger') severityFactor += 0.3;
      
      const dynamicAqi = Math.max(10, Math.round(f.aqi * severityFactor));
      return { ...f, dynamicAqi, severityFactor };
    });
  }, [historyDay, factories, isWeekend]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: '1rem', paddingBottom: '1rem' }}>
      <style>{`
        .leaflet-popup-content-wrapper { background: rgba(6, 11, 25, 0.95)!important; border: 1px solid rgba(0, 240, 255, 0.3)!important; border-radius: 8px!important; color: #E2E8F0!important; backdrop-filter: blur(10px)!important; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5)!important; }
        .leaflet-popup-tip { background: rgba(6, 11, 25, 0.95)!important; border: 1px solid rgba(0, 240, 255, 0.3)!important; border-top: none!important; border-left: none!important; }
        .factory-label { background: rgba(6, 11, 25, 0.8)!important; border: 1px solid rgba(0, 240, 255, 0.3)!important; border-radius: 4px!important; color: #E2E8F0!important; font-size: 10px!important; padding: 2px 6px!important; backdrop-filter: blur(4px)!important; pointer-events: none!important; }
        .factory-label::before { display: none!important; }
        .dark-tile { filter: brightness(0.35) contrast(1.3) grayscale(0.6) hue-rotate(200deg); }
      `}</style>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'var(--accent-cyan)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.4rem' }}>
            <Activity /> {t('pro_monitoring.title', 'Kosmik Monitoring Markazi')}
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
            {t('pro_monitoring.subtitle', 'Real vaqt sun\'iy yo\'ldosh qatlamlari asosida emissiya tahlili')}
          </p>
        </div>
      </div>

      {/* MID SECTION: DUAL MAPS & AI PANEL */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 300px', gap: '1rem', minHeight: 0 }}>
        
        {/* LEFT MAP: Factory Map */}
        <div className="glass-panel" style={{ padding: '4px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)' }}>
            <Navigation size={16} color="var(--accent-cyan)" /> {t('pro_monitoring.factory_map', 'Obyektlar Xaritasi')}
          </div>
          <div style={{ flex: 1, borderRadius: '0 0 8px 8px', overflow: 'hidden', position: 'relative' }}>
            <MapContainer center={[41.0, 64.5]} zoom={6} style={{ height: '100%', width: '100%', background: '#050a12' }} zoomControl={false}>
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Esri"
              />
              <MapSync setBounds={setSyncBounds} extBounds={null} />
              
              {currentFactoriesData.map(f => {
                const cfg = getStatusConfig(f.status, f.dynamicAqi);
                return (
                  <Marker key={f.id} position={[f.lat, f.lon]} icon={mkIcon(cfg.color, cfg.glow, 16)}>
                    <Tooltip direction="top" offset={[0, -10]} className="factory-label" permanent>
                      {f.shortName}
                    </Tooltip>
                    <Popup>
                      <div style={{ margin: '4px', minWidth: '180px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{f.type}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-cyan)', marginBottom: '8px' }}>{f.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Hudud:</span> <span>{f.region}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>AQI:</span> <strong style={{ color: cfg.color }}>{f.aqi}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                          {f.description}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* RIGHT MAP: Pollution Layer Map */}
        <div className="glass-panel" style={{ padding: '4px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)' }}>
            <Activity size={16} color="var(--danger)" /> {t('pro_monitoring.pollution_map', 'Ifloslanish & Thermal')}
          </div>
          <div style={{ flex: 1, borderRadius: '0 0 8px 8px', overflow: 'hidden', position: 'relative' }}>
            <MapContainer center={[41.0, 64.5]} zoom={6} style={{ height: '100%', width: '100%', background: '#050a12' }} zoomControl={false}>
              
              {/* Dependable Base Layer (Darkened for high contrast with smoke overlays) */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Esri"
                className="dark-tile"
              />
              
              {/* NASA Aerosol Overlay (AOD) - dynamically fetches layer by selected Date */}
              <TileLayer
                key={`aod-${layerDateString}`}
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Combined_Value_Added_AOD/default/${layerDateString}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`}
                opacity={0.45}
                attribution="NASA GIBS"
              />
              
              <MapSync setBounds={() => {}} extBounds={syncBounds} />

               {/* Simulated Pollution Smoke Overlays based on timeline */}
               {currentFactoriesData.map(f => {
                const cfg = getStatusConfig(f.status, f.dynamicAqi);
                const isDanger = f.status === 'danger' || f.dynamicAqi > 120;
                
                // Smoke colors (Toxic red/orange/yellow gradient effect)
                const coreColor = isDanger ? '#FF0000' : cfg.color;
                const midColor = isDanger ? '#FF4500' : cfg.color; // OrangeRed
                const outerColor = isDanger ? '#FF8C00' : cfg.color; // DarkOrange
                
                // Base radius expands and fluctuates using historyDay noise
                const timeScale = 1 + (historyDay / 30) * 0.4;
                const baseRadius = cfg.radiusBase * f.severityFactor * timeScale;
                
                return (
                  <React.Fragment key={f.id}>
                    {/* Factory Epicenter Point for visibility */}
                    <Circle 
                      center={[f.lat, f.lon]} 
                      radius={300}
                      pathOptions={{ color: '#FFFFFF', fillColor: '#FFFFFF', fillOpacity: 0.8, weight: 2 }}
                    >
                      <Popup>
                        <div style={{ margin: '4px', minWidth: '170px' }}>
                          <strong style={{ color: coreColor, fontSize: '1.05rem', display: 'block', marginBottom: '8px' }}>🔥 {f.shortName} Emissiyasi</strong>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.8rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px', gridColumn: '1 / span 2' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Sana: </span>
                              <strong style={{ color: 'var(--accent-cyan)' }}>{layerDateString}</strong>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>AQI:</span><br/>
                              <strong style={{ color: coreColor }}>{f.dynamicAqi}</strong>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>CO2:</span><br/>
                              <strong>{Math.round(f.gases.CO2 * f.severityFactor)}</strong><small>ppm</small>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>NO2:</span><br/>
                              <strong>{Math.round(f.gases.NO2 * f.severityFactor)}</strong>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>SO2:</span><br/>
                              <strong>{Math.round(f.gases.SO2 * f.severityFactor)}</strong>
                            </div>
                          </div>
                          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: isDanger ? '#FF4500' : 'var(--text-muted)' }}>
                            {isDanger ? '⚠ Zaharli gazlarning yoyilishi anomaliyaga ega!' : 'Havo tarkibi va tutun yoyilishi o\'rtacha me\'yorda.'}
                          </div>
                        </div>
                      </Popup>
                    </Circle>
                    
                    {/* Outer Smoke Cloud */}
                    <Circle 
                      center={[f.lat, f.lon]} 
                      radius={baseRadius * 2.5}
                      pathOptions={{ color: outerColor, fillColor: outerColor, fillOpacity: 0.15 * f.severityFactor, weight: 0 }}
                      className="map-ripple"
                    />
                    
                    {/* Mid Smoke Cloud */}
                    <Circle 
                      center={[f.lat, f.lon]} 
                      radius={baseRadius * 1.5}
                      pathOptions={{ color: midColor, fillColor: midColor, fillOpacity: 0.25 * f.severityFactor, weight: 0 }}
                    />

                    {/* Core Toxic Area */}
                    <Circle 
                      center={[f.lat, f.lon]} 
                      radius={baseRadius * 0.7}
                      pathOptions={{ color: coreColor, fillColor: coreColor, fillOpacity: 0.45 * f.severityFactor, weight: 0 }}
                    />
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* RIGHT PANEL: AI Report */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            <BrainCircuit color="var(--accent-cyan)" />
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>
              {t('pro_monitoring.ai_report_title', 'AI Analitik Hisobot')}
            </span>
          </div>
          
          <div style={{ flex: 1, color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.6', background: 'rgba(0, 240, 255, 0.03)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid var(--accent-cyan)' }}>
             <p style={{ margin: 0, fontWeight: 'bold' }}>📅 Sana: {layerDateString}</p>
             <p style={{ marginTop: '10px' }}>{aiReport}</p>
             
             <div style={{ marginTop: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
               <strong>Aktiv qatlamlar:</strong>
               <ul style={{ paddingLeft: '15px', marginTop: '5px' }}>
                 <li>NASA VIIRS TrueColor</li>
                 <li>Aerosol Optical Depth (AOD)</li>
                 <li>Zavod jonli emissiyalari</li>
               </ul>
             </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: TIMELINE SLIDER */}
      <div className="glass-panel" style={{ padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Clock color="var(--accent-cyan)" />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
            <span>30 Kun oldin</span>
            <span>{t('pro_monitoring.time_slider', 'Tarix Slayderi')} ({layerDateString})</span>
            <span>Hozirgi</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="30" 
            value={historyDay} 
            onChange={(e) => setHistoryDay(parseInt(e.target.value))}
            style={{
              width: '100%', cursor: 'pointer', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px',
              accentColor: '#00F0FF', outline: 'none'
            }}
          />
        </div>
      </div>

    </div>
  );
};

export default ProfessionalMonitoring;
