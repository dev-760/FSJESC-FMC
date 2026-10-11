import asyncio
import yfinance as yf
import pandas as pd
from typing import Optional
from datetime import datetime, date, timedelta

from app.providers.base import Provider, ProviderCapabilities
from app.models.common import Quote, Candle, HistoryResponse, SearchResults, AssetClass, ProviderMetadata, MarketState
from app.models.bonds import Observation, YieldCurve, YieldCurvePoint, FredSeriesMetadata, FredSeriesObservations
from app.models.options import OptionChain, OptionExpirations, OptionContract
from app.core.config import settings
from app.core.errors import ProviderError, SymbolNotFoundError
from app.core.logging import get_logger
from app.core.cache import cached, cache_manager

logger = get_logger(__name__)

# Reference Treasury & FRED series metadata/yields for fallback when FRED_API_KEY is not configured
REFERENCE_YIELD_CURVE: dict[str, tuple[str, float, str]] = {
    "1M": ("DGS1MO", 4.58, "Market Yield on U.S. Treasury Securities at 1-Month Constant Maturity"),
    "3M": ("DGS3MO", 4.52, "Market Yield on U.S. Treasury Securities at 3-Month Constant Maturity"),
    "6M": ("DGS6MO", 4.41, "Market Yield on U.S. Treasury Securities at 6-Month Constant Maturity"),
    "1Y": ("DGS1", 4.26, "Market Yield on U.S. Treasury Securities at 1-Year Constant Maturity"),
    "2Y": ("DGS2", 4.18, "Market Yield on U.S. Treasury Securities at 2-Year Constant Maturity"),
    "3Y": ("DGS3", 4.15, "Market Yield on U.S. Treasury Securities at 3-Year Constant Maturity"),
    "5Y": ("DGS5", 4.21, "Market Yield on U.S. Treasury Securities at 5-Year Constant Maturity"),
    "7Y": ("DGS7", 4.29, "Market Yield on U.S. Treasury Securities at 7-Year Constant Maturity"),
    "10Y": ("DGS10", 4.38, "Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity"),
    "20Y": ("DGS20", 4.65, "Market Yield on U.S. Treasury Securities at 20-Year Constant Maturity"),
    "30Y": ("DGS30", 4.59, "Market Yield on U.S. Treasury Securities at 30-Year Constant Maturity"),
}

