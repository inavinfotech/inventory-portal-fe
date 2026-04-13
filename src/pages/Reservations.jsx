import React, { useState, useEffect } from 'react';
import { CalendarClock, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { reservationService } from '../services/api';

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
            setReservations(res.data.items);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'confirm') await reservationService.confirm(id);
            else if (action === 'release') await reservationService.release(id);
            fetchReservations();
        } catch (e) {
            alert(e.response?.data?.detail || 'Action failed');
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarClock className="h-6 w-6 text-amber-500" />
                Active Reservations
            </h3>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Product ID</th>
                                <th className="px-6 py-4">Quantity</th>
                                <th className="px-6 py-4">Reserved At</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {reservations.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                            r.status === 'RESERVED' ? 'bg-amber-100 text-amber-700' :
                                            r.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {r.status === 'RESERVED' ? <Clock className="h-3 w-3" /> :
                                             r.status === 'CONFIRMED' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-600">Product #{r.product_id}</td>
                                    <td className="px-6 py-4 font-bold">{r.quantity}</td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {r.status === 'RESERVED' && (
                                            <>
                                                <button onClick={() => handleAction(r.id, 'confirm')} className="text-emerald-600 font-bold hover:underline">Confirm</button>
                                                <span className="text-gray-200">|</span>
                                                <button onClick={() => handleAction(r.id, 'release')} className="text-rose-500 font-bold hover:underline">Release</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Reservations;
