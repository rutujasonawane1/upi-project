import React, { useState, useEffect, Component, useRef } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
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
  ExternalLink,
  FileText,
  X,
  Info,
  Lock,
  Smartphone,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  Cloud
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import "./index.css";
import { syncSubscribeBill, syncPublishPayment, syncSubscribeOffer, isFirebaseActive } from "./firebaseSync";
import FirebaseSettingsModal from "./FirebaseSettingsModal";

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

  const [creditLimit, setCreditLimit] = useState(() => {
    const saved = localStorage.getItem("flexiCreditLimit");
    const num = Number(saved);
    return isNaN(num) || num <= 0 ? 25000 : num;
  });
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
  const [aaModal, setAaModal] = useState(false);
  const [showCloudSettings, setShowCloudSettings] = useState(false);
  const [cloudActive, setCloudActive] = useState(isFirebaseActive());

  // Upgrade credit limit via Account Aggregator simulation
  const handleAaUpgrade = (newLimit) => {
    const boost = newLimit - creditLimit;
    setCreditLimit(newLimit);
    setCredit((c) => c + boost);
    try {
      localStorage.setItem("flexiCreditLimit", String(newLimit));
      localStorage.setItem("flexiCredit", String(credit + boost));
    } catch (e) {}
  };

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

    // Check for live offers on relay server (cross-port bridge)
    const offerPoll = setInterval(() => {
      fetch("http://localhost:4000/api/offer")
        .then(r => r.json())
        .then(data => {
          if (data && data.offer) {
            setActiveOffer({
              title: data.offer.title || "Store Special Offer",
              subtitle: `Orders above ₹${data.offer.minSpend || 1000} • Cap ₹${data.offer.cashbackCap || 150}`,
              minSpend: data.offer.minSpend || 1000
            });
          }
        })
        .catch(() => {});
    }, 1500);

    // 4. Firebase Cloud Realtime Listeners (Global cross-device sync)
    const unsubscribeBill = syncSubscribeBill((bill) => {
      console.log("[Consumer Firebase Bill Received]", bill);
      if (bill && bill.amount) {
        setAmount(Number(bill.amount));
        if (bill.merchant) setMerchant(bill.merchant);
        if (bill.vpa) setVpa(bill.vpa);
      }
    });

    const unsubscribeOffer = syncSubscribeOffer((offerData) => {
      console.log("[Consumer Firebase Offer Received]", offerData);
      if (offerData && offerData.title) {
        setActiveOffer({
          title: offerData.title || "Store Special Offer",
          subtitle: `Orders above ₹${offerData.minSpend || 1000} • Cap ₹${offerData.cashbackCap || 150}`,
          minSpend: offerData.minSpend || 1000
        });
      }
    });

    return () => {
      clearInterval(offerPoll);
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorageEvent);
      if (unsubscribeBill) unsubscribeBill();
      if (unsubscribeOffer) unsubscribeOffer();
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

      // 0. Firebase Realtime Cloud Broadcast (cross-device global sync)
      syncPublishPayment(syncPayload);

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
  const handleRepay = (payAmt, payMode) => {
    const due = creditLimit - credit;
    const settleAmt = payAmt ? Math.min(due, Math.max(1, Number(payAmt))) : due;
    if (settleAmt <= 0) return;
    setCredit((c) => Math.min(creditLimit, c + settleAmt));
    setPoints((p) => p + 50);

    const newTx = normalizeTx({
      id: "tx_" + Date.now(),
      merchant: "FlexiPay Bill Settlement",
      upiId: "repay@flexipay",
      initials: "FP",
      amount: settleAmt,
      date: "Just now",
      mode: payMode || "HDFC Bank •••• 4812",
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

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowCloudSettings(true)}
              className={`p-2 rounded-full transition flex items-center justify-center cursor-pointer ${
                cloudActive
                  ? "text-emerald-600 hover:bg-emerald-50"
                  : "text-gray-400 hover:bg-orange-50 hover:text-[#F47920]"
              }`}
              title="Configure Firebase Realtime Cloud Sync"
            >
              <Cloud size={20} />
            </button>
            <button
              onClick={() => navigate("/qr")}
              className="p-2 text-gray-600 hover:bg-orange-50 hover:text-[#F47920] rounded-full transition cursor-pointer"
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
              onOpenAaModal={() => setAaModal(true)}
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

        {/* 45-Day Repayment Modal with Timeline Visualizer & Multi-Method Options */}
        {repayModal && (
          <ConsumerRepayModal
            dueAmount={creditLimit - credit}
            onClose={() => setRepayModal(false)}
            onConfirm={(amt, method) => handleRepay(amt, method)}
          />
        )}

        {/* Account Aggregator (AA) Underwriting Consent Modal */}
        {aaModal && (
          <AaUnderwritingModal
            creditLimit={creditLimit}
            onClose={() => setAaModal(false)}
            onUpgrade={handleAaUpgrade}
          />
        )}

        {/* Minimal Receipt Modal */}
        {selectedTx && createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedTx(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-tab-enter my-auto border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
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
                className="w-full py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl mt-2 transition cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>,
          document.body
        )}

        {/* Cloud Sync Settings Modal for Realtime Cross-Device Testing */}
        <FirebaseSettingsModal
          isOpen={showCloudSettings}
          onClose={() => {
            setShowCloudSettings(false);
            setCloudActive(isFirebaseActive());
          }}
        />

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
              <div className="text-xs text-gray-500">Current bill (45-Day Cycle)</div>
              <div className="text-sm font-bold text-gray-900">{formatRupee(used)} • Due 30 Nov (0% Fee)</div>
            </div>
            <button
              onClick={onRepayClick}
              className="px-4 py-1.5 text-xs font-semibold text-[#F47920] border border-[#F47920] rounded-full hover:bg-orange-50 transition cursor-pointer"
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
// RBI KEY FACT STATEMENT (KFS) MODAL (Sprint 3 / DLG Compliant)
// ----------------------------------------------------
function KfsModal({ amount, credit, onClose, onAccept }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 overflow-y-auto animate-tab-enter">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#F47920] flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Key Fact Statement (KFS)</h3>
              <p className="text-[10px] text-gray-500">RBI Digital Lending Guidelines (DLG) Mandated</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable KFS Content */}
        <div className="overflow-y-auto space-y-3.5 py-3 text-xs text-gray-700 flex-1 pr-1">
          {/* Regulated Entity / LSP Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-500">Regulated Entity (Lender)</span>
              <span className="font-bold text-gray-900">Equitas Small Finance Bank</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-500">Lending Service Provider (LSP)</span>
              <span className="font-semibold text-gray-800">FlexiPay Technologies Pvt Ltd</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-500">RBI Registration / License</span>
              <span className="font-mono text-gray-600">RBI/DLG/SFB/2023-891</span>
            </div>
          </div>

          {/* Key Loan Financial Parameters Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-gray-100 px-3 py-1.5 font-bold text-gray-800 text-[11px] uppercase tracking-wide">
              Transaction & Repayment Terms
            </div>
            <div className="divide-y divide-gray-100">
              <div className="px-3 py-2 flex justify-between items-center">
                <span className="text-gray-600">Sanctioned Drawdown</span>
                <span className="font-bold text-gray-900">{formatRupee(amount)}</span>
              </div>
              <div className="px-3 py-2 flex justify-between items-center">
                <span className="text-gray-600">Interest-Free Tenure</span>
                <span className="font-bold text-emerald-700">45 Calendar Days</span>
              </div>
              <div className="px-3 py-2 flex justify-between items-center bg-orange-50/40">
                <span className="text-gray-700 font-medium">Annual Percentage Rate (APR)</span>
                <span className="font-extrabold text-[#F47920]">0.0% APR (Within 45 Days)</span>
              </div>
              <div className="px-3 py-2 flex justify-between items-center">
                <span className="text-gray-600">Post-Grace Overdue Rate</span>
                <span className="font-semibold text-gray-700">18.0% p.a. simple interest</span>
              </div>
              <div className="px-3 py-2 flex justify-between items-center">
                <span className="text-gray-600">Origination / Processing Fees</span>
                <span className="font-semibold text-emerald-700">₹0.00 (Nil)</span>
              </div>
              <div className="px-3 py-2 flex justify-between items-center">
                <span className="text-gray-600">Foreclosure / Prepayment Penalty</span>
                <span className="font-semibold text-emerald-700">₹0.00 (Nil)</span>
              </div>
              <div className="px-3 py-2 flex justify-between items-center">
                <span className="text-gray-600">Cooling-Off / Look-Up Period</span>
                <span className="font-bold text-slate-800">3 Days (Exit with 0 penalty)</span>
              </div>
            </div>
          </div>

          {/* Borrower Rights & Grievance Mechanism */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] space-y-1.5">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
              <span>Borrower Data Privacy & Protections</span>
            </div>
            <p className="text-emerald-800 leading-relaxed text-[10px]">
              • No access to personal photos, media, or contact list (RBI DLG 4.2 compliant).<br />
              • Loan recovery follows Fair Practice Code without unconsented calls or harassment.
            </p>
            <div className="pt-1 border-t border-emerald-200/60 text-[10px] text-emerald-950 flex justify-between">
              <span><strong>Nodal Grievance Officer:</strong> Rajesh Sharma</span>
              <a href="mailto:grievance@flexipay.in" className="underline font-semibold">grievance@flexipay.in</a>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-gray-100 flex gap-2.5">
          <button
            onClick={onClose}
            className="w-1/3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              if (onAccept) onAccept();
            }}
            className="w-2/3 py-2.5 bg-[#F47920] hover:bg-[#E06710] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check size={15} />
            <span>I Acknowledge & Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAYMENT VIEW
