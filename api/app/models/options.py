from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date

from app.models.common import ProviderMetadata


class OptionType(str):
    """Option type."""
    CALL = "call"
    PUT = "put"


class OptionContract(BaseModel):
    """Option contract data."""
    contract_symbol: str = Field(..., description="Option contract symbol")
    type: str = Field(..., description="Option type (call or put)")
    strike: float = Field(..., description="Strike price")
    expiration: date = Field(..., description="Expiration date")
    last_price: Optional[float] = Field(None, description="Last price")
    bid: Optional[float] = Field(None, description="Bid price")
    ask: Optional[float] = Field(None, description="Ask price")
    volume: Optional[int] = Field(None, description="Volume")
    open_interest: Optional[int] = Field(None, description="Open interest")
    implied_volatility: Optional[float] = Field(None, description="Implied volatility")
    in_the_money: bool = Field(..., description="Whether option is in the money")


class OptionChain(BaseModel):
    """Option chain data."""
    symbol: str = Field(..., description="Underlying symbol")
    expiration: date = Field(..., description="Expiration date")
    calls: list[OptionContract] = Field(..., description="Call options")
    puts: list[OptionContract] = Field(..., description="Put options")
    metadata: ProviderMetadata = Field(..., description="Provider metadata")


class OptionExpirations(BaseModel):
    """Available option expiration dates."""
    symbol: str = Field(..., description="Underlying symbol")
    expirations: list[date] = Field(..., description="Expiration dates")
    metadata: ProviderMetadata = Field(..., description="Provider metadata")
