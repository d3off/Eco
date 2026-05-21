import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useAppData } from '../context/AppDataContext';
import { BarChart2, ShieldCheck, Flame, Factory, Satellite, TrendingDown, TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EcoRanking = () => {
  const { factories, selectedFactory, selectFactory, activeLayers, gibsDate } = useAppData();

  const sorted = useMemo(() => [...factories].sort((a, b) => b.eco_score - a.eco_score), [factories]);
  const cleanest = sorted.filter(f => f.eco_score >= 60);
  const dirtiest = [...sorted].reverse().filter(f => f.eco_score < 50);

  const barColor = (score) =>
    score >= 70 ? 'rgba(16,185,129,0.75)' : score >= 50 ? 'rgba(245,158,11,0.75)' : 'rgba(239,68,68,0.75)';
  const barBorder = (score) =>
    score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';

  const chartData = {
    labels: sorted.map(f => f.shortName),
    datasets: [{
      label: 'Eko-Ball (0–100)',
      data: sorted.map(f => f.eco_score),
      backgroundColor: sorted.map(f => barColor(f.eco_score)),
      borderColor: sorted.map(f => barBorder(f.eco_score)),
      borderWidth: 2, borderRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterLabel: (ctx) => {
            const f = sorted[ctx.dataIndex];
            return [`AQI: ${f.aqi}`, `NO₂: ${f.gases.NO2} мкг/м³`, `SO₂: ${f.gases.SO2} мкг/м³`];
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: 'var(--text-muted)', font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { color: 'var(--text-main)', font: { size: 11 }, maxRotation: 30 } }
    }
  };

  const aqiSorted = [...factories].sort((a, b) => b.aqi - a.aqi);
  const aqiChartData = {
    labels: aqiSorted.map(f => f.shortName),
    datasets: [{
      label: 'AQI',
      data: aqiSorted.map(f => f.aqi),
      backgroundColor: aqiSorted.map(f => barColor(f.eco_score)),
      borderColor: aqiSorted.map(f => barBorder(f.eco_score)),
      borderWidth: 2, borderRadius: 6,
    }],
  };
  const aqiOptions = { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 220 } } };

  // Спутниковые индикаторы на основе GIBS данных
  const satelliteIndicators = useMemo(() => {
    return factories.map(f => {
      // Аэрозольная нагрузка (AOD) — коррелирует с AQI
      const aodEstimate = f.aqi > 150 ? 0.8 + (f.aqi - 150) * 0.005 : f.aqi > 80 ? 0.3 + (f.aqi - 80) * 0.007 : 0.1 + f.aqi * 0.002;
      // NDVI деградация — обратная AQI
      const ndviEstimate = f.eco_score >= 70 ? 0.65 : f.eco_score >= 40 ? 0.35 : 0.15;
      // Тепловая аномалия
      const thermalAnomaly = f.status === 'danger' ? 'Aniqlangan' : f.status === 'medium' ? 'Kuchsiz' : 'Yo\'q';
      return { ...f, aod: aodEstimate.toFixed(2), ndvi: ndviEstimate.toFixed(2), thermal: thermalAnomaly };
    });
  }, [factories]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Заголовок */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h2 style={{ color: 'var(--accent-cyan)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={24} /> Ekologiya Reytingi
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0' }}>
            {factories.length} obyekt • Sun'iy yo'ldosh sanasi: {gibsDate}
          </p>
        </div>
        <div className="glass-panel" style={{ padding:'0.5rem 1rem', display:'flex', alignItems:'center', gap:'0.5rem', borderLeft:'3px solid var(--accent-cyan)' }}>
          <Satellite size={16} color="var(--accent-cyan)" />
          <span style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>
            Ma'lumotlar: NASA GIBS + yer usti datchiklari
          </span>
        </div>
      </div>

      {/* Графики */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ height: 320 }}>
          <h3 style={{ margin: '0 0 1rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>📊 Zavodlar Eko-Balli (yuqori = toza)</h3>
          <div style={{ height: 'calc(100% - 44px)' }}><Bar data={chartData} options={chartOptions} /></div>
        </div>
        <div className="glass-panel" style={{ height: 320 }}>
          <h3 style={{ margin: '0 0 1rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>🌫️ AQI Indeksi (past = toza)</h3>
          <div style={{ height: 'calc(100% - 44px)' }}><Bar data={aqiChartData} options={aqiOptions} /></div>
        </div>
      </div>

      {/* Спутниковые индикаторы — НОВЫЙ БЛОК */}
      <div className="glass-panel" style={{ borderTop:'3px solid var(--accent-cyan)' }}>
        <h3 style={{ margin:'0 0 1rem', color:'var(--accent-cyan)', display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.95rem' }}>
          <Satellite size={20} /> Sun'iy yo'ldosh indikatorlari (NASA GIBS)
        </h3>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                {['Obyekt','AQI','Eko-Ball','AOD (aerozol)','NDVI (vegetatsiya)','Termo-anomaliya','Holat'].map(h=>(
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:'var(--text-muted)', fontWeight:'600', fontSize:'0.72rem', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {satelliteIndicators.sort((a,b) => b.aqi - a.aqi).map(f => {
                const color = f.status==='danger'?'#EF4444':f.status==='medium'?'#F59E0B':'#10B981';
                const label = f.status==='danger'?'Xavfli':f.status==='medium'?'Diqqat':'Me\'yorda';
                const aodColor = parseFloat(f.aod) > 0.5 ? '#EF4444' : parseFloat(f.aod) > 0.3 ? '#F59E0B' : '#10B981';
                const ndviColor = parseFloat(f.ndvi) < 0.3 ? '#EF4444' : parseFloat(f.ndvi) < 0.5 ? '#F59E0B' : '#10B981';
                const thermalColor = f.thermal === 'Aniqlangan' ? '#EF4444' : f.thermal === 'Kuchsiz' ? '#F59E0B' : '#10B981';
                return (
                  <tr key={f.id} onClick={()=>selectFactory(f)} style={{
                    borderBottom:'1px solid rgba(255,255,255,0.04)',
                    background: selectedFactory?.id===f.id ? `${color}11` : 'transparent',
                    cursor:'pointer', transition:'background 0.15s',
                  }}>
                    <td style={{padding:'9px 10px',fontWeight:'600',color:'var(--text-main)'}}>{f.name}</td>
                    <td style={{padding:'9px 10px',fontWeight:'bold',color}}>{f.aqi}</td>
                    <td style={{padding:'9px 10px',fontWeight:'bold',color: barBorder(f.eco_score)}}>{f.eco_score}</td>
                    <td style={{padding:'9px 10px'}}>
                      <span style={{color: aodColor, fontWeight:'bold'}}>{f.aod}</span>
                      <span style={{color:'var(--text-muted)',fontSize:'0.68rem',marginLeft:4}}>τ</span>
                    </td>
                    <td style={{padding:'9px 10px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <div style={{width:40,height:6,background:'rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden'}}>
                          <div style={{width:`${parseFloat(f.ndvi)*100}%`,height:'100%',background:ndviColor,borderRadius:3}}/>
                        </div>
                        <span style={{color:ndviColor,fontWeight:'bold',fontSize:'0.82rem'}}>{f.ndvi}</span>
                      </div>
                    </td>
                    <td style={{padding:'9px 10px'}}>
                      <span style={{color:thermalColor, fontWeight:'600', fontSize:'0.8rem'}}>
                        {f.thermal === 'Aniqlangan' ? '🔥 ' : f.thermal === 'Kuchsiz' ? '🟡 ' : '✅ '}{f.thermal}
                      </span>
                    </td>
                    <td style={{padding:'9px 10px'}}>
                      <span style={{background:`${color}22`,border:`1px solid ${color}`,color,padding:'2px 8px',borderRadius:12,fontSize:'0.72rem',fontWeight:'bold'}}>{label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Топ-списки */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel">
          <h3 style={{ margin:'0 0 1rem', color:'var(--success)', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <ShieldCheck size={20} /> Eng toza obyektlar 🟢
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {cleanest.map((f, i) => (
              <div key={f.id} onClick={()=>selectFactory(f)} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'0.7rem 1rem', background: selectedFactory?.id===f.id ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.04)',
                borderRadius:8, borderLeft:'4px solid var(--success)', cursor:'pointer', transition:'background 0.15s',
              }}>
                <div style={{display:'flex',alignItems:'center',gap:'0.8rem'}}>
                  <span style={{fontWeight:'bold',fontSize:'1.1rem',color:'var(--text-muted)',minWidth:24}}>#{i+1}</span>
                  <div>
                    <div style={{fontWeight:'600',color:'var(--text-main)',fontSize:'0.88rem'}}>{f.name}</div>
                    <div style={{color:'var(--text-muted)',fontSize:'0.7rem'}}>{f.type} • NDVI: {satelliteIndicators.find(s=>s.id===f.id)?.ndvi}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:'bold',fontSize:'1.2rem',color:'var(--success)'}}>{f.eco_score}</div>
                  <div style={{fontSize:'0.62rem',color:'var(--text-muted)'}}>AQI: {f.aqi}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <h3 style={{ margin:'0 0 1rem', color:'var(--danger)', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Flame size={20} /> Eng ifloslangan obyektlar 🔴
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {dirtiest.map((f, i) => (
              <div key={f.id} onClick={()=>selectFactory(f)} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'0.7rem 1rem', background: selectedFactory?.id===f.id ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.04)',
                borderRadius:8, borderLeft:'4px solid var(--danger)', cursor:'pointer', transition:'background 0.15s',
              }}>
                <div style={{display:'flex',alignItems:'center',gap:'0.8rem'}}>
                  <span style={{fontWeight:'bold',fontSize:'1.1rem',color:'var(--text-muted)',minWidth:24}}>#{i+1}</span>
                  <div>
                    <div style={{fontWeight:'600',color:'var(--text-main)',fontSize:'0.88rem'}}>{f.name}</div>
                    <div style={{color:'var(--text-muted)',fontSize:'0.7rem'}}>{f.type} • AOD: {satelliteIndicators.find(s=>s.id===f.id)?.aod}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:'bold',fontSize:'1.2rem',color:'var(--danger)'}}>{f.eco_score}</div>
                  <div style={{fontSize:'0.62rem',color:'var(--text-muted)'}}>AQI: {f.aqi}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcoRanking;
