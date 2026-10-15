import React, { useState, useEffect, Component } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, useNavigate, useLocation } from "react-router-dom";
import {
  QrCode,
  Scan,
  ArrowLeft,
  Check,
  Building2,
  Clock,
  ChevronRight,
  User,
  History,
  Copy,
  Search,
  ArrowUpRight,
  Gift,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Tag,
  AlertCircle,
  Share2,
  ExternalLink
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import "./index.css";

// ----------------------------------------------------
// ERROR BOUNDARY (Zero Blank Screen Guarantee)
// ----------------------------------------------------
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center font-sans">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 max-w-sm shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-base font-bold text-gray-900">App Encountered an Issue</h2>
            <p className="text-xs text-gray-500">
              Clear local cached state and reload to resume.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 bg-[#F47920] text-white rounded-xl text-xs font-semibold hover:bg-[#E06710] transition"
            >
              Reset Data & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ----------------------------------------------------
// TRANSACTION NORMALIZER (Protects against schema mismatches)
// ----------------------------------------------------
function normalizeTx(tx) {
  if (!tx || typeof tx !== "object") return null;
  const merchant = tx.merchant || "Merchant";
  const mode = tx.mode || tx.type || "Buy Now, Pay Later";
  const initials =
    tx.initials ||
    merchant
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "TX";

  return {
    id: tx.id || "tx_" + Math.random(),
    merchant,
    upiId: tx.upiId || tx.vpa || "store@upi",
    initials,
    amount: Number(tx.amount) || 0,
    date: tx.date || tx.time || "Recently",
    mode,
    utr: String(tx.utr || "429108420192"),
    status: tx.status || "Completed",
    rewardEarned: Number(tx.rewardEarned) || (mode.includes("Later") ? 25 : 5)
  };
}

const INITIAL_TRANSACTIONS = [
  {
    id: "tx_101",
    merchant: "Sharma Super Store",
    upiId: "sharma@flexipay",
    initials: "SS",
    amount: 2500,
    date: "Today, 7:32 PM",
    mode: "Buy Now, Pay Later",
    utr: "429108420192",
    status: "Completed",
    rewardEarned: 25
  },
  {
    id: "tx_102",
    merchant: "Zepto Groceries",
    upiId: "zepto@icici",
    initials: "ZG",
    amount: 840,
    date: "Today, 3:15 PM",
    mode: "Buy Now, Pay Later",
    utr: "429108119284",
    status: "Completed",
    rewardEarned: 10
  },
  {
    id: "tx_103",
    merchant: "Swiggy",
    upiId: "swiggy@axisbank",
    initials: "SW",
    amount: 420,
    date: "Yesterday, 8:45 PM",
    mode: "HDFC Bank •••• 4812",
    utr: "429091824712",
    status: "Completed",
    rewardEarned: 5
  },
  {
    id: "tx_104",
    merchant: "Apollo Pharmacy",
    upiId: "apollopharmacy@hdfcbank",
    initials: "AP",
    amount: 610,
    date: "13 Oct 2026",
    mode: "Buy Now, Pay Later",
    utr: "428910492819",
    status: "Completed",
    rewardEarned: 8
  },
  {
    id: "tx_105",
    merchant: "Croma Retail",
    upiId: "croma@kotak",
    initials: "CR",
    amount: 4200,
    date: "08 Oct 2026",
    mode: "Buy Now, Pay Later",
    utr: "428201948210",
    status: "Completed",
    rewardEarned: 50
  }
].map(normalizeTx);

function formatRupee(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const [creditLimit] = useState(25000);
  const [credit, setCredit] = useState(() => {
    const saved = localStorage.getItem("flexiCredit");
    const num = Number(saved);
    return isNaN(num) || num <= 0 ? 22500 : num;
  });

  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem("flexiPoints");
    const num = Number(saved);
    return isNaN(num) ? 2450 : num;
  });

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem("flexiTx");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeTx).filter(Boolean);
        }
      }
    } catch (e) {
      console.warn("Resetting flexiTx cache:", e);
    }
    return INITIAL_TRANSACTIONS;
  });

  // Active Flow State
  const [amount, setAmount] = useState(2500);
  const [merchant, setMerchant] = useState("Sharma Super Store");
  const [vpa, setVpa] = useState("sharma@flexipay");
  const [method, setMethod] = useState("later"); // "later" | "bank"
  const [repayModal, setRepayModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // Cross-App Synchronization Bus (BroadcastChannel + LocalStorage Event)
  const [activeOffer, setActiveOffer] = useState(() => {
    try {
      const savedOffer = localStorage.getItem("flexiMerchantOffer");
      if (savedOffer) return JSON.parse(savedOffer);
    } catch (e) {
      console.warn("Failed reading cached offer:", e);
    }
    return {
      title: "Sharma Super Store Offer",
      subtitle: "Flat 10% Cashback on Pay Later",
      minSpend: 1000
    };
  });

  // Listen for Merchant App updates (e.g. dynamic bills, offers, remote resets)
  useEffect(() => {
    let channel = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("flexipay_bus");
        channel.onmessage = (event) => {
          if (!event || !event.data) return;
          const { type, payload } = event.data;
          if (type === "OFFER_UPDATED" && payload) {
            setActiveOffer({
              title: payload.title || "Store Special Offer",
              subtitle: `Orders above ₹${payload.minSpend || 1000} • Cap ₹${payload.cashbackCap || 150}`,
              minSpend: payload.minSpend || 1000
            });
          }
          if (type === "POS_BILL_GENERATED" && payload) {
            if (payload.amount) setAmount(Number(payload.amount));
            if (payload.merchant) setMerchant(payload.merchant);
            if (payload.vpa) setVpa(payload.vpa);
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel initialization error:", e);
    }

    const handleStorageEvent = (e) => {
      if (e.key === "flexiMerchantOffer" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setActiveOffer({
            title: parsed.title || "Store Special Offer",
            subtitle: `Orders above ₹${parsed.minSpend || 1000} • Cap ₹${parsed.cashbackCap || 150}`,
            minSpend: parsed.minSpend || 1000
          });
        } catch (err) {
          console.warn("Storage event parse error:", err);
        }
      }
      if (e.key === "flexiPosBill" && e.newValue) {
        try {
          const bill = JSON.parse(e.newValue);
          if (bill.amount) setAmount(Number(bill.amount));
          if (bill.merchant) setMerchant(bill.merchant);
          if (bill.vpa) setVpa(bill.vpa);
        } catch (err) {
          console.warn("Storage bill parse error:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem("flexiCredit", String(credit));
      localStorage.setItem("flexiPoints", String(points));
      localStorage.setItem("flexiTx", JSON.stringify(transactions));
    } catch (e) {
      console.error("Storage save failed:", e);
    }
  }, [credit, points, transactions]);

  // Execute payment & Broadcast to Merchant App
  const handlePay = () => {
    let modeText = "Buy Now, Pay Later";
    if (method === "hdfc") modeText = "HDFC Bank •••• 4812";
    if (method === "sbi") modeText = "SBI •••• 8912";

    const rawTx = {
      id: "tx_" + Date.now(),
      merchant: merchant || "Sharma Super Store",
      upiId: vpa || "sharma@flexipay",
      initials: (merchant || "SS")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      amount: amount,
      date: "Just now",
      mode: modeText,
      utr: String(Math.floor(400000000000 + Math.random() * 900000000000)),
      status: "Completed",
      rewardEarned: method === "later" ? 25 : 5
    };

    const newTx = normalizeTx(rawTx);

    if (method === "later") {
      setCredit((c) => Math.max(0, c - amount));
      setPoints((p) => p + 25);
    } else {
      setPoints((p) => p + 5);
    }

    setTransactions((prev) => [newTx, ...prev]);

    // Broadcast payment completion to Merchant App (via Relay Server + BroadcastChannel)
    try {
      const syncPayload = {
        amount: Number(amount),
        customer: "Rahul Sharma",
        upiId: "rahul@flexipay",
        mode: modeText,
        utr: newTx.utr,
        timestamp: Date.now()
      };

      console.log("[Customer Pay] Broadcasting payment:", syncPayload);

      // 1. Send via local HTTP sync relay (crosses localhost port boundary 5173 -> 5174 seamlessly)
      fetch("http://localhost:4000/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncPayload)
      }).then(r => r.json()).then(res => {
        console.log("[Customer Pay] Synced to Relay Server successfully:", res);
      }).catch(err => {
        console.warn("[Customer Pay] Relay Server fetch skipped/offline:", err);
      });

      // 2. Storage bus trigger
      localStorage.removeItem("flexiLastSyncPayment");
      localStorage.setItem("flexiLastSyncPayment", JSON.stringify(syncPayload));

      // 3. BroadcastChannel trigger
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("flexipay_bus");
        bc.postMessage({ type: "PAYMENT_COMPLETED", payload: syncPayload });
        setTimeout(() => {
          try { bc.close(); } catch (err) {}
        }, 1000);
      }
    } catch (e) {
      console.warn("Cross-app broadcast error:", e);
    }

    navigate("/success");
  };

  // Repay dues
  const handleRepay = () => {
    const due = creditLimit - credit;
    if (due <= 0) return;
    setCredit(creditLimit);
    setPoints((p) => p + 50);

    const newTx = normalizeTx({
      id: "tx_" + Date.now(),
      merchant: "FlexiPay Bill Settlement",
      upiId: "repay@flexipay",
      initials: "FP",
      amount: due,
      date: "Just now",
      mode: "HDFC Bank •••• 4812",
      utr: String(Math.floor(400000000000 + Math.random() * 900000000000)),
      status: "Completed",
      rewardEarned: 50
    });

    setTransactions((prev) => [newTx, ...prev]);
    setRepayModal(false);
  };

  const navItems = [
    { path: "/", label: "Home", icon: Building2 },
    { path: "/history", label: "Activity", icon: History },
    { path: "/rewards", label: "Rewards", icon: Gift },
    { path: "/profile", label: "Profile", icon: User }
  ];

  return (
    <div className="min-h-screen bg-white sm:bg-gray-100 flex justify-center font-sans">
      
      {/* Clean Device Container */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col sm:shadow-lg sm:border-x sm:border-gray-200">
        
        {/* Simple Minimal Top Bar */}
        <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-20">
          {location.pathname === "/" ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#002855] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                R
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">Rahul Sharma</div>
                <div className="text-xs text-gray-500">rahul@flexipay</div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-gray-700 hover:text-black flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-semibold">
                {location.pathname === "/scan"
                  ? "Scan QR"
                  : location.pathname === "/pay"
                  ? "Confirm Payment"
                  : location.pathname === "/success"
                  ? "Receipt"
                  : location.pathname === "/rewards"
                  ? "Rewards"
                  : location.pathname === "/profile"
                  ? "Profile"
                  : location.pathname === "/qr"
                  ? "My QR"
                  : "Activity"}
              </span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/qr")}
              className="p-2 text-gray-600 hover:bg-orange-50 hover:text-[#F47920] rounded-full transition"
              title="My QR"
            >
              <QrCode size={20} />
            </button>
          </div>
        </header>

        {/* View Routing */}
        <main className="flex-1 px-5 py-5 pb-24">
          {location.pathname === "/" && (
            <HomeView
              credit={credit}
              creditLimit={creditLimit}
              transactions={transactions}
              points={points}
              activeOffer={activeOffer}
              navigate={navigate}
              onSelectTx={(tx) => setSelectedTx(tx)}
              onRepayClick={() => setRepayModal(true)}
            />
          )}

          {location.pathname === "/scan" && (
            <ScanView
              amount={amount}
              setAmount={setAmount}
              merchant={merchant}
              setMerchant={setMerchant}
              setVpa={setVpa}
              navigate={navigate}
            />
          )}

          {location.pathname === "/pay" && (
            <PaymentView
              amount={amount}
              merchant={merchant}
              vpa={vpa}
              credit={credit}
              method={method}
              setMethod={setMethod}
              onPay={handlePay}
            />
          )}

          {location.pathname === "/success" && (
            <SuccessView
              amount={amount}
              merchant={merchant}
              vpa={vpa}
              method={method}
              navigate={navigate}
            />
          )}

          {location.pathname === "/qr" && <MyQrView />}

          {location.pathname === "/rewards" && (
            <RewardsView points={points} setPoints={setPoints} />
          )}

          {location.pathname === "/history" && (
            <HistoryView
              transactions={transactions}
              onSelectTx={(tx) => setSelectedTx(tx)}
            />
          )}

          {location.pathname === "/profile" && (
            <ProfileView
              credit={credit}
              creditLimit={creditLimit}
              points={points}
              onRepayClick={() => setRepayModal(true)}
            />
          )}

          {/* Fallback to Home if unknown route */}
          {!["/", "/scan", "/pay", "/success", "/qr", "/rewards", "/history", "/profile"].includes(location.pathname) && (
            <HomeView
              credit={credit}
              creditLimit={creditLimit}
              transactions={transactions}
              points={points}
              activeOffer={activeOffer}
              navigate={navigate}
              onSelectTx={(tx) => setSelectedTx(tx)}
              onRepayClick={() => setRepayModal(true)}
            />
          )}
        </main>

        {/* Bottom 4-Item Minimal Navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-2.5 px-3 z-20 shadow-md">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-1 text-xs py-1 px-3 rounded-xl transition ${
                  active ? "text-[#F47920] font-bold" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Icon size={20} className={active ? "text-[#F47920]" : "text-gray-500"} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Minimal Repay Modal */}
        {repayModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-tab-enter">
              <h3 className="text-base font-bold text-gray-900">Pay FlexiPay Bill</h3>
              <p className="text-xs text-gray-500 mt-0.5">Due on 5 Nov • 0% Interest</p>

              <div className="my-5 p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                <div className="text-xs text-gray-500">Amount Due</div>
                <div className="text-2xl font-black text-gray-900 mt-0.5">
                  {formatRupee(creditLimit - credit)}
                </div>
                <div className="text-xs text-gray-600 mt-2">Paying via HDFC Bank •••• 4812</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRepayModal(false)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRepay}
                  className="flex-1 py-3 text-sm font-bold text-white bg-[#F47920] hover:bg-[#E06710] rounded-xl shadow-xs transition"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Minimal Receipt Modal */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-tab-enter">
              <div className="text-center pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-[#F47920] flex items-center justify-center mx-auto text-base font-bold">
                  {selectedTx.initials || "TX"}
                </div>
                <div className="text-2xl font-black text-gray-900 mt-2">
                  {formatRupee(selectedTx.amount)}
                </div>
                <div className="text-sm font-semibold text-gray-900 mt-0.5">{selectedTx.merchant}</div>
                <div className="text-xs text-gray-500">{selectedTx.date}</div>
              </div>

              <div className="py-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid Using</span>
                  <span className="font-semibold text-gray-900">{selectedTx.mode || "FlexiPay"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">UPI Ref (UTR)</span>
                  <span className="font-mono text-gray-800">{selectedTx.utr || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rewards Earned</span>
                  <span className="font-bold text-emerald-700">+{selectedTx.rewardEarned || 25} Points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="text-emerald-700 font-bold">{selectedTx.status || "Completed"}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl mt-2 transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ----------------------------------------------------
// HOME VIEW
// ----------------------------------------------------
function HomeView({ credit, creditLimit, transactions, points, activeOffer, navigate, onSelectTx, onRepayClick }) {
  const used = creditLimit - credit;

  const people = [
    { name: "Sharma Store", initials: "SS", vpa: "sharma@flexipay" },
    { name: "Zepto", initials: "ZG", vpa: "zepto@icici" },
    { name: "Swiggy", initials: "SW", vpa: "swiggy@axis" },
    { name: "Apollo", initials: "AP", vpa: "apollo@hdfc" }
  ];

  return (
    <div className="space-y-6">
      
      {/* Primary Credit Card */}
      <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Buy Now, Pay Later
          </span>
          <span className="text-xs font-medium text-gray-500">
            Limit: {formatRupee(creditLimit)}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {formatRupee(credit)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Available to spend at any store QR</div>
        </div>

        {used > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Current bill</div>
              <div className="text-sm font-bold text-gray-900">{formatRupee(used)} due on 5 Nov</div>
            </div>
            <button
              onClick={onRepayClick}
              className="px-4 py-1.5 text-xs font-semibold text-[#F47920] border border-[#F47920] rounded-full hover:bg-orange-50 transition"
            >
              Pay bill
            </button>
          </div>
        )}
      </div>

      {/* 4 Action Grid */}
      <div className="grid grid-cols-4 gap-2 text-center pt-1">
        <button
          onClick={() => navigate("/scan")}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-13 h-13 rounded-full bg-orange-50 text-[#F47920] flex items-center justify-center group-hover:bg-orange-100 transition">
            <Scan size={22} />
          </div>
          <span className="text-xs font-medium text-gray-800">Scan QR</span>
        </button>

        <button
          onClick={() => navigate("/scan")}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-13 h-13 rounded-full bg-gray-50 text-gray-700 flex items-center justify-center group-hover:bg-gray-100 transition">
            <Building2 size={22} />
          </div>
          <span className="text-xs font-medium text-gray-800">Pay Store</span>
        </button>

        <button
          onClick={() => navigate("/rewards")}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-13 h-13 rounded-full bg-gray-50 text-gray-700 flex items-center justify-center group-hover:bg-gray-100 transition">
            <Gift size={22} />
          </div>
          <span className="text-xs font-medium text-gray-800">Rewards</span>
        </button>

        <button
          onClick={() => navigate("/qr")}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-13 h-13 rounded-full bg-gray-50 text-gray-700 flex items-center justify-center group-hover:bg-gray-100 transition">
            <QrCode size={22} />
          </div>
          <span className="text-xs font-medium text-gray-800">My QR</span>
        </button>
      </div>

      {/* Clean Store Offer Banner - Synced with Merchant Campaign */}
      <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#F47920] text-white flex items-center justify-center shrink-0">
            <Tag size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-900 truncate">
              {activeOffer?.title || "Sharma Super Store Offer"}
            </div>
            <div className="text-[11px] text-gray-600 truncate">
              {activeOffer?.subtitle || "Flat 10% Cashback on Pay Later"}
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/scan")}
          className="px-3 py-1.5 text-xs font-semibold bg-white border border-orange-200 text-[#F47920] rounded-lg hover:bg-orange-50 shrink-0 ml-2"
        >
          Scan
        </button>
      </div>

      {/* Recent Merchants */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Frequent Stores
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
          {people.map((p, i) => (
            <button
              key={i}
              onClick={() => navigate("/scan")}
              className="flex flex-col items-center gap-1.5 min-w-[64px]"
            >
              <div className="w-13 h-13 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center font-semibold text-sm hover:ring-2 hover:ring-[#F47920] transition">
                {p.initials}
              </div>
              <span className="text-xs text-gray-700 font-medium truncate max-w-[68px]">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Clean Transaction List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Recent Activity
          </span>
          <button
            onClick={() => navigate("/history")}
            className="text-xs font-semibold text-[#F47920] hover:underline"
          >
            See all
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {(transactions || []).slice(0, 4).map((tx) => (
            <div
              key={tx.id}
              onClick={() => onSelectTx(tx)}
              className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 -mx-2 px-2 rounded-xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold">
                  {tx.initials || "TX"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 leading-tight">
                    {tx.merchant}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{tx.date}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">
                  -{formatRupee(tx.amount)}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {(tx.mode || "").includes("Later") ? "Pay Later" : "Bank UPI"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SCAN VIEW
// ----------------------------------------------------
function ScanView({ amount, setAmount, merchant, setMerchant, setVpa, navigate }) {
  const stores = [
    { name: "Sharma Super Store", vpa: "sharma@flexipay", defaultAmt: 2500 },
    { name: "Zepto Groceries", vpa: "zepto@icici", defaultAmt: 840 },
    { name: "Apollo Pharmacy", vpa: "apollopharmacy@hdfcbank", defaultAmt: 610 }
  ];

  const handleSelectStore = (s) => {
    setMerchant(s.name);
    setVpa(s.vpa);
    setAmount(s.defaultAmt);
  };

  const [scannedBill, setScannedBill] = useState(() => {
    try {
      const saved = localStorage.getItem("flexiPosBill");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  });

  const [detectStatus, setDetectStatus] = useState("");

  const handleScanFromPos = async () => {
    setDetectStatus("Scanning POS...");
    // 1. Try fetching live from relay server (cross-port bridge)
    try {
      const res = await fetch("http://localhost:4000/api/bill");
      const data = await res.json();
      if (data && data.bill && data.bill.amount) {
        setAmount(Number(data.bill.amount));
        setMerchant(data.bill.merchant || "Sharma Super Store");
        setVpa(data.bill.vpa || "sharma@flexipay");
        setDetectStatus(`✓ Linked POS Bill: ₹${data.bill.amount}`);
        setTimeout(() => setDetectStatus(""), 3500);
        return;
      }
    } catch (e) {
      console.warn("Relay bill fetch:", e);
    }

    // 2. Fallback to localStorage / defaults
    try {
      const saved = localStorage.getItem("flexiPosBill");
      if (saved) {
        const bill = JSON.parse(saved);
        if (bill && bill.amount) {
          setAmount(Number(bill.amount));
          setMerchant(bill.merchant || "Sharma Super Store");
          setVpa(bill.vpa || "sharma@flexipay");
          setDetectStatus(`✓ Linked POS Bill: ₹${bill.amount}`);
          setTimeout(() => setDetectStatus(""), 3500);
          return;
        }
      }
    } catch (err) {}

    setAmount(2500);
    setMerchant("Sharma Super Store");
    setVpa("sharma@flexipay");
    setDetectStatus("✓ Linked Default Sharma Bill: ₹2,500");
    setTimeout(() => setDetectStatus(""), 3500);
  };

  return (
    <div className="space-y-6">
      <div className="text-center pt-2">
        <h2 className="text-lg font-bold text-gray-900">Scan & Pay</h2>
        <p className="text-xs text-gray-500">Scan any store QR code to pay using FlexiPay</p>
      </div>

      {/* Clean Scanner Box with Live Detect */}
      <div className="w-64 p-4 mx-auto rounded-2xl border-2 border-dashed border-[#F47920] flex flex-col items-center justify-center bg-orange-50/30 text-gray-600 space-y-2">
        <div className="w-14 h-14 rounded-full bg-orange-100 text-[#F47920] flex items-center justify-center">
          <Scan size={32} />
        </div>
        <span className="text-xs text-gray-700 font-semibold text-center">
          Point at Sharma Store POS QR
        </span>
        <button
          onClick={handleScanFromPos}
          className="px-3.5 py-1.5 text-xs font-bold bg-[#F47920] text-white rounded-lg hover:bg-[#E06710] shadow-xs transition cursor-pointer"
        >
          ⚡ Auto-Detect POS Bill
        </button>
        {detectStatus && (
          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full animate-tab-enter">
            {detectStatus}
          </div>
        )}
      </div>

      {/* Select Demo Store */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Or Select Nearby Store (Demo)
        </div>
        <div className="space-y-2">
          {stores.map((s, i) => (
            <div
              key={i}
              onClick={() => handleSelectStore(s)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                merchant === s.name
                  ? "border-[#F47920] bg-orange-50/50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div>
                <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                <div className="text-xs text-gray-500">{s.vpa}</div>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatRupee(s.defaultAmt)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Amount input & presets */}
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1">Enter Amount</label>
        <div className="flex items-center border border-gray-300 rounded-xl px-4 py-2.5 focus-within:border-[#F47920]">
          <span className="text-xl font-bold text-gray-500 mr-2">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full text-2xl font-bold text-gray-900 outline-none"
            placeholder="0"
          />
        </div>

        {/* Quick Amount Presets */}
        <div className="flex gap-2 mt-2">
          {[250, 500, 1000, 2500].map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg border transition ${
                amount === preset
                  ? "bg-[#F47920] text-white border-[#F47920]"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              ₹{preset}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate("/pay")}
        disabled={!amount || amount <= 0}
        className="w-full py-3.5 bg-[#F47920] hover:bg-[#E06710] text-white font-semibold rounded-xl transition disabled:opacity-50"
      >
        Proceed to Pay {formatRupee(amount)}
      </button>
    </div>
  );
}

// ----------------------------------------------------
// PAYMENT VIEW
// ----------------------------------------------------
function PaymentView({ amount, merchant, vpa, credit, method, setMethod, onPay }) {
  const isEligible = credit >= amount;

  return (
    <div className="space-y-6 pt-2">
      <div className="text-center py-4 border-b border-gray-100">
        <div className="text-xs text-gray-500">Paying to</div>
        <div className="text-lg font-bold text-gray-900 mt-0.5">{merchant}</div>
        <div className="text-xs text-gray-500">{vpa}</div>
        <div className="text-4xl font-extrabold text-gray-900 mt-3">{formatRupee(amount)}</div>
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          PAYMENT OPTION
        </div>

        <div className="space-y-2.5">
          {/* Buy Now, Pay Later Option */}
          <label
            onClick={() => setMethod("later")}
            className={`p-4 rounded-xl border block cursor-pointer transition ${
              method === "later"
                ? "border-[#F47920] bg-orange-50/40 ring-1 ring-[#F47920]"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="payopt"
                checked={method === "later"}
                onChange={() => setMethod("later")}
                className="mt-1 accent-[#F47920]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">Buy Now, Pay Later</span>
                  <span className="text-xs font-semibold text-[#F47920]">30-day 0% interest</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Available credit: {formatRupee(credit)} • +25 Reward Points
                </div>
              </div>
            </div>
          </label>

          {/* HDFC Bank Option */}
          <label
            onClick={() => setMethod("hdfc")}
            className={`p-4 rounded-xl border block cursor-pointer transition ${
              method === "hdfc"
                ? "border-[#F47920] bg-orange-50/40 ring-1 ring-[#F47920]"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="payopt"
                checked={method === "hdfc"}
                onChange={() => setMethod("hdfc")}
                className="mt-1 accent-[#F47920]"
              />
              <div>
                <div className="text-sm font-bold text-gray-900">HDFC Bank •••• 4812</div>
                <div className="text-xs text-gray-500 mt-0.5">Instant UPI debit via PIN</div>
              </div>
            </div>
          </label>

          {/* SBI Bank Option */}
          <label
            onClick={() => setMethod("sbi")}
            className={`p-4 rounded-xl border block cursor-pointer transition ${
              method === "sbi"
                ? "border-[#F47920] bg-orange-50/40 ring-1 ring-[#F47920]"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="payopt"
                checked={method === "sbi"}
                onChange={() => setMethod("sbi")}
                className="mt-1 accent-[#F47920]"
              />
              <div>
                <div className="text-sm font-bold text-gray-900">SBI •••• 8912</div>
                <div className="text-xs text-gray-500 mt-0.5">Instant UPI debit via PIN</div>
              </div>
            </div>
          </label>
        </div>
      </div>

      <button
        onClick={onPay}
        disabled={method === "later" && !isEligible}
        className="w-full py-4 bg-[#F47920] hover:bg-[#E06710] text-white font-semibold rounded-xl text-base shadow-sm transition disabled:opacity-50"
      >
        {method === "later"
          ? `Pay ${formatRupee(amount)} using Buy Now, Pay Later`
          : method === "sbi"
          ? `Pay ${formatRupee(amount)} via SBI UPI`
          : `Pay ${formatRupee(amount)} via HDFC UPI`}
      </button>
    </div>
  );
}

// ----------------------------------------------------
// SUCCESS VIEW
// ----------------------------------------------------
function SuccessView({ amount, merchant, vpa, method, navigate }) {
  const utr = String(Math.floor(400000000000 + Math.random() * 900000000000));

  return (
    <div className="pt-8 text-center space-y-5 animate-tab-enter">
      <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
        <Check size={36} strokeWidth={3} />
      </div>

      <div>
        <div className="text-3xl font-extrabold text-gray-900">{formatRupee(amount)}</div>
        <div className="text-sm font-semibold text-gray-900 mt-1">Paid to {merchant}</div>
        <div className="text-xs text-gray-500">{vpa}</div>
        <div className="text-xs text-gray-400 mt-2">UPI Ref No: {utr}</div>
      </div>

      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-left text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Method</span>
          <span className="font-semibold text-gray-900">
            {method === "later"
              ? "Buy Now, Pay Later (0% interest)"
              : method === "sbi"
              ? "SBI •••• 8912"
              : "HDFC Bank •••• 4812"}
          </span>
        </div>
        {method === "later" && (
          <div className="flex justify-between">
            <span className="text-gray-500">Repayment Date</span>
            <span className="font-semibold text-gray-900">5 Nov 2026</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-200/60 pt-2">
          <span className="text-gray-500">Rewards Earned</span>
          <span className="font-bold text-emerald-700">
            {method === "later" ? "+25 Points" : "+5 Points"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => navigate("/")}
          className="w-full py-3.5 bg-[#F47920] hover:bg-[#E06710] text-white font-semibold rounded-xl transition"
        >
          Done
        </button>
        <button
          onClick={() => navigate("/rewards")}
          className="w-full py-2.5 text-xs font-semibold text-[#F47920] hover:underline"
        >
          View My Reward Points →
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// REWARDS VIEW (Google Pay Voucher Style)
// ----------------------------------------------------
function RewardsView({ points, setPoints }) {
  const [vouchers, setVouchers] = useState([
    { id: 1, title: "₹50 Instant Cashback", req: 500, code: "FLEXI50", claimed: false },
    { id: 2, title: "₹100 Sharma Store Discount", req: 900, code: "SHARMA100", claimed: false },
    { id: 3, title: "₹200 Zepto Grocery Voucher", req: 1800, code: "ZEPTO200", claimed: false }
  ]);
  const [copiedCode, setCopiedCode] = useState("");

  const handleClaim = (v) => {
    if (points < v.req || v.claimed) return;
    setPoints((p) => p - v.req);
    setVouchers((prev) =>
      prev.map((item) => (item.id === v.id ? { ...item, claimed: true } : item))
    );
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Points Card */}
      <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Total Reward Points
        </div>
        <div className="text-3xl font-extrabold text-gray-900 mt-1">
          {points.toLocaleString("en-IN")}
        </div>
        <p className="text-xs text-gray-500 mt-1">Earn points on every UPI & Pay Later transaction</p>
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Redeemable Vouchers
        </div>

        <div className="space-y-3">
          {vouchers.map((v) => (
            <div key={v.id} className="p-4 rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{v.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{v.req} Points required</div>
                </div>

                <button
                  disabled={points < v.req || v.claimed}
                  onClick={() => handleClaim(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    v.claimed
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                      : points >= v.req
                      ? "bg-[#F47920] text-white hover:bg-[#E06710]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {v.claimed ? "Unlocked" : "Redeem"}
                </button>
              </div>

              {v.claimed && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-gray-800">Coupon: {v.code}</span>
                  <button
                    onClick={() => copyCode(v.code)}
                    className="text-[#F47920] font-semibold hover:underline"
                  >
                    {copiedCode === v.code ? "Copied" : "Copy Code"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PROFILE & BANK ACCOUNTS VIEW
// ----------------------------------------------------
function ProfileView({ credit, creditLimit, points, onRepayClick }) {
  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs text-center">
        <div className="w-16 h-16 rounded-full bg-[#002855] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-xs">
          R
        </div>
        <h2 className="text-base font-bold text-gray-900 mt-3">Rahul Sharma</h2>
        <div className="text-xs text-gray-500 font-mono">rahul@flexipay • +91 98765 43210</div>
        <div className="text-xs text-emerald-700 font-semibold mt-2 inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full">
          <ShieldCheck size={14} /> Full KYC Verified
        </div>
      </div>

      {/* Linked Bank Accounts */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Linked Bank Accounts
        </div>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 bg-white">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-gray-600" />
              <div>
                <div className="text-xs font-bold text-gray-900">HDFC Bank •••• 4812</div>
                <div className="text-[11px] text-gray-500">Savings A/c • Primary UPI</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#F47920]">Default</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-gray-600" />
              <div>
                <div className="text-xs font-bold text-gray-900">State Bank of India •••• 8912</div>
                <div className="text-[11px] text-gray-500">Savings A/c • Secondary</div>
              </div>
            </div>
            <span className="text-[11px] text-gray-400">Linked</span>
          </div>
        </div>
      </div>

      {/* Credit Score & Health */}
      <div className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Experian Credit Score</div>
          <div className="text-lg font-bold text-gray-900 mt-0.5">785 • Excellent</div>
          <div className="text-xs text-gray-500">Eligible for ₹10,000 credit limit increase</div>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>

      {/* Pay Later Statement */}
      <div className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Current FlexiPay Bill</div>
          <div className="text-base font-bold text-gray-900 mt-0.5">
            {formatRupee(creditLimit - credit)} Due on 5 Nov
          </div>
        </div>
        {creditLimit - credit > 0 && (
          <button
            onClick={onRepayClick}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#F47920] rounded-lg hover:bg-[#E06710]"
          >
            Pay Dues
          </button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MY QR VIEW
// ----------------------------------------------------
function MyQrView() {
  return (
    <div className="pt-4 text-center space-y-4">
      <h2 className="text-lg font-bold text-gray-900">My UPI QR</h2>
      <p className="text-xs text-gray-500">Scan using any UPI app to pay Rahul Sharma directly</p>

      <div className="p-6 rounded-2xl border border-gray-200 bg-white inline-block shadow-sm">
        <QRCodeCanvas value="upi://pay?pa=rahul@flexipay&pn=Rahul%20Sharma" size={200} />
        <div className="mt-4 text-sm font-bold text-gray-900">Rahul Sharma</div>
        <div className="text-xs text-gray-500 font-mono">rahul@flexipay</div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// HISTORY VIEW (With Search & Filter Pills)
// ----------------------------------------------------
function HistoryView({ transactions, onSelectTx }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = (transactions || []).filter((tx) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "later"
        ? (tx.mode || "").includes("Later")
        : (tx.mode || "").includes("HDFC");
    const matchesSearch =
      (tx.merchant || "").toLowerCase().includes(search.toLowerCase()) ||
      (tx.utr || "").includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
        <p className="text-xs text-gray-500">All past UPI and FlexiPay orders</p>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search merchant or UTR..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-[#F47920]"
      />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: "all", label: "All" },
          { id: "later", label: "Pay Later" },
          { id: "bank", label: "Bank UPI" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              filter === tab.id
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="divide-y divide-gray-100">
        {filtered.map((tx) => (
          <div
            key={tx.id}
            onClick={() => onSelectTx(tx)}
            className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 -mx-2 px-2 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold">
                {tx.initials || "TX"}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 leading-tight">
                  {tx.merchant}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{tx.date}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">
                -{formatRupee(tx.amount)}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {(tx.mode || "").includes("Later") ? "Pay Later" : "Bank UPI"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ROOT MOUNT
// ----------------------------------------------------
const container = document.getElementById("root");
if (!window.__upi_root) {
  window.__upi_root = createRoot(container);
}
window.__upi_root.render(
  <ErrorBoundary>
    <HashRouter>
      <App />
    </HashRouter>
  </ErrorBoundary>
);

