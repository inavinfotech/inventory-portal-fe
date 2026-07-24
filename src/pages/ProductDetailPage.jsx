import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  Warehouse,
  AlertTriangle,
  History,
  Info,
  IndianRupee,
  Activity,
  Settings2,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Layers,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
  Check,
  Lock,
  Barcode,
  Barcode as BarcodeIcon,
  Copy,
} from "lucide-react";
import { inventoryService } from "../services/api";
import { generateVariantSku, sanitizeSkuInput } from "../utils/skuGenerator";
import BarcodeModal from "../components/BarcodeModal";

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedSku, setCopiedSku] = useState(null);

  const handleCopySku = (e, skuToCopy) => {
    if (e) e.stopPropagation();
    if (!skuToCopy) return;
    navigator.clipboard.writeText(skuToCopy);
    setCopiedSku(skuToCopy);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // In-Page Variant Management State
  const [variants, setVariants] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [optionNiches, setOptionNiches] = useState([
    { name: "Size", values: "Small, Medium, Large" },
    { name: "Color", values: "Red, Green, Blue" },
  ]);

  // Quick Adjustment Modal State
  const [adjustingVariant, setAdjustingVariant] = useState(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [barcodeModal, setBarcodeModal] = useState(null);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeSku, setBarcodeSku] = useState("");
  const [barcodeName, setBarcodeName] = useState("");
  const [zoomedImage, setZoomedImage] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");

  const hasVariantChanges = React.useMemo(() => {
    if (!product) return false;
    const origVariants = product.variants || [];

    if (variants.length !== origVariants.length) return true;

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const orig = origVariants[i];

      if (!orig) return true;
      if (v.id !== orig.id) return true;
      if (v.sku !== orig.sku) return true;
      if (parseFloat(v.price || 0) !== parseFloat(orig.price || 0)) return true;
      if (parseInt(v.stock || 0) !== parseInt(orig.stock || 0)) return true;

      const vAttrs = JSON.stringify(v.attributes || {});
      const origAttrs = JSON.stringify(orig.attributes || {});
      if (vAttrs !== origAttrs) return true;

      const vImgs = JSON.stringify(v.images || []);
      const origImgs = JSON.stringify(orig.images || []);
      if (vImgs !== origImgs) return true;
    }

    return false;
  }, [product, variants]);

  const handleVariantImageUpload = async (vIdx, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      const res = await inventoryService.uploadImages(files);
      const uploadedUrls = res.data;
      setVariants((prev) =>
        prev.map((item, i) => {
          if (i !== vIdx) return item;
          const currentImgs = item.images || [];
          return { ...item, images: [...currentImgs, ...uploadedUrls] };
        })
      );
    } catch (err) {
      alert("Failed to upload variant image: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleRemoveVariantImage = (vIdx, imgIdx) => {
    setVariants((prev) =>
      prev.map((item, i) => {
        if (i !== vIdx) return item;
        const currentImgs = item.images || [];
        return { ...item, images: currentImgs.filter((_, idx) => idx !== imgIdx) };
      })
    );
  };

  const openBarcodeModal = (sku, name) => {
    setBarcodeSku(sku);
    setBarcodeName(name);
    setBarcodeModalOpen(true);
  };

  useEffect(() => {
    fetchProductDetails();
    fetchProductMovements();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getProductById(productId);
      setProduct(res.data);
      setVariants(JSON.parse(JSON.stringify(res.data.variants || [])));
      setError(null);
    } catch (err) {
      setError("Failed to load product details: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchProductMovements = async () => {
    try {
      setMovementsLoading(true);
      const res = await inventoryService.getMovements({ product_id: productId, limit: 20 });
      setMovements(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMovementsLoading(false);
    }
  };

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

  const handleSaveVariants = async () => {
    try {
      setIsSaving(true);
      const payload = {
        name: product.name,
        sku: product.sku,
        base_price: parseFloat(product.base_price ?? product.price ?? 0),
        description: product.description,
        images: product.images,
        variants: variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          price: parseFloat(v.price || product.base_price || product.price || 0),
          attributes: v.attributes || {},
          stock: parseInt(v.stock || 0),
          images: v.images || [],
        })),
      };

      await inventoryService.updateProduct(product.id, payload);
      await fetchProductDetails();
      await fetchProductMovements();
      window.dispatchEvent(new Event("stock-updated"));
      alert("Variants and stock updated successfully!");
    } catch (err) {
      alert("Failed to save variants: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyManualAdjustment = () => {
    if (!adjustingVariant) return;
    const amount = parseInt(adjustQty);
    if (isNaN(amount) || amount < 0) {
      alert("Please enter a valid stock quantity");
      return;
    }

    setVariants((prev) =>
      prev.map((item) =>
        item.id === adjustingVariant.id || item === adjustingVariant
          ? { ...item, stock: amount }
          : item
      )
    );

    setAdjustingVariant(null);
    setAdjustQty("");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">
            Analyzing Inventory Data...
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 text-center bg-gray-50/50 min-h-screen">
        <div className="max-w-md mx-auto bg-white p-12 rounded-3xl shadow-xl border border-gray-100">
          <AlertTriangle className="h-16 w-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Error Encountered
          </h2>
          <p className="text-gray-500 mb-8">
            {error || "Product not found in our records."}
          </p>
          <button
            onClick={() => navigate("/inventory")}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg hover:shadow-xl transition-all"
          >
            Return to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate("/inventory")}
            className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black uppercase rounded-lg tracking-widest border border-gray-200">
                PROD-{product.id}
              </span>
              <button
                type="button"
                onClick={(e) => handleCopySku(e, product.sku)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-mono font-bold transition-all border border-gray-200 cursor-pointer shadow-2xs"
                title="Click to copy product SKU ID"
              >
                {copiedSku === product.sku ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-gray-400" />
                    <span>SKU: {product.sku}</span>
                  </>
                )}
              </button>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              {product.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBarcodeModal({ sku: product.sku, title: product.name, price: product.base_price ?? product.price })}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-700 border border-indigo-100/80 rounded-2xl text-sm font-bold hover:bg-indigo-100 transition-all shadow-xs"
          >
            <Barcode className="h-4 w-4" /> Barcode
          </button>
          <Link
            to="/movements"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
          >
            <History className="h-4 w-4" /> View All Movements
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Warehouse className="text-blue-500" />}
          label="Available Inventory"
          value={product.stock}
          suffix="Units"
          description="Physical stock on shelf"
          color="blue"
        />
        <StatCard
          icon={<Package className="text-amber-500" />}
          label="Active Reservations"
          value={product.reserved || 0}
          suffix="Units"
          description="Locked in pending orders"
          color="amber"
          warning={(product.reserved || 0) > 0}
        />
        <StatCard
          icon={<TrendingUp className="text-emerald-500" />}
          label="Net Available"
          value={product.stock - (product.reserved || 0)}
          suffix="Units"
          description="Ready for new orders"
          color="emerald"
        />
        <StatCard
          icon={<IndianRupee className="text-indigo-500" />}
          label="Retail Unit Price"
          value={`₹${(product.base_price ?? product.price ?? 0).toFixed(2)}`}
          description="Base listing price"
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Info & In-Page Variant Management */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Product Visual Showcase */}
          {product.images?.length > 0 && (
            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary-500" /> Catalog Showcase ({product.images.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {product.images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setZoomedImage(`${import.meta.env.VITE_API_URL.replace("/api/v1", "")}${imgUrl}`)}
                    className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden cursor-zoom-in group relative"
                  >
                    <img
                      src={`${import.meta.env.VITE_API_URL.replace("/api/v1", "")}${imgUrl}`}
                      alt={`Product asset ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Catalog Description */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary-500" /> Catalog Description
            </h3>
            <p className="text-gray-600 leading-relaxed italic border-l-4 border-gray-100 pl-6">
              {product.description || "No description provided for this catalog item."}
            </p>
          </section>

          {/* IN-PAGE VARIANT MANAGEMENT SECTION */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/50 space-y-5">
              {/* Full-Width Heading */}
              <div className="flex items-start gap-4 w-full">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">
                    Variant Combinations & Inventory Control
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Manage option niches, SKUs, prices, and stock levels directly on this page.
                  </p>
                </div>
              </div>

              {/* Action Buttons on Next Line */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-200/50 w-full">
                <button
                  type="button"
                  onClick={() => setShowGen(!showGen)}
                  className="px-4 py-2.5 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs hover:scale-[1.02] active:scale-95"
                >
                  <Sparkles className="h-4 w-4 text-indigo-600" /> Option Niches Generator
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setVariants([
                      ...variants,
                      {
                        attributes: {},
                        sku: generateVariantSku(product.sku, {}),
                        price: product.base_price || product.price || 0,
                        stock: 0,
                      },
                    ])
                  }
                  className="px-4 py-2.5 bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs hover:scale-[1.02] active:scale-95"
                >
                  <Plus className="h-4 w-4 text-gray-500" /> Add Variant
                </button>
                {hasVariantChanges && (
                  <button
                    type="button"
                    onClick={handleSaveVariants}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gray-900 text-white hover:bg-black rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 hover:scale-[1.02] active:scale-95 cursor-pointer sm:ml-auto animate-in fade-in zoom-in-95 duration-200"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Variants
                  </button>
                )}
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Option Niches Matrix Generator */}
              {showGen && (
                <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-indigo-600" /> Dynamic Option Niches Generator
                      </h4>
                      <p className="text-[11px] text-indigo-700 font-medium">
                        Define custom option niches (e.g. Size, Color, Storage) to auto-generate combination matrix.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOptionNiches([...optionNiches, { name: "", values: "" }])}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white px-3 py-1 rounded-xl border border-indigo-200 shadow-sm"
                    >
                      + Add Niche
                    </button>
                  </div>

                  <div className="space-y-2">
                    {optionNiches.map((niche, nIdx) => (
                      <div key={nIdx} className="grid grid-cols-5 gap-3 items-center bg-white p-3 rounded-xl border border-indigo-100">
                        <div className="col-span-2">
                          <label className="text-[9px] font-black text-indigo-500 uppercase">Niche Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Storage, Color, Size"
                            className="w-full px-3 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-gray-900"
                            value={niche.name}
                            onChange={(e) => {
                              const list = [...optionNiches];
                              list[nIdx].name = e.target.value;
                              setOptionNiches(list);
                            }}
                          />
                        </div>
                        <div className="col-span-3 relative flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-[9px] font-black text-indigo-500 uppercase">Values (comma separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. 128GB, 256GB or Red, Blue"
                              className="w-full px-3 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
                              value={niche.values}
                              onChange={(e) => {
                                const list = [...optionNiches];
                                list[nIdx].values = e.target.value;
                                setOptionNiches(list);
                              }}
                            />
                          </div>
                          {optionNiches.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setOptionNiches(optionNiches.filter((_, i) => i !== nIdx))}
                              className="text-rose-500 hover:text-rose-700 p-1.5 mt-4 rounded-lg hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const combos = generateDynamicCombinations(optionNiches, product.sku, product.base_price || product.price);
                        if (combos.length > 0) {
                          setVariants([...variants, ...combos]);
                          setShowGen(false);
                        } else {
                          alert("Please specify option niche names and values (comma separated).");
                        }
                      }}
                      className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Sparkles className="h-4 w-4" /> Generate Matrix Combinations
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGen(false)}
                      className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Variants Card-Based List Section */}
              {variants.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Active Product Variants ({variants.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {variants.map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all space-y-4 relative group"
                      >
                        {/* Header: Attribute Badges & Delete */}
                        <div className="flex items-center justify-between border-b border-gray-50 pb-3 gap-2">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {v.attributes && typeof v.attributes === "object" && Object.keys(v.attributes).length > 0 ? (
                              Object.entries(v.attributes).map(([key, val]) => (
                                <span
                                  key={key}
                                  className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-100/80 shadow-2xs flex items-center gap-1"
                                >
                                  <span className="text-indigo-400 font-normal">{key}:</span> {val}
                                </span>
                              ))
                            ) : (
                              <>
                                {v.size && (
                                  <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-100">
                                    Size: {v.size}
                                  </span>
                                )}
                                {v.color && (
                                  <span className="px-3 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-xl border border-purple-100">
                                    Color: {v.color}
                                  </span>
                                )}
                                {v.weight && (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200">
                                    Weight: {v.weight}
                                  </span>
                                )}
                                {!v.size && !v.color && !v.weight && (
                                  <span className="font-bold text-gray-500 text-xs px-3 py-1 bg-gray-50 rounded-xl">Standard Variant</span>
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setBarcodeModal({ sku: v.sku, title: `${product.name} (${formatVariantTitle(v)})`, price: v.price })}
                              className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-colors shrink-0 flex items-center gap-1 font-bold text-xs border border-indigo-100/60 shadow-2xs"
                              title="View & Download Barcode"
                            >
                              <Barcode className="h-3.5 w-3.5" /> Barcode
                            </button>
                            <button
                              type="button"
                              onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                              title="Delete Variant"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Body Grid: SKU (4 cols), Price (3 cols), Stock Controls (5 cols) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-center">
                          {/* SKU Column */}
                          <div className="lg:col-span-4">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                SKU Identity
                              </label>
                              {!v.id ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSku = generateVariantSku(product.sku, v.attributes || {});
                                    setVariants(variants.map((item, i) => i === idx ? { ...item, sku: newSku } : item));
                                  }}
                                  className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                                  title="Auto-Generate Variant SKU"
                                >
                                  <Sparkles className="h-2.5 w-2.5" /> Auto SKU
                                </button>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60" title="Fixed once generated">
                                  <Lock className="h-2.5 w-2.5" /> Fixed
                                </span>
                              )}
                            </div>
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                disabled={Boolean(v.id)}
                                readOnly={Boolean(v.id)}
                                title={v.id ? "Variant SKU is fixed once generated" : ""}
                                className={`w-full pl-3 pr-8 py-2 text-xs rounded-xl outline-none font-mono ${
                                  v.id
                                    ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200 select-none"
                                    : "bg-gray-50/80 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary-500/20 text-gray-800"
                                }`}
                                value={v.sku || ""}
                                onChange={(e) => {
                                  if (v.id) return;
                                  const newSku = sanitizeSkuInput(e.target.value);
                                  setVariants(variants.map((item, i) => i === idx ? { ...item, sku: newSku } : item));
                                }}
                              />
                              {v.sku && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCopySku(e, v.sku)}
                                  className="absolute right-2 p-1 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                  title="Copy Variant SKU ID"
                                >
                                  {copiedSku === v.sku ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Price Column */}
                          <div className="lg:col-span-3">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
                              Retail Price (₹)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-gray-400 font-bold">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                className="w-full pl-7 pr-3 py-2 text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none font-black text-gray-900"
                                value={v.price || ""}
                                onChange={(e) => {
                                  const newPrice = e.target.value;
                                  setVariants(variants.map((item, i) => i === idx ? { ...item, price: newPrice } : item));
                                }}
                              />
                            </div>
                          </div>

                          {/* Stock & Quick Controls Column (Spacious 5 columns) */}
                          <div className="lg:col-span-5">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
                              Inventory Stock & Controls
                            </label>
                            <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50/80 p-2 rounded-xl border border-gray-200">
                              <div className="pl-1 shrink-0">
                                <span className="font-black text-sm text-gray-900">
                                  {v.stock || 0}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold ml-1">Units</span>
                                {v.reserved > 0 && (
                                  <span className="block text-[9px] text-amber-600 font-bold">
                                    -{v.reserved} res.
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newStock = Math.max(0, parseInt(v.stock || 0) + 10);
                                    setVariants(variants.map((item, i) => i === idx ? { ...item, stock: newStock } : item));
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                  title="Add 10 Units"
                                >
                                  <TrendingUp className="h-3 w-3 text-emerald-700" /> +10
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newStock = Math.max(0, parseInt(v.stock || 0) - 10);
                                    setVariants(variants.map((item, i) => i === idx ? { ...item, stock: newStock } : item));
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-100 text-rose-800 hover:bg-rose-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                  title="Remove 10 Units"
                                >
                                  <TrendingDown className="h-3 w-3 text-rose-700" /> -10
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdjustingVariant(v);
                                    setAdjustQty((v.stock || 0).toString());
                                  }}
                                  className="p-1.5 bg-white text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors shadow-2xs"
                                  title="Set Exact Quantity"
                                >
                                  <Settings2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Variant Images Section */}
                        <div className="border-t border-gray-100 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <ImageIcon className="h-3.5 w-3.5 text-indigo-500" /> Variant Specific Images ({v.images?.length || 0})
                            </label>
                            <label className="cursor-pointer text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                              <Plus className="h-3 w-3" /> Add Variant Images
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleVariantImageUpload(idx, e)}
                              />
                            </label>
                          </div>
                          {v.images && v.images.length > 0 ? (
                            <div className="flex flex-wrap gap-2 items-center">
                              {v.images.map((imgUrl, imgIdx) => {
                                const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.split("/api/v1")[0] : "";
                                const fullUrl = imgUrl && imgUrl.startsWith("/") ? baseUrl + imgUrl : imgUrl;
                                return (
                                  <div key={imgIdx} className="relative group w-12 h-12 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-2xs">
                                    <img src={fullUrl} alt={`Variant ${idx} image ${imgIdx}`} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVariantImage(idx, imgIdx)}
                                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                      title="Remove Image"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-rose-400 hover:text-rose-200" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-400 italic">No variant-specific images set (will fall back to main product images on store)</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Package className="h-10 w-10 text-gray-300 mx-auto mb-3 opacity-60" />
                  <p className="text-sm font-bold text-gray-600 mb-1">
                    No Variant Combinations Added Yet
                  </p>
                  <p className="text-xs text-gray-400 mb-4 max-w-sm mx-auto">
                    Use the Option Niches Generator above or click "+ Add Single Variant" to set up variants directly on this product page.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Ledger Audit Trail */}
        <div className="space-y-6">
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" /> Audit Trail (Movements)
              </h3>
              <span className="text-[10px] font-bold text-gray-400">
                Recent 20
              </span>
            </div>

            {movementsLoading ? (
              <div className="py-8 text-center text-gray-400 font-medium text-xs">
                Loading history...
              </div>
            ) : movements.length === 0 ? (
              <div className="py-8 text-center text-gray-400 italic text-xs">
                No movements recorded for this item yet.
              </div>
            ) : (
              <div className="space-y-4">
                {movements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50/50 border border-gray-100/50 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        m.type === "IN"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {m.type === "IN" ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {m.type === "IN" ? "+" : "-"}{m.quantity} Units
                        </span>
                        <span className="text-[9px] font-mono text-gray-400">
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5 truncate">
                        Ref: {m.reference_id || "Direct Adjust"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {adjustingVariant && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Adjust Variant Stock
            </h3>
            <p className="text-xs text-gray-500 mb-6 font-medium">
              Updating stock level for:
              <span className="font-bold text-gray-900 block mt-1">
                {formatVariantTitle(adjustingVariant)} ({adjustingVariant.sku})
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
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAdjustingVariant(null)}
                  className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyManualAdjustment}
                  className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all active:scale-95"
                >
                  Apply Stock
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

      {/* Image Preview Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl relative">
            <img
              src={zoomedImage}
              alt="Zoomed product showcase"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  suffix,
  description,
  color,
  warning = false,
}) => {
  const colors = {
    blue: "bg-blue-50 border-blue-100",
    amber: "bg-amber-50 border-amber-100",
    emerald: "bg-emerald-50 border-emerald-100",
    indigo: "bg-indigo-50 border-indigo-100",
  };

  return (
    <div
      className={`p-6 rounded-3xl border bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}
    >
      <div
        className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-700 ${colors[color].split(" ")[0]}`}
      ></div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${colors[color]} border shadow-inner`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
        {warning && (
          <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
        )}
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">
        {label}
      </p>
      <div className="flex items-baseline gap-1 relative z-10">
        <h4 className="text-2xl font-black text-gray-900">{value}</h4>
        {suffix && (
          <span className="text-xs font-bold text-gray-500">{suffix}</span>
        )}
      </div>
      <p className="text-[10px] text-gray-500 mt-2 font-medium opacity-80 relative z-10">
        {description}
      </p>
    </div>
  );
};

export default ProductDetailPage;
