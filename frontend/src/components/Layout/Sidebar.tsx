import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Search,
  BarChart3,
  Eye,
  PieChart,
  History,
  Settings,
  Database,
  FileText,
  Bell,
  ArrowLeftRight,
  Activity,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/stocks', icon: TrendingUp, label: 'Stocks' },
  { path: '/screener', icon: Search, label: 'Screener' },
  { path: '/heatmap', icon: BarChart3, label: 'Heatmap' },
  { path: '/watchlist', icon: Eye, label: 'Watchlist' },
  { path: '/portfolio', icon: PieChart, label: 'Portfolio' },
  { path: '/backtest', icon: History, label: 'Backtest' },
];

const analysisItems = [
  { path: '/floorsheet', icon: ArrowLeftRight, label: 'Floorsheet' },
  { path: '/transactions', icon: FileText, label: 'Transactions' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
  { path: '/analysis', icon: Activity, label: 'Analysis' },
];

const bottomItems = [
  { path: '/data', icon: Database, label: 'Data' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ marketOpen }: { marketOpen: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className="sidebar"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="logo-icon">N</span>
        {expanded && <span className="logo-text">NEPSE</span>}
      </div>

      {/* Market Status */}
      <div className="market-status">
        <div className={`live-indicator ${!marketOpen ? 'closed' : ''}`}>
          <span className="live-dot"></span>
          {expanded && (marketOpen ? 'Market Open' : 'Market Closed')}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            title={item.label}
          >
            <item.icon size={18} />
            {expanded && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
        
        {/* Divider */}
        {expanded && <div className="nav-divider">Analysis</div>}
        
        {analysisItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            title={item.label}
          >
            <item.icon size={18} />
            {expanded && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="sidebar-bottom">
        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            title={item.label}
          >
            <item.icon size={18} />
            {expanded && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </div>

      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 56px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: width 0.15s ease;
          overflow: hidden;
        }

        .sidebar:hover {
          width: 180px;
        }

        .sidebar-logo {
          height: 36px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .logo-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent);
          color: #000;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .logo-text {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          font-size: 0.9rem;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .market-status {
          padding: 8px;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--gain);
        }

        .live-indicator.closed {
          color: var(--text-muted);
        }

        .live-indicator.closed .live-dot {
          background: var(--text-muted);
          animation: none;
        }

        .live-dot {
          width: 5px;
          height: 5px;
          background-color: var(--gain);
          animation: pulse-dot 1.5s infinite;
          flex-shrink: 0;
        }

        .sidebar-nav {
          flex: 1;
          padding: 8px 0;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          color: var(--text-muted);
          text-decoration: none;
          transition: all 0.1s ease;
          white-space: nowrap;
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .nav-item.active {
          color: var(--accent);
          background: var(--bg-tertiary);
        }

        .nav-item svg {
          flex-shrink: 0;
        }

        .nav-label {
          font-size: 0.85rem;
        }

        .nav-divider {
          padding: 12px 14px 4px;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
          border-top: 1px solid var(--border);
          margin-top: 8px;
        }

        .sidebar-bottom {
          padding: 8px 0;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </aside>
  );
}
