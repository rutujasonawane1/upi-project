import React, { useState } from "react";
import { User, Check, Plus, X, ShieldCheck } from "lucide-react";

export const PRESET_USERS = [
  {
    id: "umesh",
    name: "Umesh",
    fullName: "Umesh Kumar",
    vpa: "umesh@flexipay",
    phone: "+91 98201 11222",
    initials: "U",
    avatarBg: "bg-indigo-600",
    defaultLimit: 60000
  },
  {
    id: "rutuja",
    name: "Rutuja",
    fullName: "Rutuja Sonawane",
    vpa: "rutuja@flexipay",
    phone: "+91 98765 43210",
    initials: "R",
    avatarBg: "bg-[#002855]",
    defaultLimit: 50000
  }
];

export default function UserSwitchModal({ isOpen, onClose, currentUser, onSelectUser }) {
  if (!isOpen) return null;

  const [customName, setCustomName] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);

  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const clean = customName.trim();
    const id = clean.toLowerCase().replace(/[^a-z0-9]/g, "");
    const newUser = {
      id: id || "user_" + Date.now(),
      name: clean.split(" ")[0],
      fullName: clean,
      vpa: `${id || "user"}@flexipay`,
      phone: "+91 98" + Math.floor(10000000 + Math.random() * 90000000),
      initials: clean.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U",
      avatarBg: "bg-emerald-700",
      defaultLimit: 45000
    };
    onSelectUser(newUser);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-tab-enter"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-5 sm:p-6 shadow-2xl space-y-4 my-auto border border-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F47920] flex items-center justify-center font-bold">
              <User size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">Switch Consumer Profile</h3>
              <p className="text-[10px] text-slate-500">Test multi-user payments to Merchant POS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Preset Profiles List */}
        <div className="space-y-2">
          {PRESET_USERS.map((u) => {
            const isSelected = currentUser.id === u.id;
            return (
              <div
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  onClose();
                }}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "border-[#F47920] bg-orange-50/60 ring-1 ring-[#F47920]"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${u.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-xs`}>
                    {u.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{u.fullName}</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                        ₹{(u.defaultLimit / 1000)}k Limit
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{u.vpa}</div>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#F47920] text-white flex items-center justify-center">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Custom User Option */}
        {!showAddCustom ? (
          <button
            type="button"
            onClick={() => setShowAddCustom(true)}
            className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-[#F47920] rounded-2xl text-xs font-bold text-slate-600 hover:text-[#F47920] transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Another User Profile</span>
          </button>
        ) : (
          <form onSubmit={handleCreateCustom} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-tab-enter">
            <label className="text-[11px] font-bold text-slate-700 block">Enter User's Name:</label>
            <input
              type="text"
              placeholder="e.g. Rahul, Priya, Amit"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#F47920] bg-white font-medium"
              autoFocus
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddCustom(false)}
                className="w-1/3 py-2 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!customName.trim()}
                className="w-2/3 py-2 text-xs font-bold bg-[#F47920] hover:bg-[#E06710] text-white rounded-xl transition shadow-xs disabled:opacity-50"
              >
                Create &amp; Switch
              </button>
            </div>
          </form>
        )}

        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 leading-relaxed text-center">
          💡 <strong>Multi-Device Tip:</strong> Open <code>?user=umesh</code> on one phone and <code>?user=rutuja</code> on another phone. When both pay, the Merchant POS displays each name distinctly!
        </div>
      </div>
    </div>
  );
}
