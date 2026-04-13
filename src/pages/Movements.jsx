import React, { useState, useEffect } from "react";
import {
  RefreshCcw,
  Search,
  Filter,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Settings2,
  Box,
} from "lucide-react";
import { inventoryService } from "../services/api";

const Movements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMovements();
  }, [type]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (type) params.type = type;
      const res = await inventoryService.getMovements(params);
      setMovements(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <RefreshCcw className="h-7 w-7 text-primary-600" />
            Stock Audit Trail
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Verifiable ledger of all warehouse inbound and outbound traffic
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 sm:flex-row sm:items-center">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by reference ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-600 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all cursor-pointer"
        >
          <option value="">All Transactions</option>
          <option value="IN">Stock Inbound</option>
          <option value="OUT">Stock Outbound</option>
          <option value="ADJUST">Inventory Adjust</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-gray-400 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />{" "}
            Pulling Ledger Data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                <tr>
                  <th className="px-6 py-4">Status & Type</th>
                  <th className="px-6 py-4">Target Product</th>
                  <th className="px-6 py-4">Quantity Delta</th>
                  <th className="px-6 py-4">Reference Source</th>
                  <th className="px-6 py-4">Fulfillment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movements.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-400 italic"
                    >
                      No warehouse movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements
                    .filter((m) => {
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return (
                        (m.reference_id?.toLowerCase() || "").includes(term) ||
                        m.product_id.toString().includes(term) ||
                        m.type.toLowerCase().includes(term)
                      );
                    })
                    .map((m) => (
                      <tr
                        key={m.id}
                        className="group hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                              m.type === "IN"
                                ? "bg-emerald-100 text-emerald-700"
                                : m.type === "OUT"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {m.type === "IN" ? (
                              <ArrowDownLeft className="h-3 w-3" />
                            ) : m.type === "OUT" ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <Settings2 className="h-3 w-3" />
                            )}
                            {m.type === "IN"
                              ? "Inbound"
                              : m.type === "OUT"
                                ? "Outbound"
                                : "Adjust"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-gray-300" />
                            <span className="font-bold text-gray-900">
                              #PX-{m.product_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-black ${m.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}{" "}
                            units
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-gray-400 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                            {m.reference_id || "manual_entry"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                          {new Date(m.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Movements;
