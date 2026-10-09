from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProviderStatus(BaseModel):
    """Provider health status."""
    name: str = Field(..., description="Provider name")
    status: str = Field(..., description="Status: healthy, degraded, or down")
    latency_ms: Optional[float] = Field(None, description="Latency in milliseconds")
    last_check: datetime = Field(..., description="Last check timestamp")
    error: Optional[str] = Field(None, description="Error message if status is not healthy")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Overall status: healthy or unhealthy")
    timestamp: datetime = Field(..., description="Check timestamp")
    providers: list[ProviderStatus] = Field(..., description="Provider statuses")
