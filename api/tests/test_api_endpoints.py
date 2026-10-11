import pytest
import asyncio
from datetime import date
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.cache import CacheManager


@pytest.mark.asyncio
class TestApiLogicAndEndpoints:
    """Comprehensive tests for FastAPI market data logic, fallbacks, and error handling."""

    async def test_cache_per_key_ttl_expiration(self):
        """Verify that per-key TTL is respected in memory cache."""
        cache = CacheManager()
        await cache.set("short_lived", "val1", ttl=1)
        await cache.set("long_lived", "val2", ttl=60)

        assert await cache.get("short_lived") == "val1"
        assert await cache.get("long_lived") == "val2"

        await asyncio.sleep(1.1)
        assert await cache.get("short_lived") is None
        assert await cache.get("long_lived") == "val2"

    async def test_cse_quote_and_calculated_change(self):
        """Test CSE quote returns valid price, computed change, and MAD currency."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/v1/cse/quote?ticker=ATW")
            assert res.status_code == 200
            data = res.json()
            assert data["symbol"] == "ATW"
            assert data["currency"] == "MAD"
            assert data["price"] > 0
            assert data["change"] is not None
            assert data["change_percent"] is not None

    async def test_cse_not_found_preserves_404(self):
        """Test unknown CSE ticker returns 404 SYMBOL_NOT_FOUND instead of 500."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/v1/cse/quote?ticker=NONEXISTENT99")
            assert res.status_code == 404
            payload = res.json()
            assert payload["error"]["code"] == "SYMBOL_NOT_FOUND"

    async def test_cse_order_book_and_sector_summary(self):
        """Test CSE order book, instrument detail, and sector summary endpoints."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            ob_res = await client.get("/api/v1/cse/order-book?ticker=IAM")
            assert ob_res.status_code == 200
            ob = ob_res.json()
            assert ob["ticker"] == "IAM"
            assert len(ob["bids"]) > 0
            assert len(ob["asks"]) > 0
            assert ob["asks"][0]["price"] > ob["bids"][0]["price"]

            sec_res = await client.get("/api/v1/cse/sector-summary")
            assert sec_res.status_code == 200
            sec = sec_res.json()
            assert sec["total_sectors"] > 0
            assert len(sec["sectors"]) > 0

    async def test_forex_mad_cross_rate_and_conversion(self):
        """Test USD/MAD and EUR/MAD forex rates and currency conversion."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            rate_res = await client.get("/api/v1/forex/rates?base=USD&symbols=MAD")
            assert rate_res.status_code == 200
            rate_data = rate_res.json()
            assert rate_data["base"] == "USD"
            assert rate_data["quote"] == "MAD"
            assert rate_data["rate"] > 5.0

            conv_res = await client.get("/api/v1/forex/convert?from=USD&to=MAD&amount=100")
            assert conv_res.status_code == 200
            conv_data = conv_res.json()
            assert conv_data["from_currency"] == "USD"
            assert conv_data["to_currency"] == "MAD"
            assert conv_data["result"] == pytest.approx(100 * conv_data["rate"], rel=1e-3)

            curr_res = await client.get("/api/v1/forex/currencies")
            assert curr_res.status_code == 200
            codes = {c["code"] for c in curr_res.json()}
            assert "MAD" in codes
            assert "USD" in codes
            assert "EUR" in codes

    async def test_bonds_yield_curve_and_fred_fallback(self):
        """Test Treasury yield curve and FRED series endpoints."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yc_res = await client.get("/api/v1/bonds/yield-curve")
            assert yc_res.status_code == 200
            yc = yc_res.json()
            assert len(yc["curve"]) >= 10
            maturities = {pt["maturity"] for pt in yc["curve"]}
            assert "10Y" in maturities
            assert "2Y" in maturities

            obs_res = await client.get("/api/v1/fred/series/DGS10/observations")
            assert obs_res.status_code == 200
            obs = obs_res.json()
            assert obs["series_id"] == "DGS10"
            assert len(obs["observations"]) > 0

    async def test_invalid_parameter_returns_422_envelope(self):
        """Test invalid symbol or interval returns 422 INVALID_PARAMETER envelope instead of 500."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/v1/stocks/quote?symbol=INV@LID")
            assert res.status_code == 422
            payload = res.json()
            assert payload["error"]["code"] == "INVALID_PARAMETER"

            hist_res = await client.get("/api/v1/cse/history?ticker=ATW&start=2026-01-01&end=2026-01-10&interval=5m")
            assert hist_res.status_code == 422
            assert hist_res.json()["error"]["code"] == "INVALID_PARAMETER"
