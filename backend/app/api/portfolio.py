"""
Portfolio API endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Portfolio, Holding, Transaction, User
from app.schemas import (
    PortfolioCreate,
    PortfolioUpdate,
    PortfolioResponse,
    HoldingCreate,
    HoldingUpdate,
    HoldingResponse,
    TransactionCreate,
    TransactionResponse,
    HoldingPerformance,
    PortfolioPerformance,
)
from app.security import get_current_user
from app.core.client import get_nepse_client

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get("", response_model=List[PortfolioResponse])
def get_portfolios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all portfolios for current user."""
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    return portfolios


@router.post("", response_model=PortfolioResponse)
def create_portfolio(
    portfolio_data: PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new portfolio."""
    portfolio = Portfolio(
        name=portfolio_data.name,
        user_id=current_user.id,
    )
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return portfolio


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific portfolio."""
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.user_id == current_user.id)
        .first()
    )
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found",
        )
    return portfolio


@router.put("/{portfolio_id}", response_model=PortfolioResponse)
def update_portfolio(
    portfolio_id: int,
    portfolio_data: PortfolioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a portfolio."""
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.user_id == current_user.id)
        .first()
    )
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found",
        )

    if portfolio_data.name:
        portfolio.name = portfolio_data.name

    db.commit()
    db.refresh(portfolio)
    return portfolio


@router.delete("/{portfolio_id}")
def delete_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a portfolio."""
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.user_id == current_user.id)
        .first()
    )
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found",
        )

    db.delete(portfolio)
    db.commit()
    return {"message": "Portfolio deleted successfully"}


@router.get("/{portfolio_id}/holdings", response_model=List[HoldingResponse])
def get_holdings(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all holdings in a portfolio."""
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.user_id == current_user.id)
        .first()
    )
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found",
        )

    holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio_id).all()
    return holdings


@router.post("/{portfolio_id}/holdings", response_model=HoldingResponse)
def add_holding(
    portfolio_id: int,
    holding_data: HoldingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a holding to a portfolio."""
    # Verify portfolio ownership
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.user_id == current_user.id)
        .first()
    )
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found",
        )

    # Check if holding already exists
    existing = (
        db.query(Holding)
        .filter(
            Holding.portfolio_id == portfolio_id,
            Holding.symbol == holding_data.symbol.upper(),
        )
        .first()
    )

    if existing:
        # Update existing holding (average price)
        new_quantity = existing.quantity + holding_data.quantity
        new_avg_price = (
            (existing.quantity * existing.avg_price)
            + (holding_data.quantity * holding_data.avg_price)
        ) / new_quantity

        existing.quantity = new_quantity
        existing.avg_price = new_avg_price

        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new holding
        holding = Holding(
            portfolio_id=portfolio_id,
            symbol=holding_data.symbol.upper(),
            quantity=holding_data.quantity,
            avg_price=holding_data.avg_price,
        )
        db.add(holding)
        db.commit()
        db.refresh(holding)
        return holding


@router.put("/{portfolio_id}/holdings/{symbol}", response_model=HoldingResponse)
def update_holding(
    portfolio_id: int,
    symbol: str,
    holding_data: HoldingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a holding."""
    # Verify ownership
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.user_id == current_user.id)
        .first()
    )
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found",
        )

    holding = (
        db.query(Holding)
        .filter(
            Holding.portfolio_id == portfolio_id,
            Holding.symbol == symbol.upper(),
        )
        .first()
    )
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holding not found",
        )

    if holding_data.quantity is not None:
        holding.quantity = holding_data.quantity
    if holding_data.avg_price is not None:
        holding.avg_price = holding_data.avg_price

    db.commit()
    db.refresh(holding)
    return holding


@router.delete("/{portfolio_id}/holdings/{symbol}")
def remove_holding(
    portfolio_id: int,
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a holding from a portfolio."""
    # Verify ownership
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.user_id == current_user.id)
        .first()
    )
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found",
        )

    holding = (
        db.query(Holding)
        .filter(
            Holding.portfolio_id == portfolio_id,
            Holding.symbol == symbol.upper(),
        )
        .first()
    )
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holding not found",
        )

    db.delete(holding)
    db.commit()
    return {"message": "Holding removed successfully"}


@router.get("/{portfolio_id}/performance", response_model=PortfolioPerformance)
def get_portfolio_performance(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get portfolio performance metrics."""
    # Verify ownership
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.user_id == current_user.id)
        .first()
    )
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found",
        )

    holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio_id).all()

    # Get current prices
    client = get_nepse_client()
    stocks = client.get_stocks()
    prices = {s.get("symbol"): s.get("lastTradedPrice", 0) for s in stocks}

    total_invested = 0
    current_value = 0
    holdings_performance = []

    for holding in holdings:
        current_price = prices.get(holding.symbol, 0)
        invested = holding.quantity * holding.avg_price
        value = holding.quantity * current_price
        pnl = value - invested

        total_invested += invested
        current_value += value

        holdings_performance.append(
            HoldingPerformance(
                symbol=holding.symbol,
                quantity=holding.quantity,
                avg_price=holding.avg_price,
                current_price=current_price,
                total_invested=invested,
                current_value=value,
                profit_loss=pnl,
                profit_loss_percent=(pnl / invested * 100) if invested > 0 else 0,
            )
        )

    total_pnl = current_value - total_invested
    pnl_percent = (total_pnl / total_invested * 100) if total_invested > 0 else 0

    return PortfolioPerformance(
        portfolio_id=portfolio_id,
        portfolio_name=portfolio.name,
        total_invested=total_invested,
        current_value=current_value,
        profit_loss=total_pnl,
        profit_loss_percent=pnl_percent,
        holdings=holdings_performance,
    )


@router.post("/{portfolio_id}/transactions", response_model=TransactionResponse)
def add_transaction(
    portfolio_id: int,
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a buy/sell transaction."""
    # Verify ownership
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.user_id == current_user.id)
        .first()
    )
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found",
        )

    # Create transaction
    transaction = Transaction(
        portfolio_id=portfolio_id,
        symbol=transaction_data.symbol.upper(),
        transaction_type=transaction_data.transaction_type,
        quantity=transaction_data.quantity,
        price=transaction_data.price,
    )
    db.add(transaction)

    # Update or create holding
    holding = (
        db.query(Holding)
        .filter(
            Holding.portfolio_id == portfolio_id,
            Holding.symbol == transaction_data.symbol.upper(),
        )
        .first()
    )

    if transaction_data.transaction_type == "BUY":
        if holding:
            # Update average price
            new_quantity = holding.quantity + transaction_data.quantity
            new_avg_price = (
                (holding.quantity * holding.avg_price)
                + (transaction_data.quantity * transaction_data.price)
            ) / new_quantity
            holding.quantity = new_quantity
            holding.avg_price = new_avg_price
        else:
            # Create new holding
            holding = Holding(
                portfolio_id=portfolio_id,
                symbol=transaction_data.symbol.upper(),
                quantity=transaction_data.quantity,
                avg_price=transaction_data.price,
            )
            db.add(holding)
    elif transaction_data.transaction_type == "SELL":
        if holding:
            holding.quantity -= transaction_data.quantity
            if holding.quantity <= 0:
                db.delete(holding)

    db.commit()
    db.refresh(transaction)
    return transaction
