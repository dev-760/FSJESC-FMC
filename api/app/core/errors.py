from typing import Any, Optional
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

from app.core.logging import get_logger

logger = get_logger(__name__)


class MarketDataError(Exception):
    """Base exception for market data errors."""

    def __init__(
        self,
        message: str,
        code: str = "MARKET_DATA_ERROR",
        provider: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
        status_code: int = status.HTTP_502_BAD_GATEWAY
    ):
        self.message = message
        self.code = code
        self.provider = provider
        self.details = details or {}
        self.status_code = status_code
        super().__init__(self.message)


class ProviderError(MarketDataError):
    """Exception for provider-specific errors."""

    def __init__(
        self,
        message: str,
        provider: str,
        details: Optional[dict[str, Any]] = None,
        status_code: int = status.HTTP_502_BAD_GATEWAY
    ):
        super().__init__(
            message=message,
            code="PROVIDER_ERROR",
            provider=provider,
            details=details,
            status_code=status_code
        )


class SymbolNotFoundError(MarketDataError):
    """Exception when a symbol is not found."""

    def __init__(self, symbol: str, provider: Optional[str] = None):
        super().__init__(
            message=f"Symbol not found: {symbol}",
            code="SYMBOL_NOT_FOUND",
            provider=provider,
            status_code=status.HTTP_404_NOT_FOUND
        )


class InvalidParameterError(MarketDataError):
    """Exception for invalid parameters."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="INVALID_PARAMETER",
            details=details,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


class RateLimitError(MarketDataError):
    """Exception when rate limit is exceeded."""

    def __init__(self, provider: str, retry_after: Optional[int] = None):
        details = {}
        if retry_after:
            details["retry_after"] = retry_after

        super().__init__(
            message=f"Rate limit exceeded for provider: {provider}",
            code="RATE_LIMIT_EXCEEDED",
            provider=provider,
            details=details,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )


class ProviderNotConfiguredError(MarketDataError):
    """Exception when a provider is not configured."""

    def __init__(self, provider: str):
        super().__init__(
            message=f"Provider not configured: {provider}",
            code="PROVIDER_NOT_CONFIGURED",
            provider=provider,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


async def market_data_error_handler(request: Request, exc: MarketDataError) -> JSONResponse:
    """Handle MarketDataError exceptions."""
    logger.error(
        f"MarketDataError: {exc.code} - {exc.message}",
        extra={
            "code": exc.code,
            "provider": exc.provider,
            "details": exc.details,
            "path": request.url.path
        }
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "provider": exc.provider,
                "details": exc.details
            }
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle standard HTTP exceptions."""
    logger.error(
        f"HTTPException: {exc.status_code} - {exc.detail}",
        extra={"path": request.url.path}
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
                "provider": None,
                "details": {}
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request validation errors."""
    logger.warning(
        f"Validation error: {exc.errors()}",
        extra={"path": request.url.path}
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request parameters",
                "provider": None,
                "details": {"errors": exc.errors()}
            }
        }
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all other exceptions."""
    logger.error(
        f"Unhandled exception: {type(exc).__name__} - {str(exc)}",
        extra={"path": request.url.path},
        exc_info=True
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred",
                "provider": None,
                "details": {}
            }
        }
    )
