from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from datetime import date

from app.models.bonds import FredSeriesMetadata, FredSeriesObservations
from app.providers.router import ProviderName
from app.services.bonds import BondsService
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/fred", tags=["fred"])


def get_bonds_service() -> BondsService:
    """Dependency to get bonds service (FRED is under bonds)."""
    from app.providers.router import router as provider_router
    return BondsService(provider_router)


@router.get("/series/{series_id}", response_model=FredSeriesMetadata)
async def get_fred_series_metadata(
    series_id: str,
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: BondsService = Depends(get_bonds_service)
):
    """Get FRED series metadata."""
    try:
        return await service.get_fred_series_metadata(series_id, provider)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting FRED series metadata: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/series/{series_id}/observations", response_model=FredSeriesObservations)
async def get_fred_series_observations(
    series_id: str,
    start: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    frequency: Optional[str] = Query(None, description="Frequency (e.g., d, w, m, q, a)"),
    units: Optional[str] = Query(None, description="Units (e.g., lin, pct_change)"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: BondsService = Depends(get_bonds_service)
):
    """Get FRED series observations."""
    try:
        return await service.get_fred_series_observations(
            series_id, start, end, frequency, units, provider
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting FRED series observations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_fred_series(
    q: str = Query(..., description="Search query"),
    provider: Optional[ProviderName] = Query(None, description="Override provider"),
    service: BondsService = Depends(get_bonds_service)
):
    """Search for FRED series."""
    try:
        return await service.search(q, provider)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching FRED series: {e}")
        raise HTTPException(status_code=500, detail=str(e))
