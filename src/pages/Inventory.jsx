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
  Upload,
  Image as ImageIcon,
  Settings2,
  Edit3,
} from "lucide-react";
import { inventoryService } from "../services/api";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    price: "",
    description: "",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleShowDetails = (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const handleShowEdit = (product) => {
    setEditProduct({ ...product });
    setSelectedFiles([]); // Reset files for edit
    setShowEditModal(true);
  };

  const handleShowAdjustment = (product) => {
    setSelectedProduct(product);
    setAdjustmentAmount("");
    setShowAdjustmentModal(true);
  };

  const handleManualAdjustment = async () => {
    const amount = parseInt(adjustmentAmount);
    if (isNaN(amount) || amount === 0) {
      alert("Please enter a valid non-zero number");
      return;
    }

    try {
      await inventoryService.updateStock(selectedProduct.id, amount);
      if (amount > 0) {
        await inventoryService.addMovement({
          product_id: selectedProduct.id,
          type: "IN",
          quantity: amount,
          reference_id: "manual_adjustment",
        });
      } else {
        await inventoryService.addMovement({
          product_id: selectedProduct.id,
          type: "OUT",
          quantity: Math.abs(amount),
          reference_id: "manual_adjustment",
        });
      }
      setShowAdjustmentModal(false);
      fetchInventory();
    } catch (err) {
      alert(
        "Adjustment failed: " + (err.response?.data?.detail || err.message),
      );
    }
  };

  const handleAddProduct = async () => {
    // Basic Validation
    if (
      !newProduct.name ||
      !newProduct.sku ||
      !newProduct.price ||
      parseFloat(newProduct.price) <= 0
    ) {
      alert("Please provide a valid name, SKU, and price (> 0)");
      return;
    }

    try {
      setIsUploading(true);
      let imageUrls = [];

      if (selectedFiles.length > 0) {
        const uploadRes = await inventoryService.uploadImages(selectedFiles);
        imageUrls = uploadRes.data;
      }

      await inventoryService.addProduct({
        ...newProduct,
        price: parseFloat(newProduct.price),
        images: imageUrls,
      });

      setShowAddModal(false);
      setNewProduct({ name: "", sku: "", price: "", description: "" });
      setSelectedFiles([]);
      fetchInventory();
    } catch (err) {
      alert(
        "Failed to add product: " + (err.response?.data?.detail || err.message),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (
      !editProduct.name ||
      !editProduct.sku ||
      !editProduct.price ||
      parseFloat(editProduct.price) <= 0
    ) {
      alert("Please provide a valid name, SKU, and price (> 0)");
      return;
    }

    try {
      setIsUploading(true);
      let imageUrls = [...(editProduct.images || [])];

      if (selectedFiles.length > 0) {
        const uploadRes = await inventoryService.uploadImages(selectedFiles);
        imageUrls = [...imageUrls, ...uploadRes.data].slice(0, 4);
      }

      const { id, stock, created_at, updated_at, ...updateData } = editProduct;
      await inventoryService.updateProduct(id, {
        ...updateData,
        price: parseFloat(updateData.price),
        images: imageUrls,
      });

      setShowEditModal(false);
      setEditProduct(null);
      setSelectedFiles([]);
      fetchInventory();
    } catch (err) {
      alert(
        "Failed to update product: " +
          (err.response?.data?.detail || err.message),
      );
    } finally {
      setIsUploading(false);
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
                          <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors overflow-hidden">
                            {product.images?.[0] ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL.replace("/api/v1", "")}${product.images[0]}`}
                                className="w-full h-full object-cover"
                                alt={product.name}
                              />
                            ) : (
                              <Warehouse className="h-5 w-5 text-gray-400" />
                            )}
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
                          <button
                            onClick={() => handleShowAdjustment(product)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-primary-100"
                            title="Manual Adjustment"
                          >
                            <Settings2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleShowEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                            title="Edit Product"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <div className="h-6 w-px bg-gray-200 mx-1"></div>
                          <button
                            onClick={() => handleShowDetails(product)}
                            className="text-gray-600 hover:text-gray-900 text-sm font-bold transition-colors hover:underline"
                          >
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
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
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
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-black text-gray-900"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      price: e.target.value,
                    })
                  }
                  placeholder="0.00"
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

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Product Images (Max 4)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-xl bg-gray-100 overflow-hidden group"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        className="w-full h-full object-cover"
                        alt="preview"
                      />
                      <button
                        onClick={() =>
                          setSelectedFiles(
                            selectedFiles.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {selectedFiles.length < 4 && (
                    <label className="aspect-square rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 mt-1">
                        Add
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          setSelectedFiles((prev) =>
                            [...prev, ...files].slice(0, 4),
                          );
                        }}
                      />
                    </label>
                  )}
                </div>
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
                disabled={isUploading}
                className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-900/10 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  "Secure Listing"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-900">
                Edit Product
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
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
                    value={editProduct.name}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, name: e.target.value })
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
                    value={editProduct.sku}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, sku: e.target.value })
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
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-black text-gray-900"
                  value={editProduct.price}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      price: e.target.value,
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
                  value={editProduct.description}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Product Images (Current & New)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {editProduct.images?.map((img, idx) => (
                    <div
                      key={`current-${idx}`}
                      className="relative aspect-square rounded-xl bg-gray-100 overflow-hidden group"
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL.replace("/api/v1", "")}${img}`}
                        className="w-full h-full object-cover"
                        alt="current"
                      />
                      <button
                        onClick={() =>
                          setEditProduct({
                            ...editProduct,
                            images: editProduct.images.filter(
                              (_, i) => i !== idx,
                            ),
                          })
                        }
                        className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="relative aspect-square rounded-xl bg-gray-100 overflow-hidden group border-2 border-emerald-500"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        className="w-full h-full object-cover"
                        alt="preview"
                      />
                      <button
                        onClick={() =>
                          setSelectedFiles(
                            selectedFiles.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {(editProduct.images?.length || 0) + selectedFiles.length <
                    4 && (
                    <label className="aspect-square rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 mt-1">
                        Add
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          setSelectedFiles((prev) =>
                            [...prev, ...files].slice(
                              0,
                              4 - (editProduct.images?.length || 0),
                            ),
                          );
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProduct}
                disabled={isUploading}
                className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-900/10 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                  </>
                ) : (
                  "Update Product"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900">
                  Product Details
                </h3>
                <p className="text-sm text-gray-400 font-mono uppercase tracking-tighter">
                  {selectedProduct.sku}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="aspect-square rounded-2xl bg-gray-50 overflow-hidden border border-gray-100">
                  {selectedProduct.images?.[0] ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL.replace("/api/v1", "")}${selectedProduct.images[0]}`}
                      className="w-full h-full object-cover"
                      alt={selectedProduct.name}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <ImageIcon className="h-10 w-10 mb-2" />
                      <span className="text-xs font-bold">NO ASSETS</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedProduct.images?.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg bg-gray-50 overflow-hidden border border-gray-100 cursor-pointer hover:border-primary-500 transition-colors"
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL.replace("/api/v1", "")}${img}`}
                        className="w-full h-full object-cover"
                        alt={`view-${idx}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Product Name
                  </label>
                  <h4 className="text-xl font-black text-gray-900">
                    {selectedProduct.name}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Unit Price
                    </label>
                    <p className="text-lg font-black text-emerald-600">
                      ${selectedProduct.price?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Current Stock
                    </label>
                    <p
                      className={`text-lg font-black ${selectedProduct.stock < 10 ? "text-rose-600" : "text-gray-900"}`}
                    >
                      {selectedProduct.stock} Units
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Description
                  </label>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl">
                    {selectedProduct.description ||
                      "No description available for this product."}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    <span>
                      Added on:{" "}
                      {new Date(
                        selectedProduct.created_at,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-900/10 hover:bg-black transition-all active:scale-95"
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {showAdjustmentModal && selectedProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Adjust Stock
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Enter a positive number to add stock, or a negative number to
              remove.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Adjustment Amount
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50 or -25"
                  className="w-full mt-2 px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-lg focus:ring-2 focus:ring-primary-500/20 outline-none"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAdjustmentModal(false)}
                  className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAdjustment}
                  className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all active:scale-95"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
