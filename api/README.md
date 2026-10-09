# Market Data API

A production-quality, async FastAPI service that exposes a unified REST API for market data across 8 asset classes: Stocks, ETFs, Futures, Forex, Bonds, Options, Crypto, and Casablanca Stock Exchange (CSE).

## Features

- **Unified API**: Single interface for 8 asset classes with consistent response formats
- **Multiple Providers**: Integrates FRED, Frankfurter, yfinance, and Casablanca Stock Exchange with automatic fallback
- **Provider Abstraction**: Easy to swap providers or add new ones
- **Caching**: Configurable TTL-based caching with Redis support
- **Rate Limiting**: Built-in rate limiting per IP
- **Symbol Normalization**: Friendly input handling (e.g., "EURUSD" → "EURUSD=X", "BTC" → "BTC-USD")
- **Error Handling**: Structured error responses with provider attribution
- **Health Checks**: Provider health monitoring endpoints
- **Async Architecture**: Non-blocking I/O with yfinance wrapped in thread pools

## Data Providers

| Provider | Asset Classes | Notes |
|----------|--------------|-------|
| **yfinance** | Stocks, ETFs, Futures, Forex, Crypto, Options | Unofficial Yahoo scraper, data is delayed (~15 min), rate-limited without notice |
| **FRED** | Bonds, Stocks (index only), Futures (commodity spot reference) | Requires API key, ~120 req/min limit, economic data focus |
| **Frankfurter** | Forex | ECB daily reference rates, no API key, no intraday data |
| **CSE** | CSE (Casablanca Stock Exchange) | Real-time and historical data for Moroccan equities, optional API key |

### Provider Mapping

| Asset Class | Primary | Secondary/Fallback |
|------------|---------|-------------------|
| Stocks | yfinance | FRED (index levels only) |
| ETFs | yfinance | None |
| Futures | yfinance (continuous front-month) | FRED (commodity spot reference) |
| Forex | Frankfurter | yfinance, FRED |
| Bonds | FRED | yfinance |
| Options | yfinance | None |
| Crypto | yfinance | FRED |
| CSE | CSE | None |

## Installation

### Prerequisites

- Python 3.11+
- Redis (optional, for distributed caching)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd api
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

5. Run the application:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Docker

```bash
# Build and run with docker-compose
docker-compose up --build

# Or build manually
docker build -t market-data-api .
docker run -p 8000:8000 --env-file .env market-data-api
```

## Configuration

Key environment variables (see `.env.example`):

- `FRED_API_KEY`: Required for FRED data. Get one at https://fred.stlouisfed.org/docs/api/api_key.html
- `API_KEY`: Optional API key for authentication via `X-API-Key` header
- `REDIS_URL`: Optional Redis URL for distributed caching
- `CACHE_TTL_*`: Cache TTLs for different data types
- `CORS_ORIGINS`: Allowed CORS origins
- `RATE_LIMIT_PER_MINUTE`: Rate limit per IP

## API Endpoints

All endpoints are under `/api/v1`.

### Generic Endpoints (Stocks, ETFs, Futures, Crypto, Bonds, Forex, CSE)

#### Get Quote
```
GET /{asset_class}/quote?symbol={symbol}&provider={provider}
```

#### Get History
```
GET /{asset_class}/history?symbol={symbol}&start={YYYY-MM-DD}&end={YYYY-MM-DD}&interval={interval}&provider={provider}
```

Intervals: `1m`, `5m`, `15m`, `1h`, `1d`, `1wk`, `1mo`

**Note**: 1-minute data is limited to ~7 days due to yfinance constraints.

#### Batch Quotes
```
GET /{asset_class}/quotes?symbols=A,B,C&provider={provider}
```

Maximum 50 symbols per request.

#### Search
```
GET /search?q={query}&asset_class={asset_class}&provider={provider}
```

### Forex (Frankfurter)

#### Get Exchange Rate
```
GET /forex/rates?base={EUR}&symbols={USD,GBP}&date={YYYY-MM-DD}&provider={provider}
```

#### Get Forex History
```
GET /forex/history?base={EUR}&symbols={USD,GBP}&start={YYYY-MM-DD}&end={YYYY-MM-DD}&provider={provider}
```

#### Convert Currency
```
GET /forex/convert?from={EUR}&to={USD}&amount={100}&date={YYYY-MM-DD}&provider={provider}
```

#### Get Currencies
```
GET /forex/currencies?provider={provider}
```

### Bonds (FRED)

#### Get Yield Curve
```
GET /bonds/yield-curve?date={YYYY-MM-DD}&provider={provider}
```

Returns Treasury yields for maturities: 1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y.

#### Get FRED Series Metadata
```
GET /fred/series/{series_id}?provider={provider}
```

#### Get FRED Series Observations
```
GET /fred/series/{series_id}/observations?start={YYYY-MM-DD}&end={YYYY-MM-DD}&frequency={freq}&units={units}&provider={provider}
```

#### Search FRED Series
```
GET /fred/search?q={query}&provider={provider}
```

### Options (yfinance)

