from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from datetime import date

from app.models.forex import ForexRate, ForexTimeSeries, ConversionResult, CurrencyInfo
from app.providers.router import ProviderName
from app.services.forex import ForexService
from app.core.errors import MarketDataError, InvalidParameterError
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/forex", tags=["forex"])


def get_forex_service() -> ForexService:
    """Dependency to get forex service."""
    from app.providers.router import router as provider_router
    return ForexService(provider_router)


@router.get("/rates", response_model=ForexRate)
async def get_forex_rates(
    base: str = Query(..., description="Base currency (e.g., EUR)"),
    symbols: str = Query(..., description="Comma-separated quote currencies (e.g., USD,GBP)"),
    date_obj: Optional[date] = Query(None, description="Optional date (YYYY-MM-DD)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: ForexService = Depends(get_forex_service)
):
    """Get forex exchange rate for a currency pair."""
    try:
        quote_currencies = [s.strip().upper() for s in symbols.split(",") if s.strip()]
        if not quote_currencies:
            raise InvalidParameterError("At least one quote currency is required")
        return await service.get_forex_rate(base.strip().upper(), quote_currencies[0], date_obj, provider)
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting forex rate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=ForexTimeSeries)
async def get_forex_history(
    base: str = Query(..., description="Base currency (e.g., EUR)"),
    symbols: str = Query(..., description="Comma-separated quote currencies (e.g., USD,GBP)"),
    start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end: date = Query(..., description="End date (YYYY-MM-DD)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: ForexService = Depends(get_forex_service)
):
    """Get forex time series data."""
    try:
        quote_currencies = [s.strip().upper() for s in symbols.split(",") if s.strip()]
        if not quote_currencies:
            raise InvalidParameterError("At least one quote currency is required")
        return await service.get_forex_history(base.strip().upper(), quote_currencies, start, end, provider)
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting forex history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/convert", response_model=ConversionResult)
async def convert_currency(
    from_currency: str = Query(..., alias="from", description="Source currency"),
    to_currency: str = Query(..., alias="to", description="Target currency"),
    amount: float = Query(..., gt=0, description="Amount to convert"),
    date_obj: Optional[date] = Query(None, description="Optional date (YYYY-MM-DD)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: ForexService = Depends(get_forex_service)
):
    """Convert currency amount."""
    try:
        return await service.convert_currency(
            from_currency.strip().upper(),
            to_currency.strip().upper(),
            amount,
            date_obj,
            provider
        )
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error converting currency: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/currencies", response_model=list[CurrencyInfo])
async def get_currencies(
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: ForexService = Depends(get_forex_service)
):
    """Get available currencies."""
    try:
        return await service.get_currencies(provider)
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting currencies: {e}")
        raise HTTPException(status_code=500, detail=str(e))
