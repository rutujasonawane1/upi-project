import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, useNavigate, useLocation } from "react-router-dom";
import {
  Home as HomeIcon,
  Receipt,
  Gift,
  User,
  ScanLine,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  Wallet,
  Clock3,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  CreditCard,
  Building2,
  Copy,
  Check,
  Share2,
  Bell,
  RefreshCw,
  Tag,
  ArrowUpRight,
  Info,
  Calendar,
  AlertCircle,
  FileText,
  Lock,
  ChevronDown,
  ShoppingBag,
  Coffee,
  Smartphone,
  Fuel,
  Pill,
  ExternalLink
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import "./index.css";

// ----------------------------------------------------
// REALISTIC DATASET (Real Indian Merchants & UPI Standards)
// ----------------------------------------------------
const REAL_TRANSACTIONS = [
  {
    id: "TX-4291084201",
    merchant: "Sharma Super Store",
    vpa: "sharma@flexipay",
    category: "Groceries & Daily Essentials",
    icon: ShoppingBag,
    iconColor: "text-purple-600 bg-purple-50",
    amount: 2500,
    type: "FlexiPay Pay Later",
    date: "Today, 07:15 PM",
    status: "Successful",
    utr: "429108420192",
    bankRef: "HDFC-UPI-9841029",
    rewardEarned: 25
  },
  {
    id: "TX-4291081192",
    merchant: "Zepto 10-Min Groceries",
    vpa: "zepto@icici",
    category: "Quick Commerce",
    icon: ShoppingBag,
    iconColor: "text-rose-600 bg-rose-50",
    amount: 840,
    type: "FlexiPay Pay Later",
    date: "Today, 03:40 PM",
    status: "Successful",
    utr: "429108119284",
    bankRef: "ICICI-UPI-4819028",
    rewardEarned: 10
  },
  {
    id: "TX-4290918247",
    merchant: "Swiggy Food & Dineout",
    vpa: "swiggy@axisbank",
    category: "Food & Dining",
    icon: Coffee,
    iconColor: "text-amber-600 bg-amber-50",
    amount: 420,
    type: "UPI Direct (HDFC Bank)",
    date: "Yesterday, 08:20 PM",
    status: "Successful",
    utr: "429091824712",
    bankRef: "HDFC-UPI-3310928",
    rewardEarned: 5
  },
  {
    id: "TX-4289104928",
    merchant: "Apollo Pharmacy",
    vpa: "apollopharmacy@hdfcbank",
    category: "Healthcare & Medicines",
    icon: Pill,
    iconColor: "text-emerald-600 bg-emerald-50",
    amount: 610,
    type: "FlexiPay Pay Later",
    date: "13 Oct 2026, 11:15 AM",
    status: "Successful",
    utr: "428910492819",
    bankRef: "HDFC-UPI-7719201",
    rewardEarned: 8
  },
  {
    id: "TX-4282019482",
    merchant: "Croma Retail Electronics",
    vpa: "croma@kotak",
    category: "Electronics & Gadgets",
    icon: Smartphone,
    iconColor: "text-blue-600 bg-blue-50",
    amount: 4200,
    type: "FlexiPay 0% Pay Later",
    date: "08 Oct 2026, 05:30 PM",
    status: "Successful",
    utr: "428201948210",
    bankRef: "KOTAK-UPI-5519283",
    rewardEarned: 50
  },
  {
    id: "TX-4279018247",
    merchant: "Indian Oil Fuel Station",
    vpa: "indianoil@sbi",
    category: "Fuel & Automobile",
    icon: Fuel,
    iconColor: "text-orange-600 bg-orange-50",
    amount: 1500,
    type: "UPI Direct (HDFC Bank)",
    date: "02 Oct 2026, 09:10 AM",
    status: "Successful",
    utr: "427901824719",
    bankRef: "HDFC-UPI-1192847",
    rewardEarned: 15
  }
];

function formatRupee(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top automatically on route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const [creditLimit] = useState(25000);
  const [credit, setCredit] = useState(() => Number(localStorage.getItem("flexiCredit") || 22500));
  const [points, setPoints] = useState(() => Number(localStorage.getItem("flexiPoints") || 2450));
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("flexiTx");
    return saved ? JSON.parse(saved) : REAL_TRANSACTIONS;
  });

  // Flow State
  const [paymentAmount, setPaymentAmount] = useState(2500);
  const [merchantName, setMerchantName] = useState("Sharma Super Store");
  const [merchantVpa, setMerchantVpa] = useState("sharma@flexipay");
  const [merchantCategory, setMerchantCategory] = useState("Groceries & Daily Essentials");
  const [paymentMethod, setPaymentMethod] = useState("later"); // "later" | "now"
  
  // Modals & Sheets
  const [selectedTx, setSelectedTx] = useState(null);
  const [repayModal, setRepayModal] = useState(false);
  const [repaySuccess, setRepaySuccess] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem("flexiCredit", credit);
    localStorage.setItem("flexiPoints", points);
    localStorage.setItem("flexiTx", JSON.stringify(transactions));
  }, [credit, points, transactions]);

  // Handle Payment Execution
  const handleConfirmPayment = () => {
    const newTx = {
      id: "TX-" + Math.floor(4291000000 + Math.random() * 900000),
      merchant: merchantName,
      vpa: merchantVpa,
      category: merchantCategory,
      icon: ShoppingBag,
      iconColor: "text-purple-600 bg-purple-50",
      amount: paymentAmount,
      type: paymentMethod === "later" ? "FlexiPay Pay Later" : "UPI Direct (HDFC Bank)",
      date: "Just now",
      status: "Successful",
      utr: String(Math.floor(400000000000 + Math.random() * 900000000000)),
      bankRef: "HDFC-UPI-" + Math.floor(1000000 + Math.random() * 9000000),
      rewardEarned: paymentMethod === "later" ? 25 : 5
    };

    if (paymentMethod === "later") {
      setCredit((c) => Math.max(0, c - paymentAmount));
      setPoints((p) => p + 25);
    } else {
      setPoints((p) => p + 5);
    }

    setTransactions((prev) => [newTx, ...prev]);
    navigate("/success");
  };

  // Repay Bill Flow
  const handleRepayBill = () => {
    const used = creditLimit - credit;
    if (used <= 0) return;

    setCredit(creditLimit);
    setPoints((p) => p + 50);

    const repaymentTx = {
      id: "RP-" + Math.floor(4291000000 + Math.random() * 900000),
      merchant: "FlexiPay Credit Limit Settlement",
      vpa: "autopay@flexipay",
      category: "Bill Settlement",
      icon: RefreshCw,
      iconColor: "text-emerald-600 bg-emerald-50",
      amount: used,
      type: "Repayment (HDFC Bank A/c ••••4812)",
      date: "Just now",
      status: "Successful",
      utr: String(Math.floor(400000000000 + Math.random() * 900000000000)),
      bankRef: "HDFC-NET-" + Math.floor(1000000 + Math.random() * 9000000),
      rewardEarned: 50
    };

    setTransactions((prev) => [repaymentTx, ...prev]);
    setRepaySuccess(true);
    setTimeout(() => {
      setRepaySuccess(false);
      setRepayModal(false);
    }, 1800);
  };

  const copyUpiId = () => {
    navigator.clipboard?.writeText("rahul@flexipay");
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const navItems = [
    { path: "/", label: "Home", icon: HomeIcon },
    { path: "/payments", label: "History", icon: Receipt },
    { path: "/rewards", label: "Rewards", icon: Gift },
    { path: "/profile", label: "Profile", icon: User }
  ];

  return (
    <div className="flex min-h-screen justify-center bg-slate-900/5 sm:py-6 font-sans">
      
      {/* Mobile Device Container (Responsive Frame on Desktop, Edge-to-Edge on Mobile) */}
      <div className="relative flex w-full max-w-md flex-col bg-white sm:rounded-3xl shadow-2xl min-h-screen sm:min-h-[844px] overflow-hidden border border-slate-200/80 pb-20">
        
        {/* Top App Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {location.pathname !== "/" ? (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 rounded-full px-2 py-1 text-slate-700 transition hover:bg-slate-100 active:scale-95"
                title="Go Back"
              >
                <ArrowLeft size={18} />
                <span className="text-xs font-semibold text-slate-600">Back</span>
              </button>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-700 font-bold text-white shadow-md ring-2 ring-purple-100">
                RS
              </div>
            )}

            <div>
              {location.pathname === "/" ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-slate-900 leading-tight">Rahul Sharma</span>
                    <ShieldCheck size={14} className="text-emerald-600" />
                  </div>
                  <button
                    onClick={copyUpiId}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-purple-700 transition"
                  >
                    <span>rahul@flexipay</span>
                    {copiedVpa ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  </button>
                </>
              ) : (
                <span className="font-extrabold text-slate-900 text-sm">
                  {location.pathname === "/scan"
                    ? "Scan & Pay"
                    : location.pathname === "/payment"
                    ? "Review & Pay"
                    : location.pathname === "/success"
                    ? "Payment Receipt"
                    : location.pathname === "/rewards"
                    ? "Rewards & Vouchers"
                    : location.pathname === "/qr"
                    ? "My Personal UPI QR"
                    : location.pathname === "/payments"
                    ? "Transaction History"
                    : "Profile & Bank Accounts"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-800 border border-purple-200/70 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              NPCI 2.0
            </span>
          </div>
        </header>

        {/* Content View with Smooth Enter Animation */}
        <main className="flex-1 px-4 py-4 animate-tab-enter">
          {location.pathname === "/" && (
            <HomeScreen
              credit={credit}
              creditLimit={creditLimit}
              transactions={transactions}
              points={points}
              navigate={navigate}
              onSelectTx={(tx) => setSelectedTx(tx)}
              onOpenRepay={() => setRepayModal(true)}
            />
          )}

          {location.pathname === "/scan" && (
            <ScanScreen
              amount={paymentAmount}
              setAmount={setPaymentAmount}
              merchantName={merchantName}
              setMerchantName={setMerchantName}
              merchantVpa={merchantVpa}
              setMerchantVpa={setMerchantVpa}
              setMerchantCategory={setMerchantCategory}
              navigate={navigate}
            />
          )}

          {location.pathname === "/payment" && (
            <PaymentScreen
              amount={paymentAmount}
              merchantName={merchantName}
              merchantVpa={merchantVpa}
              merchantCategory={merchantCategory}
              credit={credit}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onConfirm={handleConfirmPayment}
            />
          )}

          {location.pathname === "/success" && (
            <SuccessScreen
              amount={paymentAmount}
              merchantName={merchantName}
              merchantVpa={merchantVpa}
              paymentMethod={paymentMethod}
              navigate={navigate}
            />
          )}

          {location.pathname === "/rewards" && (
            <RewardsScreen points={points} setPoints={setPoints} />
          )}

          {location.pathname === "/qr" && <MyQrScreen />}

          {location.pathname === "/payments" && (
            <HistoryScreen
              transactions={transactions}
              onSelectTx={(tx) => setSelectedTx(tx)}
            />
          )}

          {location.pathname === "/profile" && (
            <ProfileScreen
              credit={credit}
              creditLimit={creditLimit}
              points={points}
              onOpenRepay={() => setRepayModal(true)}
            />
          )}
        </main>

        {/* Transaction Detail Bottom Sheet */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom duration-250">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-purple-50 p-2 text-purple-700">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Transaction Details</h3>
                    <p className="text-[11px] text-slate-500 font-mono">{selectedTx.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition"
                >
                  ✕
                </button>
              </div>

              <div className="my-4 text-center">
                <div className="text-3xl font-extrabold text-slate-900">
                  {formatRupee(selectedTx.amount)}
                </div>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 size={13} /> {selectedTx.status}
                </div>
              </div>

              <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-xs border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Paid to</span>
                  <span className="font-bold text-slate-900">{selectedTx.merchant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">UPI Reference (UTR)</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedTx.utr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode</span>
                  <span className="font-semibold text-purple-700">{selectedTx.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time</span>
                  <span className="text-slate-700">{selectedTx.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rewards Earned</span>
                  <span className="font-bold text-emerald-600">+{selectedTx.rewardEarned} Points</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="mt-4 w-full rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        )}

        {/* Repayment Modal */}
        {repayModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom duration-250">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-purple-100 p-2 text-purple-700">
                    <RefreshCw size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Settle FlexiPay Dues</h3>
                    <p className="text-[11px] text-slate-500">Restore your credit limit instantly</p>
                  </div>
                </div>
                <button
                  onClick={() => setRepayModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="my-4 rounded-2xl bg-purple-50/70 p-4 border border-purple-100 text-center">
                <div className="text-xs font-medium text-purple-900">Total Outstanding Amount</div>
                <div className="mt-1 text-3xl font-extrabold text-slate-900">
                  {formatRupee(creditLimit - credit)}
                </div>
                <div className="mt-2 text-[11px] text-slate-600">
                  Interest & Fees: <b>₹0.00 (0% Interest Applied)</b>
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-slate-200/80 p-3.5 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Building2 size={18} className="text-slate-600" />
                  <div>
                    <div className="font-bold text-slate-900">HDFC Bank •••• 4812</div>
                    <div className="text-[11px] text-slate-500">Primary UPI Bank Account</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>

              {repaySuccess ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-3.5 text-sm font-bold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={18} /> Dues Settled! Credit Restored to {formatRupee(creditLimit)}
                </div>
              ) : (
                <button
                  onClick={handleRepayBill}
                  disabled={creditLimit - credit <= 0}
                  className="w-full rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 py-3.5 font-bold text-white shadow-md hover:opacity-95 active:scale-98 transition disabled:opacity-50"
                >
                  Pay {formatRupee(creditLimit - credit)} via Bank UPI
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur-md">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative flex flex-col items-center gap-1 rounded-2xl px-4 py-1.5 transition active:scale-95 ${
                  active ? "text-purple-700" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] ${active ? "font-bold text-purple-700" : "font-medium"}`}>
                  {label}
                </span>
                {active && (
                  <span className="absolute -bottom-1 h-1 w-6 rounded-full bg-purple-700" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// HOME SCREEN
// ----------------------------------------------------
function HomeScreen({ credit, creditLimit, transactions, points, navigate, onSelectTx, onOpenRepay }) {
  const usedCredit = creditLimit - credit;
  const utilization = Math.round((usedCredit / creditLimit) * 100);

  return (
    <div className="space-y-5 pb-4">
      
      {/* Hero Virtual FlexiPay Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-950 p-5 text-white shadow-xl shadow-purple-950/20">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-purple-500/20 blur-xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white/15 p-1.5 backdrop-blur-xs">
              <CreditCard size={18} className="text-purple-200" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider text-purple-200 uppercase">
                FlexiPay Credit Card
              </span>
              <div className="text-[10px] text-purple-300 font-mono">•••• 8920</div>
            </div>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-100 backdrop-blur-xs border border-white/10">
            0% Interest 30-Day
          </span>
        </div>

        <div className="mt-4">
          <span className="text-xs text-purple-200 font-medium">Available Credit Limit</span>
          <div className="mt-0.5 text-3xl font-extrabold tracking-tight">
            {formatRupee(credit)}
          </div>
        </div>

        {/* Limit Meter */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-purple-200 font-medium">
            <span>Used: {formatRupee(usedCredit)} ({utilization}%)</span>
            <span>Total: {formatRupee(creditLimit)}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(4, utilization))}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-purple-200">
            <Calendar size={13} />
            <span>Bill Due: <b>5th Nov 2026</b></span>
          </div>
          {usedCredit > 0 ? (
            <button
              onClick={onOpenRepay}
              className="rounded-full bg-white px-3.5 py-1 text-xs font-bold text-purple-900 shadow transition hover:bg-purple-50 active:scale-95"
            >
              Pay Dues
            </button>
          ) : (
            <span className="text-xs font-medium text-emerald-300 flex items-center gap-1">
              <CheckCircle2 size={12} /> All dues clear
            </span>
          )}
        </div>
      </div>

      {/* UPI Quick Action Buttons */}
      <div>
        <div className="grid grid-cols-4 gap-2.5 text-center">
          <QuickActionItem
            icon={<ScanLine size={24} className="text-purple-700" />}
            label="Scan & Pay"
            primary
            onClick={() => navigate("/scan")}
          />
          <QuickActionItem
            icon={<QrCode size={24} className="text-indigo-600" />}
            label="My QR"
            onClick={() => navigate("/qr")}
          />
          <QuickActionItem
            icon={<Gift size={24} className="text-amber-600" />}
            label="Rewards"
            badge={`${points} pts`}
            onClick={() => navigate("/rewards")}
          />
          <QuickActionItem
            icon={<Receipt size={24} className="text-teal-600" />}
            label="History"
            onClick={() => navigate("/payments")}
          />
        </div>
      </div>

      {/* Credit Health / Score Pill */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs">
            785
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Experian Credit Score: Excellent</div>
            <div className="text-[11px] text-slate-500">Eligible for ₹10,000 limit enhancement</div>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-400" />
      </div>

      {/* Active Store Promo Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-purple-700 p-2 text-white shadow-xs">
            <Tag size={18} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-purple-700 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                Featured Store
              </span>
              <span className="text-xs font-bold text-purple-950">Sharma Super Store</span>
            </div>
            <div className="mt-1 text-sm font-bold text-slate-900 leading-tight">
              Flat 10% Cashback up to ₹100
            </div>
            <div className="mt-0.5 text-xs text-slate-600">
              Min bill ₹1,000 via FlexiPay Pay Later • Instant cashback to wallet
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/scan")}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-purple-700 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-800 transition"
        >
          <span>Pay at Store (Scan QR)</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* Recent Transactions List */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
          <button
            onClick={() => navigate("/payments")}
            className="text-xs font-bold text-purple-700 hover:underline"
          >
            View all ({transactions.length})
          </button>
        </div>

        <div className="space-y-2">
          {transactions.slice(0, 4).map((tx) => {
            const Icon = tx.icon || ShoppingBag;
            return (
              <div
                key={tx.id}
                onClick={() => onSelectTx(tx)}
                className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-2xs hover:border-purple-200 transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${tx.iconColor || "text-purple-700 bg-purple-50"}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm leading-tight">
                      {tx.merchant}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="font-medium text-purple-700">{tx.type}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    -{formatRupee(tx.amount)}
                  </div>
                  <div className="mt-0.5 text-[10px] font-semibold text-emerald-600">
                    {tx.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuickActionItem({ icon, label, badge, primary, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center rounded-2xl border p-3 transition active:scale-95 ${
        primary
          ? "border-purple-200 bg-purple-50/70 shadow-xs hover:bg-purple-100/70"
          : "border-slate-200/70 bg-white shadow-2xs hover:border-purple-100 hover:bg-slate-50/60"
      }`}
    >
      {badge && (
        <span className="absolute -top-1.5 right-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-bold text-white shadow-xs">
          {badge}
        </span>
      )}
      <div className="mb-1.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-2xs group-hover:scale-105 transition">
        {icon}
      </div>
      <span className="text-[11px] font-semibold text-slate-800 leading-tight">
        {label}
      </span>
    </button>
  );
}

// ----------------------------------------------------
// SCAN SCREEN (Real QR Presets & Live Detection)
// ----------------------------------------------------
function ScanScreen({ amount, setAmount, merchantName, setMerchantName, merchantVpa, setMerchantVpa, setMerchantCategory, navigate }) {
  const [selectedPresetMerchant, setSelectedPresetMerchant] = useState("sharma");

  const merchantOptions = [
    { id: "sharma", name: "Sharma Super Store", vpa: "sharma@flexipay", category: "Groceries & Daily Essentials", defAmt: 2500 },
    { id: "zepto", name: "Zepto 10-Min Groceries", vpa: "zepto@icici", category: "Quick Commerce", defAmt: 650 },
    { id: "croma", name: "Croma Retail Electronics", vpa: "croma@kotak", category: "Electronics & Gadgets", defAmt: 4200 }
  ];

  const selectMerchant = (m) => {
    setSelectedPresetMerchant(m.id);
    setMerchantName(m.name);
    setMerchantVpa(m.vpa);
    setMerchantCategory(m.category);
    setAmount(m.defAmt);
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="text-center">
        <h1 className="text-base font-bold text-slate-900">Scan Any UPI QR Code</h1>
        <p className="text-xs text-slate-500">Fast checkout with 30-Day Pay Later</p>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative mx-auto mt-1 flex h-64 w-64 flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-slate-300 bg-slate-950 text-white shadow-inner">
        <div className="pointer-events-none absolute left-4 top-4 h-8 w-8 border-l-4 border-t-4 border-purple-500 rounded-tl-lg" />
        <div className="pointer-events-none absolute right-4 top-4 h-8 w-8 border-r-4 border-t-4 border-purple-500 rounded-tr-lg" />
        <div className="pointer-events-none absolute bottom-4 left-4 h-8 w-8 border-l-4 border-b-4 border-purple-500 rounded-bl-lg" />
        <div className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 border-r-4 border-b-4 border-purple-500 rounded-br-lg" />

        <div className="absolute inset-x-8 top-12 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" />
        <ScanLine size={56} className="text-purple-400 opacity-70" />
        <p className="mt-2 text-xs font-medium text-slate-300">Point at Merchant QR</p>
      </div>

      {/* Select Store Shortcut */}
      <div>
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
          Or Select Nearby Demo Merchant
        </label>
        <div className="space-y-2">
          {merchantOptions.map((m) => (
            <div
              key={m.id}
              onClick={() => selectMerchant(m)}
              className={`flex items-center justify-between rounded-2xl border p-3 cursor-pointer transition ${
                selectedPresetMerchant === m.id
                  ? "border-purple-600 bg-purple-50/70 ring-1 ring-purple-500 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="text-xs font-bold text-slate-900">{m.name}</div>
                <div className="text-[11px] text-slate-500">{m.vpa} • {m.category}</div>
              </div>
              <span className="text-xs font-extrabold text-purple-700">
                {formatRupee(m.defAmt)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Amount Input */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <label className="text-xs font-semibold text-slate-700">Bill Amount to Pay</label>
        <div className="mt-1.5 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus-within:border-purple-600 focus-within:bg-white">
          <span className="text-xl font-bold text-slate-500 mr-2">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full text-2xl font-extrabold text-slate-900 outline-none bg-transparent"
            placeholder="0"
          />
        </div>

        <div className="mt-2.5 flex gap-1.5">
          {[250, 500, 1000, 2500].map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className={`flex-1 rounded-xl py-1 text-xs font-bold border transition ${
                amount === preset
                  ? "bg-purple-700 text-white border-purple-700"
                  : "bg-white text-slate-700 border-slate-200 hover:border-purple-200"
              }`}
            >
              ₹{preset}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate("/payment")}
        disabled={!amount || amount <= 0}
        className="w-full rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 py-3.5 font-bold text-white shadow-md hover:opacity-95 active:scale-98 transition disabled:opacity-50"
      >
        Proceed to Pay {formatRupee(amount)}
      </button>
    </div>
  );
}

// ----------------------------------------------------
// PAYMENT CHECKOUT SCREEN
// ----------------------------------------------------
function PaymentScreen({ amount, merchantName, merchantVpa, merchantCategory, credit, paymentMethod, setPaymentMethod, onConfirm }) {
  const isEligibleForLater = credit >= amount;

  return (
    <div className="space-y-4 pb-6">
      
      {/* Merchant Header Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 font-extrabold text-lg mb-2">
          {merchantName[0]}
        </div>
        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-slate-700">
          <span>Paying to</span>
          <span className="font-bold text-slate-900">{merchantName}</span>
          <CheckCircle2 size={14} className="text-emerald-600" />
        </div>
        <div className="mt-2 text-4xl font-extrabold text-slate-900 tracking-tight">
          {formatRupee(amount)}
        </div>
        <div className="mt-1 text-xs text-slate-500">{merchantVpa} • {merchantCategory}</div>
      </div>

      {/* Method Selector */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Choose How to Pay
        </h2>

        <div className="space-y-2.5">
          {/* FlexiPay Pay Later Option */}
          <label
            onClick={() => setPaymentMethod("later")}
            className={`relative block cursor-pointer rounded-2xl border p-4 transition ${
              paymentMethod === "later"
                ? "border-purple-600 bg-purple-50/70 ring-1 ring-purple-600 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="payMethod"
                checked={paymentMethod === "later"}
                onChange={() => setPaymentMethod("later")}
                className="mt-1 h-4 w-4 text-purple-700 accent-purple-700"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">FlexiPay Pay Later</span>
                  <span className="rounded bg-gradient-to-r from-purple-700 to-indigo-700 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                    0% Interest
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  Pay ₹0 today • Due on 5th Nov 2026
                </p>
                <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-700 border-t border-purple-100 pt-2">
                  <span>Available: <b>{formatRupee(credit)}</b></span>
                  <span className="text-emerald-600 font-bold">+25 Reward Points</span>
                </div>
              </div>
            </div>
          </label>

          {/* Direct Bank Account UPI */}
          <label
            onClick={() => setPaymentMethod("now")}
            className={`block cursor-pointer rounded-2xl border p-4 transition ${
              paymentMethod === "now"
                ? "border-purple-600 bg-purple-50/70 ring-1 ring-purple-600 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="payMethod"
                checked={paymentMethod === "now"}
                onChange={() => setPaymentMethod("now")}
                className="mt-1 h-4 w-4 text-purple-700 accent-purple-700"
              />
              <div>
                <div className="font-bold text-slate-900 text-sm">HDFC Bank •••• 4812</div>
                <p className="mt-0.5 text-xs text-slate-600">Direct debit via UPI PIN</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>NPCI 256-bit Encrypted</span>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      <button
        onClick={onConfirm}
        disabled={paymentMethod === "later" && !isEligibleForLater}
        className="w-full rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 py-4 font-bold text-white shadow-lg shadow-purple-900/20 hover:opacity-95 active:scale-98 transition disabled:opacity-50"
      >
        {paymentMethod === "later"
          ? `Confirm & Pay Later ${formatRupee(amount)}`
          : `Pay ${formatRupee(amount)} with UPI PIN`}
      </button>
    </div>
  );
}

// ----------------------------------------------------
// PAYMENT SUCCESS SCREEN
// ----------------------------------------------------
function SuccessScreen({ amount, merchantName, merchantVpa, paymentMethod, navigate }) {
  const utr = String(Math.floor(400000000000 + Math.random() * 900000000000));

  return (
    <div className="pt-4 pb-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-250">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
        <CheckCircle2 size={56} className="text-emerald-600" />
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Payment Successful</h1>
        <p className="text-xs text-slate-500">UPI Reference (UTR): {utr}</p>
        <div className="mt-2 text-4xl font-extrabold text-slate-900 tracking-tight">
          {formatRupee(amount)}
        </div>
        <p className="mt-0.5 text-sm font-bold text-slate-800">{merchantName}</p>
        <p className="text-xs text-slate-500">{merchantVpa}</p>
      </div>

      {/* Receipt Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-left space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Payment Mode</span>
          <span className="font-bold text-slate-900">
            {paymentMethod === "later" ? "FlexiPay Pay Later" : "UPI Direct (HDFC Bank)"}
          </span>
        </div>
        {paymentMethod === "later" && (
          <div className="flex justify-between">
            <span className="text-slate-500">Repayment Date</span>
            <span className="font-bold text-purple-700">5th Nov 2026 (0% Interest)</span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200/60 pt-2">
          <span className="text-slate-500">Reward Credited</span>
          <span className="font-bold text-emerald-600">+25 FlexiPay Reward Points</span>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <button
          onClick={() => navigate("/")}
          className="w-full rounded-2xl bg-purple-700 py-3.5 font-bold text-white shadow-md hover:bg-purple-800 transition"
        >
          Done (Go to Home)
        </button>
        <button
          onClick={() => navigate("/payments")}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          View in Transaction History
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// REWARDS SCREEN (Interactive Scratch & Vouchers)
// ----------------------------------------------------
function RewardsScreen({ points, setPoints }) {
  const [vouchers, setVouchers] = useState([
    { id: 1, title: "₹50 Instant Cashback", req: 500, code: "FLEXI50", redeemed: false },
    { id: 2, title: "₹100 Sharma Store Discount", req: 900, code: "SHARMA100", redeemed: false },
    { id: 3, title: "₹200 Zepto Grocery Coupon", req: 1800, code: "ZEPTO200", redeemed: false }
  ]);
  const [copiedCode, setCopiedCode] = useState("");

  const redeem = (v) => {
    if (points < v.req || v.redeemed) return;
    setPoints((p) => p - v.req);
    setVouchers((prev) =>
      prev.map((item) => (item.id === v.id ? { ...item, redeemed: true } : item))
    );
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Points Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-5 text-white shadow-lg shadow-amber-900/10">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-100">
          <Sparkles size={16} /> FlexiPay Rewards Club
        </div>
        <div className="mt-2 text-3xl font-extrabold">{points.toLocaleString("en-IN")}</div>
        <p className="text-xs text-amber-100 mt-0.5">Earned across 12 UPI & Pay Later transactions</p>
      </div>

      <div>
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
          Available Brand Vouchers
        </h2>
        <div className="space-y-2.5">
          {vouchers.map((v) => (
            <div
              key={v.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{v.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Requires {v.req} Points</div>
                </div>

                <button
                  disabled={points < v.req || v.redeemed}
                  onClick={() => redeem(v)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    v.redeemed
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                      : points >= v.req
                      ? "bg-purple-700 text-white hover:bg-purple-800 shadow-xs"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {v.redeemed ? "Unlocked" : "Redeem"}
                </button>
              </div>

              {v.redeemed && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-purple-50 p-2.5 text-xs border border-purple-100">
                  <span className="font-mono font-bold text-purple-900">Code: {v.code}</span>
                  <button
                    onClick={() => copyCode(v.code)}
                    className="flex items-center gap-1 font-bold text-purple-700 hover:underline"
                  >
                    {copiedCode === v.code ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedCode === v.code ? "Copied" : "Copy"}</span>
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
// MY PERSONAL QR SCREEN
// ----------------------------------------------------
function MyQrScreen() {
  return (
    <div className="pt-2 pb-6 text-center space-y-4">
      <div>
        <h1 className="text-base font-bold text-slate-900">Receive Money into Bank</h1>
        <p className="text-xs text-slate-500">Scan via any UPI app (GPay, PhonePe, Paytm)</p>
      </div>

      <div className="mx-auto w-fit rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md">
        <QRCodeCanvas
          value="upi://pay?pa=rahul@flexipay&pn=Rahul%20Sharma&cu=INR"
          size={190}
        />
        <div className="mt-4">
          <div className="font-extrabold text-slate-900 text-base">Rahul Sharma</div>
          <div className="text-xs font-medium text-slate-500 font-mono">rahul@flexipay</div>
          <div className="mt-2 text-[11px] text-slate-600">Linked to: HDFC Bank •••• 4812</div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
          <ShieldCheck size={12} /> Verified NPCI Virtual ID
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// HISTORY SCREEN (Search, Category Filters, Details)
// ----------------------------------------------------
function HistoryScreen({ transactions, onSelectTx }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "later"
        ? t.type.includes("Later")
        : t.type.includes("UPI");
    const matchesSearch =
      t.merchant.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900">All Transactions</h1>
          <p className="text-xs text-slate-500">Showing {filtered.length} settled records</p>
        </div>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search merchant or category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium outline-none focus:border-purple-600 shadow-2xs"
      />

      {/* Filter Tabs */}
      <div className="flex gap-1.5 border-b border-slate-100 pb-2">
        {[
          { id: "all", label: "All Modes" },
          { id: "later", label: "Pay Later" },
          { id: "upi", label: "Direct UPI" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              filter === tab.id
                ? "bg-purple-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((tx) => {
          const Icon = tx.icon || ShoppingBag;
          return (
            <div
              key={tx.id}
              onClick={() => onSelectTx(tx)}
              className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-2xs hover:border-purple-200 transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${tx.iconColor || "text-purple-700 bg-purple-50"}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm leading-tight">
                    {tx.merchant}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {tx.date} • <span className="font-medium text-purple-700">{tx.type}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">
                  -{formatRupee(tx.amount)}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600">
                  {tx.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PROFILE SCREEN (Bank Accounts & KYC)
// ----------------------------------------------------
function ProfileScreen({ credit, creditLimit, points, onOpenRepay }) {
  return (
    <div className="space-y-4 pb-6">
      {/* User Header */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 text-center shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-purple-800 to-indigo-700 text-xl font-bold text-white shadow-md">
          RS
        </div>
        <h2 className="mt-3 text-base font-extrabold text-slate-900">Rahul Sharma</h2>
        <p className="text-xs text-slate-500 font-mono">rahul@flexipay • +91 98765 43210</p>
        <div className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-100">
          <ShieldCheck size={13} /> Full KYC Verified (Aadhaar + PAN)
        </div>
      </div>

      {/* Linked Bank Accounts */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Linked UPI Bank Accounts
        </div>
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-2 text-purple-700">
              <Building2 size={18} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">HDFC Bank Ltd.</div>
              <div className="text-[11px] text-slate-500">Savings A/c •••• 4812 • IFSC: HDFC0001234</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
            Primary
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
              <Building2 size={18} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">State Bank of India</div>
              <div className="text-[11px] text-slate-500">Savings A/c •••• 8912 • IFSC: SBIN0004521</div>
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-500">Secondary</span>
        </div>
      </div>

      {/* Credit Status & Bill Repayment */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">FlexiPay Available Limit</div>
            <div className="text-base font-extrabold text-slate-900">
              {formatRupee(credit)} of {formatRupee(creditLimit)}
            </div>
            <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
              Next Statement: 1st Nov 2026
            </div>
          </div>
          {creditLimit - credit > 0 && (
            <button
              onClick={onOpenRepay}
              className="rounded-xl bg-purple-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-800 transition"
            >
              Pay Dues
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ROOT MOUNT
// ----------------------------------------------------
createRoot(document.getElementById("root")).render(
  <HashRouter>
    <App />
  </HashRouter>
);
