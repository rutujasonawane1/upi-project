import React, { useState } from "react";
import { ArrowLeft, Check, Delete, Lock, ShieldCheck, RefreshCw } from "lucide-react";

export default function UpiPinScreen({
  amount,
  merchant,
  vpa,
  method,
  onSuccess,
  onCancel
}) {
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const bankName =
    method === "later"
      ? "FlexiPay • ICICI Bank"
      : method === "sbi"
      ? "State Bank of India"
      : "HDFC Bank";

  const handleKeyPress = (num) => {
    if (isProcessing) return;
    if (pin.length < 4) {
      setPin((prev) => prev + String(num));
    }
  };

  const handleBackspace = () => {
    if (isProcessing) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (pin.length < 4 || isProcessing) return;
    setIsProcessing(true);

    // Realistic banking switch authorization delay
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 text-white flex flex-col justify-between select-none font-sans">
      {/* Top Bank Header Bar */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-3.5 flex items-center justify-between">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="p-1 -ml-1 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft size={20} />
          <span className="text-xs font-semibold">Cancel</span>
        </button>

        <div className="text-right">
          <div className="text-xs font-bold text-white tracking-tight">{bankName}</div>
          <div className="text-[10px] text-slate-400 font-mono">NPCI UPI Gateway</div>
        </div>
      </div>

      {/* Main Merchant & Amount Details */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 max-w-sm mx-auto w-full text-center space-y-6">
        
        {/* Merchant & Amount Box */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-400">Paying to</div>
          <div className="text-lg font-bold text-white tracking-tight">{merchant || "Sharma Super Store"}</div>
          <div className="text-[11px] font-mono text-slate-400">{vpa || "sharma@flexipay"}</div>
          
          <div className="text-3xl sm:text-4xl font-black text-white pt-2 font-mono tracking-tight">
            ₹{Number(amount || 0).toLocaleString("en-IN")}
          </div>
        </div>

        {/* PIN Entry Area */}
        <div className="w-full space-y-4 pt-2">
          <div className="text-xs font-bold text-slate-300 tracking-wider uppercase">
            ENTER 4-DIGIT UPI PIN
          </div>

          {/* 4 Masked PIN Indicator Dots */}
          <div className="flex justify-center items-center gap-5 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = idx < pin.length;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    isFilled
                      ? "bg-white scale-125 shadow-sm shadow-white/50"
                      : "border-2 border-slate-600 bg-transparent"
                  }`}
                />
              );
            })}
          </div>

          {/* NPCI Security Mandate */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
            <Lock size={12} className="text-emerald-400 shrink-0" />
            <span>UPI PIN is encrypted end-to-end with Bank Switch</span>
          </div>
        </div>

        {/* Processing State Overlay */}
        {isProcessing && (
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-2.5 text-xs text-emerald-400 animate-pulse w-full">
            <RefreshCw size={16} className="animate-spin" />
            <span className="font-semibold">Authorizing payment with bank...</span>
          </div>
        )}
      </div>

      {/* NPCI Custom Keypad */}
      <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 py-4 pb-8 max-w-sm mx-auto w-full">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isProcessing}
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-600 text-xl font-bold text-white flex items-center justify-center transition cursor-pointer disabled:opacity-50"
            >
              {digit}
            </button>
          ))}

          {/* Backspace Button */}
          <button
            type="button"
            disabled={isProcessing || pin.length === 0}
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer disabled:opacity-40"
          >
            <Delete size={22} />
          </button>

          {/* Zero Button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleKeyPress(0)}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-600 text-xl font-bold text-white flex items-center justify-center transition cursor-pointer disabled:opacity-50"
          >
            0
          </button>

          {/* Confirm / Submit Button (Green Checkmark) */}
          <button
            type="button"
            disabled={isProcessing || pin.length < 4}
            onClick={handleSubmit}
            className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex items-center justify-center transition cursor-pointer shadow-lg shadow-emerald-900/30 disabled:opacity-40"
          >
            <Check size={26} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
