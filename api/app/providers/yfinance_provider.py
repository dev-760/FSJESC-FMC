import asyncio
import yfinance as yf
import pandas as pd
from typing import Optional
from datetime import datetime, date, timedelta
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.providers.base import Provider, ProviderCapabilities
from app.models.common import Quote, Candle, HistoryResponse, SearchResults, AssetClass, ProviderMetadata, MarketState
from app.models.options import OptionChain, OptionExpirations, OptionContract
from app.core.config import settings
from app.core.errors import ProviderError, SymbolNotFoundError
from app.core.logging import get_logger
from app.core.cache import cached

logger = get_logger(__name__)


class YFinanceProvider(Provider):
    """yfinance (Yahoo Finance) provider implementation with async wrapping."""

    # Futures symbol mapping
    FUTURES_MAPPING = {
        "ES": "ES=F",  # S&P 500 E-mini
        "NQ": "NQ=F",  # NASDAQ 100 E-mini
        "YM": "YM=F",  # Dow Jones E-mini
        "RTY": "RTY=F",  # Russell 2000 E-mini
        "GC": "GC=F",  # Gold
        "SI": "SI=F",  # Silver
        "CL": "CL=F",  # Crude Oil
        "NG": "NG=F",  # Natural Gas
        "ZN": "ZN=F",  # 10-Year T-Note
        "ZB": "ZB=F",  # 30-Year T-Bond
    }

    def __init__(self):
        self.capabilities = ProviderCapabilities(
            quotes=True,
            history=True,
            batch_quotes=True,
            search=True,
            forex_rates=True,
            forex_history=True,
            forex_convert=False,
            yield_curve=False,
            fred_series=False,
            options_chain=True,
            options_expirations=True,
        )
        super().__init__("yfinance")

    def _run_sync(self, func, *args, **kwargs):
        """Run a synchronous function in a thread pool."""
        return asyncio.to_thread(func, *args, **kwargs)

    def _convert_to_float(self, value) -> Optional[float]:
        """Convert pandas value to float, handling NaN/NaT."""
        if pd.isna(value):
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    def _convert_timestamp(self, ts) -> datetime:
        """Convert pandas timestamp to UTC datetime."""
        if pd.isna(ts):
            return datetime.utcnow()
        if isinstance(ts, datetime):
            return ts
        if isinstance(ts, pd.Timestamp):
            return ts.to_pydatetime()
        return datetime.utcnow()

    @cached(ttl=settings.CACHE_TTL_QUOTES, key_prefix="yfinance")
    async def get_quote(self, symbol: str, asset_class: AssetClass) -> Quote:
        """Get current quote for a symbol."""

        def _get_quote_sync():
            ticker = yf.Ticker(symbol)
            info = ticker.info
            fast_info = ticker.fast_info

            # Use fast_info for price when available (faster)
            price = self._convert_to_float(fast_info.get("last_price") if fast_info else None)
            if price is None:
                price = self._convert_to_float(info.get("currentPrice") or info.get("regularMarketPrice"))

            # Market state
            market_state = MarketState.CLOSED
            if fast_info:
                if fast_info.get("market_state") == "REGULAR":
                    market_state = MarketState.OPEN
                elif fast_info.get("market_state") == "PRE":
                    market_state = MarketState.PRE_MARKET
                elif fast_info.get("market_state") == "POST":
                    market_state = MarketState.AFTER_HOURS

            return Quote(
                symbol=symbol,
                name=info.get("longName") or info.get("shortName"),
                asset_class=asset_class,
                currency=info.get("currency", "USD"),
                price=price or 0.0,
                change=self._convert_to_float(info.get("regularMarketChange")),
                change_percent=self._convert_to_float(info.get("regularMarketChangePercent")),
                open=self._convert_to_float(info.get("regularMarketOpen")),
                high=self._convert_to_float(info.get("regularMarketDayHigh")),
                low=self._convert_to_float(info.get("regularMarketDayLow")),
                prev_close=self._convert_to_float(info.get("previousClose")),
                volume=self._convert_to_float(info.get("regularMarketVolume")),
                market_cap=self._convert_to_float(info.get("marketCap")),
                exchange=info.get("exchange"),
                market_state=market_state,
                timestamp=datetime.utcnow(),
                metadata=ProviderMetadata(
                    provider=self.name,
                    fetched_at=datetime.utcnow(),
                    delayed=True,  # yfinance data is delayed
                    cached=True
                )
            )

        try:
            return await self._run_sync(_get_quote_sync)
        except Exception as e:
            logger.error(f"yfinance quote error for {symbol}: {e}")
            raise SymbolNotFoundError(symbol, provider=self.name)

    async def get_history(
        self,
        symbol: str,
        asset_class: AssetClass,
        start: date,
        end: date,
        interval: str = "1d"
    ) -> HistoryResponse:
        """Get historical data for a symbol."""

        # Determine cache TTL based on interval
        ttl = settings.CACHE_TTL_INTRADAY if interval in ["1m", "5m", "15m", "1h"] else settings.CACHE_TTL_DAILY

        @cached(ttl=ttl, key_prefix="yfinance")
        async def _get_cached_history():
            def _get_history_sync():
                ticker = yf.Ticker(symbol)
                df = ticker.history(start=start, end=end, interval=interval)

                if df.empty:
                    raise SymbolNotFoundError(symbol, provider=self.name)

                candles = []
                for idx, row in df.iterrows():
                    candles.append(
                        Candle(
                            timestamp=self._convert_timestamp(idx),
                            open=self._convert_to_float(row.get("Open")) or 0.0,
                            high=self._convert_to_float(row.get("High")) or 0.0,
                            low=self._convert_to_float(row.get("Low")) or 0.0,
                            close=self._convert_to_float(row.get("Close")) or 0.0,
                            volume=self._convert_to_float(row.get("Volume"))
                        )
                    )

                return HistoryResponse(
                    symbol=symbol,
                    asset_class=asset_class,
                    interval=interval,
                    currency="USD",  # yfinance doesn't always provide currency in history
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

            return await self._run_sync(_get_history_sync)

        try:
            return await _get_cached_history()
        except Exception as e:
            logger.error(f"yfinance history error for {symbol}: {e}")
            raise SymbolNotFoundError(symbol, provider=self.name)

    async def get_batch_quotes(
        self,
        symbols: list[str],
        asset_class: AssetClass
    ) -> list[Quote]:
        """Get quotes for multiple symbols."""

        def _get_batch_quotes_sync():
            # Use download for batch
            df = yf.download(symbols, period="1d", interval="1d", group_by="ticker", progress=False)

            quotes = []
            for symbol in symbols:
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    fast_info = ticker.fast_info

                    price = self._convert_to_float(fast_info.get("last_price") if fast_info else None)
                    if price is None:
                        price = self._convert_to_float(info.get("currentPrice") or info.get("regularMarketPrice"))

                    quotes.append(
                        Quote(
                            symbol=symbol,
                            name=info.get("longName") or info.get("shortName"),
                            asset_class=asset_class,
                            currency=info.get("currency", "USD"),
                            price=price or 0.0,
                            change=self._convert_to_float(info.get("regularMarketChange")),
                            change_percent=self._convert_to_float(info.get("regularMarketChangePercent")),
                            open=self._convert_to_float(info.get("regularMarketOpen")),
                            high=self._convert_to_float(info.get("regularMarketDayHigh")),
                            low=self._convert_to_float(info.get("regularMarketDayLow")),
                            prev_close=self._convert_to_float(info.get("previousClose")),
                            volume=self._convert_to_float(info.get("regularMarketVolume")),
                            market_cap=self._convert_to_float(info.get("marketCap")),
                            exchange=info.get("exchange"),
                            market_state=MarketState.CLOSED,
                            timestamp=datetime.utcnow(),
                            metadata=ProviderMetadata(
                                provider=self.name,
                                fetched_at=datetime.utcnow(),
                                delayed=True,
                                cached=False
                            )
                        )
                    )
                except Exception as e:
                    logger.warning(f"Failed to get quote for {symbol}: {e}")
                    continue

            return quotes

        try:
            return await self._run_sync(_get_batch_quotes_sync)
        except Exception as e:
            logger.error(f"yfinance batch quotes error: {e}")
            raise ProviderError(message="Failed to fetch batch quotes", provider=self.name)

    async def search(self, query: str, asset_class: Optional[AssetClass] = None) -> list[SearchResults]:
        """Search for symbols using yfinance."""

        def _search_sync():
            # yfinance doesn't have a built-in search, so we'll try to get info
            # This is a limitation - we can't do true search
            ticker = yf.Ticker(query)
            info = ticker.info

            if not info or "quoteType" not in info:
                return []

            return [
                SearchResults(
                    symbol=query.upper(),
                    name=info.get("longName") or info.get("shortName"),
                    asset_class=asset_class,
                    exchange=info.get("exchange"),
                    type=info.get("quoteType")
                )
            ]

        try:
            return await self._run_sync(_search_sync)
        except Exception as e:
            logger.warning(f"yfinance search failed for {query}: {e}")
            return []

    async def get_forex_rate(
        self,
        base: str,
        quote: str,
        date_obj: Optional[date] = None
    ) -> Quote:
        """Get forex rate using yfinance forex symbols."""
        # yfinance uses format like EURUSD=X
        symbol = f"{base.upper()}{quote.upper()}=X"
        return await self.get_quote(symbol, AssetClass.FOREX)

    async def get_options_expirations(self, symbol: str) -> OptionExpirations:
        """Get option expiration dates."""

        def _get_expirations_sync():
            ticker = yf.Ticker(symbol)
            expirations = ticker.options

            if not expirations:
                raise SymbolNotFoundError(symbol, provider=self.name)

            expiration_dates = [date.fromisoformat(exp) for exp in expirations]

            return OptionExpirations(
                symbol=symbol,
                expirations=expiration_dates,
                metadata=ProviderMetadata(
                    provider=self.name,
                    fetched_at=datetime.utcnow(),
                    delayed=True,
                    cached=False
                )
            )

        try:
            return await self._run_sync(_get_expirations_sync)
        except Exception as e:
            logger.error(f"yfinance options expirations error for {symbol}: {e}")
            raise SymbolNotFoundError(symbol, provider=self.name)

    async def get_options_chain(
        self,
        symbol: str,
        expiration: date,
        option_type: Optional[str] = "all",
        min_strike: Optional[float] = None,
        max_strike: Optional[float] = None,
        in_the_money: Optional[bool] = None
    ) -> OptionChain:
        """Get option chain."""

        def _get_chain_sync():
            ticker = yf.Ticker(symbol)
            exp_str = expiration.isoformat()

            calls_df = ticker.option_chain(exp_str).calls
            puts_df = ticker.option_chain(exp_str).puts

            calls = []
            for _, row in calls_df.iterrows():
                contract = OptionContract(
                    contract_symbol=row.get("contractSymbol", ""),
                    type="call",
                    strike=self._convert_to_float(row.get("strike")) or 0.0,
                    expiration=expiration,
                    last_price=self._convert_to_float(row.get("lastPrice")),
                    bid=self._convert_to_float(row.get("bid")),
                    ask=self._convert_to_float(row.get("ask")),
                    volume=self._convert_to_float(row.get("volume")),
                    open_interest=self._convert_to_float(row.get("openInterest")),
                    implied_volatility=self._convert_to_float(row.get("impliedVolatility")),
                    in_the_money=bool(row.get("inTheMoney", False))
                )

                # Apply filters
                if min_strike and contract.strike < min_strike:
                    continue
                if max_strike and contract.strike > max_strike:
                    continue
                if in_the_money is not None and contract.in_the_money != in_the_money:
                    continue

                calls.append(contract)

            puts = []
            for _, row in puts_df.iterrows():
                contract = OptionContract(
                    contract_symbol=row.get("contractSymbol", ""),
                    type="put",
                    strike=self._convert_to_float(row.get("strike")) or 0.0,
                    expiration=expiration,
                    last_price=self._convert_to_float(row.get("lastPrice")),
                    bid=self._convert_to_float(row.get("bid")),
                    ask=self._convert_to_float(row.get("ask")),
                    volume=self._convert_to_float(row.get("volume")),
                    open_interest=self._convert_to_float(row.get("openInterest")),
                    implied_volatility=self._convert_to_float(row.get("impliedVolatility")),
                    in_the_money=bool(row.get("inTheMoney", False))
                )

                # Apply filters
                if min_strike and contract.strike < min_strike:
                    continue
                if max_strike and contract.strike > max_strike:
                    continue
                if in_the_money is not None and contract.in_the_money != in_the_money:
                    continue

                puts.append(contract)

            return OptionChain(
                symbol=symbol,
                expiration=expiration,
                calls=calls,
                puts=puts,
                metadata=ProviderMetadata(
                    provider=self.name,
                    fetched_at=datetime.utcnow(),
                    delayed=True,
                    cached=False
                )
            )

        try:
            return await self._run_sync(_get_chain_sync)
        except Exception as e:
            logger.error(f"yfinance options chain error for {symbol}: {e}")
            raise SymbolNotFoundError(symbol, provider=self.name)

    async def health_check(self) -> bool:
        """Check yfinance health."""
        try:
            ticker = yf.Ticker("AAPL")
            info = ticker.info
            return bool(info)
        except Exception as e:
            logger.error(f"yfinance health check failed: {e}")
            return False
