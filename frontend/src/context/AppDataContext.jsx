import React, { createContext, useContext, useState, useCallback } from 'react';

// ============================================================
// ЕДИНЫЙ ИСТОЧНИК ДАННЫХ — реальные заводы Узбекистана
// ============================================================
export const FACTORIES = [
  {
    id: 1, name: 'Olmaliq KMK', shortName: 'Olmaliq KMK',
    region: 'Olmaliq tumani, Toshkent viloyati',
    lat: 40.8490, lon: 69.6051, type: 'Kon-metallurgiya kombinati',
    status: 'danger', aqi: 187, eco_score: 18,
    gases: { NO2: 98.4, SO2: 142.7, CO: 8.3, CO2: 512 },
    description: "O'rta Osiyodagi eng yirik mis eritish zavodi. Yiliga 100 000+ tonna mis eritadi.",
    founded: 1949, workers: 14000,
  },
  {
    id: 2, name: 'Navoiy KMK', shortName: 'Navoiy KMK',
    region: 'Navoiy sh., Navoiy viloyati',
    lat: 40.1035, lon: 65.3736, type: 'Kon-metallurgiya kombinati',
    status: 'medium', aqi: 112, eco_score: 44,
    gases: { NO2: 52.1, SO2: 67.3, CO: 4.9, CO2: 448 },
    description: "MDHda eng yirik oltin ishlab chiqaruvchi. Uran rudasini qayta ishlaydi va oltin qazib oladi.",
    founded: 1958, workers: 9000,
  },
  {
    id: 3, name: 'Farg\'ona NQIZ', shortName: 'Farg\'ona NQIZ',
    region: 'Farg\'ona sh., Farg\'ona viloyati',
    lat: 40.3726, lon: 71.7974, type: 'Neftni qayta ishlash zavodi',
    status: 'danger', aqi: 163, eco_score: 25,
    gases: { NO2: 74.8, SO2: 89.2, CO: 11.4, CO2: 489 },
    description: "O'zbekistonning asosiy NQIZi. Qayta ishlash quvvati — yiliga 5 mln tonna neft.",
    founded: 1959, workers: 4500,
  },
  {
    id: 4, name: 'Toshkent IEM', shortName: 'Toshkent IEM',
    region: 'Toshkent sh., Yunusobod tumani',
    lat: 41.3523, lon: 69.3460, type: 'Issiqlik elektr markazi',
    status: 'medium', aqi: 98, eco_score: 52,
    gases: { NO2: 41.2, SO2: 55.6, CO: 5.7, CO2: 430 },
    description: 'Poytaxtning asosiy issiqlik elektr markazi. Toshkentni issiqlik va elektr energiyasi bilan ta\'minlaydi.',
    founded: 1964, workers: 2800,
  },
  {
    id: 5, name: 'Buxoro NQIZ', shortName: 'Buxoro NQIZ',
    region: 'Buxoro sh., Buxoro viloyati',
    lat: 39.7590, lon: 64.3712, type: 'Neftni qayta ishlash zavodi',
    status: 'medium', aqi: 121, eco_score: 40,
    gases: { NO2: 58.3, SO2: 72.1, CO: 6.8, CO2: 458 },
    description: "Mamlakatning ikkinchi yirik NQIZi. Buxoro viloyati konlaridan olingan neftni qayta ishlaydi.",
    founded: 1971, workers: 3200,
  },
  {
    id: 6, name: 'Angren IES', shortName: 'Angren IES',
    region: 'Angren sh., Toshkent viloyati',
    lat: 41.0133, lon: 70.1588, type: 'Ko\'mir elektr stansiyasi',
    status: 'danger', aqi: 178, eco_score: 20,
    gases: { NO2: 88.9, SO2: 135.4, CO: 9.8, CO2: 505 },
    description: 'Ko\'mir IES — O\'zbekistondagi eng iflos elektr stansiyalardan biri. Qo\'ng\'ir ko\'mirda ishlaydi.',
    founded: 1956, workers: 1800,
  },
  {
    id: 7, name: 'Samarqand Sement', shortName: 'Samarqand Sement',
    region: 'Samarqand sh., Samarqand viloyati',
    lat: 39.6782, lon: 66.9764, type: 'Sement zavodi',
    status: 'good', aqi: 64, eco_score: 72,
    gases: { NO2: 28.4, SO2: 31.7, CO: 2.9, CO2: 415 },
    description: 'Yirik sement zavodi. 2020 yildagi modernizatsiyadan so\'ng zamonaviy filtrlar o\'rnatilgan.',
    founded: 1969, workers: 1200,
  },
  {
    id: 8, name: 'Muborak GQIZ', shortName: 'Muborak GQIZ',
    region: 'Muborak sh., Qashqadaryo viloyati',
    lat: 39.2739, lon: 65.1447, type: 'Gazni qayta ishlash zavodi',
    status: 'good', aqi: 71, eco_score: 68,
    gases: { NO2: 31.5, SO2: 38.2, CO: 3.4, CO2: 420 },
    description: "Yirik GQIZ. Surxondaryo konlaridan tabiiy gaz qazib oladi.",
    founded: 1974, workers: 950,
  },
];

