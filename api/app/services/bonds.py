from typing import Optional
from datetime import date

from app.services.base import BaseService
from app.models.common import AssetClass
from app.models.bonds import YieldCurve, FredSeriesMetadata, FredSeriesObservations
from app.providers.router import ProviderRouter, ProviderName
from app.core.logging import get_logger

logger = get_logger(__name__)


class BondsService(BaseService):
    """Service for bond data."""

    def __init__(self, router: ProviderRouter):
        super().__init__(AssetClass.BONDS, router)

    async def get_yield_curve(
        self,
        date_obj: Optional[date] = None,
        provider: Optional[ProviderName] = None
    ) -> YieldCurve:
        """Get Treasury yield curve."""
        return await self.router.with_fallback(
            self.asset_class,
            "get_yield_curve",
            provider,
            date_obj
        )

    async def get_fred_series_metadata(
        self,
        series_id: str,
        provider: Optional[ProviderName] = None
    ) -> FredSeriesMetadata:
        """Get FRED series metadata."""
        return await self.router.with_fallback(
            self.asset_class,
            "get_fred_series_metadata",
            provider,
            series_id
        )

    async def get_fred_series_observations(
        self,
        series_id: str,
        start: Optional[date] = None,
        end: Optional[date] = None,
        frequency: Optional[str] = None,
        units: Optional[str] = None,
        provider: Optional[ProviderName] = None
    ) -> FredSeriesObservations:
        """Get FRED series observations."""
        return await self.router.with_fallback(
            self.asset_class,
            "get_fred_series_observations",
            provider,
            series_id,
            start,
            end,
            frequency,
            units
        )
