import httpx
from typing import Optional
from datetime import datetime, date
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.providers.base import Provider, ProviderCapabilities
from app.models.common import Quote, Candle, HistoryResponse, SearchResults, AssetClass, ProviderMetadata
from app.models.forex import ForexRate, ForexTimeSeries, ConversionResult, CurrencyInfo
from app.core.config import settings
from app.core.errors import ProviderError, SymbolNotFoundError
from app.core.logging import get_logger
from app.core.cache import cached

logger = get_logger(__name__)


class FrankfurterProvider(Provider):
    """Frankfurter (ECB exchange rates) provider implementation."""

    def __init__(self, base_url: Optional[str] = None, http_client: Optional[httpx.AsyncClient] = None):
        self.base_url = base_url or settings.FRANKFURTER_BASE_URL
        self.http_client = http_client
        self.capabilities = ProviderCapabilities(
            quotes=False,
            history=False,
            batch_quotes=False,
            search=False,
            forex_rates=True,
            forex_history=True,
            forex_convert=True,
            yield_curve=False,
            fred_series=False,
            options_chain=False,
            options_expirations=False,
        )
        super().__init__("Frankfurter")

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
        """Make a request to Frankfurter API."""
        client = await self._get_http_client()
        url = f"{self.base_url}/{endpoint}"
        logger.debug(f"Frankfurter request: {url} with params {params}")

        response = await client.get(url, params=params)
        response.raise_for_status()

        data = response.json()

        # Check for Frankfurter errors
        if "error" in data and isinstance(data.get("error"), dict):
            error_data = data["error"]
            if "message" in error_data:
                raise ProviderError(
                    message=error_data["message"],
                    provider=self.name,
                    details={"status": data.get("status")}
                )

        return data

    async def get_quote(self, symbol: str, asset_class: AssetClass) -> Quote:
        """Frankfurter does not support individual quotes."""
        raise NotImplementedError("Frankfurter does not support individual quotes")

    async def get_history(
        self,
        symbol: str,
        asset_class: AssetClass,
        start: date,
        end: date,
        interval: str = "1d"
    ) -> HistoryResponse:
        """Frankfurter does not support general history."""
        raise NotImplementedError("Frankfurter does not support general history")

    async def get_batch_quotes(
        self,
        symbols: list[str],
        asset_class: AssetClass
    ) -> list[Quote]:
        """Frankfurter does not support batch quotes."""
        raise NotImplementedError("Frankfurter does not support batch quotes")

    async def search(self, query: str, asset_class: Optional[AssetClass] = None) -> list[SearchResults]:
        """Frankfurter does not support search."""
        raise NotImplementedError("Frankfurter does not support search")

    @cached(ttl=settings.CACHE_TTL_FRANKFURTER, key_prefix="frankfurter")
    async def get_forex_rate(
        self,
        base: str,
        quote: str,
        date_obj: Optional[date] = None
    ) -> ForexRate:
        """Get forex exchange rate."""
        params = {"from": base.upper(), "to": quote.upper()}
        if date_obj:
            params["date"] = date_obj.isoformat()

        data = await self._request("rate", params)

        rate_date = date.fromisoformat(data["date"])
        rate = data["rates"][quote.upper()]

        return ForexRate(
            base=base.upper(),
            quote=quote.upper(),
            rate=rate,
            date=rate_date,
            metadata=ProviderMetadata(
                provider=self.name,
                fetched_at=datetime.utcnow(),
                delayed=False,
                cached=True
            )
        )

    @cached(ttl=settings.CACHE_TTL_FRANKFURTER, key_prefix="frankfurter")
    async def get_forex_history(
        self,
        base: str,
        quotes: list[str],
        start: date,
        end: date
    ) -> ForexTimeSeries:
        """Get forex time series."""
        params = {
            "from": base.upper(),
            "to": ",".join(q.upper() for q in quotes),
            "from_date": start.isoformat(),
            "to_date": end.isoformat()
        }

        data = await self._request("rates", params)

        start_date = date.fromisoformat(data["start_date"])
        end_date = date.fromisoformat(data["end_date"])

        # Convert rates dict: {date: {currency: rate}}
        rates_dict: dict[date, dict[str, float]] = {}
        for date_str, rates in data["rates"].items():
            rates_dict[date.fromisoformat(date_str)] = rates

        return ForexTimeSeries(
            base=base.upper(),
            quotes=[q.upper() for q in quotes],
            start_date=start_date,
            end_date=end_date,
            rates=rates_dict,
            metadata=ProviderMetadata(
                provider=self.name,
                fetched_at=datetime.utcnow(),
                delayed=False,
                cached=True
            )
        )

    async def convert_currency(
        self,
        from_currency: str,
        to_currency: str,
        amount: float,
        date_obj: Optional[date] = None
    ) -> ConversionResult:
        """Convert currency using exchange rate."""
        rate_data = await self.get_forex_rate(from_currency, to_currency, date_obj)

        result = amount * rate_data.rate

        return ConversionResult(
            from_currency=from_currency.upper(),
            to_currency=to_currency.upper(),
            amount=amount,
            result=result,
            rate=rate_data.rate,
            date=rate_data.date,
            metadata=rate_data.metadata
        )

    @cached(ttl=settings.CACHE_TTL_FRANKFURTER, key_prefix="frankfurter")
    async def get_currencies(self) -> list[CurrencyInfo]:
        """Get available currencies."""
        data = await self._request("currencies", {})

        currencies = []
        for code, name in data.items():
            currencies.append(
                CurrencyInfo(
                    code=code,
                    name=name
                )
            )

        return currencies

    async def health_check(self) -> bool:
        """Check Frankfurter API health."""
        try:
            await self._request("currencies", {})
            return True
        except Exception as e:
            logger.error(f"Frankfurter health check failed: {e}")
            return False

    async def close(self) -> None:
        """Close HTTP client."""
        if self.http_client:
            await self.http_client.aclose()
