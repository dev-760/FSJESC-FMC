from app.services.base import BaseService
from app.models.common import AssetClass
from app.providers.router import ProviderRouter


class ETFsService(BaseService):
    """Service for ETF data."""

    def __init__(self, router: ProviderRouter):
        super().__init__(AssetClass.ETFS, router)
