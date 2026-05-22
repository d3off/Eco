import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, useMap, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import HazardBadge from '../components/HazardBadge';
import { useAppData } from '../context/AppDataContext';

const API = 'http://localhost:8000';

const LEVEL_CONFIG = {
  LOW:    { label: 'PAST XAVF',   color: '#22c55e', glow: '0 0 40px rgba(34,197,94,0.3)',    bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.3)',   gauge: '#22c55e', pct: 18  },
  MEDIUM: { label: "O'RTA XAVF", color: '#f59e0b', glow: '0 0 40px rgba(245,158,11,0.35)',  bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', gauge: '#f59e0b', pct: 55  },
  HIGH:   { label: 'YUQORI XAVF', color: '#ef4444', glow: '0 0 40px rgba(239,68,68,0.4)',    bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',   gauge: '#ef4444', pct: 92  },
};

// ── Циферблат опасности ───────────────────────────────────────────────────────
const DangerGauge = ({ level }) => {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.LOW;
  const radius = 80, cx = 100, cy = 100;
  const startAngle = 210, sweepTotal = 300;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const arcPath = (pct) => {
    const sweep = (sweepTotal * pct) / 100;
    const endAngle = startAngle + sweep;
    const x1 = cx + radius * Math.cos(toRad(startAngle));
    const y1 = cy + radius * Math.sin(toRad(startAngle));
    const x2 = cx + radius * Math.cos(toRad(endAngle));
    const y2 = cy + radius * Math.sin(toRad(endAngle));
    const large = sweep > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Track */}
        <path d={arcPath(100)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round" />
        {/* Value arc */}
        <path
          d={arcPath(cfg.pct)}
          fill="none"
          stroke={cfg.gauge}
          strokeWidth="14"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${cfg.gauge})`, transition: 'all 0.8s ease' }}
        />
        {/* Center text */}
        <text x="100" y="90" textAnchor="middle" fill={cfg.color} fontSize="28" fontWeight="bold">
          {cfg.pct}%
        </text>
        <text x="100" y="112" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">
          XAVF DARAJASI
        </text>
        {/* Labels */}
        <text x="30" y="168" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9">ME'YOR</text>
        <text x="170" y="168" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9">XAVFLI</text>
      </svg>
      <div style={{
        padding: '8px 24px', borderRadius: '20px',
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        color: cfg.color, fontWeight: 800, fontSize: '0.95rem',
        letterSpacing: '1.5px', boxShadow: cfg.glow,
        transition: 'all 0.6s ease',
      }}>
        {cfg.label}
      </div>
    </div>
  );
};

// ── Карточка вещества ─────────────────────────────────────────────────────────
const ThreatCard = ({ threat }) => {
  const isHigh = threat.severity === 'HIGH';
  const color = isHigh ? '#ef4444' : '#f59e0b';
  const bg    = isHigh ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.07)';

  return (
    <div style={{
      background: bg, border: `1px solid ${isHigh ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
      borderRadius: '14px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem',
      transition: 'transform 0.2s', cursor: 'default',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.6rem' }}>{threat.icon}</span>
          <div>
            <div style={{ color, fontWeight: 800, fontSize: '1.1rem' }}>{threat.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>{threat.full_name}</div>
          </div>
        </div>
        {threat.is_carcinogen && (
          <span style={{
            background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)',
            color: '#a855f7', fontSize: '0.68rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 700,
          }}>☢️ КАНЦЕРОГЕН</span>
        )}
      </div>

      {/* Прогресс-бар */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
          <span>O'lchangan: <strong style={{ color }}>{threat.measured_value} {threat.unit}</strong></span>
          <span>Me'yor (JSST): {threat.who_threshold} {threat.unit}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min((threat.measured_value / threat.who_threshold) * 100, 100)}%`,
            height: '100%', background: `linear-gradient(90deg, ${color}90, ${color})`,
            borderRadius: '6px', transition: 'width 0.8s ease',
            boxShadow: `0 0 8px ${color}`,
          }} />
        </div>
        <div style={{ fontSize: '0.72rem', color, marginTop: '3px', fontWeight: 700 }}>
          ⚠️ Me'yordan {threat.excess_ratio} bar yuqori
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.6rem' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: '4px' }}>🎯 Organlar:</span>
        {threat.organs.join(', ')}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
        {threat.symptoms}
      </div>
    </div>
  );
};

// ── Карточка реакции ──────────────────────────────────────────────────────────
const ReactionCard = ({ reaction }) => {
  const [open, setOpen] = useState(false);
  const isHigh = reaction.severity === 'HIGH';
  const color = isHigh ? '#ef4444' : '#f59e0b';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid ${isHigh ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)'}`,
      borderRadius: '12px', overflow: 'hidden',
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: '1rem 1.2rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontSize: '1.2rem' }}>{isHigh ? '⚗️' : '🔬'}</span>
          <div>
            <div style={{ color, fontWeight: 700, fontSize: '0.92rem' }}>{reaction.name}</div>
            <code style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', fontFamily: 'monospace' }}>{reaction.equation}</code>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <HazardBadge level={reaction.severity === 'HIGH' ? 'HIGH' : 'MEDIUM'} size="sm" />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 1.2rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginBottom: '2px' }}>ПРОДУКТ РЕАКЦИИ</div>
            <div style={{ color: '#60a5fa', fontWeight: 700 }}>{reaction.product}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginBottom: '2px' }}>МЕХАНИЗМ ВОЗДЕЙСТВИЯ</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.83rem', lineHeight: 1.5 }}>{reaction.mechanism}</div>
          </div>
          <div style={{
            background: `${color}12`, border: `1px solid ${color}40`,
            borderRadius: '8px', padding: '0.7rem',
          }}>
            <div style={{ color, fontWeight: 700, fontSize: '0.8rem' }}>🏥 Влияние на здоровье</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginTop: '3px' }}>{reaction.health_effect}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Обзорная карточка всех регионов ──────────────────────────────────────────
