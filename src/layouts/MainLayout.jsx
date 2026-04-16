import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Menu, X, Bell, User, Layers, LogOut } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

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
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors hidden sm:block">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
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

            <button
              onClick={() => {
                localStorage.removeItem("adminToken");
                navigate("/login");
              }}
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex items-center gap-2 group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium hidden md:block">
                Logout
              </span>
            </button>
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
