from typing import Optional
from datetime import date

from app.services.base import BaseService
from app.models.common import AssetClass
from app.models.cse import (
    CSESharePricesResponse,
    CSEOrderBook,
    CSEInstrumentDetail,
    CSESectorSummaryResponse,
)
from app.providers.router import ProviderRouter, ProviderName
from app.core.logging import get_logger

logger = get_logger(__name__)


class CSEService(BaseService):
    """Service for Casablanca Stock Exchange data."""

    def __init__(self, router: ProviderRouter):
        super().__init__(AssetClass.CSE, router)

    async def get_all_share_prices(
        self,
        sector: Optional[str] = None,
        company: Optional[str] = None,
        provider: Optional[ProviderName] = None
    ) -> CSESharePricesResponse:
        """Get all share prices with optional filters."""
        provider_instance = self.router.get_provider(self.asset_class, provider)
        return await provider_instance.get_all_share_prices(sector, company)

    async def get_order_book(
        self,
        ticker: str,
        provider: Optional[ProviderName] = None
    ) -> CSEOrderBook:
        """Get order book for a ticker."""
        provider_instance = self.router.get_provider(self.asset_class, provider)
        return await provider_instance.get_order_book(ticker)

    async def get_instrument_detail(
        self,
        ticker: str,
        provider: Optional[ProviderName] = None
    ) -> CSEInstrumentDetail:
        """Get full instrument detail."""
        provider_instance = self.router.get_provider(self.asset_class, provider)
        return await provider_instance.get_instrument_detail(ticker)

    async def get_sector_summary(
        self,
        sector: Optional[str] = None,
        provider: Optional[ProviderName] = None
    ) -> CSESectorSummaryResponse:
        """Get sector summary."""
        provider_instance = self.router.get_provider(self.asset_class, provider)
        return await provider_instance.get_sector_summary(sector)
