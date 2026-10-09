from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


class CSESharePrice(BaseModel):
    """CSE share price data."""
    sector: str = Field(..., description="Sector in French")
    status: str = Field(..., description="T, NT, or S")
    ticker: str = Field(..., description="Exchange ticker")
    volume: Optional[float] = Field(None, description="Traded value in MAD")
    company: str = Field(..., description="Issuer name")
    best_ask: Optional[float] = Field(None, description="Best ask price")
    best_bid: Optional[float] = Field(None, description="Best bid price")
    low_price: Optional[float] = Field(None, description="Session low")
    high_price: Optional[float] = Field(None, description="Session high")
    market_cap: Optional[float] = Field(None, description="Market capitalization in MAD")
    total_trades: Optional[int] = Field(None, description="Number of trades")
    closing_price: Optional[float] = Field(None, description="Last traded price")
    opening_price: Optional[float] = Field(None, description="Session opening price")
    change_percent: Optional[float] = Field(None, description="Change versus reference price")
    instrument_url: Optional[str] = Field(None, description="Exchange instrument page")
    quantity_traded: Optional[float] = Field(None, description="Shares traded")
    reference_price: Optional[float] = Field(None, description="Reference/previous close")


class CSESharePricesResponse(BaseModel):
    """Response for /get_share_prices."""
    companies: List[CSESharePrice] = Field(..., description="List of companies")
    total_companies: int = Field(..., description="Total number of companies")


class CSERealtimePrice(BaseModel):
    """CSE realtime price data."""
    sector: str = Field(..., description="French sector")
    status: str = Field(..., description="T, NT, or S")
    ticker: str = Field(..., description="Exchange ticker")
    volume: Optional[float] = Field(None, description="Traded value in MAD")
    company: str = Field(..., description="Issuer")
    best_ask: Optional[float] = Field(None, description="Best ask")
    best_bid: Optional[float] = Field(None, description="Best bid")
    currency: str = Field(..., description="Quote currency, normally MAD")
    low_price: Optional[float] = Field(None, description="Session low")
    high_price: Optional[float] = Field(None, description="Session high")
    market_cap: Optional[float] = Field(None, description="Market capitalization")
    compartment: Optional[str] = Field(None, description="Market compartment")
    session_date: Optional[str] = Field(None, description="Trading date, YYYY-MM-DD")
    total_trades: Optional[int] = Field(None, description="Number of trades")
    closing_price: Optional[float] = Field(None, description="Last traded price")
    opening_price: Optional[float] = Field(None, description="Session opening")
    change_percent: Optional[float] = Field(None, description="Percentage change")
    session_status: Optional[str] = Field(None, description="open or closed")
    quantity_traded: Optional[float] = Field(None, description="Number of shares traded")
    reference_price: Optional[float] = Field(None, description="Previous/reference price")
    best_ask_quantity: Optional[int] = Field(None, description="Quantity at best ask")
    best_bid_quantity: Optional[int] = Field(None, description="Quantity at best bid")
    shares_outstanding: Optional[int] = Field(None, description="Listed shares")


class CSEOrderBookLevel(BaseModel):
    """Order book level."""
    price: float = Field(..., description="Price")
    quantity: int = Field(..., description="Quantity")


class CSEOrderBook(BaseModel):
    """CSE order book data."""
    asks: List[CSEOrderBookLevel] = Field(default_factory=list, description="Best ask")
    bids: List[CSEOrderBookLevel] = Field(default_factory=list, description="Best bid")
    spread: Optional[float] = Field(None, description="best_ask - best_bid")
    status: str = Field(..., description="T, NT, or S")
    ticker: str = Field(..., description="Exchange ticker")
    company: str = Field(..., description="Issuer")
    last_price: Optional[float] = Field(None, description="Last traded price")
    depth_levels: int = Field(..., description="Always 1")
    session_date: Optional[str] = Field(None, description="Trading date")
    session_status: Optional[str] = Field(None, description="open or closed")


class CSEFinancials(BaseModel):
    """Financial data."""
    fiscal_year: int = Field(..., description="Fiscal year")
    share_capital: Optional[float] = Field(None, description="Share capital in MAD")
    equity: Optional[float] = Field(None, description="Equity in MAD")
    shares_count: Optional[int] = Field(None, description="Shares count")
    revenue: Optional[float] = Field(None, description="Revenue in MAD")
    operating_income: Optional[float] = Field(None, description="Operating income in MAD")
    net_income: Optional[float] = Field(None, description="Net income in MAD")
    consolidated: Optional[bool] = Field(None, description="Consolidated")


class CSEDividend(BaseModel):
    """Dividend data."""
    fiscal_year: int = Field(..., description="Fiscal year")
    amount: float = Field(..., description="Dividend amount")
    type: str = Field(..., description="Dividend type")
    ex_date: Optional[str] = Field(None, description="Ex-dividend date")
    payment_date: Optional[str] = Field(None, description="Payment date")


class CSEManagement(BaseModel):
    """Management team member."""
    last_name: str = Field(..., description="Last name")
    first_name: str = Field(..., description="First name")
    position: str = Field(..., description="Position")
    rank: int = Field(..., description="Rank")


class CSEShareholder(BaseModel):
    """Shareholder data."""
    holder: str = Field(..., description="Shareholder name")
    share_percent: float = Field(..., description="Share percentage")


