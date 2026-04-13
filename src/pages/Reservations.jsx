import React, { useState, useEffect } from "react";
import {
  CalendarClock,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { reservationService } from "../services/api";

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await reservationService.getReservations();
      setReservations(res.data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === "confirm") await reservationService.confirm(id);
      else if (action === "release") await reservationService.release(id);
      fetchReservations();
    } catch (e) {
      alert(e.response?.data?.detail || "Action failed");
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div>
        <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <CalendarClock className="h-7 w-7 text-amber-500" />
          Pending Reservations
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Manage temporary stock holds for incoming orders
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-gray-400 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />{" "}
            Gathering Reservations...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                <tr>
                  <th className="px-6 py-4">Status & State</th>
                  <th className="px-6 py-4">Product Identity</th>
                  <th className="px-6 py-4">Reserved Quantity</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reservations.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-400 italic"
                    >
                      No active reservations found.
                    </td>
                  </tr>
                ) : (
                  reservations.map((r) => (
                    <tr
                      key={r.id}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-300 group-hover:text-gray-400 transition-colors">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            r.status === "RESERVED"
                              ? "bg-amber-100 text-amber-700"
                              : r.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {r.status === "RESERVED" ? (
                            <Clock className="h-3 w-3" />
                          ) : r.status === "CONFIRMED" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">
                            Product #{r.product_id}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono italic">
                            Internal Ref System
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-900">
                        {r.quantity} units
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {r.status === "RESERVED" ? (
                          <div className="flex items-center justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleAction(r.id, "confirm")}
                              className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/10"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleAction(r.id, "release")}
                              className="px-4 py-1.5 text-rose-600 font-bold hover:bg-rose-50 rounded-lg text-xs transition-all border border-rose-100"
                            >
                              Release
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic text-[10px] font-bold">
                            LOCKED
                          </span>
                        )}
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

export default Reservations;
