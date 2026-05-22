from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

from database import Base

# SQLAlchemy Models
class EmissionData(Base):
    __tablename__ = "emission_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    region = Column(String, index=True)
    co2_level = Column(Float)
    no2_level = Column(Float)
    methane_level = Column(Float)
    eco_score = Column(Float, default=100.0)
    
    anomalies = relationship("Anomaly", back_populates="emission")

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    emission_id = Column(Integer, ForeignKey("emission_data.id"))
    anomaly_score = Column(Float)
    is_anomaly = Column(Boolean, default=True)
    description = Column(String, nullable=True)

    emission = relationship("EmissionData", back_populates="anomalies")

# Pydantic Schemas
class EmissionDataCreate(BaseModel):
    region: str
    co2_level: float
    no2_level: float
    methane_level: float
    timestamp: Optional[datetime] = None

class EmissionDataResponse(EmissionDataCreate):
    id: int
    timestamp: datetime
    eco_score: float

    class Config:
        orm_mode = True

class AnomalyResponse(BaseModel):
    id: int
    emission_id: int
    anomaly_score: float
    is_anomaly: bool
    description: Optional[str] = None
    emission: EmissionDataResponse

    class Config:
        orm_mode = True

# Hazard Assessment Schema
class HazardThreat(BaseModel):
    substance_key: str
    name: str
    full_name: str
    measured_value: float
    who_threshold: float
    unit: str
    excess_ratio: float
    organs: list
    symptoms: str
    is_carcinogen: bool
    severity: str
    icon: str

class HazardReaction(BaseModel):
    id: str
    name: str
    equation: str
    product: str
    mechanism: str
    health_effect: str
    severity: str

class HazardReport(BaseModel):
    region: str
    hazard_level: str
    violation_count: int
    active_threats: list
    active_reactions: list
    recommendations: list
    substances_reference: list
    latest_measurements: Optional[dict] = None
