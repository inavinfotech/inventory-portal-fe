import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Key,
  ShieldCheck,
  Trash2,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Barcode,
  Sparkles,
  Save,
  Info,
  BookOpen,
  Code,
  X,
} from "lucide-react";
import api from "../services/api";
import {
  getSkuConfig,
  saveSkuConfig,
  generateProductSku,
  generateVariantSku,
} from "../utils/skuGenerator";

const SettingsPage = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [createdApp, setCreatedApp] = useState(null);

  // SKU Config State
  const [skuConfig, setSkuConfig] = useState(getSkuConfig());
  const [skuSaved, setSkuSaved] = useState(false);
  const [showSkuGuide, setShowSkuGuide] = useState(false);
  const [previewProductSku, setPreviewProductSku] = useState("");
  const [previewVariantSku, setPreviewVariantSku] = useState("");

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    // Update live previews when config changes
    const prodSku = generateProductSku("T-Shirt", skuConfig);
    const varSku = generateVariantSku(prodSku, { Size: "Small", Color: "Red" }, skuConfig);
    setPreviewProductSku(prodSku);
    setPreviewVariantSku(varSku);
  }, [skuConfig]);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await api.get("/apps");
      setApps(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSkuConfig = () => {
    saveSkuConfig(skuConfig);
    setSkuSaved(true);
    setTimeout(() => setSkuSaved(false), 2500);
  };

  const handleCreate = async () => {
    try {
      const res = await api.post("/apps", { name: newAppName });
      setCreatedApp(res.data);
      fetchApps();
    } catch (e) {
      alert("Failed to generate API Key");
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this API application? Permanent access loss."))
      return;
    try {
      await api.delete(`/apps/${id}`);
      fetchApps();
    } catch (e) {
      alert("Delete failed");
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-top-1 duration-700 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-indigo-600" /> System Settings & Controls
        </h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Configure automated SKU generator formats, API security credentials, and portal preferences.
        </p>
      </div>

      {/* AUTOMATED SKU FORMAT GENERATOR CONFIGURATION */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Barcode className="h-6 w-6 text-indigo-600" /> Automated SKU Generation Rules
              </h3>
              <button
                type="button"
                onClick={() => setShowSkuGuide(true)}
                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-100 transition-colors shadow-2xs flex items-center justify-center"
                title="View Detailed SKU Creation Guide"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Configure system-wide automatic SKU formats for products and variants. Click <strong className="text-indigo-600 font-bold">(i)</strong> for template guide.
            </p>
          </div>

          <button
            onClick={handleSaveSkuConfig}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md"
          >
            {skuSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {skuSaved ? "Rules Saved!" : "Save SKU Rules"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prefix Input */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              Default Brand Prefix
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-gray-900"
              value={skuConfig.prefix}
              onChange={(e) => setSkuConfig({ ...skuConfig, prefix: e.target.value })}
            />
            <p className="text-[10px] text-gray-400 mt-1">Replaces &#123;PREFIX&#125; token (e.g. INV)</p>
          </div>

          {/* Product SKU Format */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              Product SKU Format Template
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono font-bold text-gray-900"
              value={skuConfig.productFormat}
              onChange={(e) => setSkuConfig({ ...skuConfig, productFormat: e.target.value })}
            />
            <p className="text-[10px] text-gray-400 mt-1">Default: &#123;NUMBERS&#125; (16 numeric digits)</p>
          </div>

          {/* Variant SKU Format */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              Variant SKU Format Template
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono font-bold text-gray-900"
              value={skuConfig.variantFormat}
              onChange={(e) => setSkuConfig({ ...skuConfig, variantFormat: e.target.value })}
            />
            <p className="text-[10px] text-gray-400 mt-1">Default: &#123;NUMBERS&#125; (16 numeric digits)</p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-[10px] font-black text-gray-400 uppercase mr-2">Preset Formats:</span>
          <button
            type="button"
            onClick={() => setSkuConfig({ ...skuConfig, prefix: "INV", productFormat: "{NUMBERS}", variantFormat: "{NUMBERS}", digitLength: 16 })}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-bold transition-colors shadow-xs"
          >
            Strict 16-Digit Numeric Code ({"{NUMBERS}"})
          </button>
          <button
            type="button"
            onClick={() => setSkuConfig({ ...skuConfig, prefix: "INV", productFormat: "{PREFIX}-{NAME}-{NUMBERS}", variantFormat: "{PRODUCT_SKU}-{VARIANTS}", digitLength: 6 })}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg font-bold transition-colors"
          >
            Prefix + Name (INV-NAME-NUMBERS)
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-3">
          <div className="text-xs font-black text-indigo-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-600" /> Live SKU Auto-Generation Preview
            </span>
            <button
              type="button"
              onClick={() => setShowSkuGuide(true)}
              className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Info className="h-3 w-3" /> Token Guide
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-indigo-100">
              <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Sample Product SKU</span>
              <code className="text-xs font-bold text-indigo-700 font-mono tracking-wider">
                {previewProductSku}
              </code>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-indigo-100">
              <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Sample Variant SKU</span>
              <code className="text-xs font-bold text-indigo-700 font-mono tracking-wider">
                {previewVariantSku}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* API INFRASTRUCTURE SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary-600" /> API Infrastructure
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              Manage portal-to-portal secure credentials and application API keys.
            </p>
          </div>
          <button
            onClick={() => setShowNewAppModal(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md"
          >
            <Plus className="h-4 w-4" /> New Application
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-40 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDelete(app.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary-50 p-3 rounded-2xl">
                  <Key className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{app.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono uppercase tracking-widest">
                    {app.id}
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">
                        API Key
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <code className="text-xs text-gray-600 flex-1 truncate font-mono">
                          {app.api_key}
                        </code>
                        <button
                          onClick={() => handleCopy(app.api_key, app.id + "key")}
                          className="text-gray-400 hover:text-primary-600 transition-colors p-1"
                        >
                          {copiedId === app.id + "key" ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DETAILED SKU CREATION GUIDE MODAL */}
      {showSkuGuide && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 border border-gray-100">
            <button
              type="button"
              onClick={() => setShowSkuGuide(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                  SKU Creation & Auto-Generation Guide
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Complete reference for SKU format templates and placeholder tokens.
                </p>
              </div>
            </div>

            {/* Guide Section 1: 16-Digit Barcode Rule */}
            <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/40 p-5 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-950 uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-indigo-600" /> 16-Digit Numeric Barcode Standard (Recommended)
              </div>
              <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
                By setting your template format to <code className="bg-white px-2 py-0.5 rounded font-mono font-bold text-indigo-700">&#123;NUMBERS&#125;</code>, the system automatically generates a pure <strong>16-digit numeric barcode</strong> (digits 0-9) for every product and variant.
              </p>
              <div className="bg-white p-3 rounded-xl border border-indigo-100/60 font-mono text-xs font-bold text-indigo-800 flex items-center justify-between">
                <span>Sample Output:</span>
                <span className="tracking-widest">6322 8105 5933 9439</span>
              </div>
            </div>

            {/* Guide Section 2: Tokens Reference Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5 text-gray-500" /> Available Placeholder Tokens
              </h4>

              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100/80 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <th className="py-2.5 px-4">Token</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Example Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">&#123;NUMBERS&#125;</td>
                      <td className="py-2.5 px-4">Strict 16 numeric barcode digits (0-9)</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-900">8492019483019284</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">&#123;PREFIX&#125;</td>
                      <td className="py-2.5 px-4">Default brand prefix configured in Settings</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-900">INV</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">&#123;NAME&#125;</td>
                      <td className="py-2.5 px-4">Sanitized first 8 characters of Product Name</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-900">TSHIRT</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">&#123;PRODUCT_SKU&#125;</td>
                      <td className="py-2.5 px-4">Parent Product SKU (for variant template)</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-900">6322810559339439</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">&#123;VARIANTS&#125;</td>
                      <td className="py-2.5 px-4">Joined variant attributes (e.g. Size/Color)</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-900">SMALL-RED</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Guide Section 3: Preset Examples */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Template Example Combinations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Template Format</span>
                  <p className="font-mono font-bold text-gray-900">&#123;NUMBERS&#125;</p>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block mt-2">Generated Result</span>
                  <p className="font-mono font-bold text-indigo-700 text-xs">8934720192837461</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Template Format</span>
                  <p className="font-mono font-bold text-gray-900">&#123;PREFIX&#125;-&#123;NAME&#125;-&#123;NUMBERS&#125;</p>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block mt-2">Generated Result</span>
                  <p className="font-mono font-bold text-indigo-700 text-xs">INV-TSHIRT-893472</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowSkuGuide(false)}
                className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-md"
              >
                Understood, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Application Modal */}
      {showNewAppModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900">Authorize App</h3>
            {!createdApp ? (
              <>
                <input
                  type="text"
                  placeholder="Application Name (e.g. Order Portal)"
                  className="w-full mt-6 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                />
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowNewAppModal(false)}
                    className="flex-1 py-3 text-gray-400 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20"
                  >
                    Generate Keys
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 italic text-xs text-amber-800">
                  <ShieldCheck className="h-5 w-5 shrink-0" />
                  Copy the secret now. It will never be shown again for security.
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    One-time Secret
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 p-4 rounded-xl mt-1 select-all font-mono text-sm break-all">
                    {createdApp.api_secret}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowNewAppModal(false);
                    setCreatedApp(null);
                    setNewAppName("");
                  }}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black"
                >
                  Success, I've Saved It
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