class CSECapitalIncrease(BaseModel):
    """Capital increase data."""
    date: str = Field(..., description="Date")
    nature: str = Field(..., description="Nature of increase")
    capital_after: Optional[float] = Field(None, description="Capital after increase")
    shares_issued: Optional[int] = Field(None, description="Shares issued")
    nominal_value: Optional[float] = Field(None, description="Nominal value")
    issue_price: Optional[float] = Field(None, description="Issue price")
    subscription_start: Optional[str] = Field(None, description="Subscription start date")
    subscription_end: Optional[str] = Field(None, description="Subscription end date")


class CSEPerformance(BaseModel):
    """Performance metrics."""
    ytd_percent: Optional[float] = Field(None, description="Year-to-date percent")
    one_year_percent: Optional[float] = Field(None, description="One year percent")
    three_year_percent: Optional[float] = Field(None, description="Three year percent")
    five_year_percent: Optional[float] = Field(None, description="Five year percent")


class CSERatios(BaseModel):
    """Financial ratios."""
    fiscal_year: int = Field(..., description="Fiscal year")
    earnings_per_share: Optional[float] = Field(None, description="EPS")
    roe_percent: Optional[float] = Field(None, description="Return on equity %")
    payout_percent: Optional[float] = Field(None, description="Payout ratio %")
    dividend_yield_percent: Optional[float] = Field(None, description="Dividend yield %")
    per: Optional[float] = Field(None, description="P/E ratio")
    pbr: Optional[float] = Field(None, description="P/B ratio")


class CSEInstrumentDetail(BaseModel):
    """CSE instrument detail."""
    isin: Optional[str] = Field(None, description="ISIN identifier")
    ticker: str = Field(..., description="Exchange ticker")
    company: str = Field(..., description="Issuer")
    sector: str = Field(..., description="Sector")
    compartment: Optional[str] = Field(None, description="Market compartment")
    quotation_group: Optional[str] = Field(None, description="Trading group")
    currency: Optional[str] = Field(None, description="Currency")
    nominal_value: Optional[float] = Field(None, description="Nominal value per share")
    shares_outstanding: Optional[int] = Field(None, description="Listed shares")
    founded_date: Optional[str] = Field(None, description="Founding date")
    listing_date: Optional[str] = Field(None, description="First listing date")
    address: Optional[str] = Field(None, description="Registered address")
    auditor: Optional[str] = Field(None, description="Statutory auditor")
    website: Optional[str] = Field(None, description="Company website")
    instrument_url: Optional[str] = Field(None, description="Exchange instrument page")
    quote: Optional[CSERealtimePrice] = Field(None, description="Current market info")
    performance: Optional[CSEPerformance] = Field(None, description="Performance metrics")
    shareholders: List[CSEShareholder] = Field(default_factory=list, description="Shareholders")
    management: List[CSEManagement] = Field(default_factory=list, description="Management team")
    ratios: List[CSERatios] = Field(default_factory=list, description="Financial ratios")
    financials: List[CSEFinancials] = Field(default_factory=list, description="Financial data")
    dividends: List[CSEDividend] = Field(default_factory=list, description="Dividends")
    capital_increases: List[CSECapitalIncrease] = Field(default_factory=list, description="Capital increases")


class CSEHistoricalPrice(BaseModel):
    """Historical price data point."""
    date: str = Field(..., description="Trading session date")
    opening_price: Optional[float] = Field(None, description="Opening price")
    closing_price: Optional[float] = Field(None, description="Closing/last price")
    high_price: Optional[float] = Field(None, description="Session high")
    low_price: Optional[float] = Field(None, description="Session low")
    reference_price: Optional[float] = Field(None, description="Reference price")
    change_percent: Optional[float] = Field(None, description="Percentage change")
    quantity_traded: Optional[float] = Field(None, description="Shares traded")
    volume: Optional[float] = Field(None, description="Traded value in MAD")
    total_trades: Optional[int] = Field(None, description="Number of trades")
    market_cap: Optional[float] = Field(None, description="Market capitalization")


class CSEHistoricalPricesResponse(BaseModel):
    """Response for /get_historical_prices."""
    page: int = Field(..., description="Current page")
    prices: List[CSEHistoricalPrice] = Field(..., description="Historical prices")
    ticker: str = Field(..., description="Ticker")
    company: str = Field(..., description="Company name")
    start_date: str = Field(..., description="Start date")
    end_date: str = Field(..., description="End date")
    page_size: int = Field(..., description="Page size")
    total_sessions: int = Field(..., description="Total sessions")
    has_more: bool = Field(..., description="Whether more pages exist")


class CSESectorSummary(BaseModel):
    """Sector summary data."""
    sector: str = Field(..., description="Sector name")
    company_count: int = Field(..., description="Number of companies")
    traded_count: int = Field(..., description="Companies traded in session")
    gainers: int = Field(..., description="Number of gainers")
    losers: int = Field(..., description="Number of losers")
    unchanged: int = Field(..., description="Number unchanged")
    total_market_cap: float = Field(..., description="Combined market cap in MAD")
    total_volume: float = Field(..., description="Combined traded value in MAD")
    total_quantity_traded: float = Field(..., description="Combined shares traded")
    total_trades: int = Field(..., description="Combined trade count")
    tickers: List[str] = Field(..., description="Constituent tickers")
    average_change_percent: Optional[float] = Field(None, description="Simple average change")
    cap_weighted_change_percent: Optional[float] = Field(None, description="Market-cap-weighted change")


class CSESectorSummaryResponse(BaseModel):
    """Response for /get_sector_summary."""
    sectors: List[CSESectorSummary] = Field(..., description="Sector summaries")
    session_date: str = Field(..., description="Session date")
    session_status: str = Field(..., description="Session status")
    total_sectors: int = Field(..., description="Total sectors")
