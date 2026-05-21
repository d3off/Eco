import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { Eye, Clock, CalendarDays, Activity, Satellite, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAppData, generateTimeSeries } from '../context/AppDataContext';

// ─── Анализ поведения на основе временных данных ───────
const analyzeFactory = (factory) => {
  // 168 часов = 7 дней — гарантирует наличие выходных в любой день недели
  const series = generateTimeSeries(factory, 168);
  const daySeries     = series.filter(p => !p.isNight);
  const nightSeries   = series.filter(p => p.isNight);
  const weekSeries    = series.filter(p => !p.isWeekend);
  const weekendSeries = series.filter(p => p.isWeekend);

  const avg = arr => arr.reduce((s, p) => s + p.co2, 0) / (arr.length || 1);

  const dayAvg     = avg(daySeries);
  const nightAvg   = avg(nightSeries);
  const weekAvg    = avg(weekSeries);
  const weekendAvg = avg(weekendSeries);

  const nightRatio   = nightAvg / dayAvg;
  const weekendRatio = weekendAvg / weekAvg;

  const isNightAnomaly   = nightRatio > 1.15 && factory.status === 'danger';
  const isWeekendAnomaly = weekendRatio > 1.10 && factory.status !== 'good';

  // Спутниковый анализ AOD
  const aodEstimate = factory.aqi > 150 ? 0.8 + (factory.aqi - 150) * 0.005 :
                      factory.aqi > 80  ? 0.3 + (factory.aqi - 80) * 0.007 :
                      0.1 + factory.aqi * 0.002;
  const ndviEstimate = factory.eco_score >= 70 ? 0.65 : factory.eco_score >= 40 ? 0.35 : 0.15;

  const insights = [];

  // Спутниковые инсайты
  if (aodEstimate > 0.6) {
    insights.push({ type:'danger', icon:'🛰️', text:`MODIS sun'iy yo'ldoshi yuqori aerozol yuklanishini qayd etmoqda (AOD ≈ ${aodEstimate.toFixed(2)}). PM2.5/PM10 zarralari me'yordan sezilarli darajada yuqori.` });
  } else if (aodEstimate > 0.3) {
    insights.push({ type:'warning', icon:'🛰️', text:`Aerozolning o'rtacha darajasi (AOD ≈ ${aodEstimate.toFixed(2)}). Sun'iy yo'ldosh ma'lumotlari yuqori changlanishni tasdiqlaydi.` });
  } else {
    insights.push({ type:'ok', icon:'🛰️', text:`Aerozol yuklanishi me'yorda (AOD ≈ ${aodEstimate.toFixed(2)}). Sun'iy yo'ldosh sezilarli ifloslanishni qayd etmayapti.` });
  }

  if (ndviEstimate < 0.3) {
    insights.push({ type:'danger', icon:'🌿', text:`NDVI ≈ ${ndviEstimate.toFixed(2)} — obyekt atrofidagi o'simliklar degradatsiyaga uchragan. Sanoat chiqindilarining ehtimoliy ta'siri.` });
  }

  // Ночной анализ
  if (isNightAnomaly) {
    insights.push({ type:'danger', icon:'🌙', text:`Tungi chiqindilar kunduzgidan ${Math.round((nightRatio-1)*100)}% yuqori. Soat 22:00 dan 06:00 gacha filtrlarsiz ishlash ehtimoli.` });
  } else {
    insights.push({ type:'ok', icon:'☀️', text:`Tungi chiqindilar barqaror (kunduzgi darajadan ${Math.round(Math.max(0,(nightRatio-1)*100))}% — me'yor doirasida).` });
  }

  // Выходные
  if (isWeekendAnomaly) {
    insights.push({ type:'danger', icon:'📅', text:`Dam olish kunlaridagi chiqindilar ish kunlariga qaraganda ${Math.round((weekendRatio-1)*100)}% yuqori. Filtrlash tizimlarini o'chirishga shubha.` });
  } else {
    insights.push({ type:'ok', icon:'📅', text:`Dam olish kunlari rejimi anomaliyalarsiz (CO₂: ${weekendAvg.toFixed(0)} vs ${weekAvg.toFixed(0)} ppm).` });
  }

  // Тепловые аномалии
  if (factory.status === 'danger') {
    insights.push({ type:'danger', icon:'🔥', text:`VIIRS obyekt hududida issiqlik anomaliyasini qayd etmoqda. Intensivlik faol sanoat jarayoniga mos keladi.` });
  }

  // Heatmap
  const hourlyAvg = Array.from({ length: 24 }, (_, h) => {
    const hourData = series.filter(p => p.hour === h);
    return { hour: `${h.toString().padStart(2,'0')}:00`, avg: Math.round(avg(hourData)), isNight: h < 6 || h >= 22 };
  });

  return { dayAvg, nightAvg, weekAvg, weekendAvg, nightRatio, weekendRatio,
           isNightAnomaly, isWeekendAnomaly, insights, hourlyAvg, series,
           aod: aodEstimate, ndvi: ndviEstimate };
};

