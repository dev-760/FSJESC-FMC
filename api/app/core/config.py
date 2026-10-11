from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AliasChoices, Field, field_validator
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # API Configuration
    API_KEY: str | None = Field(default=None, description="Optional API key for authentication via X-API-Key header")
    PROJECT_NAME: str = "Market Data API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "production", "testing"] = "development"

    # Provider Configuration
    FRED_API_KEY: str | None = Field(default=None, description="FRED API key (required for FRED routes)")
    FRANKFURTER_BASE_URL: str = "https://api.frankfurter.dev/v2"
    CSE_API_KEY: str | None = Field(default=None, description="CSE API key (optional for basic operations)")

    # Cache Configuration
    REDIS_URL: str | None = Field(default=None, description="Redis URL for distributed caching (optional)")
    CACHE_TTL_QUOTES: int = Field(default=30, description="Cache TTL for quotes in seconds")
    CACHE_TTL_INTRADAY: int = Field(default=60, description="Cache TTL for intraday history in seconds")
    CACHE_TTL_DAILY: int = Field(default=3600, description="Cache TTL for daily history in seconds")
    CACHE_TTL_OPTIONS: int = Field(default=60, description="Cache TTL for options chain in seconds")
    CACHE_TTL_FRANKFURTER: int = Field(default=3600, description="Cache TTL for Frankfurter data in seconds")
    CACHE_TTL_FRED_OBSERVATIONS: int = Field(default=3600, description="Cache TTL for FRED observations in seconds")
    CACHE_TTL_FRED_METADATA: int = Field(default=86400, description="Cache TTL for FRED metadata in seconds")

    # CORS Configuration
    CORS_ORIGINS: list[str] = Field(default=["http://localhost:3000", "http://localhost:3001", "http://localhost:8080"], description="Allowed CORS origins")

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, description="Rate limit per minute per IP")

    # Logging
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    # HTTP Client Configuration (note: uv reads HTTP_TIMEOUT as an integer during builds)
    HTTP_TIMEOUT: float = Field(
        default=30,
        validation_alias=AliasChoices("API_HTTP_TIMEOUT", "HTTP_TIMEOUT"),
        description="HTTP request timeout in seconds (use integer e.g. 30 on Vercel/uv)",
    )
    HTTP_MAX_CONNECTIONS: int = Field(default=100, description="Maximum HTTP connections")
    HTTP_MAX_KEEPALIVE_CONNECTIONS: int = Field(default=20, description="Maximum keepalive connections")

    # Retry Configuration
    RETRY_MAX_ATTEMPTS: int = Field(default=3, description="Maximum retry attempts")
    RETRY_INITIAL_DELAY: float = Field(default=1, description="Initial retry delay in seconds")
    RETRY_MAX_DELAY: float = Field(default=30, description="Maximum retry delay in seconds")


settings = Settings()
