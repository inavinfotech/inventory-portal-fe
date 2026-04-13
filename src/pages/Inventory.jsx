import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Warehouse, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { inventoryService } from '../services/api';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getProducts();
      // products are in response.data[0] as per ProductService.get_products returning Tuple[List[dict], int]
      const items = response.data[0] || [];
      
      // Fetch stock for each product
      const productsWithStock = await Promise.all(items.map(async (p) => {
          try {
              const stockRes = await inventoryService.getProductStock(p.id);
              return { ...p, stock: stockRes.data.quantity };
          } catch (e) {
              return { ...p, stock: 0 };
          }
      }));
      
      setProducts(productsWithStock);
      setError(null);
    } catch (err) {
      setError('Failed to fetch inventory. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-gray-400 gap-2">
      <Loader2 className="h-6 w-6 animate-spin" /> Loading Inventory...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Inventory Items</h3>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 shadow-sm transition-all focus:ring-2 focus:ring-primary-500/50">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {error && (
          <div className="rounded-lg bg-rose-50 p-4 text-rose-700 text-sm border border-rose-100 italic">
              {error}
          </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search products, SKU or location..."
            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500/20">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      {/* Product Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Product Info</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Stock Level</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                  <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-400 italic">No products found in inventory.</td>
                  </tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 hover:transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{product.name}</span>
                      <span className="text-xs text-gray-500">{product.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">${product.price?.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${product.stock < 10 ? 'text-rose-600' : 'text-gray-900'}`}>
                        {product.stock} units
                      </span>
                      {product.stock < 10 && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">LOW</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary-600 hover:text-primary-700 font-medium ml-4" onClick={() => fetchInventory()}>Refresh</button>
                    <button className="text-primary-600 hover:text-primary-700 font-medium ml-4">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
