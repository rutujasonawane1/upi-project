import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Building2,
  Lock,
  MessageSquare,
  AlertCircle
} from "lucide-react";

export default function OnboardingFlow({ onComplete, initialUserParam }) {
  // Step 1: Mobile & Name, Step 2: OTP, Step 3: AA Underwriting & Sanction
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState(
    initialUserParam === "umesh"
      ? "98201 44552"
      : initialUserParam === "rutuja"
      ? "98765 43210"
      : ""
  );
  const [fullName, setFullName] = useState(
    initialUserParam === "umesh"
      ? "Umesh Kumar"
      : initialUserParam === "rutuja"
      ? "Rutuja Sonawane"
      : ""
  );
  const [pan, setPan] = useState("ABCDE1234F");
  const [agreed, setAgreed] = useState(true);

  // OTP State
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("4921");
  const [smsBanner, setSmsBanner] = useState(false);
  const [timer, setTimer] = useState(45);

  // Underwriting Animation State
  const [underwritingProgress, setUnderwritingProgress] = useState(0);

  // Quick Preset Helper
  const applyPreset = (presetName, presetPhone) => {
    setFullName(presetName);
    setPhone(presetPhone);
  };

  const handleSendOtp = (e) => {
    if (e) e.preventDefault();
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!fullName.trim()) {
      alert("Please enter your full legal name");
      return;
    }
    if (!agreed) {
      alert("Please accept the terms and AA consent to proceed");
      return;
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(code);
    setStep(2);
    setSmsBanner(true);
    setTimer(45);
  };

  const handleAutoFillOtp = () => {
    setOtp(generatedOtp.split(""));
  };

  const handleVerifyOtp = () => {
    const entered = otp.join("");
    if (entered.length < 4) {
      alert("Please enter the 4-digit OTP");
      return;
    }
    // Proceed to Step 3: Underwriting
    setStep(3);
  };

  // Underwriting steps animation
  useEffect(() => {
    if (step === 3) {
      setUnderwritingProgress(1);
      const t1 = setTimeout(() => setUnderwritingProgress(2), 1000);
      const t2 = setTimeout(() => setUnderwritingProgress(3), 2000);
      const t3 = setTimeout(() => setUnderwritingProgress(4), 3000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [step]);

  // Handle final completion
  const handleFinalize = () => {
    const cleanId = fullName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const vpa = `${cleanId || "user"}@flexipay`;
    const initials = fullName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "FP";

    const userProfile = {
      id: cleanId || "user",
      fullName: fullName.trim(),
      phone: phone.startsWith("+91") ? phone : `+91 ${phone}`,
      vpa: vpa,
      initials: initials,
      avatarBg: "bg-[#002855]",
      creditLimit: 60000,
      availableCredit: 60000,
      pan: pan.toUpperCase(),
      cibilScore: 785,
      linkedBank: "HDFC Bank •••• 4812",
      kycVerified: true,
      onboardingDate: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    };

    onComplete(userProfile);
  };

  return (
    <div className="min-h-screen bg-slate-900 sm:bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-6 font-sans">
      {/* Device wrapper */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border border-slate-200">
        
        {/* Top Simulated SMS Banner (Only during Step 2) */}
        {smsBanner && step === 2 && (
          <div className="absolute top-3 left-3 right-3 bg-slate-950 text-white rounded-2xl p-3 shadow-2xl z-50 animate-bounce flex items-start gap-3 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200">Messages • Just now</span>
                <button
                  onClick={() => setSmsBanner(false)}
                  className="text-slate-400 text-xs hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                Your FlexiPay OTP is <strong className="text-emerald-400 font-mono text-sm tracking-wider">{generatedOtp}</strong>. Valid for 10 minutes.
              </p>
              <button
                onClick={handleAutoFillOtp}
                className="mt-2 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 rounded-md transition"
              >
                Auto-fill {generatedOtp}
              </button>
            </div>
          </div>
        )}

        {/* Brand Header */}
        <div className="bg-gradient-to-br from-[#002855] via-[#001f42] to-slate-950 text-white p-6 pb-8 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#F47920] flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                FP
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight">FlexiPay</span>
                <span className="text-[10px] text-orange-300 block font-mono">ICICI Bank • UPI Credit</span>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-white/10 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-400/20 flex items-center gap-1">
              <ShieldCheck size={12} /> RBI DLG Compliant
            </span>
          </div>

          <div className="mt-5">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {step === 1 && "Welcome to FlexiPay"}
              {step === 2 && "Verify Mobile Number"}
              {step === 3 && "Underwriting & Credit Approval"}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              {step === 1 && "India's RBI-compliant Credit-on-UPI with 45-day 0% interest line"}
              {step === 2 && `Enter 4-digit OTP sent to +91 ${phone}`}
              {step === 3 && "Consent-based Account Aggregator evaluation"}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-1.5 mt-4">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-[#F47920]" : "bg-white/20"}`}></div>
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-[#F47920]" : "bg-white/20"}`}></div>
            <div className={`h-1 flex-1 rounded-full ${step >= 3 ? "bg-[#F47920]" : "bg-white/20"}`}></div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          
          {/* STEP 1: MOBILE & NAME */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Quick Fill Chips for Testing */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Demo Profiles (or type any name below):
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset("Umesh Kumar", "98201 44552")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      fullName === "Umesh Kumar"
                        ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>👤</span>
                    <span>Umesh Kumar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("Rutuja Sonawane", "98765 43210")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      fullName === "Rutuja Sonawane"
                        ? "bg-orange-50 border-[#F47920] text-[#F47920] font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>👤</span>
                    <span>Rutuja Sonawane</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Legal Name (as per PAN / Aadhaar)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Umesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F47920] text-sm text-slate-900 font-medium"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (Linked to Bank A/c)
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 focus-within:border-[#F47920] overflow-hidden">
                  <span className="px-3 py-2.5 bg-slate-50 text-xs font-bold text-slate-600 border-r border-slate-200">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    placeholder="98765 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none"
                    maxLength={13}
                  />
                </div>
              </div>

              {/* PAN Number Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Permanent Account Number (PAN)
                </label>
                <input
                  type="text"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F47920] text-sm font-mono text-slate-900 uppercase"
                  maxLength={10}
                />
              </div>

              {/* RBI Consent Checkbox */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consent"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-[#F47920] cursor-pointer"
                />
                <label htmlFor="consent" className="text-[11px] text-slate-600 leading-relaxed cursor-pointer">
                  I agree to the <strong>Terms &amp; Conditions</strong> and authorize ICICI Bank &amp; RBI-regulated Account Aggregator (AA) to fetch bank statements for credit underwriting under <strong>RBI DLG 2022</strong>.
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full py-3.5 rounded-xl bg-[#F47920] hover:bg-[#E06710] text-white font-bold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Verify Mobile &amp; Get OTP</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-[#F47920] flex items-center justify-center mx-auto mb-2">
                  <Smartphone size={24} />
                </div>
                <div className="text-xs text-slate-500">
                  Enter the 4-digit code sent via SMS to
                </div>
                <div className="text-sm font-bold font-mono text-slate-900">+91 {phone}</div>
              </div>

              {/* 4 OTP Boxes */}
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={otp[idx]}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const nextOtp = [...otp];
                      nextOtp[idx] = val;
                      setOtp(nextOtp);
                      if (val && idx < 3) {
                        document.getElementById(`otp-${idx + 1}`)?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[idx] && idx > 0) {
                        document.getElementById(`otp-${idx - 1}`)?.focus();
                      }
                    }}
                    className="w-12 h-14 text-center text-xl font-bold font-mono border-2 rounded-xl border-slate-200 focus:border-[#F47920] focus:outline-none bg-slate-50 focus:bg-white text-slate-900 shadow-xs"
                  />
                ))}
              </div>

              {/* Auto Fill Help */}
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  className="font-bold text-[#F47920] hover:underline cursor-pointer"
                >
                  ⚡ Auto-fill OTP ({generatedOtp})
                </button>
                <span className="text-slate-400">
                  Resend in {timer}s
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="w-full py-3.5 rounded-xl bg-[#F47920] hover:bg-[#E06710] text-white font-bold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Verify &amp; Activate Credit Line</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  ← Edit Mobile Number
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ACCOUNT AGGREGATOR UNDERWRITING & SANCTION */}
          {step === 3 && (
            <div className="space-y-6 py-2">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    underwritingProgress >= 1 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                  }`}>
                    {underwritingProgress >= 1 ? <CheckCircle2 size={16} /> : "1"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800">SIM Binding &amp; Device Identity</div>
                    <div className="text-[10px] text-slate-500">NPCI Device Binding Handshake</div>
                  </div>
                  {underwritingProgress >= 1 && <span className="text-xs text-emerald-600 font-bold">Passed</span>}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    underwritingProgress >= 2 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                  }`}>
                    {underwritingProgress >= 2 ? <CheckCircle2 size={16} /> : "2"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800">Experian / CIBIL Bureau Check</div>
                    <div className="text-[10px] text-slate-500">Score: 785 • Zero default history</div>
                  </div>
                  {underwritingProgress >= 2 && <span className="text-xs text-emerald-600 font-bold">Score 785</span>}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    underwritingProgress >= 3 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                  }`}>
                    {underwritingProgress >= 3 ? <CheckCircle2 size={16} /> : "3"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800">Account Aggregator (AA) Statement</div>
                    <div className="text-[10px] text-slate-500">HDFC Bank Avg Monthly Inflow: ₹1,24,000</div>
                  </div>
                  {underwritingProgress >= 3 && <span className="text-xs text-emerald-600 font-bold">Approved</span>}
                </div>

                {underwritingProgress >= 4 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-center space-y-2 animate-fade-in">
                    <div className="inline-flex p-2 rounded-full bg-emerald-500 text-white shadow-md">
                      <Sparkles size={20} />
                    </div>
                    <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Credit Line Sanctioned!
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900">
                      ₹60,000
                    </div>
                    <p className="text-[11px] text-slate-600">
                      45-Day Zero Interest UPI Credit Line activated for <strong>{fullName}</strong>.
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 pt-1">
                      Assigned UPI ID: {fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}@flexipay
                    </div>
                  </div>
                )}
              </div>

              {underwritingProgress >= 4 ? (
                <button
                  type="button"
                  onClick={handleFinalize}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Launch FlexiPay Dashboard</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <div className="text-center text-xs text-slate-500 py-3 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#F47920] border-t-transparent rounded-full animate-spin"></div>
                  <span>Evaluating credit eligibility via Account Aggregator...</span>
                </div>
              )}
            </div>
          )}

          {/* Footer Security Badges */}
          <div className="border-t border-slate-100 pt-4 mt-6 text-center">
            <div className="flex items-center justify-center gap-4 text-[10px] font-medium text-slate-400">
              <span className="flex items-center gap-1">
                <Lock size={12} className="text-slate-500" /> 256-Bit SSL Encrypted
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 size={12} className="text-slate-500" /> ICICI Bank Partnered
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
