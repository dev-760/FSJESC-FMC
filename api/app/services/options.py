from typing import Optional
from datetime import date

from app.services.base import BaseService
from app.models.common import AssetClass
from app.models.options import OptionChain, OptionExpirations
from app.providers.router import ProviderRouter, ProviderName
from app.core.logging import get_logger

logger = get_logger(__name__)


class OptionsService(BaseService):
    """Service for options data."""

    def __init__(self, router: ProviderRouter):
        super().__init__(AssetClass.OPTIONS, router)

    async def get_expirations(
        self,
        symbol: str,
        provider: Optional[ProviderName] = None
    ) -> OptionExpirations:
        """Get option expiration dates."""
        provider_instance = self.router.get_provider(self.asset_class, provider)
        return await provider_instance.get_options_expirations(symbol)

    async def get_chain(
        self,
        symbol: str,
        expiration: date,
        option_type: Optional[str] = "all",
        min_strike: Optional[float] = None,
        max_strike: Optional[float] = None,
        in_the_money: Optional[bool] = None,
        provider: Optional[ProviderName] = None
    ) -> OptionChain:
        """Get option chain."""
        provider_instance = self.router.get_provider(self.asset_class, provider)
        return await provider_instance.get_options_chain(
            symbol, expiration, option_type, min_strike, max_strike, in_the_money
        )
