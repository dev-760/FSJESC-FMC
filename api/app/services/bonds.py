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
        provider_instance = self.router.get_provider(self.asset_class, provider)
        return await provider_instance.get_yield_curve(date_obj)

    async def get_fred_series_metadata(
        self,
        series_id: str,
        provider: Optional[ProviderName] = None
    ) -> FredSeriesMetadata:
        """Get FRED series metadata."""
        provider_instance = self.router.get_provider(self.asset_class, provider)
        return await provider_instance.get_fred_series_metadata(series_id)

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
        provider_instance = self.router.get_provider(self.asset_class, provider)
        return await provider_instance.get_fred_series_observations(
            series_id, start, end, frequency, units
        )
