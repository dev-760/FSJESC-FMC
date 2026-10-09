import pytest
from datetime import date

from app.utils.symbols import SymbolNormalizer
from app.models.common import AssetClass
from app.core.errors import InvalidParameterError


class TestSymbolNormalizer:
    """Test symbol normalization."""

    def test_normalize_forex(self):
        """Test forex symbol normalization."""
        # Various formats
        assert SymbolNormalizer.normalize("EURUSD", AssetClass.FOREX) == "EURUSD=X"
        assert SymbolNormalizer.normalize("EUR/USD", AssetClass.FOREX) == "EURUSD=X"
        assert SymbolNormalizer.normalize("eurusd", AssetClass.FOREX) == "EURUSD=X"
        assert SymbolNormalizer.normalize("EURUSD=X", AssetClass.FOREX) == "EURUSD=X"

    def test_normalize_crypto(self):
        """Test crypto symbol normalization."""
        assert SymbolNormalizer.normalize("BTC", AssetClass.CRYPTO) == "BTC-USD"
        assert SymbolNormalizer.normalize("ETH", AssetClass.CRYPTO) == "ETH-USD"
        assert SymbolNormalizer.normalize("btc", AssetClass.CRYPTO) == "BTC-USD"
        assert SymbolNormalizer.normalize("BTC-USD", AssetClass.CRYPTO) == "BTC-USD"

    def test_normalize_futures(self):
        """Test futures symbol normalization."""
        assert SymbolNormalizer.normalize("ES", AssetClass.FUTURES) == "ES=F"
        assert SymbolNormalizer.normalize("GC", AssetClass.FUTURES) == "GC=F"
        assert SymbolNormalizer.normalize("CL", AssetClass.FUTURES) == "CL=F"
        assert SymbolNormalizer.normalize("ES=F", AssetClass.FUTURES) == "ES=F"

    def test_normalize_stocks(self):
        """Test stock symbol normalization."""
        assert SymbolNormalizer.normalize("AAPL", AssetClass.STOCKS) == "AAPL"
        assert SymbolNormalizer.normalize("aapl", AssetClass.STOCKS) == "AAPL"

    def test_invalid_symbol(self):
        """Test invalid symbol raises error."""
        with pytest.raises(InvalidParameterError):
            SymbolNormalizer.normalize("", AssetClass.STOCKS)

        with pytest.raises(InvalidParameterError):
            SymbolNormalizer.normalize("INV@LID", AssetClass.STOCKS)

    def test_validate_interval(self):
        """Test interval validation."""
        valid_intervals = ["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"]
        for interval in valid_intervals:
            assert SymbolNormalizer.validate_interval(interval) == interval

        with pytest.raises(InvalidParameterError):
            SymbolNormalizer.validate_interval("invalid")

    def test_validate_date_range(self):
        """Test date range validation."""
        start = "2026-01-01"
        end = "2026-01-31"

        # Valid range
        validated_start, validated_end = SymbolNormalizer.validate_date_range(
            start, end, "1d"
        )
        assert validated_start == start
        assert validated_end == end

        # Invalid: start after end
        with pytest.raises(InvalidParameterError):
            SymbolNormalizer.validate_date_range(end, start, "1d")

        # Invalid: 1-minute data > 7 days
        with pytest.raises(InvalidParameterError):
            SymbolNormalizer.validate_date_range(
                "2026-01-01", "2026-01-15", "1m"
            )

        # Valid: 1-minute data <= 7 days
        validated_start, validated_end = SymbolNormalizer.validate_date_range(
            "2026-01-01", "2026-01-07", "1m"
        )
        assert validated_start == "2026-01-01"
        assert validated_end == "2026-01-07"
