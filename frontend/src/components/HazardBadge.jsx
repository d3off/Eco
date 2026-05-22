import React from 'react';

const LEVEL_CONFIG = {
  LOW:    { label: 'Низкая',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)',   icon: '🟢' },
  MEDIUM: { label: 'Средняя', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  icon: '🟡' },
  HIGH:   { label: 'Высокая', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',   icon: '🔴' },
};

const HazardBadge = ({ level = 'LOW', showLabel = true, size = 'md' }) => {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.LOW;

  const padding = size === 'sm' ? '2px 8px' : '4px 12px';
  const fontSize = size === 'sm' ? '0.72rem' : '0.82rem';

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '5px',
      padding,
      borderRadius: '20px',
      background:   cfg.bg,
      border:       `1px solid ${cfg.border}`,
      color:        cfg.color,
      fontWeight:   700,
      fontSize,
      letterSpacing: '0.5px',
      whiteSpace:   'nowrap',
    }}>
      {cfg.icon}
      {showLabel && cfg.label}
    </span>
  );
};

export default HazardBadge;
