"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# Portfolio Schemas
class HoldingCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    quantity: float = Field(..., gt=0)
    avg_price: float = Field(..., gt=0)


class HoldingUpdate(BaseModel):
    quantity: Optional[float] = Field(None, gt=0)
    avg_price: Optional[float] = Field(None, gt=0)


class HoldingResponse(BaseModel):
    id: int
    portfolio_id: int
    symbol: str
    quantity: float
    avg_price: float
    added_at: datetime

    model_config = {"from_attributes": True}


class PortfolioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class PortfolioUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class PortfolioResponse(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime
    updated_at: datetime
    holdings: list[HoldingResponse] = []

    model_config = {"from_attributes": True}


class TransactionCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    transaction_type: str = Field(..., pattern="^(BUY|SELL)$")
    quantity: float = Field(..., gt=0)
    price: float = Field(..., gt=0)


class TransactionResponse(BaseModel):
    id: int
    portfolio_id: int
    symbol: str
    transaction_type: str
    quantity: float
    price: float
    executed_at: datetime

    model_config = {"from_attributes": True}


# Performance Schemas
class HoldingPerformance(BaseModel):
    symbol: str
    quantity: float
    avg_price: float
    current_price: Optional[float] = None
    total_invested: float
    current_value: Optional[float] = None
    profit_loss: Optional[float] = None
    profit_loss_percent: Optional[float] = None


class PortfolioPerformance(BaseModel):
    portfolio_id: int
    portfolio_name: str
    total_invested: float
    current_value: float
    profit_loss: float
    profit_loss_percent: float
    holdings: list[HoldingPerformance]


# Market Data Schemas
class MarketStatus(BaseModel):
    is_open: bool
    message: Optional[str] = None


class MarketSummary(BaseModel):
    total_turnover: Optional[float] = None
    total_trade: Optional[int] = None
    total_share: Optional[int] = None
    total_companies: Optional[int] = None


class IndexData(BaseModel):
    index_value: Optional[float] = None
    index_change: Optional[float] = None
    index_change_percent: Optional[float] = None
    float_index_value: Optional[float] = None
    sensitive_index_value: Optional[float] = None


class StockData(BaseModel):
    symbol: str
    name: Optional[str] = None
    last_traded_price: Optional[float] = None
    open_price: Optional[float] = None
    high_price: Optional[float] = None
    low_price: Optional[float] = None
    volume: Optional[int] = None
    percentage_change: Optional[float] = None


class StockHistory(BaseModel):
    symbol: str
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


# Analysis Schemas
class TechnicalIndicators(BaseModel):
    symbol: str
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    sma_200: Optional[float] = None
    bollinger_upper: Optional[float] = None
    bollinger_middle: Optional[float] = None
    bollinger_lower: Optional[float] = None
    recommendation: Optional[str] = None


# Floorsheet Schemas
class FloorsheetData(BaseModel):
    symbol: str
    buyer_broker: str
    seller_broker: str
    quantity: int
    rate: float
    amount: float
    date: Optional[str] = None
