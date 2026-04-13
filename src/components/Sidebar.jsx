import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  RefreshCcw, 
  CalendarClock, 
  Settings,
  X,
  Warehouse
} from 'lucide-react';

const Sidebar = ({ onClose }) => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Inventory', icon: Package, path: '/inventory' },
    { name: 'Movements', icon: RefreshCcw, path: '/movements' },
    { name: 'Reservations', icon: CalendarClock, path: '/reservations' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-gray-300">
      {/* Brand */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Warehouse className="h-8 w-8 text-primary-500" />
          <span className="text-xl font-bold text-white tracking-tight">INV PORTAL</span>
        </div>
        <button 
          className="rounded-md p-1 hover:bg-gray-800 lg:hidden"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-sidebar-active text-white' 
                : 'hover:bg-sidebar-hover hover:text-white'}
            `}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile snippet */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
            <Warehouse className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">Main Warehouse</span>
            <span className="text-xs text-gray-500">Standalone Mode</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
