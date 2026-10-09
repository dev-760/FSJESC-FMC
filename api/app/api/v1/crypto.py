from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from datetime import date

from app.models.common import Quote, HistoryResponse, BatchQuotesResponse
from app.providers.router import ProviderName
from app.services.crypto import CryptoService
from app.utils.symbols import SymbolNormalizer
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/crypto", tags=["crypto"])


def get_crypto_service() -> CryptoService:
    """Dependency to get crypto service."""
    from app.providers.router import router as provider_router
    return CryptoService(provider_router)


@router.get("/quote", response_model=Quote)
async def get_crypto_quote(
    symbol: str = Query(..., description="Crypto symbol (e.g., BTC or BTC-USD)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: CryptoService = Depends(get_crypto_service)
):
    """Get current quote for a cryptocurrency."""
    try:
        normalized_symbol = SymbolNormalizer.normalize(symbol, "crypto")
        return await service.get_quote(normalized_symbol, provider)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting crypto quote: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=HistoryResponse)
async def get_crypto_history(
    symbol: str = Query(..., description="Crypto symbol (e.g., BTC or BTC-USD)"),
    start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end: date = Query(..., description="End date (YYYY-MM-DD)"),
    interval: str = Query("1d", description="Interval (1m, 5m, 15m, 1h, 1d, 1wk, 1mo)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: CryptoService = Depends(get_crypto_service)
):
    """Get historical data for a cryptocurrency."""
    try:
        normalized_symbol = SymbolNormalizer.normalize(symbol, "crypto")
        validated_interval = SymbolNormalizer.validate_interval(interval)
        validated_start, validated_end = SymbolNormalizer.validate_date_range(
            start.isoformat(), end.isoformat(), validated_interval
        )

        return await service.get_history(
            normalized_symbol,
            validated_start,
            validated_end,
            validated_interval,
            provider
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting crypto history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quotes", response_model=BatchQuotesResponse)
async def get_crypto_quotes(
    symbols: str = Query(..., description="Comma-separated symbols (e.g., BTC,ETH,SOL)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: CryptoService = Depends(get_crypto_service)
):
    """Get quotes for multiple cryptocurrencies (max 50)."""
    try:
        symbol_list = [s.strip() for s in symbols.split(",")]
        if len(symbol_list) > 50:
            raise HTTPException(status_code=400, detail="Maximum 50 symbols per request")

        normalized_symbols = [
            SymbolNormalizer.normalize(s, "crypto") for s in symbol_list
        ]

        quotes = await service.get_batch_quotes(normalized_symbols, provider)

        return BatchQuotesResponse(
            quotes=quotes,
            metadata=quotes[0].metadata if quotes else None
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting crypto quotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
