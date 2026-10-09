from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from datetime import date

from app.models.options import OptionChain, OptionExpirations
from app.providers.router import ProviderName
from app.services.options import OptionsService
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/options", tags=["options"])


def get_options_service() -> OptionsService:
    """Dependency to get options service."""
    from app.providers.router import router as provider_router
    return OptionsService(provider_router)


@router.get("/expirations", response_model=OptionExpirations)
async def get_option_expirations(
    symbol: str = Query(..., description="Underlying symbol (e.g., AAPL)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: OptionsService = Depends(get_options_service)
):
    """Get available option expiration dates."""
    try:
        return await service.get_expirations(symbol, provider)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting option expirations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chain", response_model=OptionChain)
async def get_option_chain(
    symbol: str = Query(..., description="Underlying symbol (e.g., AAPL)"),
    expiration: date = Query(..., description="Expiration date (YYYY-MM-DD)"),
    option_type: Optional[str] = Query("all", description="Filter: calls, puts, or all"),
    min_strike: Optional[float] = Query(None, gt=0, description="Minimum strike price"),
    max_strike: Optional[float] = Query(None, gt=0, description="Maximum strike price"),
    in_the_money: Optional[bool] = Query(None, description="Filter by in-the-money status"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: OptionsService = Depends(get_options_service)
):
    """Get option chain for a symbol and expiration."""
    try:
        if option_type not in ["calls", "puts", "all"]:
            raise HTTPException(
                status_code=400,
                detail="option_type must be 'calls', 'puts', or 'all'"
            )

        return await service.get_chain(
            symbol,
            expiration,
            option_type,
            min_strike,
            max_strike,
            in_the_money,
            provider
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting option chain: {e}")
        raise HTTPException(status_code=500, detail=str(e))