// ============================================================
// NASA GIBS — КОНФИГУРАЦИЯ СПУТНИКОВЫХ СЛОЁВ
// Endpoint: WMTS RESTful (EPSG:3857 — Web Mercator, совместим с Leaflet)
// Docs: https://nasa-gibs.github.io/gibs-api-docs/
// ============================================================
const GIBS_BASE = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

// Вчерашняя дата — для стабильности (GIBS может не иметь данных за сегодня)
export const getGibsDate = (daysAgo = 1) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const SATELLITE_LAYERS = [
  {
    id: 'esri_highres',
    name: 'Esri High-Res (Hybrid)',
    nameRu: 'Shaharlar va Uylar (Esri Hybrid)',
    icon: '🏙️',
    description: "Yuqori ruxsatdagi batafsil sun'iy yo'ldosh rasmlari. Shaharlarni batafsil ko'rish uchun mos keladi.",
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    format: 'jpg',
    category: 'base',
    defaultOpacity: 1.0,
  },
  {
    id: 'modis_true',
    name: 'MODIS True Color',
    nameRu: 'Haqiqiy ranglar (MODIS)',
    icon: '🛰️',
    description: 'MODIS Terra suratlari — Yerni koinotdan haqiqiy ko\'rinishi.',
    url: `${GIBS_BASE}/MODIS_Terra_CorrectedReflectance_TrueColor/default/${getGibsDate()}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    maxZoom: 9,
    format: 'jpg',
    category: 'base',
    defaultOpacity: 1.0,
  },
  {
    id: 'viirs_true',
    name: 'VIIRS True Color',
    nameRu: 'Haqiqiy ranglar (VIIRS)',
    icon: '🌍',
    description: 'VIIRS Suomi NPP suratlari — yuqori ruxsat, kunlik yangilanish.',
    url: `${GIBS_BASE}/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${getGibsDate()}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    maxZoom: 9,
    format: 'jpg',
    category: 'base',
    defaultOpacity: 1.0,
  },
  {
    id: 'aerosol',
    name: 'Aerosol Optical Depth',
    nameRu: 'Aerozollar (AOD)',
    icon: '🌫️',
    description: 'Aerozolning optik qalinligi — PM2.5/PM10 zarralari bilan ifloslanish ko\'rsatkichi.',
    url: `${GIBS_BASE}/MODIS_Combined_Value_Added_AOD/default/${getGibsDate()}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
    maxZoom: 6,
    format: 'png',
    category: 'atmosphere',
    defaultOpacity: 0.7,
  },
  {
    id: 'no2',
    name: 'Nitrogen Dioxide (NO₂)',
    nameRu: 'Azot dioksidi (NO₂)',
    icon: '☁️',
    description: 'Troposferadagi NO₂ konsentratsiyasi — sanoat chiqindilarining asosiy ko\'rsatkichi.',
    url: `${GIBS_BASE}/OMPS_NPP_NMTO3_L2_PyrCld_TroposphericColumnNO2/default/${getGibsDate()}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
    maxZoom: 6,
    format: 'png',
    category: 'atmosphere',
    defaultOpacity: 0.65,
  },
  {
    id: 'fire',
    name: 'Thermal Anomalies',
    nameRu: 'Issiqlik anomaliyalari (yong\'inlar)',
    icon: '🔥',
    description: 'VIIRS — issiqlik anomaliyalarini aniqlash: yong\'inlar, mash\'alalar, sanoat issiqligi.',
    url: `${GIBS_BASE}/VIIRS_SNPP_Thermal_Anomalies_375m_All/default/${getGibsDate()}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`,
    maxZoom: 8,
    format: 'png',
    category: 'hazards',
    defaultOpacity: 0.85,
  },
  {
    id: 'ndvi',
    name: 'NDVI (Vegetation)',
    nameRu: 'O\'simliklar (NDVI)',
    icon: '🌿',
    description: 'NDVI vegetatsiya indeksi — zavodlar atrofidagi o\'simliklar salomatligini ko\'rsatadi.',
    url: `${GIBS_BASE}/MODIS_Terra_NDVI_8Day/default/${getGibsDate(8)}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`,
    maxZoom: 8,
    format: 'png',
    category: 'ecology',
    defaultOpacity: 0.7,
  },
  {
    id: 'clouds',
    name: 'Cloud Phase',
    nameRu: 'Bulutlilik',
    icon: '⛅',
    description: 'MODIS bulutlar fazasi — hudud ustidagi bulutlilik turini aniqlaydi.',
    url: `${GIBS_BASE}/MODIS_Terra_Cloud_Phase_Infrared_Day/default/${getGibsDate()}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
    maxZoom: 6,
    format: 'png',
    category: 'atmosphere',
    defaultOpacity: 0.5,
  },
];

export const LAYER_CATEGORIES = [
  { id: 'base', nameRu: '📡 Asosiy rasm', desc: 'Asosiy sun\'iy yo\'ldosh ko\'rinishi' },
  { id: 'atmosphere', nameRu: '🌫️ Atmosfera', desc: 'Havoning ifloslanishi va bulutlilik' },
  { id: 'hazards', nameRu: '🔥 Anomaliyalar', desc: 'Issiqlik va yong\'in anomaliyalari' },
  { id: 'ecology', nameRu: '🌿 Ekologiya', desc: 'O\'simliklar va suv resurslari' },
];

// ============================================================
// ГЕНЕРАЦИЯ РЕАЛИСТИЧНЫХ ВРЕМЕННЫХ РЯДОВ
// ============================================================
export const generateTimeSeries = (factory, hours = 48) => {
  const series = [];
  const now = new Date();
  const baseCO2 = factory.gases.CO2;
  const baseNO2 = factory.gases.NO2;
  const baseAqi = factory.aqi;
  const isDangerous = factory.status === 'danger';
  const isMedium = factory.status === 'medium';

  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = time.getHours();
    const isNight = hour < 6 || hour >= 22;
    const isWeekend = time.getDay() === 0 || time.getDay() === 6;
    const noise = Math.sin(i * 0.7) * 0.05 + Math.cos(i * 1.3) * 0.03;
    const nightFactor = isNight && isDangerous ? 1.28 + noise * 0.1 :
                        isNight && isMedium    ? 1.12 + noise * 0.05 :
                        1.0 + noise * 0.03;
    const weekendFactor = isWeekend && isDangerous ? 1.15 :
                          isWeekend               ? 0.92 : 1.0;
    const factor = nightFactor * weekendFactor;

    series.push({
      time, hour, isNight, isWeekend,
      label: `${time.toLocaleDateString('ru-RU', {day:'2-digit',month:'2-digit'})} ${time.getHours().toString().padStart(2,'0')}:00`,
      aqi: Math.round(baseAqi * factor),
      co2: Math.round(baseCO2 * factor * 10) / 10,
      no2: Math.round(baseNO2 * factor * 10) / 10,
    });
  }
  return series;
};

export const generateForecast = (series, steps = 12) => {
  const last = series[series.length - 1];
  const forecast = [];
  const recent = series.slice(-6);
  const avgChange = (recent[recent.length - 1].co2 - recent[0].co2) / 6;

  for (let i = 1; i <= steps; i++) {
    const time = new Date(last.time.getTime() + i * 60 * 60 * 1000);
    const hour = time.getHours();
    const isNight = hour < 6 || hour >= 22;
    const trend = avgChange * i;
    const nightBoost = isNight && last.co2 > 450 ? 8 : 0;
    forecast.push({
      time, isForecast: true, isNight,
      label: `+${i}ч`,
      co2: Math.round((last.co2 + trend + nightBoost) * 10) / 10,
      no2: Math.round((last.no2 + trend * 0.2) * 10) / 10,
    });
  }
  return forecast;
};

// ============================================================
// REACT CONTEXT — с управлением спутниковыми слоями
// ============================================================
const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const [selectedFactory, setSelectedFactory] = useState(FACTORIES[0]);
  const [activeLayers, setActiveLayers] = useState(['esri_highres']); // по умолчанию Esri Hybrid
  const [layerOpacities, setLayerOpacities] = useState(
    Object.fromEntries(SATELLITE_LAYERS.map(l => [l.id, l.defaultOpacity]))
  );
  const [gibsDate, setGibsDate] = useState(getGibsDate(0));

  const selectFactory = useCallback((factory) => {
    setSelectedFactory(factory);
  }, []);

  const toggleLayer = useCallback((layerId) => {
    setActiveLayers(prev => {
      const layer = SATELLITE_LAYERS.find(l => l.id === layerId);
      // Для base-слоёв — заменить (только один base одновременно)
      if (layer?.category === 'base') {
        const others = prev.filter(id => SATELLITE_LAYERS.find(l => l.id === id)?.category !== 'base');
        return prev.includes(layerId) ? others : [...others, layerId];
      }
      // Для overlay — toggle
      return prev.includes(layerId) ? prev.filter(id => id !== layerId) : [...prev, layerId];
    });
  }, []);

  const setLayerOpacity = useCallback((layerId, opacity) => {
    setLayerOpacities(prev => ({ ...prev, [layerId]: opacity }));
  }, []);

  return (
    <AppDataContext.Provider value={{
      factories: FACTORIES,
      selectedFactory, selectFactory,
      satelliteLayers: SATELLITE_LAYERS,
      layerCategories: LAYER_CATEGORIES,
      activeLayers, toggleLayer,
      layerOpacities, setLayerOpacity,
      gibsDate, setGibsDate,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
};
