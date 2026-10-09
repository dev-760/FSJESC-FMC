import asyncio
from typing import Any, Optional, Callable
from functools import wraps
from cachetools import TTLCache
from aiocache import Cache
from aiocache.serializers import PickleSerializer
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class CacheManager:
    """Cache manager with in-memory and optional Redis support."""

    def __init__(self):
        self._memory_cache: TTLCache = TTLCache(maxsize=10000, ttl=settings.CACHE_TTL_QUOTES)
        self._redis_cache: Optional[Cache] = None
        self._pending_requests: dict[str, asyncio.Event] = {}
        self._lock = asyncio.Lock()

        if settings.REDIS_URL:
            try:
                self._redis_cache = Cache.from_url(
                    settings.REDIS_URL,
                    serializer=PickleSerializer(),
                    namespace="market_data"
                )
                logger.info("Redis cache initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Redis cache, falling back to in-memory: {e}")

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        # Try Redis first if available
        if self._redis_cache:
            try:
                value = await self._redis_cache.get(key)
                if value is not None:
                    logger.debug(f"Cache hit (Redis): {key}")
                    return value
            except Exception as e:
                logger.warning(f"Redis cache get failed: {e}")

        # Fall back to memory cache
        value = self._memory_cache.get(key)
        if value is not None:
            logger.debug(f"Cache hit (memory): {key}")
        return value

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with optional TTL."""
        if ttl is None:
            ttl = settings.CACHE_TTL_QUOTES

        # Set in Redis if available
        if self._redis_cache:
            try:
                await self._redis_cache.set(key, value, ttl=ttl)
            except Exception as e:
                logger.warning(f"Redis cache set failed: {e}")

        # Always set in memory cache
        self._memory_cache[key] = value

    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        if self._redis_cache:
            try:
                await self._redis_cache.delete(key)
            except Exception as e:
                logger.warning(f"Redis cache delete failed: {e}")

        self._memory_cache.pop(key, None)

    async def clear(self) -> None:
        """Clear all cache."""
        if self._redis_cache:
            try:
                await self._redis_cache.clear()
            except Exception as e:
                logger.warning(f"Redis cache clear failed: {e}")

        self._memory_cache.clear()


cache_manager = CacheManager()


def cached(ttl: Optional[int] = None, key_prefix: str = ""):
    """Decorator for caching async function results with request coalescing."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(sorted(kwargs.items()))}"

            # Check cache
            cached_value = await cache_manager.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Request coalescing: wait if another request is in progress
            async with cache_manager._lock:
                if cache_key in cache_manager._pending_requests:
                    await cache_manager._pending_requests[cache_key].wait()
                    cached_value = await cache_manager.get(cache_key)
                    if cached_value is not None:
                        return cached_value

                # Mark request as in progress
                cache_manager._pending_requests[cache_key] = asyncio.Event()

            try:
                # Execute function
                result = await func(*args, **kwargs)

                # Cache result
                await cache_manager.set(cache_key, result, ttl=ttl)

                return result
            finally:
                # Mark request as complete
                async with cache_manager._lock:
                    event = cache_manager._pending_requests.pop(cache_key, None)
                    if event:
                        event.set()

        return wrapper
    return decorator
