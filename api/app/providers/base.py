from abc import ABC, abstractmethod
from typing import Optional, Literal
from datetime import datetime, date

from app.models.common import Quote, Candle, HistoryResponse, SearchResults, AssetClass
from app.models.forex import ForexRate, ForexTimeSeries, ConversionResult
from app.models.bonds import Observation, YieldCurve, FredSeriesMetadata, FredSeriesObservations
from app.models.options import OptionChain, OptionExpirations


class ProviderCapabilities:
    """Provider capability flags."""

    def __init__(
        self,
        quotes: bool = False,
        history: bool = False,
        batch_quotes: bool = False,
        search: bool = False,
        forex_rates: bool = False,
        forex_history: bool = False,
        forex_convert: bool = False,
        yield_curve: bool = False,
        fred_series: bool = False,
        options_chain: bool = False,
        options_expirations: bool = False,
    ):
        self.quotes = quotes
        self.history = history
        self.batch_quotes = batch_quotes
        self.search = search
        self.forex_rates = forex_rates
        self.forex_history = forex_history
        self.forex_convert = forex_convert
        self.yield_curve = yield_curve
        self.fred_series = fred_series
        self.options_chain = options_chain
        self.options_expirations = options_expirations


class Provider(ABC):
    """Abstract base class for data providers."""

    def __init__(self, name: str):
        self.name = name
        self.capabilities = ProviderCapabilities()

    @abstractmethod
    async def get_quote(self, symbol: str, asset_class: AssetClass) -> Quote:
        """Get current quote for a symbol."""
        pass

    @abstractmethod
    async def get_history(
        self,
        symbol: str,
        asset_class: AssetClass,
        start: date,
        end: date,
        interval: str = "1d"
    ) -> HistoryResponse:
        """Get historical data for a symbol."""
        pass

    @abstractmethod
    async def get_batch_quotes(
        self,
        symbols: list[str],
        asset_class: AssetClass
    ) -> list[Quote]:
        """Get quotes for multiple symbols."""
        pass

    @abstractmethod
    async def search(self, query: str, asset_class: Optional[AssetClass] = None) -> list[SearchResults]:
        """Search for symbols."""
        pass

    async def get_forex_rate(
        self,
        base: str,
        quote: str,
        date_obj: Optional[date] = None
    ) -> ForexRate:
        """Get forex exchange rate. Override if supported."""
        raise NotImplementedError(f"{self.name} does not support forex rates")

    async def get_forex_history(
        self,
        base: str,
        quotes: list[str],
        start: date,
        end: date
    ) -> ForexTimeSeries:
        """Get forex time series. Override if supported."""
        raise NotImplementedError(f"{self.name} does not support forex history")

    async def convert_currency(
        self,
        from_currency: str,
        to_currency: str,
        amount: float,
        date_obj: Optional[date] = None
    ) -> ConversionResult:
        """Convert currency. Override if supported."""
        raise NotImplementedError(f"{self.name} does not support currency conversion")

    async def get_yield_curve(self, date_obj: Optional[date] = None) -> YieldCurve:
        """Get treasury yield curve. Override if supported."""
        raise NotImplementedError(f"{self.name} does not support yield curve")

    async def get_fred_series_metadata(self, series_id: str) -> FredSeriesMetadata:
        """Get FRED series metadata. Override if supported."""
        raise NotImplementedError(f"{self.name} does not support FRED series")

    async def get_fred_series_observations(
        self,
        series_id: str,
        start: Optional[date] = None,
        end: Optional[date] = None,
        frequency: Optional[str] = None,
        units: Optional[str] = None
    ) -> FredSeriesObservations:
        """Get FRED series observations. Override if supported."""
        raise NotImplementedError(f"{self.name} does not support FRED observations")

    async def get_options_expirations(self, symbol: str) -> OptionExpirations:
        """Get option expiration dates. Override if supported."""
        raise NotImplementedError(f"{self.name} does not support options")

    async def get_options_chain(
        self,
        symbol: str,
        expiration: date,
        option_type: Optional[Literal["calls", "puts", "all"]] = "all",
        min_strike: Optional[float] = None,
        max_strike: Optional[float] = None,
        in_the_money: Optional[bool] = None
    ) -> OptionChain:
        """Get option chain. Override if supported."""
        raise NotImplementedError(f"{self.name} does not support options")

    async def health_check(self) -> bool:
        """Check if provider is healthy."""
        try:
            # Try a simple operation
            await self.search("AAPL")
            return True
        except Exception:
            return False
