from pydantic import BaseModel, Field
from typing import Optional
import datetime as dt

from app.models.common import ProviderMetadata


class Observation(BaseModel):
    """FRED observation data point."""
    date: dt.date = Field(..., description="Observation date")
    value: Optional[float] = Field(None, description="Observation value (null if missing)")


class YieldCurvePoint(BaseModel):
    """Yield curve data point."""
    maturity: str = Field(..., description="Maturity (e.g., '1M', '10Y')")
    yield_rate: Optional[float] = Field(None, description="Yield rate as percentage")


class YieldCurve(BaseModel):
    """Treasury yield curve."""
    date: dt.date = Field(..., description="Curve date")
    curve: list[YieldCurvePoint] = Field(..., description="Yield curve points")
    metadata: ProviderMetadata = Field(..., description="Provider metadata")


class FredSeriesMetadata(BaseModel):
    """FRED series metadata."""
    series_id: str = Field(..., description="Series ID")
    title: str = Field(..., description="Series title")
    observation_start: dt.date = Field(..., description="First observation date")
    observation_end: dt.date = Field(..., description="Last observation date")
    frequency: str = Field(..., description="Data frequency")
    frequency_short: str = Field(..., description="Short frequency code")
    units: str = Field(..., description="Units of measurement")
    units_short: str = Field(..., description="Short units code")
    seasonal_adjustment: str = Field(..., description="Seasonal adjustment")
    seasonal_adjustment_short: str = Field(..., description="Short seasonal adjustment code")
    last_updated: dt.datetime = Field(..., description="Last update timestamp")
    realtime_start: dt.date = Field(..., description="Realtime start")
    realtime_end: dt.date = Field(..., description="Realtime end")
    notes: Optional[str] = Field(None, description="Series notes")


class FredSeriesObservations(BaseModel):
    """FRED series observations."""
    series_id: str = Field(..., description="Series ID")
    observations: list[Observation] = Field(..., description="List of observations")
    metadata: ProviderMetadata = Field(..., description="Provider metadata")
