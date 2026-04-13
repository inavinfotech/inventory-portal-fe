import React, { useState, useEffect } from 'react';
import { Package, RefreshCcw, CalendarClock, AlertTriangle, Loader2 } from 'lucide-react';
import { inventoryService } from '../services/api';

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
    { name: 'Total Products', value: stats?.total_products || 0, icon: Package, color: 'bg-blue-600' },
    { name: 'Pending Resv', value: stats?.pending_reservations || 0, icon: CalendarClock, color: 'bg-amber-500' },
    { name: 'Movements (24h)', value: stats?.movements_24h || 0, icon: RefreshCcw, color: 'bg-emerald-500' },
    { name: 'Low Stock Items', value: stats?.low_stock_count || 0, icon: AlertTriangle, color: 'bg-rose-500' },
  ];

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-gray-400 gap-2 font-medium">
      <Loader2 className="h-6 w-6 animate-spin" /> Gathering Analytics...
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-3 text-white shadow-lg shadow-current/10 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <span className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</span>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.name}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 h-80 flex flex-col">
            <h4 className="font-bold text-gray-900 mb-4">Stock Overview</h4>
            <div className="flex-1 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 italic text-sm">
                Visualizing Inventory Health...
            </div>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 h-80 flex flex-col">
            <h4 className="font-bold text-gray-900 mb-4">Operational Status</h4>
            <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm font-bold text-emerald-800">API Latency</span>
                    <span className="text-xs font-mono text-emerald-600 px-2 py-0.5 bg-white rounded-full">12ms</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-bold text-blue-800">Database Engine</span>
                    <span className="text-xs font-mono text-blue-600 px-2 py-0.5 bg-white rounded-full">SQLite Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <span className="text-sm font-bold text-amber-800">Stale Cleanup</span>
                    <span className="text-xs font-mono text-amber-600 px-2 py-0.5 bg-white rounded-full">Every 5m</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
