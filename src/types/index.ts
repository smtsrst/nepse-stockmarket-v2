// TypeScript types for API responses
// This file contains all types - shared.ts has the core contract

// ============================================
// User & Auth
// ============================================

export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ============================================
// Portfolio Types
// ============================================

export interface Portfolio {
  id: number;
  name: string;
  created_at: string;
  user_id?: number;
  updated_at?: string;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price?: number;
  id?: number;
  portfolio_id?: number;
  added_at?: string;
}

export interface HoldingPerformance {
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price?: number;
  total_invested: number;
  current_value?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
}

export interface PortfolioPerformance {
  portfolio_id: number;
  portfolio_name: string;
  total_invested: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percent: number;
  holdings: HoldingPerformance[];
}

// ============================================
// Market Data Types
// ============================================

export interface MarketStatus {
  is_open: boolean;
  message?: string;
}

export interface MarketSummary {
  total_turnover?: number | null;
  total_trade?: number | null;
  total_share?: number | null;
  total_companies?: number | null;
}

export interface IndexData {
  index_value?: number | null;
  index_change?: number | null;
  index_change_percent?: number | null;
  float_index_value?: number | null;
  sensitive_index_value?: number | null;
}

export interface SectorIndex {
  id: number;
  index: string;
  change: number;
  perChange: number;
  currentValue: number;
}

// ============================================
// Stock Data Types
// ============================================

export interface StockData {
  symbol: string;
  name?: string;
  last_traded_price?: number;
  open_price?: number;
  high_price?: number;
  low_price?: number;
  volume?: number;
  percentage_change?: number;
}

export interface HistoryData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistoryResponse {
  symbol: string;
  days: number;
  source: string;
  record_count: number;
  history: HistoryData[];
}

// ============================================
// Technical Analysis Types
// ============================================

export interface TechnicalAnalysis {
  symbol: string;
  current_price?: number;
  rsi?: number | null;
  macd?: number | null;
  macd_signal?: number | null;
  macd_histogram?: number | null;
  sma_20?: number | null;
  sma_50?: number | null;
  sma_200?: number | null;
  bollinger_upper?: number | null;
  bollinger_middle?: number | null;
  bollinger_lower?: number | null;
  recommendation?: string;
  summary?: string;
}

export interface StockPrediction {
  symbol: string;
  current_price: number;
  prediction: 'UP' | 'DOWN' | string;
  confidence: number;
  prob_up: number;
  prob_down: number;
  indicators?: Record<string, number>;
}

// ============================================
// Floorsheet Types
// ============================================

export interface FloorsheetData {
  symbol: string;
  buyer_broker?: string | number;
  seller_broker?: string | number;
  quantity: number;
  rate: number;
  amount: number;
  time?: string;
  date?: string;
}

// ============================================
// Transaction History Types
// ============================================

export interface Transaction {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  rate: number;
  amount: number;
  date: string;
  notes?: string;
}

export interface TransactionSummary {
  total_buy: number;
  total_sell: number;
  net_investment: number;
  transactions: Transaction[];
}

// ============================================
// Price Alerts Types
// ============================================

export interface PriceAlert {
  id: number;
  symbol: string;
  target_price: number;
  condition: 'ABOVE' | 'BELOW';
  is_active: boolean;
  created_at: string;
  triggered_at?: string;
}

// ============================================
// Backtesting Types
// ============================================

export interface BacktestConfig {
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  strategy: 'SMA_CROSS' | 'RSI' | 'MACD' | 'HOLD';
  sma_short?: number;
  sma_long?: number;
  rsi_oversold?: number;
  rsi_overbought?: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  total_return: number;
  total_return_percent: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  max_drawdown: number;
  max_drawdown_percent: number;
  sharpe_ratio?: number;
  holdings: number;
  final_capital: number;
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  amount: number;
  reason: string;
}