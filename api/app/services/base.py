from typing import Optional
from datetime import date

from app.models.common import AssetClass, Quote, HistoryResponse, SearchResults
from app.providers.router import ProviderRouter, ProviderName
from app.core.errors import InvalidParameterError
from app.core.logging import get_logger

logger = get_logger(__name__)


class BaseService:
    """Base service for asset class operations."""

    def __init__(self, asset_class: AssetClass, router: ProviderRouter):
        self.asset_class = asset_class
        self.router = router

    async def get_quote(
        self,
        symbol: str,
        provider: Optional[ProviderName] = None
    ) -> Quote:
        """Get quote for a symbol."""
        return await self.router.with_fallback(
            self.asset_class,
            "get_quote",
            provider,
            symbol,
            self.asset_class
        )

    async def get_history(
        self,
        symbol: str,
        start: date,
        end: date,
        interval: str = "1d",
        provider: Optional[ProviderName] = None
    ) -> HistoryResponse:
        """Get historical data for a symbol."""
        return await self.router.with_fallback(
            self.asset_class,
            "get_history",
            provider,
            symbol,
            self.asset_class,
            start,
            end,
            interval
        )

    async def get_batch_quotes(
        self,
        symbols: list[str],
        provider: Optional[ProviderName] = None
    ) -> list[Quote]:
        """Get quotes for multiple symbols."""
        if len(symbols) > 50:
            raise InvalidParameterError("symbols", "Maximum 50 symbols per batch request")

        return await self.router.with_fallback(
            self.asset_class,
            "get_batch_quotes",
            provider,
            symbols,
            self.asset_class
        )

    async def search(
        self,
        query: str,
        provider: Optional[ProviderName] = None
    ) -> list[SearchResults]:
        """Search for symbols."""
        return await self.router.with_fallback(
            self.asset_class,
            "get_search",
            provider,
            query,
            self.asset_class
        ) if hasattr(self.router, "get_search") else await self.router.with_fallback(
            self.asset_class,
            "search",
            provider,
            query,
            self.asset_class
        )

