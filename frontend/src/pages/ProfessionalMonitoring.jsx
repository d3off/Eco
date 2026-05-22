import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Tooltip, Popup, useMapEvent, SVGOverlay } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppData, getGibsDate, SATELLITE_LAYERS } from '../context/AppDataContext';
import { BrainCircuit, Activity, Clock, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Utility for formatting factory status
// Utility for formatting factory status
const getStatusConfig = (status) => {
  if (status === 'purple') return { color: '#9d00ff', glow: 'rgba(157,0,255,0.6)', radiusBase: 5500 };
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
  const [realChemicalData, setRealChemicalData] = useState({});
  const [isFetchingChem, setIsFetchingChem] = useState(true);
  
  // Calculate selected date (offset by 2 days to ensure NASA GIBS imagery is processed)
  const selectedDateObj = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2 - (30 - historyDay));
    return d;
  }, [historyDay]);

  const layerDateString = selectedDateObj.toISOString().split('T')[0];

  // Fetch REAL CHEMICAL DATA from Open-Meteo API for every factory
  useEffect(() => {
    const fetchRealChemistry = async () => {
      setIsFetchingChem(true);
      const dataMapping = {};
      try {
        await Promise.all(factories.map(async (f) => {
          const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${f.lat}&longitude=${f.lon}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aerosol_optical_depth,dust`);
          const dataset = await res.json();
          if (dataset && dataset.current) dataMapping[f.id] = dataset.current;
        }));
      } catch (err) {
        console.error("Failed to fetch real chemical data:", err);
      }
      setRealChemicalData(dataMapping);
      setIsFetchingChem(false);
    };
    fetchRealChemistry();
  }, [factories]);

  // Derived state mapping REAL TOXIC DATA to factories
  const currentFactoriesData = useMemo(() => {
    if (Object.keys(realChemicalData).length === 0) return factories.map(f => ({...f, severityFactor: 1, dynamicAqi: f.aqi, isReal: false}));
    
    return factories.map(f => {
      const realData = realChemicalData[f.id] || {};
      const pm25 = realData.pm2_5 || 0;
      const so2 = realData.sulphur_dioxide || 0;
      const no2 = realData.nitrogen_dioxide || 0;
      const aqi = realData.european_aqi || 20;

      let status = 'good';
      let sev = 1.0;

      // Real WHO / EPA Threshold detection
      if (pm25 > 50 || so2 > 100 || no2 > 80 || aqi > 80) { 
        status = 'purple';
        sev = 2.8;
      } else if (pm25 > 25 || so2 > 40 || no2 > 40 || aqi > 50 || f.status === 'danger') {
        status = 'danger';
        sev = 1.8;
      } else if (pm25 > 15 || aqi > 30) {
        status = 'medium';
        sev = 1.3;
      }

      return { 
        ...f, 
        status, 
        severityFactor: sev, 
        dynamicAqi: aqi || f.aqi,
        realData,
        isReal: true
      };
    });
  }, [factories, realChemicalData]);

  // AI REAL CHEMICAL ANALYSIS REPORT & RISK CALCULATION
  const { aiReport, riskCalc } = useMemo(() => {
    if (isFetchingChem) return { aiReport: "📡 Ochiq Atmosfera API'sidan real havo kimyoviy tarkibi tahlili yuklanmoqda...", riskCalc: { safe: 100, toxic: 0 } };
    
    const purpleF = currentFactoriesData.filter(f => f.status === 'purple');
    const dangerF = currentFactoriesData.filter(f => f.status === 'danger');
    
    // Safety & Toxicity Proportions Computation
    const maxAqi = Math.max(...currentFactoriesData.map(f => f.dynamicAqi || 0));
    const toxicityPercent = Math.min(100, Math.round((maxAqi / 120) * 100)); // Capped at 100
    const safetyPercent = 100 - toxicityPercent;

    let aiTxt = '';
    if (purpleF.length > 0) {
      const w = purpleF[0];
      const so2 = w.realData?.sulphur_dioxide ?? 'N/A';
      const pm25 = w.realData?.pm2_5 ?? 'N/A';
      aiTxt = `☣️ TOXIC CHEMICAL DANGER: ${w.shortName} hududida SO2 (${so2} µg/m³) va PM2.5 zaharli changi (${pm25} µg/m³) inson hayoti uchun o'ta xavfli darajaga chiqdi. Atmosferada zaharli gaz reaksiya ehtimoli keskin oshdi! Zudlik bilan zavod to'xtatilishi shart.`;
    } else if (dangerF.length > 0) {
      const w = dangerF[0];
      const no2 = w.realData?.nitrogen_dioxide ?? 'N/A';
      aiTxt = `🔴 Anomaliya Aniqlandi: Koinot API va datchiklari ${w.shortName} gumbazi atrofida JST me'yoridan ortiqcha chiqindini tutib oldi! Azot dioksidi (NO2): ${no2} µg/m³. Zudlik bilan tekshiruv tavsiya etiladi.`;
    } else {
      aiTxt = `🟢 Stabil Mintaqa: O'zbekistondagi monitoring obyektlarining atmosfera ko'rsatkichlari WHO xavfsizlik me'yorlariga javob bermoqda. Havo aylanishi normada, toksik anomaliyalar yo'q.`;
    }
    
    return { aiReport: aiTxt, riskCalc: { safe: safetyPercent, toxic: toxicityPercent } };
  }, [currentFactoriesData, isFetchingChem]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: '1rem', paddingBottom: '1rem' }}>
      <style>{`
        .leaflet-popup-content-wrapper { background: rgba(6, 11, 25, 0.95)!important; border: 1px solid rgba(0, 240, 255, 0.3)!important; border-radius: 8px!important; color: #E2E8F0!important; backdrop-filter: blur(10px)!important; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5)!important; }
        .leaflet-popup-tip { background: rgba(6, 11, 25, 0.95)!important; border: 1px solid rgba(0, 240, 255, 0.3)!important; border-top: none!important; border-left: none!important; }
        .factory-label { background: rgba(6, 11, 25, 0.8)!important; border: 1px solid rgba(0, 240, 255, 0.3)!important; border-radius: 4px!important; color: #E2E8F0!important; font-size: 10px!important; padding: 2px 6px!important; backdrop-filter: blur(4px)!important; pointer-events: none!important; }
        .factory-label::before { display: none!important; }
        .dark-tile { filter: brightness(0.65) contrast(1.1) grayscale(0.5) sepia(0.3) hue-rotate(180deg); }
        .pulse-layer { animation: smkPulse 2s infinite alternate ease-in-out; transform-origin: center; }
        @keyframes smkPulse { 0% { opacity: 0.7; } 100% { opacity: 1; } }
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>PM2.5:</span><br/>
                            <strong>{f.isReal ? f.realData.pm2_5 : '-'}</strong><small>μg/m³</small>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>SO2:</span><br/>
                            <strong>{f.isReal ? f.realData.sulphur_dioxide : '-'}</strong><small>μg/m³</small>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>NO2:</span><br/>
                            <strong>{f.isReal ? f.realData.nitrogen_dioxide : '-'}</strong><small>μg/m³</small>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Aerosol Zichligi:</span><br/>
                            <strong>{f.isReal ? f.realData.aerosol_optical_depth : '-'}</strong>
                          </div>
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
              
              {/* Dependable Base Layer (Bright daylight version to match left map) */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Esri"
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
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>PM2.5:</span><br/>
                              <strong>{f.isReal ? f.realData.pm2_5 : '-'}</strong><small>μg/m³</small>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>SO2:</span><br/>
                              <strong style={{ color: f.status === 'purple' ? '#9d00ff' : 'white' }}>{f.isReal ? f.realData.sulphur_dioxide : '-'}</strong><small>μg/m³</small>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>NO2:</span><br/>
                              <strong>{f.isReal ? f.realData.nitrogen_dioxide : '-'}</strong><small>μg/m³</small>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                               <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Aerosol Zichlik:</span><br/>
                               <strong>{f.isReal ? f.realData.aerosol_optical_depth : '-'}</strong>
                            </div>
                          </div>
                          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: f.status === 'purple' ? '#9d00ff' : (isDanger ? '#FF4500' : 'var(--text-muted)') }}>
                            {f.status === 'purple' ? '☣️ XAVFLI ZAHARLI REAKSIYA EHTIMOLI YUQORI!' : (isDanger ? '⚠ Havoning xavfli darajada ifloslanishi aniqlandi!' : 'Havo kimyoviy tarkibi o\'rtacha me\'yorda.')}
                          </div>
                        </div>
                      </Popup>
                    </Circle>
                    
                    {/* SVG Volumetric Plume Overlay */}
                    {(() => {
                      // Calculate geographic bounds based on radius in meters
                      const totalRadiusMeters = baseRadius * 3.5;
                      const latOffset = totalRadiusMeters / 111320;
                      const lonOffset = totalRadiusMeters / (111320 * Math.cos((f.lat * Math.PI) / 180));
                      const bounds = [
                        [f.lat - latOffset, f.lon - lonOffset],
                        [f.lat + latOffset, f.lon + lonOffset]
                      ];
                      
                      return (
                        <SVGOverlay bounds={bounds} className="pulse-layer" attributes={{ pointerEvents: 'none' }}>
                          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: '100%' }}>
                            <defs>
                              {isDanger ? (
                                <radialGradient id={`smoke-grad-${f.id}`} cx="50%" cy="50%" r="50%">
                                  {/* Deep black core for danger emissions, blending into red toxic smoke */}
                                  <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
                                  <stop offset="15%" stopColor="#2a0a0a" stopOpacity="0.7" />
                                  <stop offset="35%" stopColor={coreColor} stopOpacity={Math.min(1, 0.5 * f.severityFactor)} />
                                  <stop offset="65%" stopColor={midColor} stopOpacity={Math.min(1, 0.25 * f.severityFactor)} />
                                  <stop offset="100%" stopColor={outerColor} stopOpacity="0" />
                                </radialGradient>
                              ) : (
                                <radialGradient id={`smoke-grad-${f.id}`} cx="50%" cy="50%" r="50%">
                                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                                  <stop offset="5%" stopColor={coreColor} stopOpacity={Math.min(1, 0.6 * f.severityFactor)} />
                                  <stop offset="25%" stopColor={midColor} stopOpacity={Math.min(1, 0.3 * f.severityFactor)} />
                                  <stop offset="60%" stopColor={outerColor} stopOpacity={Math.min(1, 0.1 * f.severityFactor)} />
                                  <stop offset="100%" stopColor={outerColor} stopOpacity="0" />
                                </radialGradient>
                              )}
                            </defs>
                            <circle cx="50" cy="50" r="50" fill={`url(#smoke-grad-${f.id})`} />
                          </svg>
                        </SVGOverlay>
                      );
                    })()}
                    
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
             
             <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '8px' }}>
                   <strong>Kimyoviy Reaksiya Risk Tahlili</strong> (Live API)
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Air Safety (Xavfsizlik):</span> 
                   <strong style={{ color: riskCalc.safe < 40 ? 'var(--danger)' : 'var(--success)' }}>{riskCalc.safe}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Toxicity (Zaharlanish):</span> 
                   <strong style={{ color: riskCalc.toxic > 60 ? '#9d00ff' : 'var(--accent-orange)' }}>{riskCalc.toxic}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Human Health Risk:</span> 
                   <strong style={{ color: riskCalc.toxic > 50 ? 'var(--danger)' : 'var(--warning)' }}>{Math.min(100, riskCalc.toxic + 12)}%</strong>
                </div>
             </div>

             <div style={{ marginTop: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
               <strong style={{ display: 'block' }}>Active OSINT Layers:</strong>
               <ul style={{ paddingLeft: '15px', marginTop: '5px' }}>
                 <li>NASA VIIRS & MODIS CAMS</li>
                 <li>Open-Meteo Air Quality API</li>
                 <li>AI Anomaly Prediction Array</li>
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
