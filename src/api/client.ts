import axios, { AxiosInstance, AxiosError } from 'axios';
import type { AuthTokens, User, Portfolio, PortfolioPerformance, Holding, MarketStatus, MarketSummary, IndexData, StockData, TechnicalAnalysis, FloorsheetData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.accessToken = null;
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  // Auth endpoints
  async register(email: string, password: string, fullName?: string) {
    const response = await this.client.post<User>('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await this.client.post<AuthTokens>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    this.setAccessToken(response.data.access_token);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await this.client.post<AuthTokens>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  logout() {
    this.setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Market endpoints
  async getMarketStatus(): Promise<MarketStatus> {
    const response = await this.client.get<MarketStatus>('/market/status');
    return response.data;
  }

  async getMarketSummary(): Promise<MarketSummary> {
    const response = await this.client.get<MarketSummary>('/market/summary');
    return response.data;
  }

  async getIndices(): Promise<{ nepse_index: IndexData; sector_indices: IndexData[] }> {
    const response = await this.client.get('/market/indices');
    return response.data;
  }

  // Stocks endpoints
  async getStocks(sector?: string, limit?: number): Promise<StockData[]> {
    const params = new URLSearchParams();
    if (sector) params.append('sector', sector);
    if (limit) params.append('limit', limit.toString());
    else params.append('limit', '500');

    const response = await this.client.get<StockData[]>(`/stocks?${params}`);
    return response.data;
  }

  async getStock(symbol: string): Promise<StockData> {
    const response = await this.client.get<StockData>(`/stocks/${symbol}`);
    return response.data;
  }

  async getTopGainers(limit?: number): Promise<StockData[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await this.client.get<StockData[]>(`/stocks/gainers${params}`);
    return response.data;
  }

  async getTopLosers(limit?: number): Promise<StockData[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await this.client.get<StockData[]>(`/stocks/losers${params}`);
    return response.data;
  }

  async getStockHistory(symbol: string, days?: number): Promise<{ history: any[] }> {
    const params = days ? `?days=${days}` : '';
    const response = await this.client.get(`/stocks/${symbol}/history${params}`);
    return response.data;
  }

  async getStockAnalysis(symbol: string): Promise<TechnicalAnalysis> {
    const response = await this.client.get<TechnicalAnalysis>(`/stocks/${symbol}/analysis`);
    return response.data;
  }

  async getStockPrediction(symbol: string): Promise<{
    symbol: string;
    current_price: number;
    prediction: string;
    confidence: number;
    prob_up: number;
    prob_down: number;
  }> {
    const response = await this.client.get(`/predict/${symbol}`);
    return response.data;
  }

  // Floorsheet endpoints
  async getFloorsheet(): Promise<FloorsheetData[]> {
    const response = await this.client.get('/floorsheet');
    return response.data;
  }

  async getFloorsheetBySymbol(symbol: string): Promise<FloorsheetData[]> {
    const response = await this.client.get(`/floorsheet/${symbol}`);
    return response.data;
  }

  // Portfolio endpoints
  async getPortfolios(): Promise<Portfolio[]> {
    const response = await this.client.get<Portfolio[]>('/portfolio');
    return response.data;
  }

  async createPortfolio(name: string): Promise<Portfolio> {
    const response = await this.client.post<Portfolio>('/portfolio', { name });
    return response.data;
  }

  async getPortfolio(id: number): Promise<Portfolio> {
    const response = await this.client.get<Portfolio>(`/portfolio/${id}`);
    return response.data;
  }

  async updatePortfolio(id: number, name: string): Promise<Portfolio> {
    const response = await this.client.put<Portfolio>(`/portfolio/${id}`, { name });
    return response.data;
  }

  async deletePortfolio(id: number): Promise<void> {
    await this.client.delete(`/portfolio/${id}`);
  }

  async getHoldings(portfolioId: number): Promise<Holding[]> {
    const response = await this.client.get<Holding[]>(`/portfolio/${portfolioId}/holdings`);
    return response.data;
  }

  async addHolding(portfolioId: number, symbol: string, quantity: number, avgPrice: number): Promise<Holding> {
    const response = await this.client.post<Holding>(`/portfolio/${portfolioId}/holdings`, {
      symbol,
      quantity,
      avg_price: avgPrice,
    });
    return response.data;
  }

  async updateHolding(portfolioId: number, symbol: string, quantity?: number, avgPrice?: number): Promise<Holding> {
    const response = await this.client.put<Holding>(`/portfolio/${portfolioId}/holdings/${symbol}`, {
      quantity,
      avg_price: avgPrice,
    });
    return response.data;
  }

  async removeHolding(portfolioId: number, symbol: string): Promise<void> {
    await this.client.delete(`/portfolio/${portfolioId}/holdings/${symbol}`);
  }

  async getPortfolioPerformance(portfolioId: number): Promise<PortfolioPerformance> {
    const response = await this.client.get<PortfolioPerformance>(`/portfolio/${portfolioId}/performance`);
    return response.data;
  }
}

export const api = new ApiClient();