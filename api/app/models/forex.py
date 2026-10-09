from pydantic import BaseModel, Field
from typing import Optional
import datetime as dt

from app.models.common import ProviderMetadata


class ForexRate(BaseModel):
    """Forex exchange rate."""
    base: str = Field(..., description="Base currency code")
    quote: str = Field(..., description="Quote currency code")
    rate: float = Field(..., description="Exchange rate")
    date: dt.date = Field(..., description="Rate date")
    metadata: ProviderMetadata = Field(..., description="Provider metadata")



class ForexTimeSeries(BaseModel):
    """Forex time series data."""
    base: str = Field(..., description="Base currency code")
    quotes: list[str] = Field(..., description="Quote currency codes")
    start_date: dt.date = Field(..., description="Start date")
    end_date: dt.date = Field(..., description="End date")
    rates: dict[dt.date, dict[str, float]] = Field(..., description="Rates by date and currency")
    metadata: ProviderMetadata = Field(..., description="Provider metadata")


class ConversionResult(BaseModel):
    """Currency conversion result."""
    from_currency: str = Field(..., description="Source currency")
    to_currency: str = Field(..., description="Target currency")
    amount: float = Field(..., description="Original amount")
    result: float = Field(..., description="Converted amount")
    rate: float = Field(..., description="Exchange rate used")
    date: Optional[dt.date] = Field(None, description="Rate date")
    metadata: ProviderMetadata = Field(..., description="Provider metadata")


class CurrencyInfo(BaseModel):
    """Currency information."""
    code: str = Field(..., description="Currency code")
    name: str = Field(..., description="Currency name")
