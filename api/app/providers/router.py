from typing import Optional, Literal
from enum import Enum

from app.providers.base import Provider
from app.providers.yfinance_provider import YFinanceProvider
from app.providers.fred_provider import FREDProvider
from app.providers.frankfurter_provider import FrankfurterProvider
from app.providers.cse_provider import CSEProvider
from app.models.common import AssetClass
from app.core.config import settings
from app.core.errors import (
    MarketDataError,
    InvalidParameterError,
    ProviderError,
    ProviderNotConfiguredError,
)
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

    # Secondary/fallback providers (only providers that actually implement the asset class capabilities)
    SECONDARY_PROVIDERS = {
        AssetClass.STOCKS: [],
        AssetClass.ETFS: [],
        AssetClass.FUTURES: [],
        AssetClass.FOREX: [ProviderName.YFINANCE],
        AssetClass.BONDS: [ProviderName.YFINANCE],
        AssetClass.OPTIONS: [],
        AssetClass.CRYPTO: [],
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
            ProviderNotConfiguredError (also a ValueError): If no provider is available
        """
        # If provider override is specified, use it
        if provider_override:
            if provider_override not in self._providers:
                raise ProviderNotConfiguredError(
                    str(provider_override),
                    f"Provider {provider_override} is not available"
                )
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

        raise ProviderNotConfiguredError(
            str(asset_class),
            f"No provider available for asset class: {asset_class}"
        )

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
        Preserves MarketDataError semantics (e.g., 404 SymbolNotFoundError, 422 InvalidParameterError).
        """
        primary_provider: Optional[Provider] = None
        try:
            primary_provider = self.get_provider(asset_class, provider_override)
            method = getattr(primary_provider, method_name)
            return await method(*args, **kwargs)
        except InvalidParameterError:
            # Invalid client parameters will fail on all providers; do not mask or retry
            raise
        except ProviderNotConfiguredError:
            if provider_override:
                raise
            primary_error: Exception = ProviderNotConfiguredError(str(asset_class))
        except Exception as e:
            primary_error = e
            logger.warning(f"Primary provider failed for {asset_class}.{method_name}: {e}")

        # If a specific provider was explicitly requested, do not fall back to another provider
        if provider_override:
            if isinstance(primary_error, MarketDataError):
                raise primary_error
            raise ProviderError(
                f"Provider {provider_override} failed for {method_name}: {primary_error}",
                provider=str(provider_override)
            )

        # Try fallback providers
        secondary = self.SECONDARY_PROVIDERS.get(asset_class, [])
        for provider_name in secondary:
            if provider_name in self._providers:
                candidate = self._providers[provider_name]
                if primary_provider is not None and candidate is primary_provider:
                    continue
                if not hasattr(candidate, method_name):
                    continue
                try:
                    method = getattr(candidate, method_name)
                    result = await method(*args, **kwargs)
                    logger.info(f"Successfully used fallback provider {provider_name} for {asset_class}.{method_name}")
                    return result
                except NotImplementedError:
                    continue
                except Exception as fallback_error:
                    logger.warning(f"Fallback provider {provider_name} also failed: {fallback_error}")
                    continue

        # All providers failed — preserve original MarketDataError if present
        if isinstance(primary_error, MarketDataError):
            raise primary_error

        raise ProviderError(
            f"All providers failed for {asset_class}.{method_name}: {primary_error}",
            provider=primary_provider.name if primary_provider else str(asset_class)
        )

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
