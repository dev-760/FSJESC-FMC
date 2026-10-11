from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from datetime import date

from app.models.common import Quote, HistoryResponse, BatchQuotesResponse
from app.providers.router import ProviderName
from app.services.etfs import ETFsService
from app.utils.symbols import SymbolNormalizer
from app.core.errors import MarketDataError, InvalidParameterError
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/etfs", tags=["etfs"])


def get_etfs_service() -> ETFsService:
    """Dependency to get ETFs service."""
    from app.providers.router import router as provider_router
    return ETFsService(provider_router)


@router.get("/quote", response_model=Quote)
async def get_etf_quote(
    symbol: str = Query(..., description="ETF symbol (e.g., SPY)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: ETFsService = Depends(get_etfs_service)
):
    """Get current quote for an ETF."""
    try:
        normalized_symbol = SymbolNormalizer.normalize(symbol, "etfs")
        return await service.get_quote(normalized_symbol, provider)
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting ETF quote: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=HistoryResponse)
async def get_etf_history(
    symbol: str = Query(..., description="ETF symbol (e.g., SPY)"),
    start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end: date = Query(..., description="End date (YYYY-MM-DD)"),
    interval: str = Query("1d", description="Interval (1m, 5m, 15m, 1h, 1d, 1wk, 1mo)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: ETFsService = Depends(get_etfs_service)
):
    """Get historical data for an ETF."""
    try:
        normalized_symbol = SymbolNormalizer.normalize(symbol, "etfs")
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
        logger.error(f"Error getting ETF history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quotes", response_model=BatchQuotesResponse)
async def get_etf_quotes(
    symbols: str = Query(..., description="Comma-separated symbols (e.g., SPY,QQQ,IWM)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: ETFsService = Depends(get_etfs_service)
):
    """Get quotes for multiple ETFs (max 50)."""
    try:
        symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
        if not symbol_list:
            raise InvalidParameterError("At least one symbol is required")
        if len(symbol_list) > 50:
            raise InvalidParameterError("Maximum 50 symbols per request")

        normalized_symbols = [
            SymbolNormalizer.normalize(s, "etfs") for s in symbol_list
        ]

        quotes = await service.get_batch_quotes(normalized_symbols, provider)

        return BatchQuotesResponse(
            quotes=quotes,
            metadata=quotes[0].metadata if quotes else None
        )
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting ETF quotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
