import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Marker, Tooltip, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAppData, SATELLITE_LAYERS, getGibsDate } from '../context/AppDataContext';
import { useNavigate } from 'react-router-dom';
import { Layers, Eye, EyeOff, ChevronDown, ChevronUp, Satellite } from 'lucide-react';

// ── Конфиг маркера ────────────────────────────────────
const getCfg = (status, aqi) => {
  if (status === 'danger') return { color:'#EF4444', glow:'rgba(239,68,68,0.6)', label:'🔴 XAVFLI', radius: Math.min(2000+(aqi-150)*15,5000), size:20 };
  if (status === 'medium') return { color:'#F59E0B', glow:'rgba(245,158,11,0.5)', label:'🟡 DIQQAT', radius: Math.min(1000+(aqi-90)*10,2500), size:16 };
  return { color:'#10B981', glow:'rgba(16,185,129,0.4)', label:'🟢 ME\'YORDA', radius:700, size:13 };
};

const mkIcon = (color, glow, size) => L.divIcon({
  className:'',
  html:`<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};
    box-shadow:0 0 0 3px rgba(255,255,255,0.15),0 0 14px ${glow},0 0 28px ${glow};
    position:relative;animation:fDot 2.2s ease-in-out infinite;">
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      width:6px;height:6px;border-radius:50%;background:#fff;opacity:0.9;"></div>
  </div>`,
  iconSize:[size,size], iconAnchor:[size/2,size/2], popupAnchor:[0,-(size/2+6)],
});

