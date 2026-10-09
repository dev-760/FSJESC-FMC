from fastapi import APIRouter, Depends
from datetime import datetime

from app.models.health import HealthResponse, ProviderStatus
from app.providers.router import router as provider_router
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/providers")
async def get_providers_health():
    """Get health status of all providers."""
    provider_health = await provider_router.health_check()

    provider_statuses = []
    for name, healthy in provider_health.items():
        provider_statuses.append(
            ProviderStatus(
                name=name,
                status="healthy" if healthy else "down",
                latency_ms=None,
                last_check=datetime.utcnow(),
                error=None if healthy else "Health check failed"
            )
        )

    return {"providers": provider_statuses}


@router.get("/healthz")
async def healthz():
    """Liveness probe."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
