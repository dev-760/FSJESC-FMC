import pytest
from unittest.mock import AsyncMock, MagicMock

from app.providers.router import ProviderRouter, ProviderName
from app.models.common import AssetClass
from app.core.errors import ProviderNotConfiguredError


class TestProviderRouter:
    """Test provider router."""

    def test_get_provider_primary(self):
        """Test getting primary provider."""
        router = ProviderRouter()

        # Stocks should use yfinance
        provider = router.get_provider(AssetClass.STOCKS)
        assert provider.name == "yfinance"

        # Forex should use frankfurter
        provider = router.get_provider(AssetClass.FOREX)
        assert provider.name == "Frankfurter"

        # Bonds should use FRED if configured or fallback to yfinance
        provider = router.get_provider(AssetClass.BONDS)
        assert provider.name in ("FRED", "yfinance")

    def test_get_provider_override(self):
        """Test provider override."""
        router = ProviderRouter()

        # yfinance override should succeed
        provider = router.get_provider(AssetClass.STOCKS, ProviderName.YFINANCE)
        assert provider.name == "yfinance"

        # FRED override depends on whether API key is configured
        if ProviderName.FRED in router._providers:
            provider = router.get_provider(AssetClass.STOCKS, ProviderName.FRED)
            assert provider.name == "FRED"
        else:
            with pytest.raises(ValueError, match="not available"):
                router.get_provider(AssetClass.STOCKS, ProviderName.FRED)

    def test_no_provider_available(self):
        """Test error when no provider available."""
        router = ProviderRouter()

        # Remove all providers
        router._providers.clear()

        with pytest.raises(ValueError, match="No provider available"):
            router.get_provider(AssetClass.STOCKS)

    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test provider health check."""
        router = ProviderRouter()

        health = await router.health_check()
        assert isinstance(health, dict)

        # Should have entries for configured providers
        for provider_name, is_healthy in health.items():
            assert isinstance(provider_name, str)
            assert isinstance(is_healthy, bool)
