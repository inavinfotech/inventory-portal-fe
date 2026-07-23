import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Menu, X, Bell, User, Layers, LogOut, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { inventoryService } from "../services/api";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async (showLoading = false) => {
    try {
      if (showLoading) setLoadingNotifications(true);
      const res = await inventoryService.getLowStock();
      setNotifications(res.data || []);
    } catch (e) {
      console.error("Failed to fetch low stock alerts", e);
    } finally {
      if (showLoading) setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleStockUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener("stock-updated", handleStockUpdate);

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000); // Poll every 15 seconds

    return () => {
      window.removeEventListener("stock-updated", handleStockUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleToggleNotifications = () => {
    if (!showNotifications) {
      fetchNotifications(true);
    }
    setShowNotifications(!showNotifications);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans antialiased overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-8 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 lg:hidden transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
              Inventory Management System
            </h2>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="relative">
              <button 
                onClick={handleToggleNotifications}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2.5 w-80 max-h-96 overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-2xl z-40 py-2 divide-y divide-gray-50 animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar">
                    <div className="px-4 py-2.5 flex items-center justify-between bg-gray-50/50 sticky top-0 backdrop-blur-sm z-10 border-b border-gray-100">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Notifications
                      </span>
                      {notifications.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider">
                          {notifications.length} Low Stock
                        </span>
                      )}
                    </div>
                    
                    {loadingNotifications ? (
                      <div className="py-8 flex flex-col items-center justify-center text-gray-400 gap-2 font-medium">
                        <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Loading Alerts...</span>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 px-4 text-center text-gray-400 flex flex-col items-center justify-center">
                        <ShieldCheck className="h-8 w-8 text-emerald-500 mb-2 opacity-80" />
                        <p className="text-xs font-bold text-gray-800 mb-0.5">All Systems Nominal</p>
                        <p className="text-[10px] text-gray-400 font-medium">All items are sufficiently stocked.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifications.map((item, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              setShowNotifications(false);
                              navigate(`/inventory/${item.product_id}`);
                            }}
                            className="p-3.5 hover:bg-gray-50/85 transition-colors cursor-pointer flex gap-3.5 items-start group text-left"
                          >
                            <div className="mt-0.5 p-1.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 group-hover:bg-rose-100 transition-colors shrink-0">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                                {item.name}
                              </p>
                              {item.weight && (
                                <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                                  Weight: {item.weight}
                                </p>
                              )}
                              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-tighter mt-0.5">
                                SKU: {item.sku}
                              </p>
                              <div className="flex items-center gap-1.5 mt-2">
                                <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden max-w-[80px]">
                                  <div 
                                    className="h-full bg-rose-500 rounded-full" 
                                    style={{ width: `${Math.max(5, (item.current_quantity / item.threshold) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-black text-rose-600 uppercase">
                                  {item.current_quantity} / {item.threshold} Units
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center gap-3 pr-2 border-r border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none">
                  Admin
                </p>
                <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-wider">
                  Inventory Manager
                </p>
              </div>
              <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 ring-2 ring-gray-50">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-gray-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
