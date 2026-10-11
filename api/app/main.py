from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from uuid import uuid4

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import setup_logging, get_logger, request_id_var
from app.core.errors import (
    MarketDataError,
    market_data_error_handler,
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)
from app.api.v1 import (
    stocks,
    etfs,
    futures,
    crypto,
    forex,
    bonds,
    options,
    fred,
    search,
    health,
    cse
)

# Setup logging
setup_logging()
logger = get_logger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")

    # Startup
    yield

    # Shutdown
    logger.info("Shutting down application")
    from app.providers.router import router as provider_router
    await provider_router.close()
    logger.info("Providers closed")


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Unified REST API for market data across 8 asset classes (CSE, Stocks, ETFs, Futures, Crypto, Forex, Bonds, Options)",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID to context."""
    request_id = str(uuid4())
    request_id_var.set(request_id)

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Exception handlers
app.add_exception_handler(MarketDataError, market_data_error_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# Include routers
app.include_router(stocks.router, prefix="/api/v1")
app.include_router(etfs.router, prefix="/api/v1")
app.include_router(futures.router, prefix="/api/v1")
app.include_router(crypto.router, prefix="/api/v1")
app.include_router(forex.router, prefix="/api/v1")
app.include_router(bonds.router, prefix="/api/v1")
app.include_router(options.router, prefix="/api/v1")
app.include_router(fred.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")
app.include_router(cse.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs" if settings.ENVIRONMENT != "production" else None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development"
    )
