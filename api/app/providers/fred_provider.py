import httpx
from typing import Optional
from datetime import datetime, date
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.providers.base import Provider, ProviderCapabilities
from app.models.common import Quote, Candle, HistoryResponse, SearchResults, AssetClass, ProviderMetadata, MarketState
from app.models.bonds import Observation, YieldCurve, YieldCurvePoint, FredSeriesMetadata, FredSeriesObservations
from app.core.config import settings
from app.core.errors import ProviderError, ProviderNotConfiguredError, SymbolNotFoundError
from app.core.logging import get_logger
from app.core.cache import cached

logger = get_logger(__name__)


class FREDProvider(Provider):
    """FRED (Federal Reserve Economic Data) provider implementation."""

    BASE_URL = "https://api.stlouisfed.org/fred"

    # Treasury yield curve series IDs
    YIELD_CURVE_SERIES = {
        "1M": "DGS1MO",
        "3M": "DGS3MO",
        "6M": "DGS6MO",
        "1Y": "DGS1",
        "2Y": "DGS2",
        "3Y": "DGS3",
        "5Y": "DGS5",
        "7Y": "DGS7",
        "10Y": "DGS10",
        "20Y": "DGS20",
        "30Y": "DGS30",
    }

    def __init__(self, api_key: Optional[str] = None, http_client: Optional[httpx.AsyncClient] = None):
        self.api_key = api_key or settings.FRED_API_KEY
        if not self.api_key:
            raise ProviderNotConfiguredError("FRED")

        self.http_client = http_client
        self.capabilities = ProviderCapabilities(
            quotes=False,
            history=False,
            batch_quotes=False,
            search=True,
            forex_rates=False,
            forex_history=False,
            forex_convert=False,
            yield_curve=True,
            fred_series=True,
            options_chain=False,
            options_expirations=False,
        )
        super().__init__("FRED")

    async def _get_http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self.http_client is None:
            self.http_client = httpx.AsyncClient(
                timeout=settings.HTTP_TIMEOUT,
                limits=httpx.Limits(
                    max_connections=settings.HTTP_MAX_CONNECTIONS,
                    max_keepalive_connections=settings.HTTP_MAX_KEEPALIVE_CONNECTIONS
                )
            )
        return self.http_client

    @retry(
        stop=stop_after_attempt(settings.RETRY_MAX_ATTEMPTS),
        wait=wait_exponential(
            multiplier=settings.RETRY_INITIAL_DELAY,
            max=settings.RETRY_MAX_DELAY
        ),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.TimeoutException))
    )
    async def _request(self, endpoint: str, params: dict) -> dict:
        """Make a request to FRED API."""
        client = await self._get_http_client()
        params["api_key"] = self.api_key
        params["file_type"] = "json"

        url = f"{self.BASE_URL}/{endpoint}"
        logger.debug(f"FRED request: {url} with params {params}")

        response = await client.get(url, params=params)
        response.raise_for_status()

        data = response.json()

        # Check for FRED errors
        if "error_code" in data:
            raise ProviderError(
                message=data.get("error_message", "FRED API error"),
                provider=self.name,
                details={"error_code": data["error_code"]}
            )

        return data

    async def get_quote(self, symbol: str, asset_class: AssetClass) -> Quote:
        """FRED does not support real-time quotes."""
        raise NotImplementedError("FRED does not support real-time quotes")

    async def get_history(
        self,
        symbol: str,
        asset_class: AssetClass,
        start: date,
        end: date,
        interval: str = "1d"
    ) -> HistoryResponse:
        """Get historical data from FRED series."""
        observations = await self.get_fred_series_observations(
            series_id=symbol,
            start=start,
            end=end
        )

        candles = [
            Candle(
                timestamp=datetime.combine(obs.date, datetime.min.time()),
                open=obs.value if obs.value is not None else 0.0,
                high=obs.value if obs.value is not None else 0.0,
                low=obs.value if obs.value is not None else 0.0,
                close=obs.value if obs.value is not None else 0.0,
                volume=None
            )
            for obs in observations.observations
        ]

        return HistoryResponse(
            symbol=symbol,
            asset_class=asset_class,
            interval=interval,
            currency="USD",
            candles=candles,
            metadata=observations.metadata,
            start=start,
            end=end
        )

    async def get_batch_quotes(
        self,
        symbols: list[str],
        asset_class: AssetClass
    ) -> list[Quote]:
        """FRED does not support batch quotes."""
        raise NotImplementedError("FRED does not support batch quotes")

    @cached(ttl=settings.CACHE_TTL_FRED_METADATA, key_prefix="fred")
    async def search(self, query: str, asset_class: Optional[AssetClass] = None) -> list[SearchResults]:
        """Search for FRED series."""
        params = {
            "search_text": query,
            "limit": 100,
            "order_by": "search_rank",
            "sort_order": "desc"
        }

        data = await self._request("series/search", params)

        results = []
        for item in data.get("seriess", []):
            results.append(
                SearchResults(
                    symbol=item["id"],
                    name=item["title"],
                    asset_class=AssetClass.BONDS,
                    exchange="FRED",
                    type=item.get("units_short", "")
                )
            )

        return results

    @cached(ttl=settings.CACHE_TTL_FRED_METADATA, key_prefix="fred")
    async def get_fred_series_metadata(self, series_id: str) -> FredSeriesMetadata:
        """Get FRED series metadata."""
        data = await self._request("series", {"series_id": series_id})
        series_list = data.get("seriess", [])
        if not series_list:
            raise SymbolNotFoundError(series_id, provider=self.name)
        series_data = series_list[0]

        return FredSeriesMetadata(
            id=series_data["id"],
            title=series_data["title"],
            observation_start=date.fromisoformat(series_data["observation_start"]),
            observation_end=date.fromisoformat(series_data["observation_end"]),
            frequency=series_data["frequency"],
            frequency_short=series_data["frequency_short"],
            units=series_data["units"],
            units_short=series_data["units_short"],
            seasonal_adjustment=series_data["seasonal_adjustment"],
            seasonal_adjustment_short=series_data["seasonal_adjustment_short"],
            last_updated=datetime.fromisoformat(series_data["last_updated"]),
            realtime_start=date.fromisoformat(series_data["realtime_start"]),
            realtime_end=date.fromisoformat(series_data["realtime_end"]),
            notes=series_data.get("notes")
        )

    @cached(ttl=settings.CACHE_TTL_FRED_OBSERVATIONS, key_prefix="fred")
    async def get_fred_series_observations(
        self,
        series_id: str,
        start: Optional[date] = None,
        end: Optional[date] = None,
        frequency: Optional[str] = None,
        units: Optional[str] = None
    ) -> FredSeriesObservations:
        """Get FRED series observations."""
        params = {"series_id": series_id}

        if start:
            params["observation_start"] = start.isoformat()
        if end:
            params["observation_end"] = end.isoformat()
        if frequency:
            params["frequency"] = frequency
        if units:
            params["units"] = units

        data = await self._request("series/observations", params)

        observations = []
        for obs in data.get("observations", []):
            # FRED returns "." for missing values
            value_str = obs.get("value", ".")
            value = None if value_str in (".", "") else float(value_str)

            observations.append(
                Observation(
                    date=date.fromisoformat(obs["date"]),
                    value=value
                )
            )

        if not observations:
            raise SymbolNotFoundError(series_id, provider=self.name)

        return FredSeriesObservations(
            series_id=series_id,
            observations=observations,
            metadata=ProviderMetadata(
                provider=self.name,
                fetched_at=datetime.utcnow(),
                delayed=False,
                cached=True
            )
        )

    @cached(ttl=settings.CACHE_TTL_FRED_OBSERVATIONS, key_prefix="fred")
    async def get_yield_curve(self, date_obj: Optional[date] = None) -> YieldCurve:
        """
        Get Treasury yield curve for a given date.
        Uses a 14-day lookback window and concurrent requests so weekends/holidays
        always resolve to the latest published observation for each maturity.
        """
        import asyncio
        from datetime import timedelta

        target_date = date_obj or date.today()
        lookback_start = target_date - timedelta(days=14)

        async def _fetch_point(maturity: str, series_id: str) -> Optional[YieldCurvePoint]:
            try:
                obs = await self.get_fred_series_observations(
                    series_id=series_id,
                    start=lookback_start,
                    end=target_date
                )
                valid_values = [o.value for o in obs.observations if o.value is not None]
                if valid_values:
                    return YieldCurvePoint(maturity=maturity, yield_rate=valid_values[-1])
            except Exception as e:
                logger.warning(f"Failed to fetch yield curve data for {maturity} ({series_id}): {e}")
            return None

        points = await asyncio.gather(
            *[_fetch_point(m, sid) for m, sid in self.YIELD_CURVE_SERIES.items()]
        )
        curve_data = [pt for pt in points if pt is not None]

        return YieldCurve(
            date=target_date,
            curve=curve_data,
            metadata=ProviderMetadata(
                provider=self.name,
                fetched_at=datetime.utcnow(),
                delayed=False,
                cached=True
            )
        )

    async def health_check(self) -> bool:
        """Check FRED API health."""
        try:
            await self._request("category", {"category_id": 0})
            return True
        except Exception as e:
            logger.error(f"FRED health check failed: {e}")
            return False

    async def close(self) -> None:
        """Close HTTP client."""
        if self.http_client:
            await self.http_client.aclose()