const RegionOverviewCard = ({ r, selectedRegion, onSelect }) => {
  const cfg = LEVEL_CONFIG[r.hazard_level] || LEVEL_CONFIG.LOW;
  const isSelected = selectedRegion === r.region;

  return (
    <div
      onClick={() => onSelect(r.region)}
      style={{
        background: isSelected ? cfg.bg : 'rgba(255,255,255,0.03)',
        border: `1.5px solid ${isSelected ? cfg.border : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '14px', padding: '1rem 1.2rem', cursor: 'pointer',
        transition: 'all 0.25s', boxShadow: isSelected ? cfg.glow : 'none',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)' }}>{r.region}</div>
        <HazardBadge level={r.hazard_level} size="sm" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
        <div>CO₂: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{r.co2_level}</span></div>
        <div>NO₂: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{r.no2_level}</span></div>
        <div>CH₄: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{r.methane_level}</span></div>
      </div>
      {r.active_reactions_count > 0 && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#f59e0b' }}>
          ⚗️ {r.active_reactions_count} активных реакций
        </div>
      )}
    </div>
  );
};

// ── Настройка вида карты ──────────────────────────────────────────────────
const SetMapCenter = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 13, { animate: true, duration: 1.5 });
    }
  }, [coords, map]);
  return null;
};

// ── Создание иконки маркера ───────────────────────────────────────────────
const hazardIcon = L.divIcon({
  className: '',
  html: `<div style="width:12px;height:12px;background:#00f0ff;border:2px solid #fff;border-radius:50%;box-shadow:0 0 15px #00f0ff;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

// ── Главная страница ──────────────────────────────────────────────────────────
const HazardPage = () => {
  const { factories } = useAppData();
  const [allRegions, setAllRegions]     = useState([]);
  const [selectedRegion, setSelected]   = useState('');
  const [report, setReport]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [loadingAll, setLoadingAll]     = useState(true);
  const [showRef, setShowRef]           = useState(false);
  const [error, setError]               = useState('');

  const danger = factories.filter(f => f.status === 'danger').length;
  const medium = factories.filter(f => f.status === 'medium').length;
  const good   = factories.filter(f => f.status === 'good').length;

  // Загружаем все регионы при старте
  useEffect(() => {
    setLoadingAll(true);
    fetch(`${API}/api/hazards`)
      .then(r => r.json())
      .then(data => {
        setAllRegions(data);
        if (data.length > 0 && !selectedRegion) {
          setSelected(data[0].region);
        }
      })
      .catch(() => setError('Не удалось подключиться к серверу'))
      .finally(() => setLoadingAll(false));
  }, []);

  // Загружаем детальный отчёт при выборе региона
  useEffect(() => {
    if (!selectedRegion) return;
    setLoading(true);
    setReport(null);
    fetch(`${API}/api/hazards/${encodeURIComponent(selectedRegion)}`)
      .then(r => r.json())
      .then(setReport)
      .catch(() => setError('Ошибка загрузки данных региона'))
      .finally(() => setLoading(false));
  }, [selectedRegion]);

  const currentFactory = factories.find(f => f.name === selectedRegion || f.region.includes(selectedRegion));

  const cfg = report ? (LEVEL_CONFIG[report.hazard_level] || LEVEL_CONFIG.LOW) : null;

  // Рассчитываем радиусы зон на основе PubChem логики и текущих данных
  const getZones = () => {
    if (!report || !currentFactory) return [];
    const base = currentFactory.aqi / 100; // Множитель от интенсивности выброса
    return [
      { name: 'Kritik zona',   radius: 400 * base,  color: '#ef4444', opacity: 0.25, label: '🔴 QIZIL: Yuqori xavf' },
      { name: 'Ogohlantirish', radius: 1200 * base, color: '#f59e0b', opacity: 0.15, label: '🟡 SARIQ: Diqqat hududi' },
      { name: 'Monitoring',   radius: 3000 * base, color: '#10b981', opacity: 0.08, label: '🟢 YASHIL: Tarqalish chegarasi' }
    ];
  };

  const zones = getZones();

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', paddingBottom: '3rem' }}>

      {/* ── Заголовок страницы ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '1px' }}>
            ⚗️ Chemical Hazard
          </h1>
          <p style={{ margin: '0.4rem 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
            Xavfli moddalar va kimyoviy reaksiyalar tahlili (JSST me'yorlari asosida)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {[
            { count: danger, label: 'Xavfli', color: '#EF4444' },
            { count: medium, label: 'Diqqat', color: '#F59E0B' },
            { count: good, label: 'Me\'yorda', color: '#10B981' },
            { count: factories.length, label: 'Jami', color: 'var(--accent-cyan)' },
          ].map(s => (
            <div key={s.label} className="glass-panel" style={{ padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.45rem', borderLeft: `3px solid ${s.color}` }}>
              <span style={{ color: s.color, fontSize: '1.2rem', fontWeight: 'bold' }}>{s.count}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '1rem', color: '#ef4444', marginBottom: '1.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem' }}>

        {/* ── Левая панель: список регионов ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            Hudud yoki zavodni tanlang
          </div>
          {loadingAll ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem' }}>Загрузка...</div>
          ) : (
            allRegions.map(r => (
              <RegionOverviewCard
                key={r.region}
                r={r}
                selectedRegion={selectedRegion}
                onSelect={setSelected}
              />
            ))
          )}
        </div>

        {/* ── Правая панель: детальный отчёт ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading && (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚗️</div>
              Анализ химической обстановки...
            </div>
          )}

          {report && !loading && cfg && (
            <>
              {/* ── Блок 1: ХАРТА — Визуализация зон по PubChem ── */}
              <div className="glass-panel" style={{ height: '350px', position: 'relative', overflow: 'hidden', padding: 0 }}>
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, background: 'rgba(7,11,20,0.85)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(0,240,255,0.3)', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                  📡 KIMYOVIY TARQALISH MODELI
                </div>
                
                <MapContainer center={[41, 64]} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  {currentFactory && <SetMapCenter coords={[currentFactory.lat, currentFactory.lon]} />}
                  
                  {currentFactory && (
                    <>
                      {/* Зоны опасности */}
                      {[...zones].reverse().map((zone, idx) => (
                        <Circle
                          key={idx}
                          center={[currentFactory.lat, currentFactory.lon]}
                          radius={zone.radius}
                          pathOptions={{ fillColor: zone.color, color: zone.color, weight: 1, fillOpacity: zone.opacity }}
                        >
                          <Popup>{zone.label}</Popup>
                        </Circle>
                      ))}
                      
                      <Marker position={[currentFactory.lat, currentFactory.lon]} icon={hazardIcon}>
                        <Popup>
                          <div style={{ color: '#00f0ff', fontWeight: 'bold' }}>{currentFactory.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#ccc' }}>Emissiya manbasi</div>
                        </Popup>
                      </Marker>
                    </>
                  )}
                </MapContainer>

                {/* Легенда на карте */}
                <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1000, background: 'rgba(7,11,20,0.9)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {zones.map((z, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: '#fff' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: z.color }}></div>
                      {z.name}: {Math.round(z.radius)}m
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Блок 2: Gauge + измерения ── */}
              <div className="glass-panel" style={{ padding: '1.8rem', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', alignItems: 'center' }}>
                <DangerGauge level={report.hazard_level} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: '0.2rem' }}>
                      {selectedRegion}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                      Усреднено по {report.latest_measurements?.sample_count} последним замерам
                    </div>
                  </div>

                  {/* Показатели */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    {[
                      { label: 'CO₂', value: report.latest_measurements?.co2_level, unit: 'ppm',   icon: '💨' },
                      { label: 'NO₂', value: report.latest_measurements?.no2_level, unit: 'мкг/м³', icon: '🟠' },
                      { label: 'CH₄', value: report.latest_measurements?.methane_level, unit: 'ppb', icon: '🔥' },
                      { label: 'Eco Score', value: report.latest_measurements?.eco_score, unit: '/100', icon: '🌱' },
                    ].map(m => (
                      <div key={m.label} style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px', padding: '0.8rem',
                      }}>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>{m.icon} {m.label}</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)' }}>
                          {m.value} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>{m.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Рекомендации */}
                  <div style={{
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    borderRadius: '10px', padding: '0.9rem',
                  }}>
                    <div style={{ color: cfg.color, fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem' }}>📋 Рекомендации</div>
                    {report.recommendations.map((rec, i) => (
                      <div key={i} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: '3px' }}>{rec}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Блок 2: Активные угрозы ── */}
              {report.active_threats.length > 0 ? (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#ef4444', fontSize: '1rem', fontWeight: 700 }}>
                    ⚠️ Превышения норм ВОЗ ({report.active_threats.length})
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.9rem' }}>
                    {report.active_threats.map(t => <ThreatCard key={t.substance_key} threat={t} />)}
                  </div>
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>✅</span>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>Все измеренные вещества в пределах нормы ВОЗ</span>
                </div>
              )}

              {/* ── Блок 3: Химические реакции ── */}
              {report.active_reactions.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#f59e0b', fontSize: '1rem', fontWeight: 700 }}>
                    ⚗️ Активные химические реакции ({report.active_reactions.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {report.active_reactions.map(r => <ReactionCard key={r.id} reaction={r} />)}
                  </div>
                </div>
              )}

              {/* ── Блок 4: Справочник всех веществ (раскрываемый) ── */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <button
                  onClick={() => setShowRef(!showRef)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', width: '100%',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '0.95rem', padding: 0,
                  }}
                >
                  <span>🧪 Справочник опасных веществ</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>{showRef ? '▲ Скрыть' : '▼ Показать'}</span>
                </button>

                {showRef && (
                  <div style={{ marginTop: '1.2rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {['', 'Вещество', 'Полное название', 'Норма ВОЗ', 'Органы-мишени', 'Канцероген'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.5px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.substances_reference.map((s, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '8px 12px', fontSize: '1.1rem' }}>{s.icon}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>{s.name}</td>
                            <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.6)' }}>{s.full_name}</td>
                            <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.7)' }}>{s.who_threshold} {s.unit}</td>
                            <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.55)' }}>{s.organs.join(', ')}</td>
                            <td style={{ padding: '8px 12px' }}>
                              {s.is_carcinogen
                                ? <span style={{ color: '#a855f7', fontWeight: 700 }}>☢️ Да</span>
                                : <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {!loading && !report && !error && (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              Выберите регион для анализа
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HazardPage;
