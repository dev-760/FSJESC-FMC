from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from datetime import date

from app.models.common import Quote, HistoryResponse, BatchQuotesResponse
from app.providers.router import ProviderName
from app.services.futures import FuturesService
from app.utils.symbols import SymbolNormalizer
from app.core.errors import MarketDataError, InvalidParameterError
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/futures", tags=["futures"])


def get_futures_service() -> FuturesService:
    """Dependency to get futures service."""
    from app.providers.router import router as provider_router
    return FuturesService(provider_router)


@router.get("/quote", response_model=Quote)
async def get_future_quote(
    symbol: str = Query(..., description="Future symbol (e.g., ES or ES=F)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: FuturesService = Depends(get_futures_service)
):
    """Get current quote for a futures contract."""
    try:
        normalized_symbol = SymbolNormalizer.normalize(symbol, "futures")
        return await service.get_quote(normalized_symbol, provider)
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting future quote: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=HistoryResponse)
async def get_future_history(
    symbol: str = Query(..., description="Future symbol (e.g., ES or ES=F)"),
    start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end: date = Query(..., description="End date (YYYY-MM-DD)"),
    interval: str = Query("1d", description="Interval (1m, 5m, 15m, 1h, 1d, 1wk, 1mo)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: FuturesService = Depends(get_futures_service)
):
    """Get historical data for a futures contract."""
    try:
        normalized_symbol = SymbolNormalizer.normalize(symbol, "futures")
        validated_interval = SymbolNormalizer.validate_interval(interval)
        validated_start, validated_end = SymbolNormalizer.validate_date_range(
            start.isoformat(), end.isoformat(), validated_interval
        )

        return await service.get_history(
            normalized_symbol,
            date.fromisoformat(validated_start),
            date.fromisoformat(validated_end),
            validated_interval,
            provider
        )
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting future history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quotes", response_model=BatchQuotesResponse)
async def get_future_quotes(
    symbols: str = Query(..., description="Comma-separated symbols (e.g., ES,GC,CL)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: FuturesService = Depends(get_futures_service)
):
    """Get quotes for multiple futures contracts (max 50)."""
    try:
        symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
        if not symbol_list:
            raise InvalidParameterError("At least one symbol is required")
        if len(symbol_list) > 50:
            raise InvalidParameterError("Maximum 50 symbols per request")

        normalized_symbols = [
            SymbolNormalizer.normalize(s, "futures") for s in symbol_list
        ]

        quotes = await service.get_batch_quotes(normalized_symbols, provider)

        return BatchQuotesResponse(
            quotes=quotes,
            metadata=quotes[0].metadata if quotes else None
        )
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting future quotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
