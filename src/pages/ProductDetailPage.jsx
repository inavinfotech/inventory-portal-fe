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
  DollarSign,
  Activity,
  Image as ImageIcon,
} from "lucide-react";
import { inventoryService } from "../services/api";

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProductDetails();
    fetchProductMovements();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getProduct(productId);
      setProduct(response.data);
    } catch (err) {
      setError("Failed to fetch product details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductMovements = async () => {
    try {
      setMovementsLoading(true);
      const response = await inventoryService.getMovements({
        product_id: productId,
        limit: 10,
      });
      setMovements(response.data.items || []);
    } catch (err) {
      console.error("Failed to fetch movements", err);
    } finally {
      setMovementsLoading(false);
    }
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
              <span className="font-mono text-gray-400 text-[10px] uppercase tracking-tighter">
                SKU: {product.sku}
              </span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              {product.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
          label="Total Inventory"
          value={product.stock}
          suffix="Units"
          description="Total quantities in stock"
          color="blue"
        />
        <StatCard
          icon={<AlertTriangle className="text-amber-500" />}
          label="Reserved Quantity"
          value={product.reserved}
          suffix="Units"
          description="Awaiting fulfillment"
          color="amber"
          warning={product.reserved > 0}
        />
        <StatCard
          icon={<TrendingUp className="text-emerald-500" />}
          label="Available Sellable"
          value={product.stock - product.reserved}
          suffix="Units"
          description="Ready for sale"
          color="emerald"
        />
        <StatCard
          icon={<DollarSign className="text-indigo-500" />}
          label="Unit Valuation"
          value={`$${product.price.toLocaleString()}`}
          description="Base listing price"
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Info & Variants */}
        <div className="lg:col-span-2 space-y-8">
          {/* Detailed Info */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Info className="h-4 w-4 text-primary-500" /> Specifications &
                Variants
              </h3>
            </div>
            <div className="p-8">
              <p className="text-gray-600 mb-8 leading-relaxed italic border-l-4 border-gray-100 pl-6">
                {product.description ||
                  "No description provided for this catalog item."}
              </p>

              {product.variants?.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                    Available Variants
                  </h4>
                  {product.variants.map((v) => (
                    <div
                      key={v.id}
                      className="group p-5 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-200 hover:bg-white transition-all shadow-sm"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                            Weight / Type
                          </p>
                          <p className="font-bold text-gray-900">{v.weight}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                            SKU
                          </p>
                          <p className="font-mono text-xs text-gray-500">
                            {v.sku}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                            Retail Price
                          </p>
                          <p className="font-black text-gray-900">
                            ${v.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                            Inventory Status
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-black text-sm text-gray-900">
                                {v.stock} in Stock
                              </p>
                              {v.reserved > 0 && (
                                <p className="text-[10px] font-bold text-amber-600">
                                  -{v.reserved} Reserved
                                </p>
                              )}
                            </div>
                            <div
                              className={`w-2 h-2 rounded-full ${v.stock > 0 ? "bg-emerald-500" : "bg-rose-500"} animate-pulse`}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500 italic">
                    This product does not have any weight-based variants.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Visual Assets (Images) */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-blue-500" /> Attached Visual
              Assets
            </h3>
            {product.images?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 shadow-inner group"
                  >
                    <img
                      src={`${import.meta.env.VITE_API_URL.replace("/api/v1", "")}${img}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt={`View ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 opacity-60">
                <ImageIcon className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  No Assets Registered
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Activity / Movements */}
        <div className="space-y-8">
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" /> Recent
                Activity
              </h3>
            </div>
            <div className="p-0 overflow-y-auto max-h-[600px] flex-1">
              {movementsLoading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                </div>
              ) : movements.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {movements.map((move) => (
                    <div
                      key={move.id}
                      className="p-6 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-1 p-2 rounded-xl border ${
                              move.type === "IN"
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                : move.type === "OUT"
                                  ? "bg-rose-50 border-rose-100 text-rose-600"
                                  : "bg-blue-50 border-blue-100 text-blue-600"
                            }`}
                          >
                            {move.type === "IN" ? (
                              <TrendingUp size={14} />
                            ) : move.type === "OUT" ? (
                              <TrendingDown size={14} />
                            ) : (
                              <AlertTriangle size={14} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-gray-900 text-sm">
                                {move.type === "IN" ? "+" : ""}
                                {move.quantity} Units
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                  move.type === "IN"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : move.type === "OUT"
                                      ? "bg-rose-100 text-rose-700"
                                      : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {move.type}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium">
                              Ref: {move.reference_id || "manual"}
                            </p>
                            <div className="mt-2 flex items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                              <Clock size={10} />{" "}
                              {new Date(move.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400 italic flex flex-col items-center">
                  <Package className="h-10 w-10 mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">
                    No movements recorded
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 bg-gray-50/50 border-t border-gray-100 shrink-0">
              <button
                onClick={() => navigate("/movements")}
                className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
              >
                View Ledger Statistics
              </button>
            </div>
          </section>
        </div>
      </div>
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
