import httpx
from typing import Optional, List
from datetime import datetime, date
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.providers.base import Provider, ProviderCapabilities
from app.models.common import Quote, Candle, HistoryResponse, SearchResults, AssetClass, ProviderMetadata, MarketState
from app.models.cse import (
    CSESharePricesResponse,
    CSERealtimePrice,
    CSEOrderBook,
    CSEInstrumentDetail,
    CSEHistoricalPricesResponse,
    CSESectorSummaryResponse,
)
from app.core.config import settings
from app.core.errors import ProviderError, SymbolNotFoundError, InvalidParameterError
from app.core.logging import get_logger
from app.core.cache import cached

logger = get_logger(__name__)


class CSEProvider(Provider):
    """Casablanca Stock Exchange (Bourse de Casablanca) provider implementation."""

    BASE_URL = "https://api.parse.bot/scraper/895e457a-a94a-422a-805c-c5cc4c51a15c"

    def __init__(self, api_key: Optional[str] = None, http_client: Optional[httpx.AsyncClient] = None):
        self.api_key = api_key
        self.http_client = http_client
        self.capabilities = ProviderCapabilities(
            quotes=True,
            history=True,
            batch_quotes=True,
            search=True,
            forex_rates=False,
            forex_history=False,
            forex_convert=False,
            yield_curve=False,
            fred_series=False,
            options_chain=False,
            options_expirations=False,
        )
        super().__init__("CSE")

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
        """Make a request to CSE API."""
        client = await self._get_http_client()
        url = f"{self.BASE_URL}/{endpoint}"
        headers = {}

        if self.api_key:
            headers["X-API-Key"] = self.api_key

        logger.debug(f"CSE request: {url} with params {params}")

        response = await client.get(url, params=params, headers=headers)
        response.raise_for_status()

        data = response.json()

        # Check for API errors
        if data.get("status") != "success":
            error_msg = data.get("error", "Unknown error")
            # Check for input_not_found error
            if "input_not_found" in str(data):
                raise SymbolNotFoundError(params.get("ticker", "unknown"), provider=self.name)
            raise ProviderError(
                message=error_msg,
                provider=self.name,
                details=data
            )

        return data.get("data", {})

    @cached(ttl=settings.CACHE_TTL_QUOTES, key_prefix="cse")
    async def get_quote(self, symbol: str, asset_class: AssetClass) -> Quote:
        """Get current quote for a CSE ticker."""
        data = await self._request("get_realtime_price", {"ticker": symbol})

        return Quote(
            symbol=data["ticker"],
            name=data["company"],
            asset_class=asset_class,
            currency=data.get("currency", "MAD"),
            price=data.get("closing_price") or 0.0,
            change=None,
            change_percent=data.get("change_percent"),
            open=data.get("opening_price"),
            high=data.get("high_price"),
            low=data.get("low_price"),
            prev_close=data.get("reference_price"),
            volume=data.get("quantity_traded"),
            market_cap=data.get("market_cap"),
            exchange="CSE",
            market_state=MarketState.OPEN if data.get("session_status") == "open" else MarketState.CLOSED,
            timestamp=datetime.utcnow(),
            metadata=ProviderMetadata(
                provider=self.name,
                fetched_at=datetime.utcnow(),
                delayed=True,  # CSE data is delayed ~15 min
                cached=True
            )
        )

    @cached(ttl=settings.CACHE_TTL_DAILY, key_prefix="cse")
    async def get_history(
        self,
        symbol: str,
        asset_class: AssetClass,
        start: date,
        end: date,
        interval: str = "1d"
    ) -> HistoryResponse:
        """Get historical data for a CSE ticker."""
        if interval != "1d":
            raise InvalidParameterError("CSE only supports daily interval")

        # Fetch all pages
        all_prices = []
        page = 1
        page_size = 1000
        has_more = True

        while has_more:
            params = {
                "ticker": symbol,
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
                "page": page,
                "page_size": page_size
            }

            data = await self._request("get_historical_prices", params)
            all_prices.extend(data.get("prices", []))
            has_more = data.get("has_more", False)
            page += 1

        candles = []
        for price in all_prices:
            candles.append(
                Candle(
                    timestamp=datetime.fromisoformat(price["date"]),
                    open=price.get("opening_price") or 0.0,
                    high=price.get("high_price") or 0.0,
                    low=price.get("low_price") or 0.0,
                    close=price.get("closing_price") or 0.0,
                    volume=price.get("quantity_traded")
                )
            )

        return HistoryResponse(
            symbol=symbol,
            asset_class=asset_class,
            interval=interval,
            currency="MAD",
            candles=candles,
            metadata=ProviderMetadata(
                provider=self.name,
                fetched_at=datetime.utcnow(),
                delayed=True,
                cached=True
            ),
            start=start,
            end=end
        )

    async def get_batch_quotes(
        self,
        symbols: List[str],
        asset_class: AssetClass
    ) -> List[Quote]:
        """Get quotes for multiple CSE tickers."""
        # CSE doesn't have a batch endpoint, so we'll fetch all and filter
        data = await self._request("get_share_prices", {})

        quotes = []
        for company in data.get("companies", []):
            if company["ticker"] in symbols:
                quotes.append(
                    Quote(
                        symbol=company["ticker"],
                        name=company["company"],
                        asset_class=asset_class,
                        currency="MAD",
                        price=company.get("closing_price") or 0.0,
                        change=None,
                        change_percent=company.get("change_percent"),
                        open=company.get("opening_price"),
                        high=company.get("high_price"),
                        low=company.get("low_price"),
                        prev_close=company.get("reference_price"),
                        volume=company.get("quantity_traded"),
                        market_cap=company.get("market_cap"),
                        exchange="CSE",
                        market_state=MarketState.OPEN if company["status"] == "T" else MarketState.CLOSED,
                        timestamp=datetime.utcnow(),
                        metadata=ProviderMetadata(
                            provider=self.name,
                            fetched_at=datetime.utcnow(),
                            delayed=True,
                            cached=False
                        )
                    )
                )

        return quotes

    @cached(ttl=settings.CACHE_TTL_QUOTES, key_prefix="cse")
    async def search(self, query: str, asset_class: Optional[AssetClass] = None) -> List[SearchResults]:
        """Search for CSE symbols."""
        # Try searching by company name
        data = await self._request("get_share_prices", {"company": query})

        results = []
        for company in data.get("companies", []):
            results.append(
                SearchResults(
                    symbol=company["ticker"],
                    name=company["company"],
                    asset_class=AssetClass.STOCKS,
                    exchange="CSE",
                    type=company["sector"]
                )
            )

        return results

    async def get_all_share_prices(
        self,
        sector: Optional[str] = None,
        company: Optional[str] = None
    ) -> CSESharePricesResponse:
        """Get all share prices with optional filters."""
        params = {}
        if sector:
            params["sector"] = sector
        if company:
            params["company"] = company

        data = await self._request("get_share_prices", params)

        companies = [
            CSESharePrice(**company) for company in data.get("companies", [])
        ]

        return CSESharePricesResponse(
            companies=companies,
            total_companies=data.get("total_companies", 0)
        )

    async def get_order_book(self, ticker: str) -> CSEOrderBook:
        """Get order book for a ticker."""
        data = await self._request("get_order_book", {"ticker": ticker})

        return CSEOrderBook(**data)

    async def get_instrument_detail(self, ticker: str) -> CSEInstrumentDetail:
        """Get full instrument detail."""
        data = await self._request("get_instrument_detail", {"ticker": ticker})

        # Parse nested objects
        instrument_data = {
            "isin": data.get("isin"),
            "ticker": data.get("ticker"),
            "company": data.get("company"),
            "sector": data.get("sector"),
            "compartment": data.get("compartment"),
            "quotation_group": data.get("quotation_group"),
            "currency": data.get("currency"),
            "nominal_value": data.get("nominal_value"),
            "shares_outstanding": data.get("shares_outstanding"),
            "founded_date": data.get("founded_date"),
            "listing_date": data.get("listing_date"),
            "address": data.get("address"),
            "auditor": data.get("auditor"),
            "website": data.get("website"),
            "instrument_url": data.get("instrument_url"),
        }

        # Add nested objects if present
        if "quote" in data and data["quote"]:
            instrument_data["quote"] = CSERealtimePrice(**data["quote"])
        if "performance" in data and data["performance"]:
            instrument_data["performance"] = CSEPerformance(**data["performance"])
        if "shareholders" in data:
            instrument_data["shareholders"] = [CSEShareholder(**s) for s in data.get("shareholders", [])]
        if "management" in data:
            instrument_data["management"] = [CSEManagement(**m) for m in data.get("management", [])]
        if "ratios" in data:
            instrument_data["ratios"] = [CSERatios(**r) for r in data.get("ratios", [])]
        if "financials" in data:
            instrument_data["financials"] = [CSEFinancials(**f) for f in data.get("financials", [])]
        if "dividends" in data:
            instrument_data["dividends"] = [CSEDividend(**d) for d in data.get("dividends", [])]
        if "capital_increases" in data:
            instrument_data["capital_increases"] = [CSECapitalIncrease(**c) for c in data.get("capital_increases", [])]

        return CSEInstrumentDetail(**instrument_data)

    async def get_sector_summary(self, sector: Optional[str] = None) -> CSESectorSummaryResponse:
        """Get sector summary."""
        params = {}
        if sector:
            params["sector"] = sector

        data = await self._request("get_sector_summary", params)

        sectors = [CSESectorSummary(**s) for s in data.get("sectors", [])]

        return CSESectorSummaryResponse(
            sectors=sectors,
            session_date=data.get("session_date"),
            session_status=data.get("session_status"),
            total_sectors=data.get("total_sectors", 0)
        )

    async def health_check(self) -> bool:
        """Check CSE API health."""
        try:
            await self._request("get_share_prices", {})
            return True
        except Exception as e:
            logger.error(f"CSE health check failed: {e}")
            return False

    async def close(self) -> None:
        """Close HTTP client."""
        if self.http_client:
            await self.http_client.aclose()
