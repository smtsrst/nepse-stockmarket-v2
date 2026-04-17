import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Wallet, FileText, Settings, LogOut, Activity, List, Eye, ListFilter, History, Bell, FlaskConical, Database } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  onLogout: () => void;
  marketOpen: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/stocks', label: 'Stocks', icon: List },
  { path: '/screener', label: 'Screener', icon: ListFilter },
  { path: '/analysis', label: 'Analysis', icon: TrendingUp },
  { path: '/portfolio', label: 'Portfolio', icon: Wallet },
  { path: '/watchlist', label: 'Watchlist', icon: Eye },
  { path: '/floorsheet', label: 'Floorsheet', icon: FileText },
  { path: '/transactions', label: 'Transactions', icon: History },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/backtesting', label: 'Backtesting', icon: FlaskConical },
  { path: '/data', label: 'Data', icon: Database },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ onLogout, marketOpen, onExpandChange }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseEnter = () => {
    setIsExpanded(true);
    onExpandChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
    onExpandChange?.(false);
  };

  return (
    <>
      <aside 
        className={`fixed left-0 top-0 h-screen bg-bg-secondary border-r border-border flex flex-col transition-all duration-300 ease-in-out z-40 ${
          isExpanded ? 'w-56' : 'w-14'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <div className="p-2 border-b border-border flex items-center justify-center h-14">
          <Activity className={`w-6 h-6 text-accent flex-shrink-0 transition-transform ${isExpanded ? 'scale-110' : 'scale-90'}`} />
          {isExpanded && (
            <h1 className="ml-2 text-lg font-bold text-accent whitespace-nowrap animate-fade-in">
              NEPSE
            </h1>
          )}
        </div>

        {/* Market Status */}
        <div className="py-2 flex justify-center border-b border-border">
          <div className={`flex items-center gap-2 text-xs ${marketOpen ? 'text-gain' : 'text-text-secondary'}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${marketOpen ? 'bg-gain' : 'bg-text-secondary'} ${marketOpen ? 'animate-pulse' : ''}`} />
            {isExpanded && (
              <span className="whitespace-nowrap animate-fade-in">
                {marketOpen ? 'Market Open' : 'Market Closed'}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col py-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center py-2.5 mx-1.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-accent text-bg-primary'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                } ${isExpanded ? 'px-3 justify-start gap-3' : 'px-0 justify-center'}`
              }
              title={!isExpanded ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isExpanded ? '' : 'mx-auto'}`} />
              {isExpanded && (
                <span className="text-sm font-medium whitespace-nowrap animate-fade-in">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-border">
          <button
            onClick={onLogout}
            className={`flex items-center text-text-secondary hover:text-loss transition-colors rounded-lg hover:bg-bg-tertiary w-full ${
              isExpanded ? 'px-3 py-2 justify-start gap-3' : 'p-2 justify-center'
            }`}
            title={!isExpanded ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm animate-fade-in">Logout</span>}
          </button>
        </div>
      </aside>
      
      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
}