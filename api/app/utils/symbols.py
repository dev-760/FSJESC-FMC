import re
from typing import Optional

from app.models.common import AssetClass
from app.providers.yfinance_provider import YFinanceProvider
from app.core.errors import InvalidParameterError
from app.core.logging import get_logger

logger = get_logger(__name__)


class SymbolNormalizer:
    """Normalizes symbols for different asset classes and providers."""

    # Futures symbol mapping (short -> yfinance format)
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

    # Crypto symbol mapping (short -> yfinance format)
    CRYPTO_MAPPING = {
        "BTC": "BTC-USD",
        "ETH": "ETH-USD",
        "BNB": "BNB-USD",
        "XRP": "XRP-USD",
        "ADA": "ADA-USD",
        "DOGE": "DOGE-USD",
        "SOL": "SOL-USD",
        "DOT": "DOT-USD",
        "MATIC": "MATIC-USD",
        "AVAX": "AVAX-USD",
    }

    @staticmethod
    def normalize(symbol: str, asset_class: AssetClass) -> str:
        """
        Normalize a symbol for the given asset class.

        Args:
            symbol: Input symbol (may be in various formats)
            asset_class: Target asset class

        Returns:
            Normalized symbol

        Raises:
            InvalidParameterError: If symbol is invalid
        """
        if not symbol:
            raise InvalidParameterError("Symbol cannot be empty")

        symbol = symbol.strip().upper()

        # Validate basic format
        if not re.match(r'^[A-Z0-9/=-]+$', symbol):
            raise InvalidParameterError(f"Invalid symbol format: {symbol}")

        # Normalize based on asset class
        if asset_class == AssetClass.FOREX:
            return SymbolNormalizer._normalize_forex(symbol)
        elif asset_class == AssetClass.CRYPTO:
            return SymbolNormalizer._normalize_crypto(symbol)
        elif asset_class == AssetClass.FUTURES:
            return SymbolNormalizer._normalize_futures(symbol)
        else:
            # For stocks, ETFs, bonds, options - just uppercase and return
            return symbol

    @staticmethod
    def _normalize_forex(symbol: str) -> str:
        """Normalize forex symbol to yfinance format (e.g., EURUSD -> EURUSD=X)."""
        # Remove slashes and spaces
        symbol = symbol.replace("/", "").replace(" ", "")

        # Validate forex pair format (6 characters: 3 for base, 3 for quote)
        if len(symbol) == 6:
            return f"{symbol}=X"

        # If already in yfinance format, return as-is
        if symbol.endswith("=X"):
            return symbol

        raise InvalidParameterError(f"Invalid forex symbol format: {symbol}. Expected format: EURUSD or EUR/USD")

    @staticmethod
    def _normalize_crypto(symbol: str) -> str:
        """Normalize crypto symbol to yfinance format (e.g., BTC -> BTC-USD)."""
        # Check mapping
        if symbol in SymbolNormalizer.CRYPTO_MAPPING:
            return SymbolNormalizer.CRYPTO_MAPPING[symbol]

        # If already in yfinance format, return as-is
        if "-" in symbol:
            return symbol

        # Try to infer format (add -USD)
        if len(symbol) >= 2 and len(symbol) <= 5:
            return f"{symbol}-USD"

        raise InvalidParameterError(f"Invalid crypto symbol format: {symbol}")

    @staticmethod
    def _normalize_futures(symbol: str) -> str:
        """Normalize futures symbol to yfinance format (e.g., ES -> ES=F)."""
        # Check mapping
        if symbol in SymbolNormalizer.FUTURES_MAPPING:
            return SymbolNormalizer.FUTURES_MAPPING[symbol]

        # If already in yfinance format, return as-is
        if symbol.endswith("=F"):
            return symbol

        raise InvalidParameterError(f"Invalid futures symbol: {symbol}. Known symbols: {', '.join(SymbolNormalizer.FUTURES_MAPPING.keys())}")

    @staticmethod
    def validate_interval(interval: str) -> str:
        """
        Validate and normalize interval string.

        Args:
            interval: Interval string (e.g., "1m", "5m", "1d", "1wk", "1mo")

        Returns:
            Validated interval string

        Raises:
            InvalidParameterError: If interval is invalid
        """
        valid_intervals = ["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"]
        interval = interval.lower()

        if interval not in valid_intervals:
            raise InvalidParameterError(
                f"Invalid interval: {interval}. Valid intervals: {', '.join(valid_intervals)}"
            )

        return interval

    @staticmethod
    def validate_date_range(start: str, end: str, interval: str) -> tuple[str, str]:
        """
        Validate date range based on interval constraints.

        Args:
            start: Start date string (ISO format)
            end: End date string (ISO format)
            interval: Data interval

        Returns:
            Tuple of (start, end) dates

        Raises:
            InvalidParameterError: If date range is invalid
        """
        from datetime import datetime, timedelta

        try:
            start_dt = datetime.fromisoformat(start)
            end_dt = datetime.fromisoformat(end)
        except ValueError:
            raise InvalidParameterError("Invalid date format. Use ISO format (YYYY-MM-DD)")

        if start_dt > end_dt:
            raise InvalidParameterError("Start date must be before end date")

        # yfinance 1-minute data is limited to ~7 days
        if interval == "1m":
            max_days = 7
            if (end_dt - start_dt).days > max_days:
                raise InvalidParameterError(
                    f"1-minute interval data is limited to {max_days} days. "
                    f"Requested range: {(end_dt - start_dt).days} days"
                )

        return start, end
