"use client";

import { useState, useEffect } from "react";
import { getSystemConfig, updateSystemConfig } from "@/app/actions/admin/config";

export default function SystemConfigPage() {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getSystemConfig().then((data) => {
      setConfig({
        default_currency: data.default_currency || "FCFA",
        registration_open: data.registration_open ?? true,
        maintenance_mode: data.maintenance_mode ?? false,
      });
      setIsLoading(false);
    });
  }, []);

  async function handleToggle(key: string, value: boolean) {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    try {
      await updateSystemConfig(key, value);
    } catch (e) {
      alert("Failed to update config");
      setConfig(config); // Revert
    }
  }

  async function handleSaveCurrency(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSystemConfig("default_currency", config.default_currency);
      alert("Currency updated successfully");
    } catch (e) {
      alert("Failed to update currency");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="material-symbols-outlined animate-spin text-4xl text-emerald-500">refresh</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
        <h2 className="text-lg font-bold text-slate-800">Global Settings</h2>
        <p className="text-sm text-slate-500">Configure platform-wide variables and features.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Settings */}
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-[20px]">payments</span>
              Localization
            </h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleSaveCurrency} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Default Currency</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.default_currency}
                    onChange={(e) => setConfig({ ...config, default_currency: e.target.value })}
                    className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-900"
                    placeholder="e.g. FCFA, USD"
                  />
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-xl transition-all disabled:opacity-70"
                  >
                    Save
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  This sets the default currency displayed across all merchant shops.
                </p>
              </div>
            </form>
          </div>
        </section>

        {/* Feature Flags */}
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-[20px]">toggle_on</span>
              Feature Flags
            </h3>
          </div>
          <div className="p-6 space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Open Registration</p>
                <p className="text-xs text-slate-500">Allow new merchants to sign up on the public page.</p>
              </div>
              <button
                onClick={() => handleToggle("registration_open", !config.registration_open)}
                className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${
                  config.registration_open ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-red-600">Maintenance Mode</p>
                <p className="text-xs text-slate-500">Disable access for all non-admin users.</p>
              </div>
              <button
                onClick={() => handleToggle("maintenance_mode", !config.maintenance_mode)}
                className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${
                  config.maintenance_mode ? "bg-red-500 justify-end" : "bg-slate-300 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
              </button>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