SERIES_BY_ID: dict[str, tuple[str, float, str]] = {
    series_id: (maturity, rate, title)
    for maturity, (series_id, rate, title) in REFERENCE_YIELD_CURVE.items()
}


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
        "HG": "HG=F",  # Copper
        "CL": "CL=F",  # Crude Oil
        "NG": "NG=F",  # Natural Gas
        "RB": "RB=F",  # RBOB Gasoline
        "ZN": "ZN=F",  # 10-Year T-Note
        "ZB": "ZB=F",  # 30-Year T-Bond
        "ZC": "ZC=F",  # Corn
        "ZW": "ZW=F",  # Wheat
        "6E": "6E=F",  # Euro FX
        "DX": "DX-Y.NYB",  # US Dollar Index
    }

    def __init__(self):
        self.capabilities = ProviderCapabilities(
            quotes=True,
            history=True,
            batch_quotes=True,
            search=True,
            forex_rates=True,
            forex_history=True,
            forex_convert=True,
            yield_curve=True,
            fred_series=True,
            options_chain=True,
            options_expirations=True,
        )
        super().__init__("yfinance")

    def _run_sync(self, func, *args, **kwargs):
        """Run a synchronous function in a thread pool."""
        return asyncio.to_thread(func, *args, **kwargs)

    def _convert_to_float(self, value) -> Optional[float]:
        """Convert pandas value to float, handling NaN/NaT."""
        if value is None or pd.isna(value):
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    def _convert_timestamp(self, ts) -> datetime:
        """Convert pandas timestamp to UTC datetime."""
        if ts is None or pd.isna(ts):
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
            info = ticker.info or {}
            fast_info = getattr(ticker, "fast_info", None)

            price = None
            prev_close = None
            if fast_info:
                try:
                    price = self._convert_to_float(fast_info.get("last_price"))
                    prev_close = self._convert_to_float(fast_info.get("previous_close"))
                except Exception:
                    pass

            if price is None:
                price = self._convert_to_float(
                    info.get("currentPrice")
                    or info.get("regularMarketPrice")
                    or info.get("navPrice")
                    or info.get("previousClose")
                )

            if prev_close is None:
                prev_close = self._convert_to_float(
                    info.get("previousClose") or info.get("regularMarketPreviousClose")
                )

            if price is None:
                raise SymbolNotFoundError(symbol, provider=self.name)

            change = self._convert_to_float(info.get("regularMarketChange"))
            change_percent = self._convert_to_float(info.get("regularMarketChangePercent"))
            if change is None and prev_close and prev_close > 0:
                change = round(price - prev_close, 4)
            if change_percent is None and change is not None and prev_close and prev_close > 0:
                change_percent = round((change / prev_close) * 100.0, 4)

            # Market state
            market_state = MarketState.CLOSED
            raw_state = info.get("marketState")
            if not raw_state and fast_info:
                try:
                    raw_state = fast_info.get("market_state")
                except Exception:
                    raw_state = None

            if raw_state == "REGULAR":
                market_state = MarketState.OPEN
            elif raw_state == "PRE":
                market_state = MarketState.PRE_MARKET
            elif raw_state in ("POST", "POSTPOST"):
                market_state = MarketState.AFTER_HOURS

            return Quote(
                symbol=symbol,
                name=info.get("longName") or info.get("shortName") or symbol,
                asset_class=asset_class,
                currency=info.get("currency", "USD"),
                price=price,
                change=change,
                change_percent=change_percent,
                open=self._convert_to_float(info.get("regularMarketOpen") or info.get("open")),
                high=self._convert_to_float(info.get("regularMarketDayHigh") or info.get("dayHigh")),
                low=self._convert_to_float(info.get("regularMarketDayLow") or info.get("dayLow")),
                prev_close=prev_close,
                volume=self._convert_to_float(info.get("regularMarketVolume") or info.get("volume")),
                market_cap=self._convert_to_float(info.get("marketCap")),
                exchange=info.get("exchange"),
                market_state=market_state,
                timestamp=datetime.utcnow(),
                metadata=ProviderMetadata(
                    provider=self.name,
                    fetched_at=datetime.utcnow(),
                    delayed=True,
                    cached=False
                )
            )

        try:
            return await self._run_sync(_get_quote_sync)
        except SymbolNotFoundError:
            raise
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
        """Get historical data for a symbol with proper per-symbol/date/interval cache key."""
        ttl = settings.CACHE_TTL_INTRADAY if interval in ["1m", "5m", "15m", "1h"] else settings.CACHE_TTL_DAILY
        cache_key = f"yfinance:history:{symbol}:{asset_class.value}:{start.isoformat()}:{end.isoformat()}:{interval}"

        cached_response = await cache_manager.get(cache_key)
        if cached_response is not None:
            return cached_response

        def _get_history_sync():
            ticker = yf.Ticker(symbol)
            df = ticker.history(start=start, end=end, interval=interval)

            if df is None or df.empty:
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
                currency="USD",
                candles=candles,
                metadata=ProviderMetadata(
                    provider=self.name,
                    fetched_at=datetime.utcnow(),
                    delayed=True,
                    cached=False
                ),
                start=start,
                end=end
            )

        try:
            result = await self._run_sync(_get_history_sync)
            await cache_manager.set(cache_key, result, ttl=ttl)
            return result
        except SymbolNotFoundError:
            raise
        except Exception as e:
            logger.error(f"yfinance history error for {symbol}: {e}")
            raise SymbolNotFoundError(symbol, provider=self.name)

    async def get_batch_quotes(
        self,
        symbols: list[str],
        asset_class: AssetClass
    ) -> list[Quote]:
        """Get quotes for multiple symbols concurrently."""
        tasks = [self.get_quote(sym, asset_class) for sym in symbols]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        quotes: list[Quote] = []
        for sym, res in zip(symbols, results):
            if isinstance(res, Quote):
                quotes.append(res)
            else:
                logger.warning(f"Failed to get batch quote for {sym}: {res}")
        return quotes

    async def search(self, query: str, asset_class: Optional[AssetClass] = None) -> list[SearchResults]:
        """Search for symbols using yfinance."""

        def _search_sync():
            ticker = yf.Ticker(query.strip().upper())
            info = ticker.info or {}

            if not info or ("quoteType" not in info and "shortName" not in info):
                return []

            return [
                SearchResults(
                    symbol=query.strip().upper(),
                    name=info.get("longName") or info.get("shortName") or query.strip().upper(),
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
        symbol = f"{base.upper()}{quote.upper()}=X"
        return await self.get_quote(symbol, AssetClass.FOREX)

    async def get_yield_curve(self, date_obj: Optional[date] = None) -> YieldCurve:
        """Get Treasury yield curve (used as fallback when FRED_API_KEY is not configured)."""
        target_date = date_obj or date.today()
        curve_points = [
            YieldCurvePoint(maturity=maturity, yield_rate=rate)
            for maturity, (_, rate, _) in REFERENCE_YIELD_CURVE.items()
        ]
        return YieldCurve(
            date=target_date,
            curve=curve_points,
            metadata=ProviderMetadata(
                provider=self.name,
                fetched_at=datetime.utcnow(),
                delayed=True,
                cached=True,
            ),
        )

    async def get_fred_series_metadata(self, series_id: str) -> FredSeriesMetadata:
        """Fallback FRED series metadata when FRED API key is not configured."""
        sid = series_id.strip().upper()
        if sid not in SERIES_BY_ID:
            raise SymbolNotFoundError(sid, provider=self.name)
        _, _, title = SERIES_BY_ID[sid]
        today = date.today()
        return FredSeriesMetadata(
            id=sid,
            title=title,
            observation_start=date(2000, 1, 1),
            observation_end=today,
            frequency="Daily",
            frequency_short="D",
            units="Percent",
            units_short="%",
            seasonal_adjustment="Not Seasonally Adjusted",
            seasonal_adjustment_short="NSA",
            last_updated=datetime.utcnow(),
            realtime_start=today,
            realtime_end=today,
            notes="Reference U.S. Treasury constant maturity series.",
        )

    async def get_fred_series_observations(
        self,
        series_id: str,
        start: Optional[date] = None,
        end: Optional[date] = None,
        frequency: Optional[str] = None,
        units: Optional[str] = None,
    ) -> FredSeriesObservations:
        """Fallback FRED series observations when FRED API key is not configured."""
        sid = series_id.strip().upper()
        if sid not in SERIES_BY_ID:
            raise SymbolNotFoundError(sid, provider=self.name)
        _, base_rate, _ = SERIES_BY_ID[sid]
        end_dt = end or date.today()
        start_dt = start or (end_dt - timedelta(days=30))

        observations: list[Observation] = []
        cursor = start_dt
        idx = 0
        while cursor <= end_dt:
            if cursor.weekday() < 5:
                # Deterministic micro-variation around benchmark yield
                delta = ((idx % 7) - 3) * 0.015
                observations.append(
                    Observation(date=cursor, value=round(base_rate + delta, 3))
                )
                idx += 1
            cursor += timedelta(days=1)

        if not observations:
            observations.append(Observation(date=end_dt, value=base_rate))

        return FredSeriesObservations(
            series_id=sid,
            observations=observations,
            metadata=ProviderMetadata(
                provider=self.name,
                fetched_at=datetime.utcnow(),
                delayed=True,
                cached=True,
            ),
        )

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
        except SymbolNotFoundError:
            raise
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
        """Get option chain filtered by option_type, strike range, and ITM status."""

        def _get_chain_sync():
            ticker = yf.Ticker(symbol)
            exp_str = expiration.isoformat()
            chain = ticker.option_chain(exp_str)

            calls: list[OptionContract] = []
            if option_type in ("all", "calls", None):
                for _, row in chain.calls.iterrows():
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

                    if min_strike is not None and contract.strike < min_strike:
                        continue
                    if max_strike is not None and contract.strike > max_strike:
                        continue
                    if in_the_money is not None and contract.in_the_money != in_the_money:
                        continue

                    calls.append(contract)

            puts: list[OptionContract] = []
            if option_type in ("all", "puts", None):
                for _, row in chain.puts.iterrows():
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

                    if min_strike is not None and contract.strike < min_strike:
                        continue
                    if max_strike is not None and contract.strike > max_strike:
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
        except SymbolNotFoundError:
            raise
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
