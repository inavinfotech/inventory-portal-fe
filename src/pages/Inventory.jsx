import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Warehouse,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import { inventoryService } from "../services/api";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    price: 0,
    description: "",
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getProducts();
      const items = response.data.items || [];

      // Fetch stock for each product
      const productsWithStock = await Promise.all(
        items.map(async (p) => {
          try {
            const stockRes = await inventoryService.getProductStock(p.id);
            return { ...p, stock: stockRes.data.quantity };
          } catch (e) {
            return { ...p, stock: 0 };
          }
        }),
      );

      setProducts(productsWithStock);
      setError(null);
    } catch (err) {
      setError("Failed to fetch inventory. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      await inventoryService.addProduct(newProduct);
      setShowAddModal(false);
      setNewProduct({ name: "", sku: "", price: 0, description: "" });
      fetchInventory();
    } catch (err) {
      alert(
        "Failed to add product: " + (err.response?.data?.detail || err.message),
      );
    }
  };

  const handleStockUpdate = async (productId, amount) => {
    try {
      if (amount > 0) {
        await inventoryService.addStock({
          product_id: productId,
          quantity: amount,
        });
      } else {
        await inventoryService.removeStock({
          product_id: productId,
          quantity: Math.abs(amount),
        });
      }
      fetchInventory();
    } catch (err) {
      alert(
        "Stock update failed: " + (err.response?.data?.detail || err.message),
      );
    }
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 gap-2 font-medium">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" /> Gathering
        Inventory Data...
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">
            Warehouse Inventory
          </h3>
          <p className="text-sm text-gray-500">
            Real-time stock monitoring and replenishment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-black shadow-lg shadow-gray-900/10 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 p-4 text-rose-700 text-sm border border-rose-100 italic flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 sm:flex-row sm:items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search products by SKU, name or location..."
            className="w-full rounded-xl bg-gray-50 border-none pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      {/* Product Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Product Assets & Info</th>
                <th className="px-6 py-4">Financials</th>
                <th className="px-6 py-4">Stock Health</th>
                <th className="px-6 py-4 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-400 italic font-medium"
                  >
                    No products registered in the warehouse.
                  </td>
                </tr>
              ) : (
                products
                  .filter(
                    (p) =>
                      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
                  )
                  .map((product) => (
                    <tr
                      key={product.id}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                            <Warehouse className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">
                              {product.name}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">
                              {product.sku}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-gray-900">
                          ${product.price?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span
                              className={`text-sm font-black ${product.stock < 10 ? "text-rose-600" : "text-gray-900"}`}
                            >
                              {product.stock} units
                            </span>
                            <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${product.stock < 10 ? "bg-rose-500" : "bg-emerald-500"}`}
                                style={{
                                  width: `${Math.min(product.stock * 2, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          {product.stock < 10 && (
                            <div className="animate-pulse flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700">
                              <AlertTriangle className="h-3 w-3" /> CRITICAL
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStockUpdate(product.id, 10)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100"
                            title="Add 10 units"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStockUpdate(product.id, -10)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100"
                            title="Remove 10 units"
                          >
                            <TrendingDown className="h-4 w-4" />
                          </button>
                          <div className="h-6 w-px bg-gray-200 mx-1"></div>
                          <button className="text-gray-600 hover:text-gray-900 text-sm font-bold transition-colors hover:underline">
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-900">
                Register Product
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                    SKU Identity
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-mono text-sm text-gray-900"
                    value={newProduct.sku}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, sku: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Base Price ($)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-black text-gray-900"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      price: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none min-h-[100px] text-sm text-gray-900"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleAddProduct}
                className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-900/10 hover:bg-black transition-all active:scale-95"
              >
                Secure Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
