import React, { useState } from "react";
import { Cloud, CheckCircle2, AlertCircle, X, ExternalLink, Key, Database } from "lucide-react";
import { getActiveFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig, isFirebaseActive } from "./firebaseSync";

export default function FirebaseSettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const currentConfig = getActiveFirebaseConfig();
  const [dbUrl, setDbUrl] = useState(currentConfig.databaseURL || "");
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || "");
  const [projectId, setProjectId] = useState(currentConfig.projectId || "");
  const [statusMsg, setStatusMsg] = useState(null);
  const isConnected = isFirebaseActive();

  const handleSave = (e) => {
    e.preventDefault();
    if (!dbUrl && !projectId) {
      setStatusMsg({ type: "error", text: "Please enter at least a Database URL or Project ID." });
      return;
    }

    const newConfig = {
      ...currentConfig,
      databaseURL: dbUrl.trim().replace(/\/$/, ""),
      apiKey: apiKey.trim(),
      projectId: projectId.trim() || (dbUrl.includes(".firebaseio.com") ? dbUrl.split("//")[1]?.split(".")[0] : "")
    };

    saveFirebaseConfig(newConfig);
    setStatusMsg({ type: "success", text: "Firebase configuration saved! Live Realtime sync is active." });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleDisconnect = () => {
    clearFirebaseConfig();
    setDbUrl("");
    setApiKey("");
    setProjectId("");
    setStatusMsg({ type: "info", text: "Cloud sync disconnected. Operating in local mode." });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-tab-enter"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white ${isConnected ? "bg-emerald-600 shadow-emerald-500/20" : "bg-[#F47920] shadow-orange-500/20"} shadow-md`}>
              <Cloud size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">Cloud Sync Settings</h3>
              <p className="text-[11px] text-slate-500">Enable live phone-to-laptop sync on GitHub Pages</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Current Status Pill */}
        <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${isConnected ? "bg-emerald-50/80 border-emerald-200 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
            <div>
              <div className="font-bold">{isConnected ? "Connected to Firebase Cloud" : "Local Mode (No Cloud DB)"}</div>
              <div className="text-[10px] text-slate-500">
                {isConnected ? (currentConfig.databaseURL || currentConfig.projectId) : "Works on localhost; add Firebase for live GitHub Pages sync"}
              </div>
            </div>
          </div>
          {isConnected && (
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
              Live
            </span>
          )}
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
            statusMsg.type === "error" ? "bg-rose-50 text-rose-800 border border-rose-200" :
            "bg-slate-100 text-slate-800"
          }`}>
            {statusMsg.type === "success" ? <CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> : <AlertCircle size={14} className="text-rose-600 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Database size={13} className="text-[#F47920]" />
              <span>Firebase Realtime Database URL</span>
            </label>
            <input
              type="text"
              placeholder="https://your-project-default-rtdb.firebaseio.com"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#F47920] bg-slate-50 focus:bg-white font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              From your Firebase Console &gt; Realtime Database &gt; top URL banner.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <Key size={12} className="text-slate-400" />
                <span>API Key (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#F47920] bg-slate-50 focus:bg-white font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Project ID</label>
              <input
                type="text"
                placeholder="my-upi-demo"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#F47920] bg-slate-50 focus:bg-white font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-2xl text-[11px] text-orange-950 space-y-1">
            <strong>💡 Quick 1-minute Free Setup:</strong>
            <p className="text-[10px] leading-relaxed">
              1. Open <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold text-[#F47920] inline-flex items-center gap-0.5">Firebase Console <ExternalLink size={10} /></a>.
              <br />
              2. Click <strong>Create a project</strong> &gt; <strong>Realtime Database</strong> &gt; <strong>Create</strong>.
              <br />
              3. Set Rules to <code>{`{ ".read": true, ".write": true }`}</code> and paste your Database URL above.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="w-1/3 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Disconnect
              </button>
            )}
            <button
              type="submit"
              className={`flex-1 py-2.5 bg-[#F47920] hover:bg-[#E06710] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5`}
            >
              <CheckCircle2 size={15} />
              <span>Save & Connect Cloud Sync</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
