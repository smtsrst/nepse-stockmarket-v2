import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Activity, RefreshCw, Clock, ArrowUpRight, ArrowDownRight, PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import type { MarketSummary, IndexData, StockData, PortfolioPerformance, SectorIndex } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const timeRanges = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: 1000 },
];

export default function Dashboard() {
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [indices, setIndices] = useState<IndexData | null>(null);
  const [sectorIndices, setSectorIndices] = useState<SectorIndex[]>([]);
  const [gainers, setGainers] = useState<StockData[]>([]);
  const [losers, setLosers] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioPerformance | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chartRange, setChartRange] = useState(30);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadChartData();
  }, [chartRange, portfolio]);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      const [summaryData, indicesData, gainersData, losersData] = await Promise.all([
        api.getMarketSummary(),
        api.getIndices(),
        api.getTopGainers(10),
        api.getTopLosers(10),
      ]);
      
      setSummary(summaryData);
      setIndices(indicesData.nepse_index);
      const mappedSectors = (indicesData.sector_indices || []).map((s: any) => ({
        id: s.id || 0,
        index: s.index || s.index_name || s.name || '',
        change: s.change || s.index_change || 0,
        perChange: s.perChange || s.index_change_percent || s.change_percent || 0,
        currentValue: s.currentValue || s.index_value || 0,
      }));
      setSectorIndices(mappedSectors);
      setGainers(gainersData);
      setLosers(losersData);
      
      try {
        const portfolios = await api.getPortfolios();
        if (portfolios && portfolios.length > 0) {
          const perf = await api.getPortfolioPerformance(portfolios[0].id);
          setPortfolio(perf);
        }
      } catch {
        // No portfolio data - user not authenticated
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadChartData = async () => {
    const mockData = [];
    const baseValue = portfolio?.current_value || summary?.total_turnover ? (summary?.total_turnover || 0) / 1000 : 100000;
    let currentValue = baseValue;
    const days = chartRange;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const change = (Math.random() - 0.48) * 0.015;
      currentValue = currentValue * (1 + change);
      mockData.push({ date: date.toISOString().split('T')[0], value: Math.max(currentValue, 0) });
    }
    setChartData(mockData);
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 10000000) return `Rs. ${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `Rs. ${(num / 100000).toFixed(2)} L`;
    return new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(num);
  };

  const formatPrice = (num: number | undefined) => {
    if (num === undefined || num === null) return 'N/A';
    return `Rs. ${num.toFixed(2)}`;
  };

  const getHeatmapColor = (change: number) => {
    const maxChange = 5;
    const normalized = Math.max(-maxChange, Math.min(maxChange, change)) / maxChange;
    if (normalized >= 0) {
      return `rgba(34, 197, 94, ${0.3 + normalized * 0.5})`;
    } else {
      return `rgba(239, 68, 68, ${0.3 + Math.abs(normalized)  * 0.5})`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-secondary">Loading market data...</div>
      </div>
    );
  }

  const portfolioValue = portfolio?.current_value || 0;
  const portfolioPL = portfolio?.profit_loss || 0;
  const portfolioPLPercent = portfolio?.profit_loss_percent || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">NEPSE Terminal</h1>
            <p className="text-text-secondary text-xs">Real-time market intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-text-secondary text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={() => loadData(true)} 
            disabled={refreshing}
            className="p-2 text-text-secondary hover:text-accent rounded-lg hover:bg-bg-secondary transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Half - Portfolio Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio Summary */}
        <div className="space-y-3">
          <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm">Portfolio Value</span>
              {(indices?.index_change || 0) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-gain" />
              ) : (
                <TrendingDown className="w-4 h-4 text-loss" />
              )}
            </div>
            <div className="text-2xl font-bold text-text-primary">{formatNumber(portfolioValue)}</div>
            <div className={`text-sm ${portfolioPL >= 0 ? 'text-gain' : 'text-loss'}`}>
              {portfolioPL >= 0 ? '+' : ''}{formatNumber(Math.abs(portfolioPL))} ({portfolioPLPercent >= 0 ? '+' : ''}{portfolioPLPercent.toFixed(2)}%)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-secondary border border-border rounded-xl p-3">
              <div className="text-text-secondary text-xs mb-1">Invested</div>
              <div className="text-lg font-semibold text-text-primary">{formatNumber(portfolio?.total_invested || 0)}</div>
            </div>
            <div className="bg-bg-secondary border border-border rounded-xl p-3">
              <div className="text-text-secondary text-xs mb-1">Holdings</div>
              <div className="text-lg font-semibold text-text-primary">{portfolio?.holdings.length || 0}</div>
            </div>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-3">
            <div className="text-text-secondary text-xs mb-2">NEPSE Index</div>
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-text-primary">{indices?.index_value?.toFixed(2) || '2,868'}</div>
              <div className={`text-sm ${(indices?.index_change || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                {(indices?.index_change || 0) >= 0 ? '+' : ''}{(indices?.index_change || -10).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-text-primary">Performance</h2>
            <div className="flex gap-1 bg-bg-tertiary rounded-lg p-1">
              {timeRanges.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setChartRange(r.days)}
                  className={`px-2 py-1 text-xs rounded ${
                    chartRange === r.days
                      ? 'bg-accent text-bg-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff9900" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff9900" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#737373', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#333' }}
                  tickFormatter={(d) => d.slice(5)}
                  minTickGap={50}
                />
                <YAxis 
                  tick={{ fill: '#737373', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toFixed(0)}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#a3a3a3' }}
                  formatter={(value: number) => [`Rs. ${value.toFixed(0)}`, 'Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#ff9900" 
                  strokeWidth={2}
                  fill="url(#portfolioGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Half - Heatmap & Market */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Holdings Heatmap */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <h2 className="font-semibold text-text-primary mb-3">Holdings Heatmap</h2>
          {portfolio && portfolio.holdings.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {portfolio.holdings.slice(0, 9).map((holding) => (
                <div
                  key={holding.symbol}
                  className="p-2 rounded-lg text-center"
                  style={{ backgroundColor: getHeatmapColor(holding.profit_loss_percent || 0) }}
                >
                  <div className="font-medium text-white text-shadow text-sm">{holding.symbol}</div>
                  <div className={`text-xs ${(holding.profit_loss_percent || 0) >= 0 ? 'text-white' : 'text-white/80'}`}>
                    {(holding.profit_loss_percent || 0) >= 0 ? '+' : ''}{(holding.profit_loss_percent || 0).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <PieChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No holdings yet</p>
            </div>
          )}
        </div>

        {/* Top Gainers */}
        <div className="bg-bg-secondary border border-border rounded-xl">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gain" />
            <span className="font-semibold text-text-primary text-sm">Top Gainers</span>
          </div>
          <div className="divide-y divide-border max-h-48 overflow-y-auto">
            {gainers.slice(0, 5).map((stock, i) => (
              <div key={stock.symbol} className="p-3 flex justify-between items-center hover:bg-bg-tertiary/50">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-gain/20 text-gain text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium text-text-primary text-sm">{stock.symbol}</div>
                    <div className="text-text-secondary text-xs">{stock.name?.slice(0, 15)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-text-primary text-sm">{formatPrice(stock.last_traded_price)}</div>
                  <div className="text-gain text-xs flex items-center justify-end gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +{stock.percentage_change?.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-bg-secondary border border-border rounded-xl">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-loss" />
            <span className="font-semibold text-text-primary text-sm">Top Losers</span>
          </div>
          <div className="divide-y divide-border max-h-48 overflow-y-auto">
            {losers.slice(0, 5).map((stock, i) => (
              <div key={stock.symbol} className="p-3 flex justify-between items-center hover:bg-bg-tertiary/50">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-loss/20 text-loss text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium text-text-primary text-sm">{stock.symbol}</div>
                    <div className="text-text-secondary text-xs">{stock.name?.slice(0, 15)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-text-primary text-sm">{formatPrice(stock.last_traded_price)}</div>
                  <div className="text-loss text-xs flex items-center justify-end gap-1">
                    <ArrowDownRight className="w-3 h-3" />
                    {stock.percentage_change?.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sector Indices - Compact */}
      {sectorIndices.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-xl p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sectorIndices.slice(0, 10).map((sector) => (
              <div key={sector.id} className="flex-shrink-0 px-3 py-1 bg-bg-tertiary rounded-lg">
                <div className="text-text-secondary text-xs">{sector.index}</div>
                <div className="flex items-center gap-2">
                  <span className="text-text-primary text-sm font-medium">{sector.currentValue?.toFixed(0) || '0'}</span>
                  <span className={`text-xs ${sector.change >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {sector.change >= 0 ? '+' : ''}{sector.perChange?.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}