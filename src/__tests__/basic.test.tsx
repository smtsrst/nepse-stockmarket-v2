import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Simple test component for testing
function TestComponent({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} data-testid="test-button">
      Click me
    </button>
  );
}

describe('Basic UI Tests', () => {
  it('renders a button', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('test-button')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<TestComponent onClick={handleClick} />);
    
    await user.click(screen.getByTestId('test-button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('Number Formatting', () => {
  it('formats large numbers with crores', () => {
    const formatNumber = (num: number | undefined) => {
      if (num === undefined) return 'N/A';
      if (num >= 10000000) return `Rs. ${(num / 10000000).toFixed(2)} Cr`;
      if (num >= 100000) return `Rs. ${(num / 100000).toFixed(2)} L`;
      return new Intl.NumberFormat('en-NP').format(num);
    };

    expect(formatNumber(15000000)).toBe('Rs. 1.50 Cr');
    expect(formatNumber(1500000)).toBe('Rs. 15.00 L');
    expect(formatNumber(50000)).toBe('50,000');
    expect(formatNumber(undefined)).toBe('N/A');
  });
});

describe('Stock Data Validation', () => {
  it('validates stock data structure', () => {
    const isValidStock = (data: unknown): data is { symbol: string; last_traded_price: number } => {
      return typeof data === 'object' && data !== null && 'symbol' in data && 'last_traded_price' in data;
    };

    const validStock = { symbol: 'NABIL', last_traded_price: 500 };
    const invalidStock = { name: 'Bank' };

    expect(isValidStock(validStock)).toBe(true);
    expect(isValidStock(invalidStock)).toBe(false);
    expect(isValidStock(null)).toBe(false);
  });
});

describe('Portfolio Calculations', () => {
  it('calculates profit/loss correctly', () => {
    const calculatePL = (currentValue: number, invested: number) => {
      return currentValue - invested;
    };

    const calculatePLPercent = (currentValue: number, invested: number) => {
      if (invested === 0) return 0;
      return ((currentValue - invested) / invested) * 100;
    };

    expect(calculatePL(120000, 100000)).toBe(20000);
    expect(calculatePLPercent(120000, 100000)).toBe(20);
    expect(calculatePL(80000, 100000)).toBe(-20000);
    expect(calculatePLPercent(80000, 100000)).toBe(-20);
  });
});