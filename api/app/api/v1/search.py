from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional

from app.models.common import SearchResults, AssetClass
from app.providers.router import ProviderName
from app.services.stocks import StocksService
from app.services.etfs import ETFsService
from app.services.futures import FuturesService
from app.services.crypto import CryptoService
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/search", tags=["search"])


def get_service(asset_class: AssetClass):
    """Get appropriate service based on asset class."""
    from app.providers.router import router as provider_router

    services = {
        AssetClass.STOCKS: StocksService(provider_router),
        AssetClass.ETFS: ETFsService(provider_router),
        AssetClass.FUTURES: FuturesService(provider_router),
        AssetClass.CRYPTO: CryptoService(provider_router),
    }

    return services.get(asset_class)


@router.get("", response_model=list[SearchResults])
async def search_symbols(
    q: str = Query(..., description="Search query"),
    asset_class: Optional[AssetClass] = Query(None, description="Filter by asset class"),
    provider: Optional[ProviderName] = Query(None, description="Override provider")
):
    """Search for symbols across asset classes."""
    try:
        if asset_class:
            service = get_service(asset_class)
            if not service:
                raise HTTPException(status_code=400, detail=f"Search not supported for {asset_class}")
            return await service.search(q, provider)
        else:
            # Search across all supported asset classes
            results = []
            for ac in [AssetClass.STOCKS, AssetClass.ETFS, AssetClass.FUTURES, AssetClass.CRYPTO]:
                service = get_service(ac)
                if service:
                    try:
                        ac_results = await service.search(q, provider)
                        results.extend(ac_results)
                    except Exception as e:
                        logger.warning(f"Search failed for {ac}: {e}")
            return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching symbols: {e}")
        raise HTTPException(status_code=500, detail=str(e))
