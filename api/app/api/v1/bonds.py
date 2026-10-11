from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from datetime import date

from app.models.bonds import YieldCurve, FredSeriesMetadata, FredSeriesObservations
from app.providers.router import ProviderName
from app.services.bonds import BondsService
from app.core.errors import MarketDataError
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/bonds", tags=["bonds"])


def get_bonds_service() -> BondsService:
    """Dependency to get bonds service."""
    from app.providers.router import router as provider_router
    return BondsService(provider_router)


@router.get("/yield-curve", response_model=YieldCurve)
async def get_yield_curve(
    date_obj: Optional[date] = Query(None, description="Optional date (YYYY-MM-DD)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: BondsService = Depends(get_bonds_service)
):
    """Get Treasury yield curve."""
    try:
        return await service.get_yield_curve(date_obj, provider)
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error getting yield curve: {e}")
        raise HTTPException(status_code=500, detail=str(e))



