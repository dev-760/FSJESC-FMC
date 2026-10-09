from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class AssetClass(str, Enum):
    """Supported asset classes."""
    STOCKS = "stocks"
    ETFS = "etfs"
    FUTURES = "futures"
    FOREX = "forex"
    BONDS = "bonds"
    OPTIONS = "options"
    CRYPTO = "crypto"
    CSE = "cse"  # Casablanca Stock Exchange


class MarketState(str, Enum):
    """Market state."""
    OPEN = "open"
    CLOSED = "closed"
    PRE_MARKET = "pre_market"
    AFTER_HOURS = "after_hours"


class ProviderMetadata(BaseModel):
    """Metadata about the data provider."""
    provider: str = Field(..., description="Name of the data provider")
    fetched_at: datetime = Field(..., description="UTC timestamp when data was fetched")
    delayed: bool = Field(default=False, description="Whether data is delayed")
    cached: bool = Field(default=False, description="Whether data was retrieved from cache")


class Quote(BaseModel):
    """Normalized quote data."""
    symbol: str = Field(..., description="Ticker symbol")
    name: Optional[str] = Field(None, description="Security name")
    asset_class: AssetClass = Field(..., description="Asset class")
    currency: str = Field(..., description="Currency code")
    price: float = Field(..., description="Current price")
    change: Optional[float] = Field(None, description="Price change")
    change_percent: Optional[float] = Field(None, description="Percentage change")
    open: Optional[float] = Field(None, description="Day open price")
    high: Optional[float] = Field(None, description="Day high price")
    low: Optional[float] = Field(None, description="Day low price")
    prev_close: Optional[float] = Field(None, description="Previous close price")
    volume: Optional[int] = Field(None, description="Trading volume")
    market_cap: Optional[int] = Field(None, description="Market capitalization")
    exchange: Optional[str] = Field(None, description="Exchange name")
    market_state: Optional[MarketState] = Field(None, description="Market state")
    timestamp: datetime = Field(..., description="Quote timestamp (UTC)")
    metadata: ProviderMetadata = Field(..., description="Provider metadata")


class Candle(BaseModel):
    """OHLCV candle data."""
    timestamp: datetime = Field(..., description="Candle timestamp (UTC, ISO-8601)")
    open: float = Field(..., description="Open price")
    high: float = Field(..., description="High price")
    low: float = Field(..., description="Low price")
    close: float = Field(..., description="Close price")
    volume: Optional[int] = Field(None, description="Volume")


class HistoryResponse(BaseModel):
    """Historical data response."""
    symbol: str = Field(..., description="Ticker symbol")
    asset_class: AssetClass = Field(..., description="Asset class")
    interval: str = Field(..., description="Data interval")
    currency: str = Field(..., description="Currency code")
    candles: list[Candle] = Field(..., description="List of candles")
    metadata: ProviderMetadata = Field(..., description="Provider metadata")
    start: datetime = Field(..., description="Start date of data")
    end: datetime = Field(..., description="End date of data")


class BatchQuotesResponse(BaseModel):
    """Batch quotes response."""
    quotes: list[Quote] = Field(..., description="List of quotes")
    metadata: ProviderMetadata = Field(..., description="Provider metadata")


class SearchResults(BaseModel):
    """Search results."""
    symbol: str = Field(..., description="Ticker symbol")
    name: Optional[str] = Field(None, description="Security name")
    asset_class: Optional[AssetClass] = Field(None, description="Asset class")
    exchange: Optional[str] = Field(None, description="Exchange name")
    type: Optional[str] = Field(None, description="Security type")
