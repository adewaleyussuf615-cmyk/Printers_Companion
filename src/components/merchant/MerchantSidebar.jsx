import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingBag, Settings, 
  LogOut, TrendingUp, X, Menu, Bell
} from 'lucide-react';
import logoMark from '../../assets/logo-mark.png';

const MerchantSidebar = ({ sidebarOpen, setSidebarOpen, newOrderCount = 0 }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/merchant/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/merchant/stocks', icon: Package, label: 'Stocks List' },
    { path: '/merchant/orders', icon: ShoppingBag, label: 'Orders', badge: newOrderCount },
    { path: '/merchant/analytics', icon: TrendingUp, label: 'Analytics' },
    { path: '/merchant/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 fixed h-full z-20 flex flex-col`} style={{ backgroundColor: '#0B1F3A' }}>
      {/* Logo */}
      <div className="p-4 flex justify-between items-center border-b" style={{ borderColor: '#1a3a5c' }}>
        <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center w-full'}`}>
          <img src={logoMark} alt="Printers Companion" className="w-8 h-8 object-cover rounded-full bg-white shrink-0" />
          {sidebarOpen && <span className="font-bold text-white">Printers Companion</span>}
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path) ? 'bg-[#E53935] text-white' : 'text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              {sidebarOpen && (
                <div className="flex-1 flex justify-between items-center">
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: '#1a3a5c' }}>
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default MerchantSidebar;
