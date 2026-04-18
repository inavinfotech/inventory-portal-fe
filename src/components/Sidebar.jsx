import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  RefreshCcw,
  CalendarClock,
  Settings,
  X,
  Warehouse,
  Layers,
  LogOut,
} from "lucide-react";

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Inventory", icon: Package, path: "/inventory" },
    { name: "Movements", icon: RefreshCcw, path: "/movements" },
    { name: "Reservations", icon: CalendarClock, path: "/reservations" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-gray-300 shadow-2xl">
      {/* Brand */}
      <div className="p-6 flex items-center justify-between border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <Layers className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight tracking-tight uppercase">
              INV Portal
            </h1>
            <p className="text-[10px] text-primary-400 font-semibold tracking-widest uppercase opacity-75">
              Inventory MS
            </p>
          </div>
        </div>
        <button
          className="rounded-md p-1 hover:bg-gray-800 lg:hidden text-gray-400"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 group
              ${
                isActive
                  ? "bg-sidebar-active text-white shadow-lg shadow-primary-600/20 translate-x-1"
                  : "text-gray-400 hover:bg-sidebar-hover hover:text-white"
              }
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`h-5 w-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile snippet */}
      <div className="border-t border-gray-800/50 p-4 bg-gray-900/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-gray-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300 group text-sm font-medium"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
