from typing import Optional, Literal
from enum import Enum

from app.providers.base import Provider
from app.providers.yfinance_provider import YFinanceProvider
from app.providers.fred_provider import FREDProvider
from app.providers.frankfurter_provider import FrankfurterProvider
from app.providers.cse_provider import CSEProvider
from app.models.common import AssetClass
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class ProviderName(str, Enum):
    """Available provider names."""
    YFINANCE = "yfinance"
    FRED = "fred"
    FRANKFURTER = "frankfurter"
    CSE = "cse"


class ProviderRouter:
    """
    Router that selects the appropriate provider for each asset class
    and handles fallback logic.
    """

    # Provider-to-asset-class mapping
    PRIMARY_PROVIDERS = {
        AssetClass.STOCKS: ProviderName.YFINANCE,
        AssetClass.ETFS: ProviderName.YFINANCE,
        AssetClass.FUTURES: ProviderName.YFINANCE,
        AssetClass.FOREX: ProviderName.FRANKFURTER,
        AssetClass.BONDS: ProviderName.FRED,
        AssetClass.OPTIONS: ProviderName.YFINANCE,
        AssetClass.CRYPTO: ProviderName.YFINANCE,
        AssetClass.CSE: ProviderName.CSE,
    }

    # Secondary/fallback providers
    SECONDARY_PROVIDERS = {
        AssetClass.STOCKS: [ProviderName.FRED],
        AssetClass.ETFS: [],
        AssetClass.FUTURES: [ProviderName.FRED],
        AssetClass.FOREX: [ProviderName.YFINANCE, ProviderName.FRED],
        AssetClass.BONDS: [ProviderName.YFINANCE],
        AssetClass.OPTIONS: [],
        AssetClass.CRYPTO: [ProviderName.FRED],
        AssetClass.CSE: [],
    }

    def __init__(self):
        self._providers: dict[ProviderName, Provider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        """Initialize all available providers."""
        try:
            self._providers[ProviderName.YFINANCE] = YFinanceProvider()
            logger.info("yfinance provider initialized")
        except Exception as e:
            logger.error(f"Failed to initialize yfinance provider: {e}")

        try:
            if settings.FRED_API_KEY:
                self._providers[ProviderName.FRED] = FREDProvider()
                logger.info("FRED provider initialized")
            else:
                logger.warning("FRED API key not configured, FRED provider disabled")
        except Exception as e:
            logger.error(f"Failed to initialize FRED provider: {e}")

        try:
            self._providers[ProviderName.FRANKFURTER] = FrankfurterProvider()
            logger.info("Frankfurter provider initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Frankfurter provider: {e}")

        try:
            # CSE provider can work without API key for basic operations
            cse_api_key = getattr(settings, 'CSE_API_KEY', None)
            self._providers[ProviderName.CSE] = CSEProvider(api_key=cse_api_key)
            logger.info("CSE provider initialized")
        except Exception as e:
            logger.error(f"Failed to initialize CSE provider: {e}")

    def get_provider(
        self,
        asset_class: AssetClass,
        provider_override: Optional[ProviderName] = None
    ) -> Provider:
        """
        Get the appropriate provider for an asset class.

        Args:
            asset_class: The asset class
            provider_override: Optional provider name to force a specific provider

        Returns:
            Provider instance

        Raises:
            ValueError: If no provider is available for the asset class
        """
        # If provider override is specified, use it
        if provider_override:
            if provider_override not in self._providers:
                raise ValueError(f"Provider {provider_override} is not available")
            return self._providers[provider_override]

        # Get primary provider
        primary = self.PRIMARY_PROVIDERS.get(asset_class)
        if primary and primary in self._providers:
            return self._providers[primary]

        # Fall back to secondary providers
        secondary = self.SECONDARY_PROVIDERS.get(asset_class, [])
        for provider_name in secondary:
            if provider_name in self._providers:
                logger.info(f"Using fallback provider {provider_name} for {asset_class}")
                return self._providers[provider_name]

        raise ValueError(f"No provider available for asset class: {asset_class}")

    async def with_fallback(
        self,
        asset_class: AssetClass,
        method_name: str,
        provider_override: Optional[ProviderName] = None,
        *args,
        **kwargs
    ):
        """
        Execute a provider method with fallback to secondary providers.

        Args:
            asset_class: The asset class
            method_name: Name of the method to call
            provider_override: Optional provider name to force a specific provider
            *args: Positional arguments for the method
            **kwargs: Keyword arguments for the method

        Returns:
            Result from the provider method

        Raises:
            Exception: If all providers fail
        """
        # Try primary (or override) provider
        try:
            provider = self.get_provider(asset_class, provider_override)
            method = getattr(provider, method_name)
            result = await method(*args, **kwargs)
            return result
        except Exception as e:
            logger.warning(f"Primary provider failed for {asset_class}.{method_name}: {e}")

            # Try fallback providers
            secondary = self.SECONDARY_PROVIDERS.get(asset_class, [])
            for provider_name in secondary:
                if provider_name in self._providers and provider_name != provider_override:
                    try:
                        provider = self._providers[provider_name]
                        method = getattr(provider, method_name)
                        result = await method(*args, **kwargs)
                        logger.info(f"Successfully used fallback provider {provider_name}")
                        return result
                    except Exception as fallback_error:
                        logger.warning(f"Fallback provider {provider_name} also failed: {fallback_error}")
                        continue

            # All providers failed
            raise Exception(f"All providers failed for {asset_class}.{method_name}")

    async def health_check(self) -> dict[str, bool]:
        """Check health of all providers."""
        results = {}
        for name, provider in self._providers.items():
            try:
                results[name.value] = await provider.health_check()
            except Exception as e:
                logger.error(f"Health check failed for {name}: {e}")
                results[name.value] = False
        return results

    async def close(self) -> None:
        """Close all providers."""
        for provider in self._providers.values():
            try:
                if hasattr(provider, "close"):
                    await provider.close()
            except Exception as e:
                logger.error(f"Error closing provider: {e}")


# Global router instance
router = ProviderRouter()
