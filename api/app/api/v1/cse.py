from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from datetime import date

from app.models.common import Quote, HistoryResponse, BatchQuotesResponse
from app.models.cse import (
    CSESharePricesResponse,
    CSEOrderBook,
    CSEInstrumentDetail,
    CSESectorSummaryResponse,
)
from app.providers.router import ProviderName
from app.services.cse import CSEService
from app.utils.symbols import SymbolNormalizer
from app.core.errors import MarketDataError, InvalidParameterError
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/cse", tags=["cse"])


def get_cse_service() -> CSEService:
    """Dependency to get CSE service."""
    from app.providers.router import router as provider_router
    return CSEService(provider_router)


@router.get("/quote", response_model=Quote)
async def get_cse_quote(
    ticker: str = Query(..., description="CSE ticker (e.g., ATW)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: CSEService = Depends(get_cse_service)
):
    """Get current quote for a CSE ticker."""
    try:
        normalized = SymbolNormalizer.normalize(ticker, "cse")
        return await service.get_quote(normalized, provider)
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting CSE quote: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=HistoryResponse)
async def get_cse_history(
    ticker: str = Query(..., description="CSE ticker (e.g., ATW)"),
    start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end: date = Query(..., description="End date (YYYY-MM-DD)"),
    interval: str = Query("1d", description="Interval (only 1d supported for CSE)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: CSEService = Depends(get_cse_service)
):
    """Get historical data for a CSE ticker."""
    try:
        if interval != "1d":
            raise InvalidParameterError("CSE only supports daily interval ('1d')")
        normalized = SymbolNormalizer.normalize(ticker, "cse")
        SymbolNormalizer.validate_date_range(start.isoformat(), end.isoformat(), "1d")

        return await service.get_history(
            normalized,
            start,
            end,
            interval,
            provider
        )
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting CSE history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quotes", response_model=BatchQuotesResponse)
async def get_cse_quotes(
    tickers: str = Query(..., description="Comma-separated tickers (e.g., ATW,IAM,BCP)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: CSEService = Depends(get_cse_service)
):
    """Get quotes for multiple CSE tickers (max 50)."""
    try:
        ticker_list = [SymbolNormalizer.normalize(t, "cse") for t in tickers.split(",") if t.strip()]
        if not ticker_list:
            raise InvalidParameterError("At least one ticker is required")
        if len(ticker_list) > 50:
            raise InvalidParameterError("Maximum 50 tickers per request")

        quotes = await service.get_batch_quotes(ticker_list, provider)

        return BatchQuotesResponse(
            quotes=quotes,
            metadata=quotes[0].metadata if quotes else None
        )
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting CSE quotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/share-prices", response_model=CSESharePricesResponse)
async def get_all_share_prices(
    sector: Optional[str] = Query(None, description="Filter by French sector name (partial match)"),
    company: Optional[str] = Query(None, description="Filter by company name (partial match)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: CSEService = Depends(get_cse_service)
):
    """Get all share prices with optional filters."""
    try:
        return await service.get_all_share_prices(sector, company, provider)
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting share prices: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order-book", response_model=CSEOrderBook)
async def get_order_book(
    ticker: str = Query(..., description="CSE ticker (e.g., ATW)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: CSEService = Depends(get_cse_service)
):
    """Get order book for a CSE ticker."""
    try:
        normalized = SymbolNormalizer.normalize(ticker, "cse")
        return await service.get_order_book(normalized, provider)
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting order book: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/instrument-detail", response_model=CSEInstrumentDetail)
async def get_instrument_detail(
    ticker: str = Query(..., description="CSE ticker (e.g., ATW)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: CSEService = Depends(get_cse_service)
):
    """Get full instrument detail including fundamentals."""
    try:
        normalized = SymbolNormalizer.normalize(ticker, "cse")
        return await service.get_instrument_detail(normalized, provider)
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting instrument detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sector-summary", response_model=CSESectorSummaryResponse)
async def get_sector_summary(
    sector: Optional[str] = Query(None, description="Filter by French sector name (partial match)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: CSEService = Depends(get_cse_service)
):
    """Get sector summary."""
    try:
        return await service.get_sector_summary(sector, provider)
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting sector summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
