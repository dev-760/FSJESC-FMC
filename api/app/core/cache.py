import asyncio
import time
from datetime import date, datetime
from enum import Enum
from typing import Any, Optional, Callable
from functools import wraps
from cachetools import LRUCache
from aiocache import Cache
from aiocache.serializers import PickleSerializer
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def _serialize_cache_arg(arg: Any) -> str:
    """Serialize an argument into a stable string for cache keys."""
    if isinstance(arg, (date, datetime)):
        return arg.isoformat()
    if isinstance(arg, Enum):
        return str(arg.value)
    if isinstance(arg, (list, tuple, set)):
        return "[" + ",".join(_serialize_cache_arg(x) for x in arg) + "]"
    if isinstance(arg, dict):
        return "{" + ",".join(f"{k}:{_serialize_cache_arg(v)}" for k, v in sorted(arg.items())) + "}"
    return str(arg)


def _build_cache_key(key_prefix: str, func_name: str, args: tuple, kwargs: dict) -> str:
    """Build a deterministic cache key, stripping `self` instance references."""
    clean_args = args
    if clean_args and hasattr(clean_args[0], "__dict__") and not isinstance(clean_args[0], (dict, list, str, int, float, bool)):
        clean_args = clean_args[1:]
    serialized_args = ":".join(_serialize_cache_arg(a) for a in clean_args)
    serialized_kwargs = ":".join(f"{k}={_serialize_cache_arg(v)}" for k, v in sorted(kwargs.items()))
    parts = [p for p in (key_prefix, func_name, serialized_args, serialized_kwargs) if p]
    return ":".join(parts)


class CacheManager:
    """Cache manager with per-key TTL in-memory cache and optional Redis support."""

    def __init__(self):
        self._memory_cache: LRUCache[str, tuple[Any, float]] = LRUCache(maxsize=10000)
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
        """Get value from cache, respecting per-key TTL expiration."""
        # Try Redis first if available
        if self._redis_cache:
            try:
                value = await self._redis_cache.get(key)
                if value is not None:
                    logger.debug(f"Cache hit (Redis): {key}")
                    return value
            except Exception as e:
                logger.warning(f"Redis cache get failed: {e}")

        # Fall back to memory cache with per-entry expiration check
        entry = self._memory_cache.get(key)
        if entry is not None:
            value, expires_at = entry
            if time.monotonic() < expires_at:
                logger.debug(f"Cache hit (memory): {key}")
                return value
            self._memory_cache.pop(key, None)
        return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with per-key TTL in seconds."""
        if ttl is None or ttl <= 0:
            ttl = settings.CACHE_TTL_QUOTES

        # Set in Redis if available
        if self._redis_cache:
            try:
                await self._redis_cache.set(key, value, ttl=ttl)
            except Exception as e:
                logger.warning(f"Redis cache set failed: {e}")

        # Store in memory cache with monotonic expiration timestamp
        self._memory_cache[key] = (value, time.monotonic() + ttl)

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
            cache_key = _build_cache_key(key_prefix, func.__name__, args, kwargs)

            # Check cache
            cached_value = await cache_manager.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Request coalescing: wait if another request is in progress
            wait_event: Optional[asyncio.Event] = None
            created_event: Optional[asyncio.Event] = None
            async with cache_manager._lock:
                if cache_key in cache_manager._pending_requests:
                    wait_event = cache_manager._pending_requests[cache_key]
                else:
                    created_event = asyncio.Event()
                    cache_manager._pending_requests[cache_key] = created_event

            if wait_event is not None:
                await wait_event.wait()
                cached_value = await cache_manager.get(cache_key)
                if cached_value is not None:
                    return cached_value

            try:
                result = await func(*args, **kwargs)
                await cache_manager.set(cache_key, result, ttl=ttl)
                return result
            finally:
                if created_event is not None:
                    async with cache_manager._lock:
                        event = cache_manager._pending_requests.pop(cache_key, None)
                        if event:
                            event.set()

        return wrapper
    return decorator
