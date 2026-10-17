import React, { useState } from "react";
import {
  Building2,
  Store,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Banknote,
  CreditCard,
  MapPin,
  Tag,
  Phone,
  FileText,
  Lock,
  ArrowLeft,
  X
} from "lucide-react";

const CATEGORIES = [
  { id: "grocery", label: "Grocery & Supermarket", icon: Store },
  { id: "pharmacy", label: "Pharmacy & Healthcare", icon: ShieldCheck },
  { id: "restaurant", label: "Cafe & Restaurant", icon: Tag },
  { id: "electronics", label: "Electronics & Mobile", icon: CreditCard },
  { id: "apparel", label: "Fashion & Retail", icon: Tag },
  { id: "services", label: "Salon & Services", icon: Sparkles }
];

const BANKS = [
  { id: "hdfc", name: "HDFC Bank", ifscPrefix: "HDFC000" },
  { id: "icici", name: "ICICI Bank", ifscPrefix: "ICIC000" },
  { id: "sbi", name: "State Bank of India", ifscPrefix: "SBIN000" },
  { id: "axis", name: "Axis Bank", ifscPrefix: "UTIB000" },
  { id: "kotak", name: "Kotak Mahindra Bank", ifscPrefix: "KKBK000" }
];

export default function MerchantOnboardingFlow({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);

  // Step 1: Store & Business Details
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("grocery");
  const [city, setCity] = useState("Mumbai");
  const [gstin, setGstin] = useState("27AABCU" + Math.floor(1000 + Math.random() * 9000) + "R1ZM");

  // Step 2: Settlement Bank Account
  const [bankId, setBankId] = useState("hdfc");
  const [accountNumber, setAccountNumber] = useState("9821" + Math.floor(100000 + Math.random() * 900000));
  const [ifsc, setIfsc] = useState("HDFC0000240");
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [bankVerified, setBankVerified] = useState(false);

  // Step 3: Credit Line Sanction
  const [sanctionedLimit, setSanctionedLimit] = useState(200000);

  const selectedBank = BANKS.find((b) => b.id === bankId) || BANKS[0];

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert("Please enter your Store Trade Name");
      return;
    }
    if (!ownerName.trim()) {
      alert("Please enter Owner Full Name");
      return;
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    setStep(2);
  };

  const handleVerifyBank = () => {
    if (!accountNumber || accountNumber.length < 8) {
      alert("Please enter a valid Bank Account Number");
      return;
    }
    setIsVerifyingBank(true);
    setTimeout(() => {
      setIsVerifyingBank(false);
      setBankVerified(true);
    }, 1200);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    if (!bankVerified) {
      // Auto-verify if user proceeds
      setBankVerified(true);
    }
    setStep(3);
  };

  const handleFinishOnboarding = () => {
    const cleanId = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 15) || "store";

    const vpa = `${cleanId}@flexipay`;

    const newMerchant = {
      id: "store_" + Date.now(),
      slug: cleanId,
      name: storeName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.startsWith("+91") ? phone : "+91 " + phone,
      category: category,
      city: city,
      gstin: gstin.toUpperCase(),
      vpa: vpa,
      bank: {
        bankName: selectedBank.name,
        accountNumber: accountNumber,
        maskedAccount: "•••• " + accountNumber.slice(-4),
        ifsc: ifsc.toUpperCase()
      },
      creditLimit: sanctionedLimit,
      initialSales: 0,
      initialUnsettled: 0,
      onboardingDate: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    };

    onComplete(newMerchant);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden my-auto animate-tab-enter">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 sm:p-6 relative">
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          )}

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-orange-500/20 text-[#F47920] border border-orange-500/30">
              Merchant Digital Onboarding
            </span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              ● RBI Master Directions Compliant
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Register Your Business on FlexiPay
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Accept UPI & 45-Day FlexiPay BNPL payments with zero MDR & instant audio soundbox.
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-1.5">
                <div
                  className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                    s <= step ? "bg-[#F47920]" : "bg-slate-700"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-7 space-y-5">
          
          {/* ---------------------------------------------------- */}
          {/* STEP 1: BUSINESS & TRADE IDENTITY                    */}
          {/* ---------------------------------------------------- */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4 animate-tab-enter">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Store size={16} className="text-[#F47920]" />
                  <span>Step 1: Store & Owner Information</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter legal trade details for digital QR generation and tax receipts.
                </p>
              </div>

              {/* Store Trade Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Store / Business Trade Name *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Rutuja Medicos & Pharmacy"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-[#F47920] focus:ring-1 focus:ring-[#F47920]"
                />
              </div>

              {/* Owner Full Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Owner Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Rutuja Sonawane"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#F47920]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mobile Number (Soundbox SMS) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#F47920]"
                  />
                </div>
              </div>

              {/* Business Category Grid */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Business Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? "border-[#F47920] bg-orange-50 text-[#F47920] font-bold shadow-2xs"
                            : "border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <Icon size={14} className={isSelected ? "text-[#F47920]" : "text-slate-400"} />
                        <span className="text-[11px] truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* City & GSTIN / MSME */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    City / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune, Maharashtra"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#F47920]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      GSTIN / MSME Udyam
                    </label>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <ShieldCheck size={11} /> GSTN Verified
                    </span>
                  </div>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="27AABCU9603R1ZM"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none uppercase font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#F47920] hover:bg-[#E06710] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Bank Settlement</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ---------------------------------------------------- */}
          {/* STEP 2: SETTLEMENT BANK ACCOUNT & VPA                */}
          {/* ---------------------------------------------------- */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4 animate-tab-enter">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 size={16} className="text-[#F47920]" />
                    <span>Step 2: Bank Payout Account</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Collections will be automatically settled via NEFT/IMPS to this account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              </div>

              {/* Settlement Bank Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Choose Settlement Bank *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BANKS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBankId(b.id);
                        setIfsc(b.ifscPrefix + "0240");
                        setBankVerified(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        bankId === b.id
                          ? "border-[#F47920] bg-orange-50 text-[#F47920] font-bold"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <div className="text-xs truncate">{b.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Number & IFSC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setBankVerified(false);
                    }}
                    placeholder="Enter A/C Number"
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl outline-none focus:border-[#F47920]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Bank IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0000240"
                    className="w-full px-3.5 py-2.5 text-xs font-mono uppercase border border-slate-200 rounded-xl outline-none focus:border-[#F47920]"
                  />
                </div>
              </div>

              {/* Penny-Drop Verification Simulation */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-slate-900">
                      Penny-Drop Verification (NPCI IMPS)
                    </span>
                  </div>
                  {bankVerified ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Account Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleVerifyBank}
                      disabled={isVerifyingBank}
                      className="text-xs font-bold text-[#F47920] hover:underline cursor-pointer"
                    >
                      {isVerifyingBank ? "Verifying..." : "Verify A/C Now"}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {bankVerified
                    ? `✓ Penny drop of ₹1.00 succeeded. Beneficiary name matched: ${ownerName || storeName}.`
                    : "Simulates instant ₹1.00 credit to ensure settlement route is active."}
                </p>
              </div>

              {/* Auto-Generated UPI VPA Preview */}
              <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Generated Store UPI VPA
                  </div>
                  <div className="text-xs font-mono font-extrabold text-[#F47920]">
                    {(storeName.toLowerCase().replace(/[^a-z0-9]/g, "") || "store") + "@flexipay"}
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 bg-white px-2 py-1 rounded-lg border border-orange-200 font-bold">
                  Zero MDR Rail
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#F47920] hover:bg-[#E06710] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Approve & Sanction Credit Line</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ---------------------------------------------------- */}
          {/* STEP 3: SANCTION WORKING CAPITAL LINE & LAUNCH      */}
          {/* ---------------------------------------------------- */}
          {step === 3 && (
            <div className="space-y-4 animate-tab-enter text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Business Onboarding Approved!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {storeName} is fully registered with zero MDR billing and Cloud Soundbox enabled.
                </p>
              </div>

              {/* Sanctioned Credit Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl text-left space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-widest">
                    Pre-Sanctioned MSME Credit Line
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400">
                    ● Equitas SFB
                  </span>
                </div>

                <div className="text-3xl font-black">
                  ₹{Number(sanctionedLimit).toLocaleString("en-IN")}
                </div>

                <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Settlement Route</span>
                    <span className="font-bold">{selectedBank.name} •••• {accountNumber.slice(-4)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Store UPI VPA</span>
                    <span className="font-mono text-[#F47920] font-bold truncate block">
                      {(storeName.toLowerCase().replace(/[^a-z0-9]/g, "") || "store") + "@flexipay"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features ready */}
              <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-1.5 text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Dynamic QR code ready with instant invoice matching</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Cloud Soundbox active (Standard Hindi, Amitabh Bachchan style & English)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Role Permissions: Switch between Cashier and Owner modes anytime</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="w-full py-3.5 bg-[#F47920] hover:bg-[#E06710] text-white font-extrabold rounded-xl text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <Store size={18} />
                <span>Launch {storeName} POS Terminal</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
