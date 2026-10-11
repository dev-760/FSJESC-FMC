from typing import Optional
from datetime import date

from app.services.base import BaseService
from app.models.common import AssetClass
from app.models.forex import ForexRate, ForexTimeSeries, ConversionResult, CurrencyInfo
from app.providers.router import ProviderRouter, ProviderName
from app.core.logging import get_logger

logger = get_logger(__name__)


class ForexService(BaseService):
    """Service for forex data."""

    def __init__(self, router: ProviderRouter):
        super().__init__(AssetClass.FOREX, router)

    async def get_forex_rate(
        self,
        base: str,
        quote: str,
        date_obj: Optional[date] = None,
        provider: Optional[ProviderName] = None
    ) -> ForexRate:
        """Get forex exchange rate."""
        return await self.router.with_fallback(
            self.asset_class,
            "get_forex_rate",
            provider,
            base,
            quote,
            date_obj
        )

    async def get_forex_history(
        self,
        base: str,
        quotes: list[str],
        start: date,
        end: date,
        provider: Optional[ProviderName] = None
    ) -> ForexTimeSeries:
        """Get forex time series."""
        return await self.router.with_fallback(
            self.asset_class,
            "get_forex_history",
            provider,
            base,
            quotes,
            start,
            end
        )

    async def convert_currency(
        self,
        from_currency: str,
        to_currency: str,
        amount: float,
        date_obj: Optional[date] = None,
        provider: Optional[ProviderName] = None
    ) -> ConversionResult:
        """Convert currency."""
        return await self.router.with_fallback(
            self.asset_class,
            "convert_currency",
            provider,
            from_currency,
            to_currency,
            amount,
            date_obj
        )

    async def get_currencies(
        self,
        provider: Optional[ProviderName] = None
    ) -> list[CurrencyInfo]:
        """Get available currencies."""
        return await self.router.with_fallback(
            self.asset_class,
            "get_currencies",
            provider
        )
