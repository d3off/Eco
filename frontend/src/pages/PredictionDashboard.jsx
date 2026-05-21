import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceArea, ReferenceLine
} from 'recharts';
import { BrainCircuit, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAppData, generateTimeSeries, generateForecast } from '../context/AppDataContext';

const PredictionDashboard = () => {
  const { factories, selectedFactory, selectFactory } = useAppData();
  const [mode, setMode] = useState('co2'); // co2 | no2

  const series = useMemo(() => generateTimeSeries(selectedFactory, 24), [selectedFactory]);
  const forecast = useMemo(() => generateForecast(series, 8), [series]);

  // Объединяем историю и прогноз для графика
  const chartData = useMemo(() => {
    const hist = series.slice(-16).map(p => ({
      label: p.label, co2: p.co2, no2: p.no2, isForecast: false
    }));
    const fcast = forecast.map(p => ({
      label: p.label, co2_forecast: p.co2, no2_forecast: p.no2, isForecast: true
    }));
    // Точка соединения
    const last = hist[hist.length - 1];
    if (fcast.length > 0) {
      fcast[0].co2_forecast = last.co2;
      fcast[0].no2_forecast = last.no2;
    }
    return [...hist, ...fcast];
  }, [series, forecast]);

  const forecastStart = chartData.findIndex(p => p.isForecast);
  const forecastStartLabel = forecastStart >= 0 ? chartData[forecastStart].label : null;
  const forecastEndLabel   = chartData[chartData.length - 1]?.label;

  const lastReal = series[series.length - 1];
  const co2Trend = lastReal.co2 - series[series.length - 4]?.co2;
  const maxForecastCO2 = Math.max(...forecast.map(f => f.co2));

  // Анализ угроз
  const threats = useMemo(() => {
    const result = [];
    if (maxForecastCO2 > 490) result.push({ icon:'🔴', text:`CO₂ ning kritik darajasi (${maxForecastCO2} ppm) kelgusi 8 soat ichida kutilmoqda.`, color:'var(--danger)' });
    else if (maxForecastCO2 > 450) result.push({ icon:'🟡', text:`CO₂ ning yuqori darajasi (${maxForecastCO2} ppm) prognoz qilinmoqda.`, color:'var(--warning)' });
    else result.push({ icon:'🟢', text:`CO₂ ruxsat etilgan me'yorda qolmoqda (maks. ${maxForecastCO2} ppm).`, color:'var(--success)' });

    if (selectedFactory.gases.SO2 > 100) result.push({ icon:'🔴', text:`SO₂ = ${selectedFactory.gases.SO2} мкг/м³ — me'yordan ${(selectedFactory.gases.SO2/20).toFixed(1)} marta yuqori.`, color:'var(--danger)' });
    if (selectedFactory.gases.NO2 > 40)  result.push({ icon:'🟡', text:`NO₂ = ${selectedFactory.gases.NO2} мкг/м³ — JSST me'yoridan yuqori (40).`, color:'var(--warning)' });
    if (co2Trend > 5)  result.push({ icon:'📈', text:`CO₂ o'smoqda — so'nggi 3 soat ichida +${co2Trend.toFixed(1)} ppm.`, color:'#F87171' });
    if (co2Trend < -5) result.push({ icon:'📉', text:`CO₂ pasaymoqda — so'nggi 3 soat ichida ${co2Trend.toFixed(1)} ppm.`, color:'var(--success)' });

    return result;
  }, [selectedFactory, maxForecastCO2, co2Trend]);

  const cfg = selectedFactory.status === 'danger' ? { color:'#EF4444', label:'🔴 XAVFLI' }
            : selectedFactory.status === 'medium' ? { color:'#F59E0B', label:'🟡 DIQQAT' }
            :                                       { color:'#10B981', label:'🟢 ME\'YORDA' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Заголовок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--accent-cyan)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BrainCircuit size={24} /> AI Prognozlar Markazi
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0' }}>Zavodlarning haqiqiy ma'lumotlari asosida prognoz qilish</p>
        </div>

        {/* Выбор завода */}
        <select
          value={selectedFactory.id}
          onChange={e => selectFactory(factories.find(f => f.id === Number(e.target.value)))}
          style={{ background:'var(--bg-panel)', color:'var(--accent-cyan)', border:'1px solid var(--accent-cyan)', padding:'0.5rem 1rem', borderRadius:'8px', fontSize:'0.9rem', outline:'none' }}
        >
          {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {/* Карточки текущего состояния */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label:'Holat', value: cfg.label, sub:'', color: cfg.color },
          { label:'AQI', value: selectedFactory.aqi, sub:'indeks', color: cfg.color },
          { label:'CO₂ hozir', value:`${lastReal.co2} ppm`, sub: co2Trend > 0 ? `▲ +${co2Trend.toFixed(1)}` : `▼ ${co2Trend.toFixed(1)}`, color: lastReal.co2 > 450 ? '#EF4444' : '#10B981' },
          { label:'CO₂ prognozi', value:`${maxForecastCO2} ppm`, sub:'8 soat ichida maks.', color: maxForecastCO2 > 490 ? '#EF4444' : maxForecastCO2 > 450 ? '#F59E0B' : '#10B981' },
          { label:'NO₂', value:`${selectedFactory.gases.NO2}`, sub:'мкг/м³', color: selectedFactory.gases.NO2 > 40 ? '#EF4444' : '#10B981' },
          { label:'SO₂', value:`${selectedFactory.gases.SO2}`, sub:'мкг/м³', color: selectedFactory.gases.SO2 > 20 ? '#EF4444' : '#10B981' },
        ].map(c => (
          <div key={c.label} className="glass-panel" style={{ borderTop: `3px solid ${c.color}`, textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{c.label}</div>
            <div style={{ color: c.color, fontWeight: 'bold', fontSize: '1.25rem', margin: '0.3rem 0' }}>{c.value}</div>
            {c.sub && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* График */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ height: 420, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem' }}>
              📈 CO₂ chiqindilari tarixi + prognoz (8 soat)
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 20, height: 2, background: 'var(--accent-cyan)', display: 'inline-block' }}></span> Tarix
              </span>
              <span style={{ fontSize: '0.72rem', color: '#A78BFA', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 20, height: 2, background: '#A78BFA', display: 'inline-block', borderTop: '2px dashed #A78BFA' }}></span> Prognoz
              </span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10} interval={3} />
                <YAxis stroke="var(--text-muted)" fontSize={10} domain={['auto','auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor:'rgba(7,11,20,0.95)', borderColor:'rgba(0,240,255,0.3)', borderRadius:8, fontSize: '0.8rem' }}
                  labelStyle={{ color:'var(--accent-cyan)', fontWeight:'bold' }}
                />

                {/* Зоны риска */}
                <ReferenceArea y1={490} y2={600} fill="rgba(239,68,68,0.1)" strokeOpacity={0} label={{ value:'⚠ Inqiroz', fill:'#EF4444', fontSize:10, position:'insideTopRight' }} />
                <ReferenceArea y1={450} y2={490} fill="rgba(245,158,11,0.08)" strokeOpacity={0} />
                <ReferenceArea y1={350} y2={450} fill="rgba(16,185,129,0.04)" strokeOpacity={0} />

                {/* Линия нормы */}
                <ReferenceLine y={420} stroke="#10B981" strokeDasharray="4 3" strokeOpacity={0.5}
                  label={{ value:'JSST me\'yori', fill:'#10B981', fontSize:9, position:'right' }} />

                {/* Прогнозное окно */}
                {forecastStartLabel && <ReferenceArea x1={forecastStartLabel} x2={forecastEndLabel} fill="rgba(167,139,250,0.06)" strokeOpacity={0} />}

                {/* Линии */}
                <Line type="monotone" dataKey="co2" name="CO₂ (ppm)" stroke="var(--accent-cyan)" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="co2_forecast" name="CO₂ prognozi" stroke="#A78BFA" strokeWidth={2.5} strokeDasharray="7 4" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Легенда зон */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.7rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { color:'rgba(239,68,68,0.4)', text:'CO₂ > 490 (inqiroz)' },
              { color:'rgba(245,158,11,0.35)', text:'CO₂ 450–490 (xavf)' },
              { color:'rgba(16,185,129,0.3)', text:'Me\'yor (< 450)' },
              { color:'rgba(167,139,250,0.2)', text:'Prognoz' },
            ].map(z => (
              <div key={z.text} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.7rem', color:'var(--text-muted)' }}>
                <div style={{ width:14, height:14, background:z.color, borderRadius:3 }}></div>{z.text}
              </div>
            ))}
          </div>
        </div>

        {/* Анализ угроз */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ flex: 1, borderTop: '3px solid var(--warning)' }}>
            <h3 style={{ margin: '0 0 1rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <AlertTriangle size={18} /> Xavflarni tahlil qilish (AI)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {threats.map((t, i) => (
                <div key={i} style={{
                  padding: '0.8rem',
                  background: `${t.color}11`,
                  borderLeft: `3px solid ${t.color}`,
                  borderRadius: 6,
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                }}>
                  {t.text}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel">
            <h4 style={{ margin: '0 0 0.8rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Boshqa zavodlar</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {factories.filter(f => f.id !== selectedFactory.id)
               .sort((a, b) => b.aqi - a.aqi)
               .slice(0, 5)
               .map(f => {
                 const c = f.status==='danger'?'#EF4444':f.status==='medium'?'#F59E0B':'#10B981';
                 return (
                   <div key={f.id} onClick={() => selectFactory(f)} style={{
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                     padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
                     background: 'rgba(255,255,255,0.03)', transition: 'background 0.15s',
                   }}>
                     <span style={{ color: 'var(--text-main)', fontSize: '0.78rem' }}>{f.shortName}</span>
                     <span style={{ color: c, fontWeight: 'bold', fontSize: '0.82rem' }}>AQI {f.aqi}</span>
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

export default PredictionDashboard;
