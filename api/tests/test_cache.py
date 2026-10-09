import pytest
from unittest.mock import AsyncMock, patch

from app.core.cache import CacheManager, cached


@pytest.mark.asyncio
class TestCacheManager:
    """Test cache manager."""

    async def test_memory_cache(self):
        """Test in-memory cache."""
        cache = CacheManager()

        # Set value
        await cache.set("test_key", "test_value", ttl=60)

        # Get value
        value = await cache.get("test_key")
        assert value == "test_value"

        # Delete value
        await cache.delete("test_key")
        value = await cache.get("test_key")
        assert value is None

    async def test_cache_decorator(self):
        """Test cached decorator."""
        cache = CacheManager()
        call_count = 0

        @cached(ttl=60, key_prefix="test")
        async def test_function(x: int) -> int:
            nonlocal call_count
            call_count += 1
            return x * 2

        # First call - executes function
        result1 = await test_function(5)
        assert result1 == 10
        assert call_count == 1

        # Second call - cached
        result2 = await test_function(5)
        assert result2 == 10
        assert call_count == 1  # Should not increment

    async def test_cache_clear(self):
        """Test cache clear."""
        cache = CacheManager()

        await cache.set("key1", "value1")
        await cache.set("key2", "value2")

        await cache.clear()

        assert await cache.get("key1") is None
        assert await cache.get("key2") is None
