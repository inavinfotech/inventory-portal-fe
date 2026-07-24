import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Sparkles,
  Layers,
  Lock,
  Barcode,
  Barcode as BarcodeIcon,
} from "lucide-react";
import { inventoryService } from "../services/api";
import { generateProductSku, generateVariantSku, sanitizeSkuInput } from "../utils/skuGenerator";
import BarcodeModal from "../components/BarcodeModal";

const Inventory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [barcodeModal, setBarcodeModal] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    price: "",
    description: "",
    variants: [],
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeSku, setBarcodeSku] = useState("");
  const [barcodeName, setBarcodeName] = useState("");

  const openBarcodeModal = (sku, name) => {
    setBarcodeSku(sku);
    setBarcodeName(name);
    setBarcodeModalOpen(true);
  };

  // Dynamic Option Niches Generator States
  const [addOptionNiches, setAddOptionNiches] = useState([
    { name: "Size", values: "Small, Medium, Large" },
    { name: "Color", values: "Red, Green, Blue" },
  ]);
  const [showGenAdd, setShowGenAdd] = useState(false);

  const [editOptionNiches, setEditOptionNiches] = useState([
    { name: "Size", values: "Small, Medium, Large" },
    { name: "Color", values: "Red, Green, Blue" },
  ]);
  const [showGenEdit, setShowGenEdit] = useState(false);

  const formatVariantTitle = (v) => {
    if (!v) return "Standard Item";
    const parts = [];
    if (v.attributes && typeof v.attributes === "object" && Object.keys(v.attributes).length > 0) {
      Object.entries(v.attributes).forEach(([k, val]) => {
        if (val) parts.push(`${k}: ${val}`);
      });
    }
    if (parts.length === 0) {
      if (v.size) parts.push(`Size: ${v.size}`);
      if (v.color) parts.push(`Color: ${v.color}`);
      if (v.weight) parts.push(`Weight: ${v.weight}`);
    }
    return parts.length > 0 ? parts.join(" / ") : (v.sku || "Variant");
  };

  const generateDynamicCombinations = (niches, baseSku, basePrice) => {
    const validNiches = niches
      .map((n) => ({
        name: n.name.trim(),
        values: n.values.split(",").map((v) => v.trim()).filter(Boolean),
      }))
      .filter((n) => n.name && n.values.length > 0);

    if (validNiches.length === 0) return [];

    const cartesian = (arrays) =>
      arrays.reduce(
        (a, b) => a.flatMap((d) => b.map((e) => [...d, e])),
        [[]]
      );

    const valueArrays = validNiches.map((n) => n.values);
    const combinations = cartesian(valueArrays);

    return combinations.map((combo) => {
      const attributes = {};
      combo.forEach((val, idx) => {
        const nicheName = validNiches[idx].name;
        attributes[nicheName] = val;
      });

      return {
        attributes,
        size: attributes["Size"] || attributes["size"] || "",
        color: attributes["Color"] || attributes["color"] || "",
        weight: attributes["Weight"] || attributes["weight"] || "",
        sku: generateVariantSku(baseSku, attributes),
        price: basePrice || "0",
        stock: 0,
      };
    });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getProducts();
      setProducts(response.data.items || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch inventory. Please try again later.");
    } finally {
      setLoading(false);
    }
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
      await inventoryService.updateStock(
        selectedProduct.id,
        amount,
        selectedVariant?.id,
      );

      await inventoryService.addMovement({
        product_id: selectedProduct.id,
        variant_id: selectedVariant?.id,
        type:
          amount >
          (selectedVariant ? selectedVariant.stock : selectedProduct.stock)
            ? "IN"
            : "OUT",
        quantity: Math.abs(
          amount -
            (selectedVariant ? selectedVariant.stock : selectedProduct.stock),
        ),
        reference_id: "manual_adjustment",
      });

      setShowAdjustmentModal(false);
      setSelectedVariant(null);
      fetchInventory();
      window.dispatchEvent(new Event("stock-updated"));
    } catch (err) {
      alert(
        "Adjustment failed: " + (err.response?.data?.detail || err.message),
      );
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.price) {
      alert("Please fill in all required fields (Name, SKU, Base Price)");
      return;
    }

    try {
      setIsUploading(true);
      let imageUrls = [];

      if (selectedFiles.length > 0) {
        const uploadRes = await inventoryService.uploadImages(selectedFiles);
        imageUrls = uploadRes.data;
      }

      const productPayload = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        images: imageUrls,
        variants: newProduct.variants.map((v) => ({
          ...v,
          price: parseFloat(v.price || newProduct.price),
          initial_stock: parseInt(v.stock || 0),
        })),
      };

      await inventoryService.createProduct(productPayload);

      setShowAddModal(false);
      setNewProduct({
        name: "",
        sku: "",
        price: "",
        description: "",
        variants: [],
      });
      setSelectedFiles([]);
      setShowGenAdd(false);
      setAddOptionNiches([
        { name: "Size", values: "Small, Medium, Large" },
        { name: "Color", values: "Red, Green, Blue" },
      ]);
      fetchInventory();
      window.dispatchEvent(new Event("stock-updated"));
    } catch (err) {
      alert(
        "Failed to add product: " + (err.response?.data?.detail || err.message),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editProduct.name || !editProduct.sku || !editProduct.price) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsUploading(true);
      let imageUrls = editProduct.images || [];

      if (selectedFiles.length > 0) {
        const uploadRes = await inventoryService.uploadImages(selectedFiles);
        imageUrls = [...imageUrls, ...uploadRes.data];
      }

      const { id, stock, created_at, updated_at, ...updateData } = editProduct;
      const payload = {
        ...updateData,
        price: parseFloat(editProduct.price),
        images: imageUrls,
        variants: editProduct.variants
          ? editProduct.variants.map((v) => ({
              ...v,
              price: parseFloat(v.price || editProduct.price),
              stock: parseInt(v.stock || 0),
            }))
          : [],
      };

      await inventoryService.updateProduct(id, payload);

      setShowEditModal(false);
      setEditProduct(null);
      setSelectedFiles([]);
      setShowGenEdit(false);
      fetchInventory();
      window.dispatchEvent(new Event("stock-updated"));
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
      window.dispatchEvent(new Event("stock-updated"));
    } catch (err) {
      alert(
        "Stock update failed: " + (err.response?.data?.detail || err.message),
      );
    }
  };

  const handleVariantStockUpdate = async (productId, variantId, amount) => {
    try {
      if (amount > 0) {
        await inventoryService.addStock({
          product_id: productId,
          variant_id: variantId,
          quantity: amount,
        });
      } else {
        await inventoryService.removeStock({
          product_id: productId,
          variant_id: variantId,
          quantity: Math.abs(amount),
        });
      }
      fetchInventory();
      window.dispatchEvent(new Event("stock-updated"));
    } catch (err) {
      alert(
        "Variant stock update failed: " +
          (err.response?.data?.detail || err.message),
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
            onClick={() => {
              setNewProduct({
                name: "",
                sku: generateProductSku(""),
                price: "",
                description: "",
                variants: [],
              });
              setShowAddModal(true);
            }}
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
      </div>

      {/* Table */}
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
                    <React.Fragment key={product.id}>
                      <tr className="group hover:bg-gray-50/50 transition-colors">
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
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">
                                  {product.sku}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBarcodeModal({ sku: product.sku, title: product.name, price: product.price });
                                  }}
                                  className="p-0.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                  title="Barcode"
                                >
                                  <BarcodeIcon className="h-3 w-3" />
                                </button>
                                {product.variants?.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedProduct(
                                        expandedProduct === product.id
                                          ? null
                                          : product.id,
                                      );
                                    }}
                                    className="ml-2 text-primary-600 hover:underline font-bold text-[10px]"
                                  >
                                    * {product.variants.length} Combinations{" "}
                                    {expandedProduct === product.id
                                      ? "Up"
                                      : "Down"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-black text-gray-900">
                            {product.variants?.length > 0
                              ? `₹${Math.min(...product.variants.map((v) => v.price)).toFixed(2)} - ₹${Math.max(...product.variants.map((v) => v.price)).toFixed(2)}`
                              : `₹${product.price?.toFixed(2)}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                product.stock < 10
                                  ? "bg-rose-500 animate-pulse"
                                  : "bg-emerald-500"
                              }`}
                            />
                            <span className="font-bold text-gray-900">
                              {product.stock} units
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(!product.variants ||
                              product.variants.length === 0) && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStockUpdate(product.id, 10)
                                  }
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100"
                                  title="Add 10 units"
                                >
                                  <TrendingUp className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleStockUpdate(product.id, -10)
                                  }
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
                              </>
                            )}
                            <button
                              onClick={() => handleShowEdit(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                              title="Edit Product"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setBarcodeModal({ sku: product.sku, title: product.name, price: product.price })}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
                              title="View & Download Barcode"
                            >
                              <Barcode className="h-4 w-4" />
                            </button>
                            <div className="h-6 w-px bg-gray-200 mx-1"></div>
                            <button
                              onClick={() =>
                                navigate(`/inventory/${product.id}`)
                              }
                              className="text-gray-600 hover:text-gray-900 text-sm font-bold transition-colors hover:underline"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedProduct === product.id &&
                        product.variants?.length > 0 && (
                          <tr className="bg-gray-50/30 animate-in slide-in-from-top-4 duration-300">
                            <td colSpan="4" className="px-12 py-4 shadow-inner">
                              <div className="grid grid-cols-1 gap-2">
                                {product.variants.map((v) => (
                                  <div
                                    key={v.id}
                                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-white px-5 rounded-2xl transition-all shadow-sm group"
                                  >
                                    <div className="flex items-center gap-8">
                                      <div className="flex flex-col min-w-[140px]">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                          Variant Combination
                                        </span>
                                        <span className="font-bold text-gray-900 text-xs">
                                          {formatVariantTitle(v)}
                                        </span>
                                      </div>
                                      <div className="flex flex-col min-w-[140px]">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                          Variant SKU
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="font-mono text-xs text-gray-500 uppercase">
                                            {v.sku}
                                          </span>
                                          <button
                                            onClick={() => setBarcodeModal({ sku: v.sku, title: `${product.name} (${formatVariantTitle(v)})`, price: v.price })}
                                            className="p-0.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                            title="Barcode"
                                          >
                                            <BarcodeIcon className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="flex flex-col min-w-[100px]">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                          Price
                                        </span>
                                        <span className="font-black text-gray-900">
                                          ₹{v.price.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex flex-col min-w-[120px]">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                          Stock Level
                                        </span>
                                        <span
                                          className={`font-bold ${v.stock < 5 ? "text-rose-600" : "text-emerald-600"}`}
                                        >
                                          {v.stock} units
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() =>
                                          handleVariantStockUpdate(
                                            product.id,
                                            v.id,
                                            10,
                                          )
                                        }
                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-100 bg-white shadow-sm"
                                        title="Add 10 units"
                                      >
                                        <TrendingUp className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleVariantStockUpdate(
                                            product.id,
                                            v.id,
                                            -10,
                                          )
                                        }
                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-100 bg-white shadow-sm"
                                        title="Remove 10 units"
                                      >
                                        <TrendingDown className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleShowVariantAdjustment(
                                            product,
                                            v,
                                          )
                                        }
                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors border border-primary-100 bg-white shadow-sm"
                                        title="Manual Adjustment"
                                      >
                                        <Settings2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => setBarcodeModal({ sku: v.sku, title: `${product.name} (${formatVariantTitle(v)})`, price: v.price })}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-indigo-100 bg-white shadow-sm"
                                        title="View & Download Barcode"
                                      >
                                        <Barcode className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
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
                New Product Listing
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
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      SKU Identity
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewProduct({ ...newProduct, sku: generateProductSku(newProduct.name) })}
                      className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                    >
                      <Sparkles className="h-2.5 w-2.5" /> Auto SKU
                    </button>
                  </div>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-mono text-sm text-gray-900"
                    value={newProduct.sku}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, sku: sanitizeSkuInput(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Base Price (₹)
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
                />
              </div>

              {/* Variant Combinations Option */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-900 uppercase tracking-wider">
                    Product Variants ({newProduct.variants.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGenAdd(!showGenAdd)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" /> Matrix Generator
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          variants: [
                            ...newProduct.variants,
                            {
                              size: "",
                              color: "",
                              weight: "",
                              sku: generateVariantSku(newProduct.sku, {}),
                              price: newProduct.price || "0",
                              stock: 0,
                            },
                          ],
                        })
                      }
                      className="text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      + Add Single Variant
                    </button>
                  </div>
                </div>

                {/* Matrix Generator Box */}
                {showGenAdd && (
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Custom Option Niches Generator
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddOptionNiches([...addOptionNiches, { name: "", values: "" }])}
                        className="text-[9px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-sm"
                      >
                        + Add Option Niche
                      </button>
                    </div>

                    <div className="space-y-2">
                      {addOptionNiches.map((niche, nIdx) => (
                        <div key={nIdx} className="grid grid-cols-5 gap-2 items-center bg-white p-2 rounded-lg border border-indigo-100">
                          <div className="col-span-2">
                            <label className="text-[8px] font-bold text-indigo-500 uppercase">Niche Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Size, Color, Storage"
                              className="w-full px-2 py-1 text-xs bg-gray-50 rounded border border-gray-200 outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              value={niche.name}
                              onChange={(e) => {
                                const list = [...addOptionNiches];
                                list[nIdx].name = e.target.value;
                                setAddOptionNiches(list);
                              }}
                            />
                          </div>
                          <div className="col-span-3 relative flex items-center gap-1">
                            <div className="flex-1">
                              <label className="text-[8px] font-bold text-indigo-500 uppercase">Values (comma separated)</label>
                              <input
                                type="text"
                                placeholder="e.g. S, M, L or 128GB, 256GB"
                                className="w-full px-2 py-1 text-xs bg-gray-50 rounded border border-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
                                value={niche.values}
                                onChange={(e) => {
                                  const list = [...addOptionNiches];
                                  list[nIdx].values = e.target.value;
                                  setAddOptionNiches(list);
                                }}
                              />
                            </div>
                            {addOptionNiches.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setAddOptionNiches(addOptionNiches.filter((_, i) => i !== nIdx))}
                                className="text-rose-500 hover:text-rose-700 p-1 mt-3"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const combos = generateDynamicCombinations(
                          addOptionNiches,
                          newProduct.sku,
                          newProduct.price
                        );
                        if (combos.length > 0) {
                          setNewProduct({
                            ...newProduct,
                            variants: [...newProduct.variants, ...combos],
                          });
                          setShowGenAdd(false);
                        } else {
                          alert("Please specify option names and values (comma separated) to generate combinations.");
                        }
                      }}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Generate Combinations
                    </button>
                  </div>
                )}

                {newProduct.variants.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic">
                    No variants added. Product will be listed as single item.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {newProduct.variants.map((variant, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-gray-100 relative group animate-in slide-in-from-top-2 duration-200 space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                          <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                            <Layers className="h-3 w-3 text-indigo-500" /> {formatVariantTitle(variant)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setNewProduct({
                                ...newProduct,
                                variants: newProduct.variants.filter((_, i) => i !== idx),
                              })
                            }
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 items-end">
                          <div>
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Variant SKU</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const v = [...newProduct.variants];
                                  v[idx].sku = generateVariantSku(newProduct.sku, v[idx].attributes || {});
                                  setNewProduct({ ...newProduct, variants: v });
                                }}
                                className="text-[8px] font-bold text-indigo-600 hover:text-indigo-800"
                              >
                                Auto SKU
                              </button>
                            </div>
                            <input
                              type="text"
                              className="w-full px-2 py-1.5 text-xs bg-gray-50 rounded-lg border-none focus:ring-1 focus:ring-primary-500/20 outline-none font-mono"
                              value={variant.sku || ""}
                              onChange={(e) => {
                                const v = [...newProduct.variants];
                                v[idx].sku = sanitizeSkuInput(e.target.value);
                                setNewProduct({ ...newProduct, variants: v });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Price (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-2 py-1.5 text-xs bg-gray-50 rounded-lg border-none focus:ring-1 focus:ring-primary-500/20 outline-none font-bold"
                              value={variant.price || ""}
                              onChange={(e) => {
                                const v = [...newProduct.variants];
                                v[idx].price = e.target.value;
                                setNewProduct({ ...newProduct, variants: v });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Initial Qty</label>
                            <input
                              type="number"
                              placeholder="0"
                              className="w-full px-2 py-1.5 text-xs bg-emerald-50 text-emerald-900 rounded-lg border-none focus:ring-1 focus:ring-emerald-500/20 outline-none font-bold"
                              value={variant.stock !== undefined ? variant.stock : ""}
                              onChange={(e) => {
                                const v = [...newProduct.variants];
                                v[idx].stock = e.target.value;
                                setNewProduct({ ...newProduct, variants: v });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900"
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
                  Product Images
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-xl bg-gray-100 overflow-hidden group"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt="upload-preview"
                        className="w-full h-full object-cover"
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
                        setSelectedFiles((prev) => [...prev, ...files]);
                      }}
                    />
                  </label>
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
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      SKU Identity
                    </label>
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> Fixed ID
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    readOnly
                    title="Product ID & SKU are fixed once generated"
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl outline-none font-mono text-sm text-gray-500 cursor-not-allowed select-none"
                    value={editProduct.sku}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Base Price (₹)
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

              {/* Edit Variant Combinations Section */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-900 uppercase tracking-wider">
                    Product Variants ({editProduct.variants?.length || 0})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGenEdit(!showGenEdit)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" /> Matrix Generator
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditProduct({
                          ...editProduct,
                          variants: [
                            ...(editProduct.variants || []),
                            {
                              size: "",
                              color: "",
                              weight: "",
                              sku: generateVariantSku(editProduct.sku, {}),
                              price: editProduct.price || "0",
                              stock: 0,
                            },
                          ],
                        })
                      }
                      className="text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      + Add Single Variant
                    </button>
                  </div>
                </div>

                {/* Matrix Generator Box */}
                {showGenEdit && (
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Custom Option Niches Generator
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditOptionNiches([...editOptionNiches, { name: "", values: "" }])}
                        className="text-[9px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-sm"
                      >
                        + Add Option Niche
                      </button>
                    </div>

                    <div className="space-y-2">
                      {editOptionNiches.map((niche, nIdx) => (
                        <div key={nIdx} className="grid grid-cols-5 gap-2 items-center bg-white p-2 rounded-lg border border-indigo-100">
                          <div className="col-span-2">
                            <label className="text-[8px] font-bold text-indigo-500 uppercase">Niche Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Size, Color, Storage"
                              className="w-full px-2 py-1 text-xs bg-gray-50 rounded border border-gray-200 outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              value={niche.name}
                              onChange={(e) => {
                                const list = [...editOptionNiches];
                                list[nIdx].name = e.target.value;
                                setEditOptionNiches(list);
                              }}
                            />
                          </div>
                          <div className="col-span-3 relative flex items-center gap-1">
                            <div className="flex-1">
                              <label className="text-[8px] font-bold text-indigo-500 uppercase">Values (comma separated)</label>
                              <input
                                type="text"
                                placeholder="e.g. S, M, L or 128GB, 256GB"
                                className="w-full px-2 py-1 text-xs bg-gray-50 rounded border border-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
                                value={niche.values}
                                onChange={(e) => {
                                  const list = [...editOptionNiches];
                                  list[nIdx].values = e.target.value;
                                  setEditOptionNiches(list);
                                }}
                              />
                            </div>
                            {editOptionNiches.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setEditOptionNiches(editOptionNiches.filter((_, i) => i !== nIdx))}
                                className="text-rose-500 hover:text-rose-700 p-1 mt-3"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const combos = generateDynamicCombinations(
                          editOptionNiches,
                          editProduct.sku,
                          editProduct.price
                        );
                        if (combos.length > 0) {
                          setEditProduct({
                            ...editProduct,
                            variants: [...(editProduct.variants || []), ...combos],
                          });
                          setShowGenEdit(false);
                        } else {
                          alert("Please specify option names and values (comma separated) to generate combinations.");
                        }
                      }}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Generate Combinations
                    </button>
                  </div>
                )}

                {!editProduct.variants || editProduct.variants.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic">
                    No variants added. Product will be listed as single item.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {editProduct.variants.map((variant, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-gray-100 relative group animate-in slide-in-from-top-2 duration-200 space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                          <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                            <Layers className="h-3 w-3 text-indigo-500" /> {formatVariantTitle(variant)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditProduct({
                                ...editProduct,
                                variants: editProduct.variants.filter((_, i) => i !== idx),
                              })
                            }
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 items-end">
                          <div>
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Variant SKU</label>
                              {!variant.id ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const v = [...editProduct.variants];
                                    v[idx].sku = generateVariantSku(editProduct.sku, v[idx].attributes || {});
                                    setEditProduct({ ...editProduct, variants: v });
                                  }}
                                  className="text-[8px] font-bold text-indigo-600 hover:text-indigo-800"
                                >
                                  Auto SKU
                                </button>
                              ) : (
                                <span className="text-[8px] font-bold text-amber-600 flex items-center gap-0.5" title="Fixed once generated">
                                  <Lock className="h-2 w-2" /> Fixed
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              disabled={Boolean(variant.id)}
                              readOnly={Boolean(variant.id)}
                              title={variant.id ? "Variant SKU is fixed once generated" : ""}
                              className={`w-full px-2 py-1.5 text-xs rounded-lg outline-none font-mono ${
                                variant.id
                                  ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200"
                                  : "bg-gray-50 border-none focus:ring-1 focus:ring-primary-500/20"
                              }`}
                              value={variant.sku || ""}
                              onChange={(e) => {
                                if (variant.id) return;
                                const v = [...editProduct.variants];
                                v[idx].sku = sanitizeSkuInput(e.target.value);
                                setEditProduct({ ...editProduct, variants: v });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Price (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-2 py-1.5 text-xs bg-gray-50 rounded-lg border-none focus:ring-1 focus:ring-primary-500/20 outline-none font-bold"
                              value={variant.price || ""}
                              onChange={(e) => {
                                const v = [...editProduct.variants];
                                v[idx].price = e.target.value;
                                setEditProduct({ ...editProduct, variants: v });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Stock Qty</label>
                            <input
                              type="number"
                              placeholder="0"
                              className="w-full px-2 py-1.5 text-xs bg-emerald-50 text-emerald-900 rounded-lg border-none focus:ring-1 focus:ring-emerald-500/20 outline-none font-bold"
                              value={variant.stock !== undefined ? variant.stock : ""}
                              onChange={(e) => {
                                const v = [...editProduct.variants];
                                v[idx].stock = e.target.value;
                                setEditProduct({ ...editProduct, variants: v });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900"
                  value={editProduct.description || ""}
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
                  Product Images
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(editProduct.images || []).map((img, idx) => (
                    <div
                      key={`existing-${idx}`}
                      className="relative aspect-square rounded-xl bg-gray-100 overflow-hidden group"
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL.replace("/api/v1", "")}${img}`}
                        alt="product"
                        className="w-full h-full object-cover"
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
                      className="relative aspect-square rounded-xl bg-gray-100 overflow-hidden group border-2 border-primary-500"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt="upload-preview"
                        className="w-full h-full object-cover"
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
                        setSelectedFiles((prev) => [...prev, ...files]);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                Discard
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

      {/* Manual Adjustment Modal */}
      {showAdjustmentModal && selectedProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 mb-2">
              {selectedVariant
                ? `Adjust Variant: ${formatVariantTitle(selectedVariant)}`
                : "Manual Adjustment"}
            </h3>
            <p className="text-xs text-gray-500 mb-6 font-medium">
              Update the current stock level for
              <span className="font-bold text-gray-900 mx-1">
                {selectedVariant ? selectedVariant.sku : selectedProduct.sku}
              </span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  New Total Quantity
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  className="w-full mt-2 px-6 py-4 bg-gray-50 border-none rounded-2xl font-black text-xl focus:ring-2 focus:ring-primary-500/20 outline-none"
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

      {/* BARCODE MODAL */}
      {barcodeModal ? (
        <BarcodeModal
          sku={barcodeModal.sku}
          title={barcodeModal.title}
          price={barcodeModal.price}
          onClose={() => setBarcodeModal(null)}
        />
      ) : (
        <BarcodeModal
          isOpen={barcodeModalOpen}
          onClose={() => setBarcodeModalOpen(false)}
          sku={barcodeSku}
          productName={barcodeName}
        />
      )}
    </div>
  );
};

export default Inventory;
