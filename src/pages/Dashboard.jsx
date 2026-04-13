import React, { useState, useEffect } from "react";
import {
  Package,
  RefreshCcw,
  CalendarClock,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Box,
} from "lucide-react";
import { inventoryService } from "../services/api";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getStats();
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: "Total Products",
      value: stats?.total_products || 0,
      icon: Box,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      name: "Pending Resv",
      value: stats?.pending_reservations || 0,
      icon: CalendarClock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      name: "Movements (24h)",
      value: stats?.movements_24h || 0,
      icon: RefreshCcw,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      name: "Low Stock Items",
      value: stats?.low_stock_count || 0,
      icon: AlertTriangle,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ];

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 gap-2 font-medium">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" /> Gathering
        Analytics...
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Warehouse Overview
        </h1>
        <p className="text-gray-500 text-sm font-medium mt-1">
          Real-time inventory metrics and stock health
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div
            key={card.name}
            className="bg-white border border-gray-100 p-6 rounded-2xl group hover:border-primary-500/50 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              {card.name}
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {card.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Stock Health Chart Placeholder */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-primary-600 w-5 h-5" />
              Stock Distribution
            </h3>
            <Link
              to="/inventory"
              className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1 group"
            >
              Manage Inventory
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-400 italic text-sm">
                Visualizing Stock Levels...
              </p>
            </div>
          </div>
        </div>

        {/* Status / Quick Info */}
        <div className="space-y-6">
          <div className="bg-primary-600 rounded-2xl p-6 text-white shadow-xl shadow-primary-600/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
              <Box className="w-20 h-20" />
            </div>
            <h3 className="text-lg font-bold mb-1">Stock Replenishment</h3>
            <p className="text-primary-100 text-xs mb-6 opacity-90 leading-relaxed">
              Scan new arrivals and update warehouse quantity instantly.
            </p>
            <Link to="/inventory">
              <button className="bg-white text-primary-600 text-xs font-bold py-2.5 px-6 rounded-xl transition-all active:scale-[0.98] shadow-lg">
                Go to Inventory
              </button>
            </Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wide">
              Infrastructure
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 italic">
                  API Engine
                </span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 uppercase transition-all">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 italic">
                  Database Relay
                </span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 italic">
                  Cleanup Loop
                </span>
                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  Every 5m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
