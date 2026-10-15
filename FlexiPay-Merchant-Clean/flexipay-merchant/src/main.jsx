import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QRCodeSVG } from "qrcode.react";
import {
  Store,
  QrCode,
  Receipt,
  ArrowUpRight,
  Printer,
  Check,
  Search,
  Building2,
  Calendar,
  Volume2,
  VolumeX,
  Tag,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Copy,
  Share2,
  Download,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Clock,
  Plus,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Smartphone,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import "./index.css";

// ----------------------------------------------------
// REALISTIC MERCHANT TRANSACTION DATA (Google Pay Business style)
// ----------------------------------------------------
const INITIAL_TRANSACTIONS = [
  {
    id: "ord_1092",
    customer: "Rahul Sharma",
    upiId: "rahul@flexipay",
    initials: "RS",
    amount: 2500,
    type: "Buy Now, Pay Later",
    date: "Today, 7:32 PM",
    items: "Aashirvaad Atta 5kg, Fortune Oil 1L, Tata Salt, Amul Ghee",
    utr: "429108420192",
    mdr: "₹0.00 (0% Promo)",
    status: "Settled",
    phone: "+91 98201 44821"
  },
  {
    id: "ord_1091",
    customer: "Priya Sharma",
    upiId: "priya@okaxis",
    initials: "PS",
    amount: 850,
    type: "UPI Direct",
    date: "Today, 4:18 PM",
    items: "Cadbury Celebrations, Tropicana Juice, Britannia GoodDay",
    utr: "429108119284",
    mdr: "₹0.00 (Free UPI)",
    status: "Settled",
    phone: "+91 97114 90123"
  },
  {
    id: "ord_1090",
    customer: "Rohan Mehta",
    upiId: "rohan@okhdfcbank",
    initials: "RM",
    amount: 1420,
    type: "Buy Now, Pay Later",
    date: "Today, 1:40 PM",
    items: "Surf Excel 2kg, Dettol Handwash Refill, Vim Bar 3-Pack",
    utr: "429091824712",
    mdr: "₹0.00 (0% Promo)",
    status: "Settled",
    phone: "+91 99820 18273"
  },
  {
    id: "ord_1089",
    customer: "Vikram Malhotra",
    upiId: "vikram@paytm",
    initials: "VM",
    amount: 3200,
    type: "Buy Now, Pay Later",
    date: "Yesterday, 8:15 PM",
    items: "Dry Fruits Gift Box, Ferrero Rocher, Organic Honey 500g",
    utr: "428910492819",
    mdr: "₹0.00 (0% Promo)",
    status: "Settled",
    phone: "+91 98450 77129"
  },
  {
    id: "ord_1088",
    customer: "Ananya Iyer",
    upiId: "ananya@ibl",
    initials: "AI",
    amount: 480,
    type: "UPI Direct",
    date: "Yesterday, 2:30 PM",
    items: "Amul Butter 500g, Brown Bread, Epigamia Yogurt",
    utr: "428201948210",
    mdr: "₹0.00 (Free UPI)",
    status: "Settled",
    phone: "+91 96112 04812"
  }
];

function formatRupee(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

function App() {
  const [tab, setTab] = useState("pos"); // "pos" | "transactions" | "offers" | "qr" | "analytics"
  const [sales, setSales] = useState(18450);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [soundboxEnabled, setSoundboxEnabled] = useState(true);
  const [voiceLang, setVoiceLang] = useState("hi-IN"); // "hi-IN" | "en-IN"
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [settledToast, setSettledToast] = useState(false);

  // POS State
  const [amount, setAmount] = useState("2500");
  const [customer, setCustomer] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [paid, setPaid] = useState(false);
  const [lastPaidMode, setLastPaidMode] = useState("Buy Now, Pay Later");
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [customerDisplayOpen, setCustomerDisplayOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Auto scroll to top on tab change so features are instantly visible without scrolling
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);




  // Quick Cart Items
  const quickItems = [
    { name: "Grocery Essentials", price: 850 },
    { name: "Pooja & Ghee Hamper", price: 1420 },
    { name: "Monthly Super Saver", price: 2500 }
  ];

  // Custom Store Offer Campaign
  const [offer, setOffer] = useState({
    title: "Flat 10% Cashback on Buy Now, Pay Later",
    minSpend: 1000,
    rewardPts: 100,
    cashbackCap: 150
  });

  // Soundbox Voice Announcement
  const announceSoundbox = (amt, forcedLang) => {
    if (!soundboxEnabled) return;
    const lang = forcedLang || voiceLang;
    const text =
      lang === "hi-IN"
        ? `FlexiPay par ${amt} rupaye prapt hue.`
        : `Received ${amt} rupees on FlexiPay.`;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText("sharma@flexipay");
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleGenerate = () => {
    if (!amount || Number(amount) <= 0) return;
    setQrGenerated(true);
    setPaid(false);
  };

  const handleSimulatePayment = (mode = "Buy Now, Pay Later") => {
    const val = Number(amount) || 2500;
    setSales((s) => s + val);
    setLastPaidMode(mode);

    const initials = (customer || "WK")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const newTx = {
      id: "ord_" + Date.now(),
      customer: customer || "Walk-in Customer",
      upiId: mode.includes("Later") ? "rahul@flexipay" : "customer@okaxis",
      initials,
      amount: val,
      type: mode,
      date: "Just now",
      items: "Custom Billing Cart",
      utr: String(Math.floor(400000000000 + Math.random() * 900000000000)),
      mdr: "₹0.00 (0% Promo)",
      status: "Settled",
      phone: customerPhone ? "+91 " + customerPhone : "+91 98201 00000"
    };

    setTransactions((prev) => [newTx, ...prev]);
    setPaid(true);
    announceSoundbox(val);
  };

  const handleInstantSettle = () => {
    setSettledToast(true);
    setTimeout(() => setSettledToast(false), 3000);
  };

  const navItems = [
    { id: "pos", label: "POS & Bill", icon: CreditCard },
    { id: "transactions", label: `Ledger (${transactions.length})`, icon: Receipt },
    { id: "qr", label: "Standee", icon: QrCode },
    { id: "offers", label: "Offers", icon: Tag },
    { id: "analytics", label: "Insights", icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 md:pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* RESPONSIVE TOP HEADER                                */}
      {/* ---------------------------------------------------- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
          
          {/* Store Branding (Mobile-Optimized) */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-sm shrink-0">
              S
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Sharma Super Store
                </h1>
                <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.2 rounded-full border border-emerald-200 shrink-0">
                  <ShieldCheck size={11} className="text-emerald-600" /> Verified
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate mt-0.5">
                <button
                  onClick={handleCopyVpa}
                  className="font-mono text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer shrink-0"
                  title="Click to copy UPI ID"
                >
                  <span>sharma@flexipay</span>
                  <Copy size={10} />
                </button>
                {copiedVpa && <span className="text-emerald-600 font-bold text-[10px]">Copied!</span>}
                <span className="hidden sm:inline">• GSTIN: 27AABCU9603R1ZM</span>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Interactive Soundbox Control */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
              <button
                onClick={() => setSoundboxEnabled((prev) => !prev)}
                className={`p-1.5 sm:px-2 sm:py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                  soundboxEnabled
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-transparent text-slate-400"
                }`}
                title="Toggle Soundbox Speaker"
              >
                {soundboxEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span className="hidden lg:inline">{soundboxEnabled ? "Soundbox On" : "Muted"}</span>
              </button>

              {soundboxEnabled && (
                <>
                  <button
                    onClick={() => setVoiceLang((v) => (v === "hi-IN" ? "en-IN" : "hi-IN"))}
                    className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-bold text-slate-600 hover:bg-slate-200/60 rounded-md transition"
                    title="Toggle voice language"
                  >
                    {voiceLang === "hi-IN" ? "HI" : "EN"}
                  </button>
                  <button
                    onClick={() => announceSoundbox(2500)}
                    className="hidden sm:inline-block px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded-md transition"
                    title="Test Voice Announcement"
                  >
                    🔊 Test
                  </button>
                </>
              )}
            </div>

            {/* Bank Badge (Desktop Only) */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Building2 size={14} className="text-slate-500" />
              <div className="text-left">
                <div className="text-[10px] text-slate-400 leading-tight">Settlement</div>
                <div className="text-xs font-bold text-slate-800 leading-tight">HDFC •••• 9921</div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Hidden on Mobile) */}
        <div className="hidden md:flex max-w-6xl mx-auto px-6 gap-2 border-t border-slate-100 text-sm overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`py-3 px-3.5 font-medium transition border-b-2 -mb-[1px] whitespace-nowrap flex items-center gap-2 ${
                  active
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* MOBILE STICKY BOTTOM NAVIGATION BAR (md:hidden)      */}
      {/* ---------------------------------------------------- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-1.5 px-2 z-40 flex justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                active ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon size={20} className={active ? "text-blue-600 stroke-[2.4]" : "text-slate-400"} />
              <span className="text-[10px] mt-0.5">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* ---------------------------------------------------- */}
      {/* MAIN CONTENT AREA                                    */}
      {/* ---------------------------------------------------- */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 animate-tab-enter space-y-4 sm:space-y-6">
        
        {/* ---------------------------------------------------- */}
        {/* COLLAPSIBLE SUMMARY BANNER (User Reference Pattern)  */}
        {/* ---------------------------------------------------- */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-2.5 sm:p-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            
            {/* Quick Status Chips (Always Visible at 1 Glance, Zero Horizontal Overflow) */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2 sm:px-2.5 py-1 rounded-lg shrink-0">
                Today: {formatRupee(sales)}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 sm:px-2.5 py-1 rounded-lg shrink-0">
                {transactions.length} Orders
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg shrink-0">
                0% MDR (Saved ₹369)
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
                Auto-Settle 7:00 AM
              </span>
            </div>

            {/* Toggle Button [ ^ ] / [ v ] as in user reference */}
            <button
              onClick={() => setSummaryExpanded((prev) => !prev)}
              className="px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1 shrink-0 text-xs font-bold cursor-pointer"
              title={summaryExpanded ? "Collapse Overview Cards" : "Expand Overview Cards"}
            >
              <span className="text-[11px] hidden sm:inline">{summaryExpanded ? "Hide Stats" : "Show Stats"}</span>
              {summaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Expanded Cards & Settlement Banner */}
          {summaryExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-tab-enter">
              {/* Instant Settlement Bar */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50/80 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="text-xs text-slate-700">
                    <strong className="font-semibold text-slate-900">Auto-Settlement:</strong> Tomorrow 7:00 AM to HDFC Bank (•••• 9921)
                  </span>
                </div>
                <button
                  onClick={handleInstantSettle}
                  className="self-stretch sm:self-auto text-center px-3 py-1.5 text-xs font-bold bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100/50 transition cursor-pointer"
                >
                  Settle to Bank Now (Free)
                </button>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-medium text-slate-500">Today's Collections</div>
                  <div className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                    {formatRupee(sales)}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
                    <ArrowUpRight size={12} /> +14.2% vs y'day
                  </div>
                </div>

                <div className="bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-medium text-slate-500">Total Orders</div>
                  <div className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                    {transactions.length} Orders
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {transactions.filter((t) => t.type.includes("Later")).length} BNPL • {transactions.filter((t) => !t.type.includes("Later")).length} UPI
                  </div>
                </div>

                <div className="bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-medium text-slate-500">MDR Charges</div>
                  <div className="text-lg sm:text-2xl font-extrabold text-emerald-600 mt-0.5">
                    ₹0.00
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    0% Fee • Saved ₹369
                  </div>
                </div>

                <div className="bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-medium text-slate-500">Avg Basket</div>
                  <div className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                    {formatRupee(Math.round(sales / Math.max(1, transactions.length)))}
                  </div>
                  <div className="text-[10px] text-purple-700 font-semibold mt-0.5">
                    BNPL avg 2.8x higher
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settlement Toast */}
        {settledToast && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-tab-enter">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            Payout initiated! {formatRupee(sales)} transferred to HDFC Bank A/C ending in 9921.
          </div>
        )}


        {/* ==================================================== */}
        {/* TAB 1: POS CLEAN DYNAMIC COLLECTOR                  */}
        {/* ==================================================== */}
        {tab === "pos" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start">
            
            {/* Left Column: Instant Bill Generator Form */}
            <div className="lg:col-span-7 bg-white p-3.5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">New Store Bill</h2>
                  <p className="text-[10px] sm:text-xs text-slate-500">Dynamic UPI QR with Voice Alert</p>
                </div>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg">
                  Counter #01
                </span>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 block mb-1">
                  Enter Bill Amount (₹)
                </label>
                <div className="flex items-center border-2 border-slate-200 rounded-xl px-3.5 py-1.5 sm:py-2 focus-within:border-blue-600 transition bg-slate-50/50">
                  <span className="text-lg sm:text-2xl font-extrabold text-slate-400 mr-2">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setQrGenerated(false);
                      setPaid(false);
                    }}
                    className="w-full text-lg sm:text-2xl font-extrabold text-slate-900 outline-none bg-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Quick Amount Shortcuts (Thumb-Friendly on Mobile) */}
              <div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {[100, 250, 500, 1000, 2500].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setAmount(String(preset));
                        setQrGenerated(false);
                        setPaid(false);
                      }}
                      className={`py-1.5 sm:py-2 text-xs font-bold rounded-xl border transition ${
                        Number(amount) === preset
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Action Buttons directly in Thumb Reach */}
              <div className="pt-0.5 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={!amount || Number(amount) <= 0}
                  className="flex-1 py-2.5 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <QrCode size={16} />
                  Generate Payment QR ({formatRupee(Number(amount))})
                </button>

                <button
                  onClick={() => setCustomerDisplayOpen(true)}
                  className="py-2.5 sm:py-3 px-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Show Fullscreen QR to Customer"
                >
                  <Maximize2 size={15} />
                  <span>Customer Standee</span>
                </button>
              </div>

              {/* Collapsible Combos & Customer Details */}
              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full text-left text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-between cursor-pointer py-1"
                >
                  <span>{showDetails ? "▲ Hide Combos & Customer Note" : "▼ + Add Store Combos or Customer Note"}</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </button>

                {(showDetails || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
                  <div className="space-y-2.5 pt-2 animate-tab-enter">
                    {/* Popular Combos */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Popular Store Combos
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {quickItems.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setAmount(String(item.price));
                              setCustomer(item.name);
                              setQrGenerated(false);
                              setPaid(false);
                            }}
                            className="p-1.5 text-left rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition group"
                          >
                            <div className="text-[10px] font-semibold text-slate-800 truncate group-hover:text-blue-700">
                              {item.name}
                            </div>
                            <div className="text-xs font-extrabold text-slate-900 mt-0.5">
                              {formatRupee(item.price)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                        placeholder="Customer Name (Optional)"
                      />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                        placeholder="Customer Mobile (Optional)"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Payment QR & Standee (Responsive Box) */}
            <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
              
              {qrGenerated ? (
                <div className="w-full space-y-3.5 animate-tab-enter">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-700">Dynamic Payment QR</span>
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Ready to Scan
                    </span>
                  </div>

                  <div className="p-3 sm:p-4 bg-white border-2 border-slate-200 rounded-2xl inline-block shadow-sm">
                    <QRCodeSVG
                      value={`upi://pay?pa=sharma@flexipay&pn=Sharma%20Super%20Store&am=${amount}&cu=INR`}
                      size={180}
                    />
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {formatRupee(Number(amount))}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">
                      {customer} • {customerPhone ? "+91 " + customerPhone : "Walk-in"}
                    </div>
                  </div>

                  {!paid ? (
                    <div className="space-y-2 pt-1 w-full max-w-sm mx-auto">
                      <button
                        onClick={() => handleSimulatePayment("Buy Now, Pay Later")}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={14} /> Simulate Customer Paying via BNPL
                      </button>

                      <button
                        onClick={() => handleSimulatePayment("UPI Direct")}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        Simulate Customer Paying via UPI Direct
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-2 animate-tab-enter">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                        <CheckCircle2 size={16} className="text-emerald-600" /> Payment Received!
                      </div>
                      <div className="text-xs text-emerald-700">
                        {formatRupee(Number(amount))} via {lastPaidMode}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            setQrGenerated(false);
                            setPaid(false);
                            setAmount("1000");
                          }}
                          className="flex-1 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800"
                        >
                          New Bill
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-100"
                        >
                          Print Slip
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400">
                    Supports Google Pay, PhonePe, Paytm, BHIM & FlexiPay
                  </div>
                </div>
              ) : (
                /* Active Standee Preview when no custom amount is generated yet */
                <div className="w-full space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-700">Counter Standee Ready</span>
                    <span className="text-[11px] font-semibold text-slate-400">Open QR</span>
                  </div>

                  <div className="p-3 sm:p-4 bg-white border border-slate-200 rounded-2xl inline-block shadow-xs">
                    <QRCodeSVG
                      value="upi://pay?pa=sharma@flexipay&pn=Sharma%20Super%20Store&cu=INR"
                      size={160}
                    />
                  </div>

                  <div>
                    <div className="text-sm sm:text-base font-bold text-slate-900">Sharma Super Store</div>
                    <div className="text-[11px] font-mono text-slate-500">sharma@flexipay</div>
                  </div>

                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Customers can scan this anytime to enter any amount.
                  </p>

                  <button
                    onClick={() => {
                      setAmount("2500");
                      setQrGenerated(true);
                      setPaid(false);
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Quick Bill ₹2,500
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: TRANSACTIONS (Responsive Table + Mobile Cards) */}
        {/* ==================================================== */}
        {tab === "transactions" && (
          <TransactionsTab
            transactions={transactions}
            onSelectReceipt={(tx) => setSelectedReceipt(tx)}
          />
        )}

        {/* ==================================================== */}
        {/* TAB 3: CUSTOMER OFFERS                               */}
        {/* ==================================================== */}
        {tab === "offers" && <OffersTab offer={offer} setOffer={setOffer} />}

        {/* ==================================================== */}
        {/* TAB 4: COUNTER STANDEE                               */}
        {/* ==================================================== */}
        {tab === "qr" && <StandeeTab onOpenDisplay={() => setCustomerDisplayOpen(true)} />}

        {/* ==================================================== */}
        {/* TAB 5: BUSINESS INSIGHTS                             */}
        {/* ==================================================== */}
        {tab === "analytics" && (
          <AnalyticsTab transactions={transactions} sales={sales} />
        )}

      </main>

      {/* ---------------------------------------------------- */}
      {/* FULLSCREEN CUSTOMER DISPLAY STANDBY MODAL            */}
      {/* ---------------------------------------------------- */}
      {customerDisplayOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setCustomerDisplayOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10"
          >
            <X size={24} />
          </button>

          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl animate-tab-enter">
            <div className="bg-blue-600 -mx-6 -mt-6 p-4 rounded-t-3xl text-white">
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">Scan to Pay</div>
              <div className="text-xl font-black mt-0.5">Sharma Super Store</div>
            </div>

            <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl inline-block shadow-sm">
              <QRCodeSVG
                value={
                  qrGenerated && amount
                    ? `upi://pay?pa=sharma@flexipay&pn=Sharma%20Super%20Store&am=${amount}&cu=INR`
                    : `upi://pay?pa=sharma@flexipay&pn=Sharma%20Super%20Store&cu=INR`
                }
                size={220}
              />
            </div>

            <div>
              {qrGenerated && amount ? (
                <div className="text-3xl font-black text-slate-900">{formatRupee(Number(amount))}</div>
              ) : (
                <div className="text-base font-bold text-slate-700">Open Payment Standee</div>
              )}
              <div className="text-xs font-mono text-slate-500 mt-0.5">UPI ID: sharma@flexipay</div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-semibold">
              <span className="px-1.5 py-0.5 bg-slate-100 rounded">GPay</span>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded">PhonePe</span>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded">Paytm</span>
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">FlexiPay</span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MOBILE-RESPONSIVE TAX INVOICE MODAL (Bottom Sheet)   */}
      {/* ---------------------------------------------------- */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-tab-enter max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Sharma Super Store Invoice</h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedReceipt.id}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4 text-center">
              <div className="text-3xl font-extrabold text-slate-900">
                {formatRupee(selectedReceipt.amount)}
              </div>
              <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 size={13} /> Settled to HDFC Bank (•••• 9921)
              </p>
            </div>

            <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 text-xs border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer</span>
                <span className="font-semibold text-slate-900">{selectedReceipt.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone</span>
                <span className="font-mono text-slate-700">{selectedReceipt.phone || "+91 98201 •••••"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Items Purchased</span>
                <span className="font-medium text-slate-800 text-right max-w-[190px] truncate">
                  {selectedReceipt.items || "General Store Purchases"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode</span>
                <span className={`font-semibold ${selectedReceipt.type.includes("Later") ? "text-purple-700" : "text-blue-700"}`}>
                  {selectedReceipt.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank UTR</span>
                <span className="font-mono text-slate-700">{selectedReceipt.utr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MDR Fee</span>
                <span className="font-semibold text-emerald-700">{selectedReceipt.mdr || "₹0.00 (Free)"}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
              >
                <Printer size={14} /> Print Invoice
              </button>
              <button
                onClick={() => {
                  alert(`Invoice link sent via WhatsApp to ${selectedReceipt.customer}`);
                }}
                className="py-2.5 px-3 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-1"
              >
                <Share2 size={14} /> WhatsApp
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="py-2.5 px-3 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// TRANSACTIONS TAB WITH MOBILE CARDS + DESKTOP TABLE
// ----------------------------------------------------
function TransactionsTab({ transactions, onSelectReceipt }) {
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // "all" | "bnpl" | "upi"

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.customer.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase()) ||
      t.utr.includes(search);

    if (!matchesSearch) return false;
    if (filterMode === "bnpl") return t.type.includes("Later");
    if (filterMode === "upi") return !t.type.includes("Later");
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Header with Search and Filter Pills */}
      <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">Payment History & Settlement</h2>
          <p className="text-[11px] sm:text-xs text-slate-500">Live ledger of incoming payments</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer, UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-600 w-full"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3.5 sm:px-5 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs overflow-x-auto no-scrollbar gap-2">
        <div className="flex gap-1.5 shrink-0">
          {[
            { id: "all", label: `All (${transactions.length})` },
            { id: "bnpl", label: "Buy Now, Pay Later" },
            { id: "upi", label: "UPI Direct" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                filterMode === f.id
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => alert("Statement exported for FY 2026-27")}
          className="text-blue-600 text-[11px] font-semibold hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Download size={12} /> Export CSV
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MOBILE LIST VIEW (Native Mobile Cards - md:hidden)   */}
      {/* ---------------------------------------------------- */}
      <div className="md:hidden divide-y divide-slate-100">
        {filtered.map((tx) => (
          <div
            key={tx.id}
            onClick={() => onSelectReceipt(tx)}
            className="p-3.5 flex items-center justify-between active:bg-slate-50 cursor-pointer transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                {tx.initials || "TX"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{tx.customer}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                      tx.type.includes("Later")
                        ? "bg-purple-50 text-purple-700 border border-purple-100"
                        : "bg-blue-50 text-blue-700 border border-blue-100"
                    }`}
                  >
                    {tx.type}
                  </span>
                  <span className="text-[10px] text-slate-400">{tx.date}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 ml-2">
              <div className="text-sm font-extrabold text-slate-900">{formatRupee(tx.amount)}</div>
              <div className="text-[10px] font-semibold text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                ● Settled
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---------------------------------------------------- */}
      {/* DESKTOP TABLE VIEW (hidden md:block)                 */}
      {/* ---------------------------------------------------- */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Mode</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Bank UTR</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filtered.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => onSelectReceipt(tx)}
                className="hover:bg-slate-50/80 cursor-pointer transition"
              >
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900">{tx.customer}</div>
                  <div className="text-[11px] text-slate-400">{tx.upiId}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      tx.type.includes("Later")
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {tx.type}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">
                  {formatRupee(tx.amount)}
                </td>
                <td className="px-5 py-3.5 text-slate-500">{tx.date}</td>
                <td className="px-5 py-3.5 font-mono text-slate-500">{tx.utr}</td>
                <td className="px-5 py-3.5">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200 text-[11px]">
                    ● {tx.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-blue-600 font-semibold hover:underline">View Slip →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// OFFERS TAB (Mobile Responsive)
// ----------------------------------------------------
function OffersTab({ offer, setOffer }) {
  const [title, setTitle] = useState(offer.title);
  const [minSpend, setMinSpend] = useState(offer.minSpend);
  const [cashbackCap, setCashbackCap] = useState(offer.cashbackCap);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setOffer({
      title,
      minSpend: Number(minSpend),
      cashbackCap: Number(cashbackCap),
      rewardPts: 100
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-sm sm:text-base font-bold text-slate-900">Customer Promotional Offer</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Reward customers who choose Buy Now, Pay Later to drive higher cart sizes at your store.
        </p>
      </div>

      <div className="space-y-3.5">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Offer Campaign Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Minimum Bill Spend (₹)
            </label>
            <input
              type="number"
              value={minSpend}
              onChange={(e) => setMinSpend(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Max Cashback Cap (₹)
            </label>
            <input
              type="number"
              value={cashbackCap}
              onChange={(e) => setCashbackCap(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
        >
          {saved ? "✓ Campaign Updated Successfully" : "Update Store Offer"}
        </button>
      </div>

      {/* Live Consumer App Simulation Preview */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-2">
        <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={12} /> Live Preview on FlexiPay Consumer App
        </span>
        <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              %
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 truncate">{title}</div>
              <div className="text-[10px] text-slate-500 truncate">
                Orders &gt; {formatRupee(minSpend)} • Cap {formatRupee(cashbackCap)}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded shrink-0">
            Applied
          </span>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// AUTHENTIC COUNTER STANDEE VIEW (Responsive Standee)
// ----------------------------------------------------
function StandeeTab({ onOpenDisplay }) {
  return (
    <div className="max-w-md mx-auto space-y-4 text-center">
      
      {/* Physical Standee Card with Indian UPI Aesthetic */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        
        {/* Top Standee Header Banner */}
        <div className="bg-blue-600 -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 p-4 text-white mb-5">
          <div className="text-[10px] sm:text-xs font-bold tracking-wider uppercase opacity-90">Accepted Here</div>
          <div className="text-base sm:text-lg font-black tracking-tight mt-0.5">UPI • Buy Now, Pay Later</div>
        </div>

        {/* QR Code Container */}
        <div className="p-3 sm:p-4 bg-white border-2 border-slate-200 rounded-2xl inline-block shadow-sm">
          <QRCodeSVG
            value="upi://pay?pa=sharma@flexipay&pn=Sharma%20Super%20Store&cu=INR"
            size={190}
          />
        </div>

        {/* Store Title & VPA */}
        <div className="mt-3">
          <div className="text-base sm:text-lg font-extrabold text-slate-900">Sharma Super Store</div>
          <div className="text-xs font-mono font-semibold text-slate-600 mt-0.5">sharma@flexipay</div>
        </div>

        {/* Supported UPI Apps Row */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 sm:gap-2.5 text-[10px] text-slate-500 font-semibold flex-wrap">
          <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200">GPay</span>
          <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200">PhonePe</span>
          <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200">Paytm</span>
          <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200">BHIM</span>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 font-bold">FlexiPay</span>
        </div>
      </div>

      {/* Standee Actions */}
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <button
          onClick={onOpenDisplay}
          className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Smartphone size={15} /> Use Phone as Live Standee
        </button>
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Printer size={15} /> Print Physical Standee
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ANALYTICS & BUSINESS INSIGHTS TAB (Responsive Grid)
// ----------------------------------------------------
function AnalyticsTab({ transactions, sales }) {
  const bnplCount = transactions.filter((t) => t.type.includes("Later")).length;
  const upiCount = transactions.length - bnplCount;
  const bnplSales = transactions
    .filter((t) => t.type.includes("Later"))
    .reduce((acc, t) => acc + t.amount, 0);
  const upiSales = sales - bnplSales;

  return (
    <div className="space-y-4 sm:space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Payment Mode Share Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">Collections Breakdown</h3>
          <p className="text-xs text-slate-500">Distribution of store volume by customer payment mode</p>

          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-purple-700">Buy Now, Pay Later</span>
                <span className="text-slate-900">
                  {formatRupee(bnplSales)} ({Math.round((bnplSales / Math.max(1, sales)) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${(bnplSales / Math.max(1, sales)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-700">UPI Direct</span>
                <span className="text-slate-900">
                  {formatRupee(upiSales)} ({Math.round((upiSales / Math.max(1, sales)) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(upiSales / Math.max(1, sales)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-[11px] sm:text-xs text-purple-900">
            <strong>Key Insight:</strong> Customers who opt for <strong>Buy Now, Pay Later</strong> have an average cart size of {formatRupee(Math.round(bnplSales / Math.max(1, bnplCount)))}, compared to {formatRupee(Math.round(upiSales / Math.max(1, upiCount)))} on UPI Direct.
          </div>
        </div>

        {/* Bank Settlements Log */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Recent Bank Payouts</h3>
            <span className="text-xs text-slate-400 font-medium">HDFC •••• 9921</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">Auto Payout • 7:00 AM</div>
                <div className="text-[10px] text-slate-400 font-mono">UTR: 428901824719</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">₹24,190</div>
                <div className="text-emerald-600 font-semibold text-[10px]">Settled</div>
              </div>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">Auto Payout • Yesterday</div>
                <div className="text-[10px] text-slate-400 font-mono">UTR: 428190412801</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">₹16,840</div>
                <div className="text-emerald-600 font-semibold text-[10px]">Settled</div>
              </div>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">Instant Settle • 13 Oct</div>
                <div className="text-[10px] text-slate-400 font-mono">UTR: 427918204918</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">₹9,450</div>
                <div className="text-emerald-600 font-semibold text-[10px]">Settled</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ROOT MOUNT
// ----------------------------------------------------
const container = document.getElementById("root");
if (!window.__merchant_root) {
  window.__merchant_root = createRoot(container);
}
window.__merchant_root.render(<App />);