// ----------------------------------------------------
function PaymentView({ amount, merchant, vpa, credit, method, setMethod, onPay }) {
  const isEligible = credit >= amount;
  const [showKfs, setShowKfs] = useState(false);

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
                  <span className="text-xs font-semibold text-[#F47920]">45-Day 0% Interest</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Available credit: {formatRupee(credit)} • +25 Reward Points • 45-Day Grace Cycle
                </div>

                {/* Direct KFS trigger on payment option */}
                <div className="mt-2 pt-2 border-t border-orange-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 flex items-center gap-1 font-medium">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    <span>RBI DLG Compliant Credit</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowKfs(true);
                    }}
                    className="font-bold text-[#F47920] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileText size={12} />
                    <span>View KFS</span>
                  </button>
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

      {/* Mandatory Regulatory KFS Notice for BNPL */}
      {method === "later" && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#F47920] shrink-0" />
            <div>
              <div className="font-bold text-gray-900 text-xs">RBI Key Fact Statement (KFS)</div>
              <div className="text-[11px] text-gray-500">0% APR for 45 Days • Lender: Equitas SFB</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowKfs(true)}
            className="text-xs font-bold text-[#F47920] hover:underline px-2.5 py-1 bg-white border border-orange-200 rounded-lg shadow-2xs cursor-pointer"
          >
            Review Terms
          </button>
        </div>
      )}

      <button
        onClick={onPay}
        disabled={method === "later" && !isEligible}
        className="w-full py-4 bg-[#F47920] hover:bg-[#E06710] text-white font-semibold rounded-xl text-base shadow-sm transition disabled:opacity-50 cursor-pointer"
      >
        {method === "later"
          ? `Pay ${formatRupee(amount)} via 45-Day Pay Later (0% Interest)`
          : method === "sbi"
          ? `Pay ${formatRupee(amount)} via SBI UPI`
          : `Pay ${formatRupee(amount)} via HDFC UPI`}
      </button>

      {/* Key Fact Statement Modal */}
      {showKfs && (
        <KfsModal
          amount={amount}
          credit={credit}
          onClose={() => setShowKfs(false)}
          onAccept={() => {
            setShowKfs(false);
          }}
        />
      )}
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
            <span className="text-gray-500">Repayment Cycle</span>
            <span className="font-semibold text-emerald-700">45 Days (Due 30 Nov 2026)</span>
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
function ProfileView({ credit, creditLimit, points, onRepayClick, onOpenAaModal }) {
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

      {/* Account Aggregator Credit Underwriting Card (PDF Key Feature) */}
      <div
        onClick={onOpenAaModal}
        className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 hover:bg-orange-50 transition cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F47920] text-white flex items-center justify-center font-bold text-sm shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <span>Account Aggregator Underwriting</span>
              <span className="text-[10px] font-bold text-[#F47920] bg-white border border-orange-200 px-1.5 py-0.2 rounded">
                RBI Approved AA
              </span>
            </div>
            <div className="text-[11px] text-gray-600 mt-0.5">
              Current Limit: <strong>{formatRupee(creditLimit)}</strong> • Tap to upgrade to ₹40,000+
            </div>
          </div>
        </div>
        <ChevronRight size={18} className="text-[#F47920] shrink-0" />
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
      <div
        onClick={onOpenAaModal}
        className="p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition cursor-pointer flex items-center justify-between"
      >
        <div>
          <div className="text-xs text-gray-500">Experian Bureau Score</div>
          <div className="text-lg font-bold text-gray-900 mt-0.5">785 • Excellent</div>
          <div className="text-xs text-[#F47920] font-semibold mt-0.5">
            Pre-qualified for instant Account Aggregator limit increase →
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>

      {/* 45-Day Pay Later Statement */}
      <div className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Current FlexiPay Bill (45-Day Cycle)</div>
          <div className="text-base font-bold text-gray-900 mt-0.5">
            {formatRupee(creditLimit - credit)} • Due 30 Nov
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">0% interest if paid on or before due date</div>
        </div>
        {creditLimit - credit > 0 && (
          <button
            onClick={onRepayClick}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#F47920] rounded-lg hover:bg-[#E06710] cursor-pointer"
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
// AUTHENTIC BANK-GRADE OTP VERIFICATION COMPONENT
// ----------------------------------------------------
function AuthenticOtpVerification({
  title,
  actionDesc,
  phone = "+91 98*** **432",
  amount,
  sender = "HDFC Bank",
  accent = "orange",
  onSuccess,
  onBack,
  submitLabel = "Verify & Authorize"
}) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [showSmsPush, setShowSmsPush] = useState(false);
  const [timer, setTimer] = useState(28);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Realistic SMS alert arrives after 1.1s delay
  useEffect(() => {
    const timerId = setTimeout(() => {
      setShowSmsPush(true);
    }, 1100);
    return () => clearTimeout(timerId);
  }, [generatedOtp]);

  // Live countdown ticker
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs[0]?.current?.focus();
  }, []);

  const handleDigitChange = (idx, val) => {
    setError("");
    const char = val.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const next = [...digits];
    next[idx] = char;
    setDigits(next);

    if (char && idx < 3) {
      inputRefs[idx + 1]?.current?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (!digits[idx] && idx > 0) {
        inputRefs[idx - 1]?.current?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    const next = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    inputRefs[Math.min(3, pasted.length - 1)]?.current?.focus();
  };

  const handleAutoFill = () => {
    setError("");
    const chars = generatedOtp.split("");
    setDigits(chars);
    inputRefs[3]?.current?.focus();
  };

  const handleResend = () => {
    setDigits(["", "", "", ""]);
    setError("");
    setTimer(30);
    setShowSmsPush(false);
    const newCode = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(newCode);
    inputRefs[0]?.current?.focus();
  };

  const handleVerify = () => {
    const entered = digits.join("");
    if (entered.length < 4) {
      setError("Please enter the complete 4-digit code.");
      return;
    }

    if (entered !== generatedOtp) {
      setError("Incorrect code. Please enter the OTP received via SMS.");
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onSuccess();
    }, 850);
  };

  const accentBtnClass =
    accent === "emerald"
      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
      : accent === "blue"
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-[#F47920] hover:bg-[#E06710] text-white";

  const accentBorderClass =
    accent === "emerald"
      ? "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
      : accent === "blue"
      ? "focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
      : "focus:border-[#F47920] focus:ring-1 focus:ring-[#F47920]";

  return (
    <div className="space-y-4 flex-1 text-center py-1 animate-tab-enter">
      {/* Authentic Incoming Mobile SMS Push Notification Banner */}
      {showSmsPush && (
        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl flex items-start gap-2.5 border border-slate-700 text-left animate-tab-enter">
          <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <MessageSquare size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span className="font-bold text-slate-200 uppercase tracking-wider">{sender} • SMS Alert</span>
              <span>Just now</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              <strong className="text-white font-mono text-xs font-black tracking-widest">{generatedOtp}</strong> is your authorization code for {actionDesc || "authorization"}{amount ? ` of ${formatRupee(amount)}` : ""}. Valid for 10 mins.
            </p>
            <button
              type="button"
              onClick={handleAutoFill}
              className="mt-2 text-[10px] font-extrabold text-orange-400 hover:text-orange-300 bg-orange-500/20 px-2.5 py-1 rounded-md border border-orange-400/30 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <Smartphone size={11} />
              <span>Tap to Auto-Fill ({generatedOtp})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Title & Description */}
      <div>
        <h4 className="text-base font-extrabold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Please enter the 4-digit authorization code sent via SMS to registered mobile <strong>{phone}</strong>.
        </p>
      </div>

      {/* 4 Clean Interactive Digit Boxes */}
      <div className="flex justify-center items-center gap-2.5 sm:gap-3 py-2" onPaste={handlePaste}>
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={inputRefs[idx]}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            style={{ width: "52px", height: "58px", minWidth: "44px", maxWidth: "56px" }}
            className={`shrink-0 text-center text-2xl font-black rounded-2xl border-2 transition outline-none bg-slate-50/80 text-slate-900 shadow-xs box-border ${
              error
                ? "border-rose-400 bg-rose-50/30 text-rose-900"
                : digit
                ? "border-slate-800 bg-white"
                : "border-slate-200 hover:border-slate-300"
            } ${accentBorderClass}`}
          />
        ))}
      </div>

      {/* Error Message if Mismatch */}
      {error && (
        <p className="text-[11px] font-bold text-rose-600 animate-tab-enter flex items-center justify-center gap-1">
          <AlertCircle size={13} />
          <span>{error}</span>
        </p>
      )}

      {/* Live Resend Countdown Timer */}
      <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
        {timer > 0 ? (
          <span>Resend OTP in <strong>00:{timer < 10 ? `0${timer}` : timer}</strong></span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-xs font-bold text-[#F47920] hover:underline cursor-pointer"
          >
            Resend OTP via SMS
          </button>
        )}
      </div>

      {/* Bank Grade Security Assurance */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
        <Lock size={12} className="text-emerald-600 shrink-0" />
        <span>256-Bit SSL Bank Grade Security • RBI DLG Mandate</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isVerifying}
          className="w-1/3 py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying || digits.some((d) => !d)}
          className={`w-2/3 py-3 font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2 ${accentBtnClass}`}
        >
          {isVerifying ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Verifying with Bank Switch...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ADVANCED CONSUMER REPAYMENT MODAL (Sprint 3 Polish)
// ----------------------------------------------------
function ConsumerRepayModal({ dueAmount, onClose, onConfirm }) {
  const [step, setStep] = useState(1); // 1: Amount & Bank, 2: Terms Consent, 3: OTP Verification, 4: Success Receipt
  const [repayType, setRepayType] = useState("full"); // "full" | "min" | "custom"
  const [customVal, setCustomVal] = useState(dueAmount);
  const [method, setMethod] = useState("hdfc"); // "hdfc" | "sbi"
  const [consent, setConsent] = useState(true);

  const minDue = Math.min(dueAmount, 250);
  const payAmt =
    repayType === "full"
      ? dueAmount
      : repayType === "min"
      ? minDue
      : Math.min(dueAmount, Math.max(1, customVal));

  const handleFinalDone = () => {
    const bankLabel = method === "sbi" ? "SBI •••• 8912" : "HDFC Bank •••• 4812";
    onConfirm(payAmt, bankLabel);
  };

  // Lock background body scroll while popup is open
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 3) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm sm:max-w-md p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col border border-gray-100 my-auto animate-tab-enter"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header & Step Bar */}
        <div className="border-b border-gray-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F47920] text-white flex items-center justify-center shadow-xs">
                <CreditCard size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">
                  {step === 1 && "Pay FlexiPay Bill"}
                  {step === 2 && "Settlement Consent"}
                  {step === 3 && "UPI Authorization PIN"}
                  {step === 4 && "Bill Settle Completed"}
                </h3>
                <p className="text-[10px] text-gray-500">
                  {step === 1 && "45-Day Interest-Free Payment Cycle"}
                  {step === 2 && "Confirm zero-interest terms & rewards"}
                  {step === 3 && "Verify with 4-digit UPI security PIN"}
                  {step === 4 && "Credit limit replenished instantly"}
                </p>
              </div>
            </div>
            {step !== 4 && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Clean Step Pills */}
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {[
              { num: 1, label: "Amount" },
              { num: 2, label: "Terms" },
              { num: 3, label: "PIN" },
              { num: 4, label: "Done" }
            ].map((s) => (
              <div
                key={s.num}
                className={`h-1.5 rounded-full transition-all ${
                  step >= s.num ? "bg-[#F47920]" : "bg-gray-100"
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: AMOUNT & BANK SELECTION */}
        {step === 1 && (
          <div className="space-y-4 flex-1">
            {/* 45-Day Progress Box */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>Day 0</span>
                <span className="text-[#F47920] font-bold">Day 32 (Today)</span>
                <span>Day 45 (Due)</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-[#F47920] h-full rounded-full" style={{ width: "71%" }}></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>⏳ <strong>13 days remaining</strong> in grace cycle</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  0% Interest
                </span>
              </div>
            </div>

            {/* Amount Selection Options */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Choose Settlement Amount</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRepayType("full")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    repayType === "full"
                      ? "border-[#F47920] bg-orange-50/70 ring-1 ring-[#F47920]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="text-[10px] text-gray-500">Total Due</div>
                  <div className="text-xs font-black text-gray-900 mt-0.5">{formatRupee(dueAmount)}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRepayType("min")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    repayType === "min"
                      ? "border-[#F47920] bg-orange-50/70 ring-1 ring-[#F47920]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="text-[10px] text-gray-500">Min Due</div>
                  <div className="text-xs font-black text-gray-900 mt-0.5">{formatRupee(minDue)}</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRepayType("custom");
                    setCustomVal(Math.round(dueAmount / 2));
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    repayType === "custom"
                      ? "border-[#F47920] bg-orange-50/70 ring-1 ring-[#F47920]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="text-[10px] text-gray-500">Custom</div>
                  <div className="text-xs font-black text-gray-900 mt-0.5">{formatRupee(customVal)}</div>
                </button>
              </div>

              {repayType === "custom" && (
                <div className="p-2.5 bg-orange-50/40 border border-orange-200 rounded-xl space-y-1.5 animate-tab-enter text-xs">
                  <div className="flex items-center border border-orange-200 rounded-xl px-3 py-1 bg-white focus-within:border-[#F47920]">
                    <span className="font-bold text-gray-400 mr-2">₹</span>
                    <input
                      type="number"
                      value={customVal}
                      onChange={(e) => setCustomVal(Math.min(dueAmount, Math.max(0, Number(e.target.value))))}
                      className="w-full font-bold text-gray-900 outline-none"
                      max={dueAmount}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bank Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Debit Bank Account</label>
              <div className="space-y-1.5 text-xs">
                <label
                  onClick={() => setMethod("hdfc")}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    method === "hdfc"
                      ? "border-[#F47920] bg-orange-50/40 ring-1 ring-[#F47920]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input type="radio" checked={method === "hdfc"} onChange={() => setMethod("hdfc")} className="accent-[#F47920]" />
                    <span className="font-bold text-gray-900">HDFC Bank •••• 4812</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#F47920] bg-orange-50 px-2 py-0.5 rounded">Default UPI</span>
                </label>

                <label
                  onClick={() => setMethod("sbi")}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    method === "sbi"
                      ? "border-[#F47920] bg-orange-50/40 ring-1 ring-[#F47920]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input type="radio" checked={method === "sbi"} onChange={() => setMethod("sbi")} className="accent-[#F47920]" />
                    <span className="font-bold text-gray-900">State Bank of India •••• 8912</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => setStep(2)}
              disabled={payAmt <= 0}
              className="w-full py-3.5 bg-[#F47920] hover:bg-[#E06710] text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Review Settlement Terms</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: TERMS CONSENT */}
        {step === 2 && (
          <div className="space-y-4 flex-1 text-xs">
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
              <div className="p-2.5 flex justify-between">
                <span className="text-gray-500">Settlement Amount</span>
                <span className="font-extrabold text-gray-900">{formatRupee(payAmt)}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-gray-500">Interest Rate Applied</span>
                <span className="font-bold text-emerald-700">0.0% APR (Within 45 Days)</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-gray-500">Prepayment / Convenience Fee</span>
                <span className="font-bold text-emerald-700">₹0.00 (Nil)</span>
              </div>
              <div className="p-2.5 flex justify-between bg-emerald-50/40">
                <span className="text-emerald-900 font-semibold">Rewards to Earn</span>
                <span className="font-bold text-emerald-700">+50 FlexiPay Coins</span>
              </div>
            </div>

            <label className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 accent-[#F47920] shrink-0"
              />
              <span className="text-gray-700 text-[11px] leading-relaxed">
                I authorize instant UPI debit of <strong>{formatRupee(payAmt)}</strong> from {method === "sbi" ? "SBI •••• 8912" : "HDFC Bank •••• 4812"} to settle my FlexiPay bill.
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!consent}
                className="w-2/3 py-3 bg-[#F47920] hover:bg-[#E06710] text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>Authorize via PIN</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AUTHENTIC OTP VERIFICATION */}
        {step === 3 && (
          <AuthenticOtpVerification
            title="UPI Debit Authorization"
            actionDesc="FlexiPay bill settlement"
            phone="+91 98*** **432"
            amount={payAmt}
            sender={method === "sbi" ? "State Bank of India" : "HDFC Bank"}
            accent="orange"
            onSuccess={() => setStep(4)}
            onBack={() => setStep(2)}
            submitLabel={`Authorize Payment of ${formatRupee(payAmt)}`}
          />
        )}

        {/* STEP 4: SUCCESS RECEIPT */}
        {step === 4 && (
          <div className="space-y-4 flex-1 text-center py-2 animate-tab-enter">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Check size={36} strokeWidth={3} />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Bill Settle Complete</span>
              <h4 className="text-2xl font-black text-gray-900 mt-1">{formatRupee(payAmt)}</h4>
              <p className="text-xs text-gray-500 mt-1">Paid via {method === "sbi" ? "SBI •••• 8912" : "HDFC Bank •••• 4812"}</p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-700 shrink-0" />
                <span className="text-emerald-900 font-bold">+50 FlexiPay Coins Earned!</span>
              </div>
              <span className="text-emerald-800 font-extrabold">Credited</span>
            </div>

            <button
              onClick={handleFinalDone}
              className="w-full py-3.5 bg-[#F47920] hover:bg-[#E06710] text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md"
            >
              Done (View Statement)
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}

// ----------------------------------------------------
// ACCOUNT AGGREGATOR (AA) UNDERWRITING MODAL (Sprint 2 / PDF Core)
// ----------------------------------------------------
function AaUnderwritingModal({ creditLimit, onClose, onUpgrade }) {
  const [step, setStep] = useState(1); // 1: Bank Selection, 2: OTP Verification & Consent, 3: Precise API Analyzer, 4: Approved Tier
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [analyzingStatus, setAnalyzingStatus] = useState("Connecting to RBI NBFC-Account Aggregator (Setu / Finvu)...");
  const [analysisProgress, setAnalysisProgress] = useState(20);

  // Dynamic calculation: ensure new limit is always higher than current
  const baseLimit = Math.max(25000, Number(creditLimit) || 25000);
  const upgradedTier = baseLimit >= 40000 ? 60000 : 40000;
  const incrementalGain = upgradedTier - baseLimit;

  const banks = [
    { name: "HDFC Bank", sub: "A/C •••• 4812 (Salary Inflows)", verified: true, score: "High Flow", logo: "🏦" },
    { name: "State Bank of India", sub: "A/C •••• 8912 (Primary UPI)", verified: true, score: "Stable", logo: "🏛️" },
    { name: "ICICI Bank", sub: "A/C •••• 1092 (Corporate)", verified: false, score: "Eligible", logo: "💎" },
    { name: "Axis Bank", sub: "A/C •••• 7731 (Savings)", verified: false, score: "Eligible", logo: "📈" }
  ];

  const handleStartAnalysis = () => {
    setStep(3);
    setAnalysisProgress(25);
    setTimeout(() => {
      setAnalyzingStatus("Fetching 12-month encrypted statements from Financial Information Provider...");
      setAnalysisProgress(50);
    }, 1100);
    setTimeout(() => {
      setAnalyzingStatus("Precise API: Analyzing net monthly cash flows, recurring debits & salary credits...");
      setAnalysisProgress(75);
    }, 2400);
    setTimeout(() => {
      setAnalyzingStatus("Underwriting complete: Pre-approved microloan line sanctioned by SFB Partner!");
      setAnalysisProgress(100);
    }, 3800);
    setTimeout(() => {
      setStep(4);
    }, 4500);
  };

  const handleApplyUpgrade = () => {
    onUpgrade(upgradedTier);
    onClose();
  };

  // Lock background body scroll while popup is open
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 2 && step !== 3) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl relative overflow-hidden border border-slate-100 my-auto animate-tab-enter"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50/60 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F47920] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              AA
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Account Aggregator Rail</h3>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  RBI Licensed
                </span>
              </div>
              <p className="text-[10px] text-gray-500">100% Consented • Zero Document Upload</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="grid grid-cols-4 px-5 pt-3 gap-1">
          {["Select Bank", "OTP Consent", "Analysis", "Limit Boost"].map((label, idx) => {
            const stepNum = idx + 1;
            const active = step === stepNum;
            const done = step > stepNum;
            return (
              <div key={label} className="space-y-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    done ? "bg-emerald-500" : active ? "bg-[#F47920]" : "bg-gray-100"
                  }`}
                ></div>
                <div className={`text-[9px] font-semibold truncate ${active ? "text-[#F47920]" : "text-gray-400"}`}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* STEP 1: Select Bank */}
        {step === 1 && (
          <div className="p-5 space-y-4 animate-tab-enter">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Select Bank for Instant Underwriting</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Account Aggregators analyze bank statements digitally to issue credit lines even without a credit card.
              </p>
            </div>

            <div className="space-y-2">
              {banks.map((b) => (
                <div
                  key={b.name}
                  onClick={() => setSelectedBank(b.name)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    selectedBank === b.name
                      ? "border-[#F47920] bg-orange-50/40 ring-1 ring-[#F47920]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl p-1 bg-white rounded-xl border border-gray-100 shadow-2xs">{b.logo}</span>
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {b.verified && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                            Linked
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500">{b.sub}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {b.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Limit vs Potential Limit Callout */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-400 text-[10px] block">Current Limit</span>
                <span className="font-extrabold text-gray-700">{formatRupee(baseLimit)}</span>
              </div>
              <div className="text-right">
                <span className="text-emerald-700 text-[10px] font-bold block">Pre-Qualified Limit</span>
                <span className="font-extrabold text-emerald-700 text-sm">{formatRupee(upgradedTier)}</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-[#F47920] hover:bg-[#E06710] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <span>Continue with {selectedBank}</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* STEP 2: AA Consent & Authentic OTP Verification */}
        {step === 2 && (
          <div className="p-5 space-y-4 animate-tab-enter">
            {/* RBI AA Consent Spec Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Financial Information Provider:</span>
                <span className="font-bold text-gray-900">{selectedBank}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Consented Entities:</span>
                <span className="font-bold text-gray-900">FlexiPay & Partner SFB</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Data Scope:</span>
                <span className="font-semibold text-gray-900">12 Months Statements & Balance</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Consent Validity:</span>
                <span className="font-bold text-emerald-700">One-Time Fetch (Revocable)</span>
              </div>
            </div>

            {/* Authentic Bank-Grade OTP Verification */}
            <AuthenticOtpVerification
              title="Authorize AA Data Consent"
              actionDesc={`sharing encrypted statements from ${selectedBank}`}
              phone="+91 98*** **432"
              sender={`RBI AA • ${selectedBank}`}
              accent="orange"
              onSuccess={handleStartAnalysis}
              onBack={() => setStep(1)}
              submitLabel="Approve & Run Analysis"
            />
          </div>
        )}

        {/* STEP 3: Automated Underwriting with Dynamic Metrics */}
        {step === 3 && (
          <div className="p-6 text-center space-y-4 animate-tab-enter">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-orange-100 border-t-[#F47920] animate-spin"></div>
              <div className="absolute font-black text-xs text-[#F47920]">{analysisProgress}%</div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900">Precise Statement Underwriting</h4>
              <p className="text-xs text-[#F47920] font-semibold mt-1 min-h-[36px] px-2">
                {analyzingStatus}
              </p>
            </div>

            {/* Live Financial Metrics Feed */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left text-[11px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Avg Monthly Inflow:</span>
                <span className="font-bold text-gray-900">₹62,400</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Zero-Bounce Track Record:</span>
                <span className="font-bold text-emerald-700">100% Clean</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">UPI Velocity Discipline:</span>
                <span className="font-bold text-blue-700">Top 10% Tier</span>
              </div>
            </div>

            <div className="text-[10px] text-gray-400">
              Powered by Precise API & Small Finance Bank Credit Rails
            </div>
          </div>
        )}

        {/* STEP 4: Approved & Limit Boosted */}
        {step === 4 && (
          <div className="p-5 text-center space-y-4 animate-tab-enter">
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Check size={32} strokeWidth={3} />
            </div>

            <div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                Underwriting Complete
              </span>
              <h4 className="text-base sm:text-lg font-black text-gray-900 mt-2">
                Credit Line Increased to {formatRupee(upgradedTier)}!
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Verified from your {selectedBank} cash flow records. Microloan limit ready for instant Scan & Pay.
              </p>
            </div>

            {/* Upgraded Comparison Card */}
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 text-left text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Previous Credit Limit:</span>
                <span className="font-semibold text-gray-500 line-through">{formatRupee(baseLimit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-bold">New Sanctioned Limit:</span>
                <span className="font-black text-emerald-700 text-base">{formatRupee(upgradedTier)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl">
                <span>Immediate Limit Boost:</span>
                <span className="font-black">+{formatRupee(incrementalGain)}</span>
              </div>
              <div className="flex justify-between border-t border-orange-200/80 pt-2 text-[11px]">
                <span className="text-gray-600">Flexible Repayment:</span>
                <span className="font-bold text-[#F47920]">45 Days (0% Interest)</span>
              </div>
            </div>

            <button
              onClick={handleApplyUpgrade}
              className="w-full py-4 bg-[#F47920] hover:bg-[#E06710] text-white font-extrabold rounded-2xl text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Activate {formatRupee(upgradedTier)} Limit Now</span>
              <span>⚡</span>
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
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