#### Get Option Expirations
```
GET /options/expirations?symbol={AAPL}&provider={provider}
```

#### Get Option Chain
```
GET /options/chain?symbol={AAPL}&expiration={YYYY-MM-DD}&type={calls|puts|all}&min_strike={100}&max_strike={200}&in_the_money={true|false}&provider={provider}
```

### Health

#### Liveness Probe
```
GET /health/healthz
```

#### Provider Health
```
GET /health/providers
```

Returns health status of all providers.

### CSE (Casablanca Stock Exchange)

#### Get All Share Prices
```
GET /cse/share-prices?sector={Banques}&company={Attijari}&provider={provider}
```

Returns current market data for all listed equities with optional sector/company filters.

#### Get Order Book
```
GET /cse/order-book?ticker={ATW}&provider={provider}
```

Returns best bid/ask for a ticker.

#### Get Instrument Detail
```
GET /cse/instrument-detail?ticker={ATW}&provider={provider}
```

Returns full company profile including fundamentals, financials, dividends, shareholders, and management.

#### Get Sector Summary
```
GET /cse/sector-summary?sector={Banques}&provider={provider}
```

Returns market statistics aggregated by sector.

## Response Format

All responses include provider metadata:

```json
{
  "symbol": "AAPL",
  "price": 150.25,
  "metadata": {
    "provider": "yfinance",
    "fetched_at": "2026-10-08T15:30:00Z",
    "delayed": true,
    "cached": false
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "SYMBOL_NOT_FOUND",
    "message": "Symbol not found: INVALID",
    "provider": "yfinance",
    "details": {}
  }
}
```

## Symbol Normalization

The API accepts friendly input and normalizes to provider formats:

- **Forex**: "EURUSD" or "EUR/USD" → "EURUSD=X"
- **Crypto**: "BTC" → "BTC-USD"
- **Futures**: "ES" → "ES=F" (supported: ES, NQ, YM, RTY, GC, SI, CL, NG, ZN, ZB)

## Important Notes

### yfinance Limitations

- **Unofficial**: yfinance is an unofficial Yahoo Finance scraper. Data may break or change without notice.
- **Delayed**: Data is delayed (~15 minutes) by Yahoo's terms.
- **Rate Limiting**: Yahoo may rate-limit without warning.
- **Terms of Use**: Intended for personal/research use. For production/enterprise use, consider a licensed data provider.
- **No Contract Chains**: Only continuous front-month futures contracts are available, not full contract chains.

### FRED Limitations

- **API Key Required**: Must set `FRED_API_KEY` in environment variables.
- **Rate Limit**: ~120 requests per minute.
- **Data Type**: Economic and macro data, not real-time market data.
- **Attribution**: This product uses the FRED API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.

### Frankfurter Limitations

- **Daily Only**: ECB reference rates are published once per working day around 16:00 CET. No intraday data.
- **No Conversion Endpoint**: Fetch the rate and convert client-side (the API provides the rate).

### CSE Limitations

- **Delayed Data**: Intraday prices are delayed by approximately 15 minutes.
- **Currency**: All prices are in Moroccan Dirham (MAD).
- **Language**: Sector and company names are returned in French as published by the exchange.
- **Trading Status**: Uses codes T (Traded), NT (Not Traded), S (Suspended).
- **Order Book Depth**: Only best bid/ask is available (single level depth).
- **No Contract Chains**: Only continuous equities are available, not derivatives.

## Development

### Running Tests

```bash
pytest tests/ -v
```

### Code Quality

```bash
# Linting
ruff check app/

# Format
ruff format app/
```

### Project Structure

```
app/
├── main.py                 # App factory, middleware, lifespan
├── core/
│   ├── config.py          # Pydantic settings
│   ├── cache.py           # Cache manager
│   ├── logging.py         # Structured logging
│   ├── errors.py          # Custom exceptions
│   └── security.py        # API key authentication
├── models/                # Pydantic schemas
│   ├── common.py          # Shared models
│   ├── forex.py           # Forex-specific models
│   ├── bonds.py           # FRED/bond models
│   ├── options.py         # Options models
│   ├── cse.py             # CSE-specific models
│   └── health.py          # Health check models
├── providers/
│   ├── base.py            # Provider protocol/ABC
│   ├── yfinance_provider.py
│   ├── fred_provider.py
│   ├── frankfurter_provider.py
│   ├── cse_provider.py    # Casablanca Stock Exchange
│   └── router.py          # Provider selection with fallback
├── services/              # Business logic per asset class
│   ├── base.py
│   ├── stocks.py, etfs.py, futures.py, crypto.py
│   ├── forex.py, bonds.py, options.py
│   └── cse.py             # CSE service
├── api/v1/                # FastAPI routers
│   ├── stocks.py, etfs.py, futures.py, crypto.py
│   ├── forex.py, bonds.py, options.py
│   ├── fred.py, search.py, health.py
│   └── cse.py             # CSE endpoints
└── utils/
    └── symbols.py         # Symbol normalization
```

## License

This project is provided as-is for educational and research purposes.

## Attribution

This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.
