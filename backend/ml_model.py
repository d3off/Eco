from sklearn.ensemble import IsolationForest
import numpy as np
import pandas as pd

class AnomalyDetector:
    def __init__(self):
        # contamination = proportion of outliers in the data set
        self.model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        self.is_trained = False

    def train(self, data: list[dict]):
        if not data:
            return
        
        df = pd.DataFrame(data)
        features = df[['co2_level', 'no2_level', 'methane_level']]
        
        self.model.fit(features)
        self.is_trained = True

    def predict(self, co2: float, no2: float, methane: float):
        if not self.is_trained:
            # If not trained, let's just train it on some dummy safe baseline data
            self._train_dummy_baseline()

        features = np.array([[co2, no2, methane]])
        # predict returns 1 for inliers, -1 for outliers
        prediction = self.model.predict(features)[0]
        # score_samples returns the opposite of the anomaly score defined in the original paper. 
        # Lower means more anomalous.
        score = self.model.score_samples(features)[0]
        
        is_anomaly = (prediction == -1)
        
        return is_anomaly, float(score)

    def _train_dummy_baseline(self):
        # Create some typical baseline data
        # CO2 ~ 400-420 ppm, NO2 ~ 10-20 ppb, Methane ~ 1800-1900 ppb
        np.random.seed(42)
        co2 = np.random.normal(410, 5, 200)
        no2 = np.random.normal(15, 2, 200)
        methane = np.random.normal(1850, 20, 200)
        
        data = [{'co2_level': c, 'no2_level': n, 'methane_level': m} for c, n, m in zip(co2, no2, methane)]
        self.train(data)

    def calculate_eco_score(self, co2: float, no2: float, methane: float) -> float:
        score = 100.0
        
        # Deduct based on CO2 (baseline ~420)
        if co2 > 420:
            score -= (co2 - 420) * 0.5
            
        # Deduct based on NO2 (baseline ~20)
        if no2 > 20:
            score -= (no2 - 20) * 1.5
            
        # Deduct based on Methane (baseline ~1900)
        if methane > 1900:
            score -= (methane - 1900) * 0.1
            
        return max(0.0, min(100.0, score))
        
    def forecast(self, recent_emissions: list[dict], steps: int = 3):
        if len(recent_emissions) < 2:
            return []
            
        # Very simple linear trend based on the recent N points
        df = pd.DataFrame(recent_emissions)
        df = df.sort_values('timestamp')
        
        forecasts = []
        
        # Calculate average step difference
        co2_diff = df['co2_level'].diff().mean()
        no2_diff = df['no2_level'].diff().mean()
        methane_diff = df['methane_level'].diff().mean()
        
        # Current last values
        last_co2 = df['co2_level'].iloc[-1]
        last_no2 = df['no2_level'].iloc[-1]
        last_methane = df['methane_level'].iloc[-1]
        
        for i in range(1, steps + 1):
            next_co2 = last_co2 + (co2_diff * i)
            next_no2 = last_no2 + (no2_diff * i)
            next_methane = last_methane + (methane_diff * i)
            
            # Prevent dropping below impossible baselines
            next_co2 = max(350.0, next_co2)
            next_no2 = max(5.0, next_no2)
            next_methane = max(1700.0, next_methane)
            
            forecasts.append({
                "step": i,
                "co2_level": next_co2,
                "no2_level": next_no2,
                "methane_level": next_methane,
                "predicted_eco_score": self.calculate_eco_score(next_co2, next_no2, next_methane)
            })
            
        return forecasts

    def analyze_forecast(self, forecasts: list[dict]) -> list[str]:
        insights = []
        if not forecasts:
            return ["Недостаточно данных для прогноза ИИ."]
        
        # Check if any step drops below 50
        critical_step = next((f for f in forecasts if f['predicted_eco_score'] < 50), None)
        if critical_step:
            insights.append(f"🔴 Внимание: Через {critical_step['step']} ч. ожидается критический уровень загрязнения (Eco Score < 50)!")
            return insights # Return immediately for critical
            
        # Check if any step drops below 75
        warning_step = next((f for f in forecasts if f['predicted_eco_score'] < 75), None)
        if warning_step:
            insights.append(f"🟡 Наблюдается рост выбросов. Возможен риск загрязнения через {warning_step['step']} ч.")
        else:
            insights.append("🟢 Прогноз стабильный. Риск загрязнения минимален.")
            
        return insights

    def analyze_behavior(self, historical_data: list[dict]) -> list[str]:
        if len(historical_data) < 24: # need some data to make conclusions
            return ["Сбор данных... (Для точного анализа паттернов нужно больше истории)"]
            
        df = pd.DataFrame(historical_data)
        # Ensure timestamp is datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['timestamp'].dt.hour
        df['weekday'] = df['timestamp'].dt.weekday
        
        # Define night (22-06) and day (06-22)
        df['is_night'] = (df['hour'] >= 22) | (df['hour'] < 6)
        
        # Define weekend (5,6)
        df['is_weekend'] = df['weekday'].isin([5, 6])
        
        insights = []
        
        # Night vs Day Analysis (comparing average eco_score)
        night_score = df[df['is_night']]['eco_score'].mean()
        day_score = df[~df['is_night']]['eco_score'].mean()
        
        if not pd.isna(night_score) and not pd.isna(day_score):
            if night_score < day_score - 10: 
                insights.append(f"⚠️ Скрытая активность: Экологические показатели ночью (в среднем {night_score:.1f}) значительно хуже, чем днем ({day_score:.1f}). Подозрение на тайный сброс отходов!")
            elif day_score < night_score - 10:
                insights.append(f"ℹ️ Дневная перегрузка: Днем уровень загрязнения существенно выше, чем ночью.")
                
        # Weekend vs Weekday Analysis
        weekend_score = df[df['is_weekend']]['eco_score'].mean()
        weekday_score = df[~df['is_weekend']]['eco_score'].mean()
        
        if not pd.isna(weekend_score) and not pd.isna(weekday_score):
            if weekend_score < weekday_score - 10:
                insights.append(f"⚠️ Нарушение режима: В выходные дни выбросы сильно увеличиваются (балл падает до {weekend_score:.1f}).")
            elif weekend_score > weekday_score + 10:
                insights.append(f"🟢 В выходные фабрика снижает темпы работы (эко-балл {weekend_score:.1f}).")
                
        if not insights:
            insights.append("🟢 Анализ не выявил подозрительных скрытых паттернов. Фабрика работает стабильно.")
            
        return insights

# Singleton instance
detector = AnomalyDetector()

