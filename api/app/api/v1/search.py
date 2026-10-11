from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from app.models.common import SearchResults, AssetClass
from app.providers.router import ProviderName
from app.services.stocks import StocksService
from app.services.etfs import ETFsService
from app.services.futures import FuturesService
from app.services.crypto import CryptoService
from app.services.cse import CSEService
from app.services.forex import ForexService
from app.core.errors import MarketDataError, InvalidParameterError
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/search", tags=["search"])


def get_service(asset_class: AssetClass):
    """Get appropriate service based on asset class."""
    from app.providers.router import router as provider_router

    services = {
        AssetClass.CSE: CSEService(provider_router),
        AssetClass.STOCKS: StocksService(provider_router),
        AssetClass.ETFS: ETFsService(provider_router),
        AssetClass.FUTURES: FuturesService(provider_router),
        AssetClass.CRYPTO: CryptoService(provider_router),
        AssetClass.FOREX: ForexService(provider_router),
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
        if not q or not q.strip():
            raise InvalidParameterError("Search query cannot be empty")

        if asset_class:
            service = get_service(asset_class)
            if not service:
                raise InvalidParameterError(f"Search not supported for {asset_class}")
            return await service.search(q.strip(), provider)
        else:
            results = []
            for ac in [AssetClass.CSE, AssetClass.STOCKS, AssetClass.ETFS, AssetClass.FUTURES, AssetClass.CRYPTO, AssetClass.FOREX]:
                service = get_service(ac)
                if service:
                    try:
                        ac_results = await service.search(q.strip(), provider)
                        results.extend(ac_results)
                    except Exception as e:
                        logger.warning(f"Search failed for {ac}: {e}")
            return results
    except (HTTPException, MarketDataError):
        raise
    except Exception as e:
        logger.error(f"Error searching symbols: {e}")
        raise HTTPException(status_code=500, detail=str(e))