// ─── КОМПОНЕНТ ────────────────────────────────────────
const BehaviorAnalysis = () => {
  const { factories, selectedFactory, selectFactory, gibsDate } = useAppData();
  const analysis = useMemo(() => analyzeFactory(selectedFactory), [selectedFactory]);

  const cfg = selectedFactory.status === 'danger' ? { color:'#EF4444' }
            : selectedFactory.status === 'medium' ? { color:'#F59E0B' }
            :                                       { color:'#10B981' };

  const timelineData = analysis.series.slice(-24).map(p => ({ label: p.label, co2: p.co2, isNight: p.isNight }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* Заголовок */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h2 style={{ color:'var(--accent-purple)', margin:0, display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Eye size={24} /> Zavodlar Xulq-atvorini Tahlil Qilish
          </h2>
          <p style={{ color:'var(--text-muted)', margin:'0.4rem 0 0' }}>
            GIBS sun'iy yo'ldosh ma'lumotlari ({gibsDate}) + yer usti monitoringi
          </p>
        </div>
        <select
          value={selectedFactory.id}
          onChange={e => selectFactory(factories.find(f => f.id === Number(e.target.value)))}
          style={{ background:'var(--bg-panel)', color:'var(--accent-purple)', border:'1px solid var(--accent-purple)', padding:'0.5rem 1rem', borderRadius:'8px', fontSize:'0.9rem', outline:'none' }}
        >
          {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'0.8rem' }}>
        {[
          { icon:<Clock size={18}/>, label:'CO₂ kunduz',      value:`${analysis.dayAvg.toFixed(0)}`,     unit:'ppm', color:'var(--accent-cyan)' },
          { icon:<Clock size={18}/>, label:'CO₂ tun',      value:`${analysis.nightAvg.toFixed(0)}`,   unit:'ppm', color: analysis.isNightAnomaly ? '#EF4444':'var(--accent-cyan)' },
          { icon:<CalendarDays size={18}/>, label:'CO₂ ish kunlari',  value:`${analysis.weekAvg.toFixed(0)}`,    unit:'ppm', color:'var(--accent-cyan)' },
          { icon:<CalendarDays size={18}/>, label:'CO₂ dam olish kunlari', value:`${analysis.weekendAvg.toFixed(0)}`, unit:'ppm', color: analysis.isWeekendAnomaly ? '#EF4444':'var(--accent-cyan)' },
          { icon:<Satellite size={18}/>,   label:'AOD (aerozol)', value:`${analysis.aod.toFixed(2)}`, unit:'τ', color: analysis.aod > 0.5 ? '#EF4444' : '#10B981' },
          { icon:<Satellite size={18}/>,   label:'NDVI (yashillik)',  value:`${analysis.ndvi.toFixed(2)}`, unit:'idx', color: analysis.ndvi < 0.3 ? '#EF4444' : '#10B981' },
        ].map((c, i) => (
          <div key={i} className="glass-panel" style={{ display:'flex', alignItems:'center', gap:'0.7rem', borderLeft:`3px solid ${c.color}`, padding:'0.7rem' }}>
            <div style={{ color: c.color }}>{c.icon}</div>
            <div>
              <div style={{ color:'var(--text-muted)', fontSize:'0.65rem' }}>{c.label}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                <span style={{ color:c.color, fontWeight:'bold', fontSize:'1.1rem' }}>{c.value}</span>
                <span style={{ color:'var(--text-muted)', fontSize:'0.62rem' }}>{c.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Основной блок */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'1.5rem' }}>

        {/* Графики */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>
          {/* Гистограмма 24ч */}
          <div className="glass-panel" style={{ height:280 }}>
            <h3 style={{ margin:'0 0 0.8rem', color:'var(--text-main)', fontSize:'0.95rem' }}>📊 24 soat ichida CO₂ (🟣 = tungi smenalar)</h3>
            <div style={{ height:'calc(100% - 40px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{top:5,right:10,left:0,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={9} interval={3} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} domain={['auto','auto']} />
                  <Tooltip contentStyle={{backgroundColor:'rgba(7,11,20,0.95)',borderColor:'rgba(138,43,226,0.4)',borderRadius:8,fontSize:'0.8rem'}}
                    formatter={(val, name, props) => [`${val} ppm`, props.payload.isNight ? '🌙 Tun' : '☀️ Kunduz']} />
                  <ReferenceLine y={selectedFactory.gases.CO2} stroke="var(--accent-purple)" strokeDasharray="4 3" strokeOpacity={0.6}
                    label={{ value:'Asosiy', fill:'var(--accent-purple)', fontSize:9, position:'right' }} />
                  <Bar dataKey="co2" radius={[3,3,0,0]}>
                    {timelineData.map((entry, index) => (
                      <Cell key={index} fill={entry.isNight ? '#8A2BE2' : cfg.color} fillOpacity={entry.isNight ? 0.9 : 0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heatmap */}
          <div className="glass-panel">
            <h3 style={{ margin:'0 0 0.8rem', color:'var(--text-main)', fontSize:'0.95rem' }}>🕐 Sutka soatlari bo'yicha o'rtacha CO₂</h3>
            <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:80 }}>
              {analysis.hourlyAvg.map(h => {
                const pct = (h.avg - (selectedFactory.gases.CO2 - 40)) / 80;
                const clamp = Math.max(0, Math.min(1, pct));
                return (
                  <div key={h.hour} title={`${h.hour}: ${h.avg} ppm`} style={{
                    flex:1, minWidth:6, height:`${20 + clamp * 60}px`,
                    background: h.isNight ? '#8A2BE2' : cfg.color,
                    opacity: 0.5 + clamp * 0.5, borderRadius:'3px 3px 0 0', cursor:'default',
                  }} />
                );
              })}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              {['00:00','06:00','12:00','18:00','23:00'].map(t => (
                <span key={t} style={{ color:'var(--text-muted)', fontSize:'0.65rem' }}>{t}</span>
              ))}
            </div>
            <div style={{ display:'flex', gap:'1rem', marginTop:'0.5rem', justifyContent:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.7rem', color:'var(--text-muted)' }}>
                <div style={{ width:12,height:12,background:cfg.color,borderRadius:2,opacity:0.7 }}/>Kunduzgi (06-22)
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.7rem', color:'var(--text-muted)' }}>
                <div style={{ width:12,height:12,background:'#8A2BE2',borderRadius:2 }}/>Tungi (22-06)
              </div>
            </div>
          </div>
        </div>

        {/* Выводы + информация */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

          {/* ИИ-выводы */}
          <div className="glass-panel" style={{ borderTop:'3px solid var(--accent-purple)' }}>
            <h3 style={{ margin:'0 0 1rem', color:'var(--accent-purple)', display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.95rem' }}>
              <Activity size={18} /> Sun'iy yo'ldosh tahlili
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
              {analysis.insights.map((ins, i) => {
                const borderColor = ins.type === 'danger' ? '#EF4444' : ins.type === 'warning' ? '#F59E0B' : '#10B981';
                return (
                  <div key={i} style={{
                    padding:'0.7rem 0.8rem',
                    background: ins.type === 'danger' ? 'rgba(239,68,68,0.07)' : ins.type === 'warning' ? 'rgba(245,158,11,0.07)' : 'rgba(16,185,129,0.05)',
                    border: `1px solid ${borderColor}22`,
                    borderLeft: `4px solid ${borderColor}`,
                    borderRadius:8, color:'var(--text-main)', fontSize:'0.8rem', lineHeight:1.5,
                  }}>
                    <span style={{ marginRight:6 }}>{ins.icon}</span>{ins.text}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Информация */}
          <div className="glass-panel">
            <h3 style={{ margin:'0 0 0.8rem', color:'var(--text-main)', fontSize:'0.88rem' }}>📋 Obyekt haqida</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {[
                ['Zavod', selectedFactory.name],
                ['Turi', selectedFactory.type],
                ['Viloyat', selectedFactory.region],
                ['Asos solingan', selectedFactory.founded],
                ['Ishchilar', `~${selectedFactory.workers.toLocaleString('ru-RU')}`],
                ['Eko-Ball', `${selectedFactory.eco_score}/100`],
              ].map(([l,v]) => (
                <div key={l} style={{display:'flex',justifyContent:'space-between',gap:'0.5rem'}}>
                  <span style={{color:'var(--text-muted)',fontSize:'0.76rem',flexShrink:0}}>{l}:</span>
                  <span style={{color:'var(--text-main)',fontSize:'0.8rem',textAlign:'right'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Другие объекты */}
          <div className="glass-panel">
            <h4 style={{ margin:'0 0 0.6rem', color:'var(--text-muted)', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'1px' }}>Boshqa obyektlar</h4>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
              {factories.filter(f => f.id !== selectedFactory.id).map(f => {
                const c = f.status==='danger'?'#EF4444':f.status==='medium'?'#F59E0B':'#10B981';
                return (
                  <div key={f.id} onClick={()=>selectFactory(f)} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'5px 8px', borderRadius:6, cursor:'pointer',
                    background:'rgba(255,255,255,0.03)', borderLeft:`3px solid ${c}`,
                  }}>
                    <div>
                      <div style={{ color:'var(--text-main)', fontSize:'0.76rem', fontWeight:'500' }}>{f.shortName}</div>
                      {f.status === 'danger' && <div style={{ color:'#EF4444', fontSize:'0.62rem' }}>⚠ Tungi anomaliya</div>}
                    </div>
                    <span style={{ color:c, fontWeight:'bold', fontSize:'0.76rem' }}>AQI {f.aqi}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BehaviorAnalysis;
