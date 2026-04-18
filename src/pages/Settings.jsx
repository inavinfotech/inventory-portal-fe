import React, { useState, useEffect } from "react";
import {
  Settings,
  Key,
  ShieldCheck,
  Trash2,
  Plus,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import api from "../services/api";

const SettingsPage = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [createdApp, setCreatedApp] = useState(null);

  useEffect(() => {
    fetchApps();
  }, []);

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
    <div className="space-y-8 animate-in slide-in-from-top-1 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary-600" />
            API Infrastructure
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage portal-to-portal secure credentials
          </p>
        </div>
        <button
          onClick={() => setShowNewAppModal(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-all"
        >
          <Plus className="h-4 w-4" /> New Application
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {apps.map((app) => (
          <div
            key={app.id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-40 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDelete(app.id)}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary-50 p-3 rounded-xl">
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
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg group/row">
                      <code className="text-xs text-gray-600 flex-1 truncate">
                        {app.api_key}
                      </code>
                      <button
                        onClick={() => handleCopy(app.api_key, app.id + "key")}
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        {copiedId === app.id + "key" ? (
                          <Check className="h-4 w-4" />
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

      {/* Simple Modal */}
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
                  Copy the secret now. It will never be shown again for
                  security.
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