// ── Панель управления слоями NASA GIBS ────────────────
const LayerControlPanel = () => {
  const { satelliteLayers, layerCategories, activeLayers, toggleLayer, layerOpacities, setLayerOpacity, gibsDate, setGibsDate } = useAppData();
  const [expanded, setExpanded] = useState(true);
  const [expandedCats, setExpandedCats] = useState({ base: true, atmosphere: true, hazards: true, ecology: true });

  const toggleCat = (catId) => setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));

  return (
    <div style={{
      position:'absolute', top:12, right:12, zIndex:1000,
      width: expanded ? 280 : 48,
      transition:'width 0.25s ease',
      display:'flex', flexDirection:'column',
    }}>
      {/* Кнопка сворачивания */}
      <button onClick={() => setExpanded(!expanded)} style={{
        background:'rgba(7,11,20,0.92)', border:'1px solid rgba(0,240,255,0.4)',
        borderRadius: expanded ? '8px 8px 0 0' : '8px',
        color:'#00F0FF', cursor:'pointer', padding:'8px 12px',
        display:'flex', alignItems:'center', gap:'8px', fontSize:'0.8rem', fontWeight:'bold',
        backdropFilter:'blur(12px)', boxShadow:'0 0 15px rgba(0,240,255,0.15)',
      }}>
        <Satellite size={16} />
        {expanded && <>NASA GIBS — Sun'iy yo'ldosh qatlamlari</>}
      </button>

      {expanded && (
        <div style={{
          background:'rgba(7,11,20,0.94)', border:'1px solid rgba(0,240,255,0.25)',
          borderTop:'none', borderRadius:'0 0 8px 8px',
          padding:'0', backdropFilter:'blur(14px)',
          maxHeight:'calc(100vh - 240px)', overflowY:'auto',
          boxShadow:'0 4px 20px rgba(0,0,0,0.5)',
        }}>
          {/* Выбор даты */}
          <div style={{ padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color:'var(--text-muted)', fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>
              Suratlar sanasi
            </div>
            <input
              type="date"
              value={gibsDate}
              onChange={(e) => setGibsDate(e.target.value)}
              style={{
                width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(0,240,255,0.2)',
                borderRadius:6, color:'var(--accent-cyan)', padding:'5px 8px', fontSize:'0.8rem', outline:'none',
              }}
            />
          </div>

          {/* Категории слоёв */}
          {layerCategories.map(cat => {
            const catLayers = satelliteLayers.filter(l => l.category === cat.id);
            const isOpen = expandedCats[cat.id];
            return (
              <div key={cat.id}>
                <div onClick={() => toggleCat(cat.id)} style={{
                  padding:'8px 12px', cursor:'pointer',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  borderBottom:'1px solid rgba(255,255,255,0.03)',
                  background:'rgba(255,255,255,0.02)',
                }}>
                  <span style={{ fontSize:'0.78rem', fontWeight:'600', color:'var(--text-main)' }}>{cat.nameRu}</span>
                  {isOpen ? <ChevronUp size={14} color="var(--text-muted)"/> : <ChevronDown size={14} color="var(--text-muted)"/>}
                </div>

                {isOpen && catLayers.map(layer => {
                  const isActive = activeLayers.includes(layer.id);
                  return (
                    <div key={layer.id} style={{ padding:'6px 12px', borderBottom:'1px solid rgba(255,255,255,0.02)' }}>
                      {/* Включение */}
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}
                           onClick={() => toggleLayer(layer.id)}>
                        <div style={{
                          width:18, height:18, borderRadius:4,
                          background: isActive ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isActive ? '#00F0FF' : 'rgba(255,255,255,0.15)'}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          transition:'all 0.15s',
                        }}>
                          {isActive && <Eye size={12} color="#00F0FF"/>}
                          {!isActive && <EyeOff size={10} color="rgba(255,255,255,0.3)"/>}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'0.76rem', color: isActive ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isActive ? '600' : '400' }}>
                            {layer.icon} {layer.nameRu}
                          </div>
                        </div>
                      </div>

                      {/* Прозрачность (только для активных) */}
                      {isActive && (
                        <div style={{ marginTop:4, marginLeft:26, display:'flex', alignItems:'center', gap:'6px' }}>
                          <span style={{ fontSize:'0.62rem', color:'var(--text-muted)', minWidth:18 }}>
                            {Math.round(layerOpacities[layer.id] * 100)}%
                          </span>
                          <input
                            type="range" min="0" max="100"
                            value={Math.round(layerOpacities[layer.id] * 100)}
                            onChange={(e) => setLayerOpacity(layer.id, parseInt(e.target.value) / 100)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ flex:1, height:3, accentColor:'#00F0FF', cursor:'pointer' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Подпись */}
          <div style={{ padding:'8px 12px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.25)', textAlign:'center' }}>
              Ma'lumotlar: NASA EOSDIS GIBS • MODIS • VIIRS • OMPS
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Установка вида (центр Узбекистана) ────────────────
const SetView = () => {
  const map = useMap();
  useEffect(() => {
    map.setView([41.0, 64.5], 6, { animate: true, duration: 0.8 });
    map.options.zoomSnap = 0.5;
    map.options.zoomDelta = 0.5;
  }, [map]);
  return null;
};

// ── Компонент NASA GIBS тайлов с fallback ─────────────
const GibsLayers = () => {
  const { activeLayers, layerOpacities, gibsDate, setGibsDate, satelliteLayers } = useAppData();

  const getUrl = (layer) => {
    if (!layer.url.includes('default/')) return layer.url;
    const date = gibsDate || getGibsDate(0);
    return layer.url.replace(/default\/[\d-]+\//, `default/${date}/`);
  };

  const handleTileError = (e) => {
    // Если тайл не найден (например, за сегодня снимков ещё нет) — откатываемся на вчера
    if (gibsDate === getGibsDate(0)) {
      console.warn('GIBS imagery not available for today yet. Falling back to yesterday.');
      setGibsDate(getGibsDate(1));
    }
  };

  return (
    <>
      {activeLayers.map(layerId => {
        const layer = satelliteLayers.find(l => l.id === layerId);
        if (!layer) return null;
        return (
          <TileLayer
            key={`${layerId}-${gibsDate}`}
            url={getUrl(layer)}
            opacity={layerOpacities[layerId] ?? layer.defaultOpacity}
            maxZoom={layer.maxZoom}
            attribution="NASA EOSDIS GIBS"
            tileSize={256}
            errorTileUrl=""
            className={layer.category === 'base' ? '' : 'gibs-overlay'}
            eventHandlers={{ tileerror: handleTileError }}
          />
        );
      })}
    </>
  );
};

// ── ГЛАВНЫЙ КОМПОНЕНТ ─────────────────────────────────
const PublicMap = () => {
  const { factories, selectedFactory, selectFactory, activeLayers } = useAppData();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const danger = factories.filter(f => f.status === 'danger').length;
  const medium = factories.filter(f => f.status === 'medium').length;
  const good   = factories.filter(f => f.status === 'good').length;

  const handleNav = (factory, page) => { selectFactory(factory); navigate(page); };

  // Определяем, какие base-слои активны
  const hasGibsBase = activeLayers.some(id => {
    const l = SATELLITE_LAYERS.find(l => l.id === id);
    return l?.category === 'base';
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 120px)', gap:'1rem' }}>
      <style>{`
        @keyframes fDot { 0%,100%{transform:scale(1)} 50%{transform:scale(1.22)} }
        .factory-label{background:rgba(7,11,20,0.88)!important;border:1px solid rgba(0,240,255,0.35)!important;
          border-radius:6px!important;color:#E2E8F0!important;font-size:11px!important;font-weight:600!important;
          padding:3px 8px!important;white-space:nowrap!important;backdrop-filter:blur(8px)!important;
          box-shadow:0 0 10px rgba(0,240,255,0.15),0 2px 8px rgba(0,0,0,0.5)!important;pointer-events:none!important;}
        .factory-label::before,.leaflet-tooltip-left.factory-label::before,.leaflet-tooltip-right.factory-label::before{display:none!important;}
        .leaflet-popup-content-wrapper{background:rgba(7,11,20,0.96)!important;border:1px solid rgba(0,240,255,0.4)!important;
          border-radius:12px!important;color:#E2E8F0!important;backdrop-filter:blur(16px)!important;min-width:290px!important;
          box-shadow:0 0 24px rgba(0,240,255,0.2),0 8px 32px rgba(0,0,0,0.6)!important;}
        .leaflet-popup-content{margin:14px 16px!important;}
        .leaflet-popup-tip-container{display:none!important;}
        .leaflet-popup-close-button{color:#00F0FF!important;font-size:18px!important;}
        .leaflet-container{background:#050a12!important;}
        .popup-btn{background:rgba(0,240,255,0.1);border:1px solid rgba(0,240,255,0.4);color:#00F0FF;
          padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.75rem;font-weight:600;
          transition:all 0.15s;margin-right:6px;}
        .popup-btn:hover{background:rgba(0,240,255,0.25);}
      `}</style>

      {/* Шапка */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.8rem' }}>
        <div>
          <h2 style={{ color:'var(--accent-cyan)', margin:0, fontSize:'1.35rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
            🛰️ Sun'iy Yo'ldosh Monitoringi — O'zbekiston
          </h2>
          <p style={{ color:'var(--text-muted)', margin:'0.25rem 0 0', fontSize:'0.8rem' }}>
            NASA GIBS • {factories.length} obyekt • {now.toLocaleTimeString('ru-RU')}
            {hasGibsBase && <span style={{color:'var(--accent-cyan)', marginLeft:8}}>🛰 SUN'IY YO'LDOSH KO'RINISHI</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap' }}>
          {[
            { count:danger, label:'Xavfli', color:'#EF4444' },
            { count:medium, label:'Diqqat', color:'#F59E0B' },
            { count:good,   label:'Me\'yorda', color:'#10B981' },
            { count:factories.length, label:'Jami', color:'var(--accent-cyan)' },
          ].map(s => (
            <div key={s.label} className="glass-panel" style={{ padding:'0.45rem 0.9rem', display:'flex', alignItems:'center', gap:'0.45rem', borderLeft:`3px solid ${s.color}` }}>
              <span style={{ color:s.color, fontSize:'1.2rem', fontWeight:'bold' }}>{s.count}</span>
              <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Карта + Боковая панель */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 310px', gap:'1rem', minHeight:0 }}>

        {/* КАРТА */}
        <div style={{ borderRadius:'12px', overflow:'hidden', border:'1px solid rgba(0,240,255,0.3)', boxShadow:'0 0 30px rgba(0,240,255,0.08)', position:'relative' }}>

          {/* LIVE бейдж */}
          <div style={{ position:'absolute', top:12, left:12, zIndex:1000, background:'rgba(239,68,68,0.9)', color:'#fff',
            padding:'3px 10px', borderRadius:'4px', fontWeight:'bold', fontSize:'0.7rem', letterSpacing:'2px',
            display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ width:7, height:7, background:'#fff', borderRadius:'50%', animation:'fDot 1s ease-in-out infinite' }}/>LIVE
          </div>

          {/* NASA бейдж */}
          <div style={{ position:'absolute', bottom:12, left:12, zIndex:1000, background:'rgba(7,11,20,0.85)',
            border:'1px solid rgba(0,240,255,0.25)', color:'var(--text-muted)', padding:'4px 10px',
            borderRadius:'4px', fontSize:'0.65rem', backdropFilter:'blur(8px)' }}>
            NASA EOSDIS GIBS • MODIS/VIIRS
          </div>

          <MapContainer center={[41.0,64.5]} zoom={6} style={{ height:'100%', width:'100%' }}
            zoomControl zoomAnimation markerZoomAnimation
            maxZoom={19} minZoom={4}>
            <SetView />

            {/* NASA GIBS — единственный базовый слой (динамическая дата) */}
            <GibsLayers />

            {/* Заводы */}
            {factories.map(factory => {
              const cfg = getCfg(factory.status, factory.aqi);
              const isSel = selectedFactory?.id === factory.id;
              return (
                <React.Fragment key={factory.id}>
                  <Circle center={[factory.lat,factory.lon]} radius={cfg.radius*1.8}
                    pathOptions={{ color:cfg.color, fillColor:cfg.color, fillOpacity:0.035, weight:0 }} />
                  <Circle center={[factory.lat,factory.lon]} radius={cfg.radius}
                    pathOptions={{ color:cfg.color, fillColor:cfg.color, fillOpacity: isSel?0.22:0.14, weight: isSel?2:1.5, dashArray:'6 4' }} />
                  <Marker position={[factory.lat,factory.lon]}
                    icon={mkIcon(cfg.color, cfg.glow, isSel ? cfg.size*1.4 : cfg.size)}
                    eventHandlers={{ click:()=>selectFactory(factory) }}>
                    <Tooltip permanent direction="right" offset={[cfg.size/2+4,0]} className="factory-label">
                      <span style={{color:cfg.color,marginRight:3}}>●</span>{factory.shortName}
                    </Tooltip>
                    <Popup>
                      <div style={{padding:'2px 0'}}>
                        <div style={{borderBottom:`2px solid ${cfg.color}`,paddingBottom:10,marginBottom:12}}>
                          <div style={{fontSize:'0.65rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:3}}>{factory.type}</div>
                          <div style={{color:'var(--accent-cyan)',fontWeight:'bold',fontSize:'1.05rem'}}>{factory.name}</div>
                          <div style={{color:'var(--text-muted)',fontSize:'0.75rem',marginTop:3}}>📍 {factory.region}</div>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                          <div style={{background:`${cfg.color}22`,border:`1px solid ${cfg.color}`,color:cfg.color,padding:'3px 10px',borderRadius:20,fontWeight:'bold',fontSize:'0.8rem'}}>{cfg.label}</div>
                          <div style={{textAlign:'right'}}>
                            <div style={{color:'var(--text-muted)',fontSize:'0.65rem'}}>AQI</div>
                            <div style={{color:cfg.color,fontWeight:'bold',fontSize:'1.6rem',lineHeight:1}}>{factory.aqi}</div>
                          </div>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginBottom:12}}>
                          {[{label:'NO₂',value:factory.gases.NO2,unit:'мкг/м³',danger:40},{label:'SO₂',value:factory.gases.SO2,unit:'мкг/м³',danger:20},
                            {label:'CO',value:factory.gases.CO,unit:'мг/м³',danger:4},{label:'CO₂',value:factory.gases.CO2,unit:'ppm',danger:420}]
                          .map(g=>(
                            <div key={g.label} style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'7px 9px',border:`1px solid ${g.value>g.danger?'#EF444433':'rgba(255,255,255,0.06)'}`}}>
                              <div style={{color:'var(--text-muted)',fontSize:'0.68rem'}}>{g.label}</div>
                              <div style={{color:g.value>g.danger?'#EF4444':'#E2E8F0',fontWeight:'bold',fontSize:'0.95rem'}}>{g.value}</div>
                              <div style={{color:'var(--text-muted)',fontSize:'0.62rem'}}>{g.unit}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{display:'flex',marginBottom:10}}>
                          <button className="popup-btn" onClick={()=>handleNav(factory,'/prediction')}>📈 Prognoz</button>
                          <button className="popup-btn" onClick={()=>handleNav(factory,'/behavior')}>👁️ Xulq-atvor</button>
                        </div>
                        <div style={{background:'rgba(255,255,255,0.03)',borderRadius:6,padding:'7px 9px',color:'var(--text-muted)',fontSize:'0.75rem',lineHeight:1.5}}>
                          ℹ️ {factory.description}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>

          {/* Панель управления GIBS слоями */}
          <LayerControlPanel />
        </div>

        {/* БОКОВАЯ ПАНЕЛЬ — список заводов */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', overflowY:'auto', paddingRight:'2px' }}>
          <div style={{ color:'var(--text-muted)', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'1px', paddingLeft:4, paddingBottom:6, borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
            AQI darajasi bo'yicha obyektlar
          </div>
          {[...factories].sort((a,b)=>b.aqi-a.aqi).map(factory => {
            const cfg = getCfg(factory.status, factory.aqi);
            const isSel = selectedFactory?.id === factory.id;
            return (
              <div key={factory.id} onClick={()=>selectFactory(factory)} style={{
                background:isSel?`${cfg.color}18`:'rgba(13,20,35,0.55)',
                border:`1px solid ${isSel?cfg.color:'rgba(255,255,255,0.05)'}`,
                borderLeft:`4px solid ${cfg.color}`, borderRadius:10,
                padding:'0.7rem 0.8rem', cursor:'pointer', transition:'all 0.18s ease', flexShrink:0,
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:'bold',color:'var(--text-main)',fontSize:'0.84rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{factory.name}</div>
                    <div style={{color:'var(--text-muted)',fontSize:'0.68rem',marginTop:2}}>{factory.type}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0,marginLeft:8}}>
                    <div style={{color:cfg.color,fontWeight:'bold',fontSize:'1.15rem',lineHeight:1}}>{factory.aqi}</div>
                    <div style={{color:'var(--text-muted)',fontSize:'0.6rem'}}>AQI</div>
                  </div>
                </div>
                {isSel && (
                  <div style={{marginTop:8}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px 12px',marginBottom:8}}>
                      {[['NO₂',factory.gases.NO2,'мкг/м³'],['SO₂',factory.gases.SO2,'мкг/м³'],['CO',factory.gases.CO,'мг/м³'],['CO₂',factory.gases.CO2,'ppm']]
                      .map(([l,v,u])=>(
                        <div key={l} style={{color:'var(--text-muted)',fontSize:'0.71rem'}}>{l}: <span style={{color:'var(--text-main)',fontWeight:'600'}}>{v}</span><span style={{fontSize:'0.6rem',marginLeft:2}}>{u}</span></div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button className="popup-btn" style={{fontSize:'0.68rem',padding:'4px 8px'}} onClick={(e)=>{e.stopPropagation();handleNav(factory,'/prediction');}}>📈 Prognoz</button>
                      <button className="popup-btn" style={{fontSize:'0.68rem',padding:'4px 8px'}} onClick={(e)=>{e.stopPropagation();handleNav(factory,'/behavior');}}>👁️ Tahlil</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PublicMap;
