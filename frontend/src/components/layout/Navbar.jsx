import React from 'react';
import { NavLink } from 'react-router-dom';
import { Globe, BarChart2, BrainCircuit, Activity, Eye, Rocket, Command, FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <nav className="glass-panel" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        marginBottom: '2rem',
        borderRadius: '0 0 16px 16px',
        borderTop: 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
            background: 'rgba(0, 240, 255, 0.1)', 
            padding: '0.8rem', 
            borderRadius: '50%',
            color: 'var(--accent-cyan)'
        }}>
           <Rocket size={28} />
        </div>
        <div>
          <h1 style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '1.5rem', letterSpacing: '1px' }}>
            EcoOrbit
          </h1>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Qo'mondonlik Markazi
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <NavLink to="/" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <Globe size={18} />
          {t('nav.global_map', 'Global Xarita')}
        </NavLink>
        <NavLink to="/ranking" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <BarChart2 size={18} />
          {t('nav.eco_ranking', 'Ekologiya Reytingi')}
        </NavLink>
        <NavLink to="/prediction" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <BrainCircuit size={18} />
          {t('nav.prediction', 'AI Prognozlari')}
        </NavLink>
        <NavLink to="/promonitoring" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <Command size={18} />
          {t('nav.pro_monitoring', 'Pro Monitoring')}
        </NavLink>
        <NavLink to="/hazard" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <FlaskConical size={18} />
          {t('nav.chemical_hazard', 'Chemical Hazard')}
        </NavLink>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <select 
          onChange={handleLanguageChange} 
          value={i18n.language}
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--accent-cyan)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            padding: '5px 10px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="uz">🇺🇿 O'zbekcha</option>
          <option value="ru">🇷🇺 Русский</option>
        </select>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ textAlign: 'right' }}>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Holat</div>
             <div style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 'bold' }}>{t('status.system_active', 'TIZIM FAOL')}</div>
          </div>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             <div style={{ width: '12px', height: '12px', background: 'var(--success)', borderRadius: '50%' }}></div>
             <div style={{ color: 'var(--success)' }} className="map-ripple"></div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
