import React, { useState, useEffect } from 'react';
import { RefreshCcw, Search, Filter, Loader2, ArrowUpRight, ArrowDownLeft, Settings2 } from 'lucide-react';
import { inventoryService } from '../services/api';

const Movements = () => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [type, setType] = useState('');

    useEffect(() => {
        fetchMovements();
    }, [type]);

    const fetchMovements = async () => {
        try {
            setLoading(true);
            const res = await inventoryService.getMovements({ type });
            setMovements(res.data.items);
            setTotal(res.data.total);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <RefreshCcw className="h-6 w-6 text-primary-600" />
                    Stock Movements
                </h3>
            </div>

            <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sm:flex-row sm:items-center">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder="Search by reference..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    className="px-4 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium text-gray-600 focus:ring-2 focus:ring-primary-500/20"
                >
                    <option value="">All Types</option>
                    <option value="IN">Stock In</option>
                    <option value="OUT">Stock Out</option>
                    <option value="ADJUST">Adjustment</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex h-64 items-center justify-center text-gray-400">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 uppercase text-[10px] font-bold text-gray-400 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Product ID</th>
                                <th className="px-6 py-4">Quantity</th>
                                <th className="px-6 py-4">Reference</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm capitalize">
                            {movements.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                            m.type === 'IN' ? 'bg-emerald-50 text-emerald-700' :
                                            m.type === 'OUT' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            {m.type === 'IN' ? <ArrowDownLeft className="h-3 w-3" /> :
                                             m.type === 'OUT' ? <ArrowUpRight className="h-3 w-3" /> : <Settings2 className="h-3 w-3" />}
                                            {m.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-500">#{m.product_id}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{m.quantity}</td>
                                    <td className="px-6 py-4 text-gray-400 italic text-xs">{m.reference_id || 'manual'}</td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(m.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Movements;
