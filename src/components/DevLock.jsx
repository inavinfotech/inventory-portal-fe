import React, { useState } from "react";
import { Lock, ShieldAlert, ArrowRight } from "lucide-react";

const DevLock = ({ children }) => {
  const devPassword = import.meta.env.VITE_DEV_PASSWORD !== undefined
    ? import.meta.env.VITE_DEV_PASSWORD
    : "dev";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(
    localStorage.getItem("dev_password_auth") === devPassword
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === devPassword) {
      localStorage.setItem("dev_password_auth", password);
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect passcode. Access denied.");
    }
  };

  // If VITE_DEV_PASSWORD is not set, bypass the lock completely
  if (!devPassword) {
    return children;
  }

  if (unlocked) {
    return children;
  }

  return (
    <div className="flex items-center justify-center py-16 px-4 font-sans">
      <div className="w-full max-w-md">
        {/* Simple card with the current application theme */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {/* Lock Icon Container matching Login style */}
            <div className="bg-blue-50 p-4 rounded-full mb-6">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Passcode Required
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This application environment is locked. Please enter the passcode to access.
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter passcode"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all text-center text-base"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 px-4 rounded-xl text-sm font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 active:transform active:scale-[0.98] transition-all font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Unlock Application</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevLock;
