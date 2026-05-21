from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, database, ml_model

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="EcoOrbit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For MVP, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to EcoOrbit API"}

@app.post("/api/emissions", response_model=models.EmissionDataResponse)
def create_emission(emission: models.EmissionDataCreate, db: Session = Depends(database.get_db)):
    # Calculate Eco Score
    eco_score = ml_model.detector.calculate_eco_score(
        emission.co2_level, 
        emission.no2_level, 
        emission.methane_level
    )
    
    # Create DB entry for emission
    db_emission = models.EmissionData(
        region=emission.region,
        co2_level=emission.co2_level,
        no2_level=emission.no2_level,
        methane_level=emission.methane_level,
        eco_score=eco_score
    )
    if emission.timestamp:
        db_emission.timestamp = emission.timestamp
        
    db.add(db_emission)
    db.commit()
    db.refresh(db_emission)

    # Run ML model to predict anomaly
    is_anomaly, score = ml_model.detector.predict(
        emission.co2_level, 
        emission.no2_level, 
        emission.methane_level
    )

    if is_anomaly:
        description = "High levels detected. "
        if emission.co2_level > 450:
            description += "CO2 is elevated. "
        if emission.methane_level > 2000:
            description += "Methane spike. "
            
        db_anomaly = models.Anomaly(
            emission_id=db_emission.id,
            anomaly_score=score,
            is_anomaly=True,
            description=description.strip()
        )
        db.add(db_anomaly)
        db.commit()

    return db_emission

@app.get("/api/emissions", response_model=List[models.EmissionDataResponse])
def get_emissions(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    emissions = db.query(models.EmissionData).order_by(models.EmissionData.timestamp.desc()).offset(skip).limit(limit).all()
    return emissions

@app.get("/api/anomalies", response_model=List[models.AnomalyResponse])
def get_anomalies(skip: int = 0, limit: int = 50, db: Session = Depends(database.get_db)):
    anomalies = db.query(models.Anomaly).join(models.EmissionData).order_by(models.EmissionData.timestamp.desc()).offset(skip).limit(limit).all()
    return anomalies

@app.get("/api/forecast/{region}")
def get_forecast(region: str, steps: int = 5, db: Session = Depends(database.get_db)):
    # Get recent data for this region
    emissions = db.query(models.EmissionData).filter(models.EmissionData.region == region).order_by(models.EmissionData.timestamp.desc()).limit(10).all()
    
    if len(emissions) < 2:
        raise HTTPException(status_code=400, detail="Not enough data to forecast")
        
    data_dicts = [{"timestamp": e.timestamp, "co2_level": e.co2_level, "no2_level": e.no2_level, "methane_level": e.methane_level} for e in emissions]
    
    forecasts = ml_model.detector.forecast(data_dicts, steps=steps)
    insights = ml_model.detector.analyze_forecast(forecasts)
    
    return {"region": region, "forecasts": forecasts, "insights": insights}

@app.get("/api/behavior/{region}")
def get_behavior(region: str, db: Session = Depends(database.get_db)):
    emissions = db.query(models.EmissionData).filter(models.EmissionData.region == region).order_by(models.EmissionData.timestamp.asc()).all()
    
    if not emissions:
        return {"region": region, "insights": ["Недостаточно данных для анализа поведения."]}
        
    data_dicts = [{"timestamp": e.timestamp, "co2_level": e.co2_level, "no2_level": e.no2_level, "methane_level": e.methane_level, "eco_score": e.eco_score} for e in emissions]
    
    insights = ml_model.detector.analyze_behavior(data_dicts)
    return {"region": region, "insights": insights}
