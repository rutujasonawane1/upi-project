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
  Info
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import "./index.css";

const DEFAULT_TRANSACTIONS = [
  { id: "TX1092", merchant: "Sharma Super Store", category: "Supermarket", amount: 2500, type: "FlexiPay Pay Later", status: "Successful", date: "Just now" },
  { id: "TX1091", merchant: "Cafe Coffee Day", category: "Food & Dining", amount: 450, type: "UPI Direct", status: "Successful", date: "Today, 11:20 AM" },
  { id: "TX1090", merchant: "Reliance Fresh", category: "Groceries", amount: 1200, type: "FlexiPay Pay Later", status: "Successful", date: "Yesterday" },
  { id: "TX1089", merchant: "Amazon India", category: "Shopping", amount: 850, type: "UPI Direct", status: "Successful", date: "12 Oct 2026" }
];

function formatRupee(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [creditLimit] = useState(25000);
  const [credit, setCredit] = useState(() => Number(localStorage.getItem("flexiCredit") || 22500));
  const [points, setPoints] = useState(() => Number(localStorage.getItem("flexiPoints") || 2450));
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("flexiTx");
    return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
  });

  const [scanDetected, setScanDetected] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("later"); // "later" | "now"
  const [paymentAmount, setPaymentAmount] = useState(2500);
  const [merchantName, setMerchantName] = useState("Sharma Super Store");
  const [merchantVpa, setMerchantVpa] = useState("sharma@flexipay");
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [repayModal, setRepayModal] = useState(false);
  const [repaySuccess, setRepaySuccess] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("flexiCredit", credit);
    localStorage.setItem("flexiPoints", points);
    localStorage.setItem("flexiTx", JSON.stringify(transactions));
  }, [credit, points, transactions]);

  // Handle Payment
  const processPayment = () => {
    const newTx = {
      id: "TX" + Math.floor(1000 + Math.random() * 9000),
      merchant: merchantName,
      category: "Retail Merchant",
      amount: paymentAmount,
      type: paymentMethod === "later" ? "FlexiPay Pay Later" : "UPI Direct (HDFC)",
      status: "Successful",
      date: "Just now"
    };

    if (paymentMethod === "later") {
      setCredit((c) => Math.max(0, c - paymentAmount));
      setPoints((p) => p + 25);
    }
    setTransactions((prev) => [newTx, ...prev]);
    navigate("/success");
  };

  // Repay Credit Bill
  const handleRepay = () => {
    const used = creditLimit - credit;
    if (used <= 0) return;
    setCredit(creditLimit);
    setPoints((p) => p + 50); // bonus points for timely repayment
    setTransactions((prev) => [
      {
        id: "RP" + Math.floor(1000 + Math.random() * 9000),
        merchant: "FlexiPay Credit Settlement",
        category: "Bill Repayment",
        amount: used,
        type: "Repayment (HDFC Bank)",
        status: "Successful",
        date: "Just now"
      },
      ...prev
    ]);
    setRepaySuccess(true);
    setTimeout(() => {
      setRepaySuccess(false);
      setRepayModal(false);
    }, 1500);
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
    <div className="flex min-h-screen justify-center bg-slate-100 font-sans">
      <div className="relative flex w-full max-w-md flex-col bg-white shadow-xl min-h-screen pb-20">
        
        {/* Top App Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {location.pathname !== "/" ? (
              <button
                onClick={() => navigate(-1)}
                className="rounded-full p-1.5 text-slate-700 transition hover:bg-slate-100 active:scale-95"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 font-bold text-white shadow-sm ring-2 ring-purple-100">
                RS
              </div>
            )}
            <div>
              {location.pathname === "/" ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900">Rahul Sharma</span>
                    <ShieldCheck size={15} className="text-emerald-600" />
                  </div>
                  <button
                    onClick={copyUpiId}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-purple-700"
                  >
                    <span>rahul@flexipay</span>
                    {copiedVpa ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  </button>
                </>
              ) : (
                <span className="font-bold text-slate-900">
                  {location.pathname === "/scan"
                    ? "Scan & Pay"
                    : location.pathname === "/payment"
                    ? "Confirm Payment"
                    : location.pathname === "/success"
                    ? "Transaction Status"
                    : location.pathname === "/rewards"
                    ? "Rewards & Cashback"
                    : location.pathname === "/qr"
                    ? "Receive UPI"
                    : location.pathname === "/payments"
                    ? "Payment History"
                    : "Account & Settings"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-purple-700 border border-purple-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              UPI 2.0
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-4">
          {location.pathname === "/" && (
            <HomeScreen
              credit={credit}
              creditLimit={creditLimit}
              transactions={transactions}
              points={points}
              navigate={navigate}
              onOpenRepay={() => setRepayModal(true)}
            />
          )}

          {location.pathname === "/scan" && (
            <ScanScreen
              scanDetected={scanDetected}
              setScanDetected={setScanDetected}
              amount={paymentAmount}
              setAmount={setPaymentAmount}
              merchantName={merchantName}
              merchantVpa={merchantVpa}
              navigate={navigate}
            />
          )}

          {location.pathname === "/payment" && (
            <PaymentScreen
              amount={paymentAmount}
              merchantName={merchantName}
              merchantVpa={merchantVpa}
              credit={credit}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onConfirm={processPayment}
            />
          )}

          {location.pathname === "/success" && (
            <SuccessScreen
              amount={paymentAmount}
              merchantName={merchantName}
              paymentMethod={paymentMethod}
              navigate={navigate}
            />
          )}

          {location.pathname === "/rewards" && (
            <RewardsScreen points={points} setPoints={setPoints} />
          )}

          {location.pathname === "/qr" && <MyQrScreen />}

          {location.pathname === "/payments" && (
            <HistoryScreen transactions={transactions} />
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

        {/* Repay Modal */}
        {repayModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-purple-100 p-2 text-purple-700">
                    <RefreshCw size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Settle Pay Later Bill</h3>
                    <p className="text-xs text-slate-500">Restore your Available Credit</p>
                  </div>
                </div>
                <button
                  onClick={() => setRepayModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="my-5 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="text-xs text-slate-500">Outstanding Bill Amount</div>
                <div className="mt-1 text-3xl font-extrabold text-slate-900">
                  {formatRupee(creditLimit - credit)}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200/60 pt-2.5">
                  <span>Repay from:</span>
                  <span className="font-semibold text-slate-800">HDFC Bank •••• 4812</span>
                </div>
              </div>

              {repaySuccess ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3.5 text-sm font-bold text-emerald-700">
                  <CheckCircle2 size={18} /> Bill Paid Successfully!
                </div>
              ) : (
                <button
                  onClick={handleRepay}
                  disabled={creditLimit - credit <= 0}
                  className="w-full rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 py-3.5 font-bold text-white shadow-md transition hover:opacity-95 active:scale-98 disabled:opacity-50"
                >
                  Pay {formatRupee(creditLimit - credit)} Now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur-md">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 transition ${
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
function HomeScreen({ credit, creditLimit, transactions, points, navigate, onOpenRepay }) {
  const usedCredit = creditLimit - credit;
  const utilization = Math.round((usedCredit / creditLimit) * 100);

  return (
    <div className="space-y-5 pb-6">
      {/* Hero Virtual FlexiPay Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-800 via-purple-700 to-indigo-900 p-5 text-white shadow-lg shadow-purple-900/20">
        {/* Subtle decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-xl"></div>
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-purple-500/20 blur-xl"></div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/15 p-1.5 backdrop-blur-xs">
              <Wallet size={16} className="text-purple-200" />
            </div>
            <span className="text-xs font-semibold tracking-wider text-purple-100 uppercase">
              FlexiPay Credit Limit
            </span>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-100 backdrop-blur-xs">
            0% Interest
          </span>
        </div>

        <div className="mt-4">
          <span className="text-xs text-purple-200 font-medium">Available to Spend</span>
          <div className="mt-0.5 text-3xl font-extrabold tracking-tight">
            {formatRupee(credit)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-purple-200">
            <span>Used: {formatRupee(usedCredit)} ({utilization}%)</span>
            <span>Total: {formatRupee(creditLimit)}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
              style={{ width: `${Math.min(100, utilization)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-purple-200">
            <Clock3 size={13} />
            <span>Next Due: <b>5th Nov 2026</b></span>
          </div>
          {usedCredit > 0 ? (
            <button
              onClick={onOpenRepay}
              className="rounded-full bg-white px-3.5 py-1 text-xs font-bold text-purple-900 shadow transition hover:bg-purple-50 active:scale-95"
            >
              Pay Bill
            </button>
          ) : (
            <span className="text-xs font-medium text-emerald-300">✓ All dues clear</span>
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
            label="Receive QR"
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

      {/* Active Store Offer Card */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-purple-600 p-2.5 text-white shadow-sm">
            <Tag size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-purple-700 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                Featured Offer
              </span>
              <span className="text-xs font-semibold text-purple-900">Sharma Super Store</span>
            </div>
            <div className="mt-1 text-sm font-bold text-slate-900">
              Flat 10% Cashback up to ₹100
            </div>
            <div className="mt-0.5 text-xs text-slate-600">
              On minimum purchase of ₹1,000 using FlexiPay Pay Later
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/scan")}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-white py-2 text-xs font-bold text-purple-800 shadow-xs border border-purple-200/60 hover:bg-purple-50"
        >
          <span>Pay at Store</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* Recent Transactions List */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
          <button
            onClick={() => navigate("/payments")}
            className="text-xs font-semibold text-purple-700 hover:underline"
          >
            See all
          </button>
        </div>

        <div className="space-y-2">
          {transactions.slice(0, 4).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs hover:border-purple-200 transition"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 font-bold text-purple-700">
                  {tx.merchant[0]}
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
          ))}
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
          : "border-slate-100 bg-white shadow-2xs hover:border-purple-100 hover:bg-slate-50/50"
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
// SCAN SCREEN
// ----------------------------------------------------
function ScanScreen({ scanDetected, setScanDetected, amount, setAmount, merchantName, merchantVpa, navigate }) {
  return (
    <div className="space-y-4 pb-6">
      <div className="text-center">
        <h1 className="text-lg font-bold text-slate-900">Scan & Pay Any UPI QR</h1>
        <p className="text-xs text-slate-500">Supports Sharma Super Store, BharatPe, Paytm, PhonePe</p>
      </div>

      {/* Camera Viewfinder Frame */}
      <div className="relative mx-auto mt-2 flex h-72 w-72 flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-slate-300 bg-slate-950 text-white shadow-inner">
        {/* Corner Brackets */}
        <div className="pointer-events-none absolute left-4 top-4 h-8 w-8 border-l-4 border-t-4 border-purple-500 rounded-tl-lg" />
        <div className="pointer-events-none absolute right-4 top-4 h-8 w-8 border-r-4 border-t-4 border-purple-500 rounded-tr-lg" />
        <div className="pointer-events-none absolute bottom-4 left-4 h-8 w-8 border-l-4 border-b-4 border-purple-500 rounded-bl-lg" />
        <div className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 border-r-4 border-b-4 border-purple-500 rounded-br-lg" />

        {/* Animated Scanning Beam */}
        <div className="absolute inset-x-8 top-12 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" />

        <ScanLine size={64} className="text-purple-400 opacity-60" />
        <p className="mt-3 text-xs font-medium text-slate-300">Align QR within frame</p>
      </div>

      {!scanDetected ? (
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setScanDetected(true)}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 py-3.5 font-bold text-white shadow-md hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            <span>Scan Demo Merchant QR</span>
          </button>
          <p className="text-center text-[11px] text-slate-500">
            Simulates scanning counter QR at Sharma Super Store
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-purple-200 bg-purple-50/50 p-5 shadow-xs space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-700 text-white font-bold">
                SS
              </div>
              <div>
                <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                  {merchantName}
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </div>
                <div className="text-xs text-slate-500">{merchantVpa}</div>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Verified UPI
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Enter Payment Amount</label>
            <div className="mt-1.5 flex items-center rounded-2xl border border-purple-200 bg-white px-4 py-3 focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-100">
              <span className="text-xl font-bold text-slate-500 mr-2">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full text-2xl font-extrabold text-slate-900 outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Preset amount pills */}
          <div className="flex gap-2">
            {[500, 1000, 2500, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={`flex-1 rounded-xl py-1.5 text-xs font-bold border transition ${
                  amount === preset
                    ? "bg-purple-700 text-white border-purple-700"
                    : "bg-white text-slate-700 border-slate-200 hover:border-purple-200"
                }`}
              >
                ₹{preset}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate("/payment")}
            disabled={!amount || amount <= 0}
            className="w-full rounded-2xl bg-purple-700 py-3.5 font-bold text-white shadow-md hover:bg-purple-800 active:scale-98 transition disabled:opacity-50"
          >
            Proceed to Pay {formatRupee(amount)}
          </button>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// PAYMENT CHECKOUT SCREEN
// ----------------------------------------------------
function PaymentScreen({ amount, merchantName, merchantVpa, credit, paymentMethod, setPaymentMethod, onConfirm }) {
  const isEligibleForLater = credit >= amount;

  return (
    <div className="space-y-5 pb-6">
      {/* Merchant Header Card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 font-bold text-lg mb-2">
          SS
        </div>
        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-slate-700">
          <span>Paying to</span>
          <span className="font-bold text-slate-900">{merchantName}</span>
          <CheckCircle2 size={14} className="text-emerald-600" />
        </div>
        <div className="mt-2 text-4xl font-extrabold text-slate-900 tracking-tight">
          {formatRupee(amount)}
        </div>
        <div className="mt-1 text-xs text-slate-500">{merchantVpa}</div>
      </div>

      {/* Payment Method Selector */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Select Payment Method
        </h2>

        <div className="space-y-3">
          {/* FlexiPay Pay Later Option */}
          <label
            onClick={() => setPaymentMethod("later")}
            className={`relative block cursor-pointer rounded-2xl border p-4 transition ${
              paymentMethod === "later"
                ? "border-purple-600 bg-purple-50/60 ring-2 ring-purple-100"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "later"}
                  onChange={() => setPaymentMethod("later")}
                  className="mt-1 h-4 w-4 text-purple-700 accent-purple-700"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">FlexiPay Pay Later</span>
                    <span className="rounded bg-gradient-to-r from-purple-700 to-indigo-700 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                      Recommended
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Pay ₹0 today • 30 days interest-free repayment
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-600 font-medium">
                    <span>Available Limit: <b>{formatRupee(credit)}</b></span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">+25 Reward Pts</span>
                  </div>
                </div>
              </div>
            </div>
            {!isEligibleForLater && (
              <div className="mt-2 text-[11px] font-semibold text-rose-600">
                ⚠ Exceeds available limit of {formatRupee(credit)}. Please pay via Bank UPI.
              </div>
            )}
          </label>

          {/* Direct Bank Account UPI */}
          <label
            onClick={() => setPaymentMethod("now")}
            className={`block cursor-pointer rounded-2xl border p-4 transition ${
              paymentMethod === "now"
                ? "border-purple-600 bg-purple-50/60 ring-2 ring-purple-100"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "now"}
                onChange={() => setPaymentMethod("now")}
                className="mt-1 h-4 w-4 text-purple-700 accent-purple-700"
              />
              <div>
                <div className="font-bold text-slate-900 text-sm">HDFC Bank •••• 4812</div>
                <p className="mt-0.5 text-xs text-slate-600">Direct instant debit via UPI PIN</p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>NPCI Secured Transaction</span>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Sticky Confirm Button */}
      <div className="pt-2">
        <button
          onClick={onConfirm}
          disabled={paymentMethod === "later" && !isEligibleForLater}
          className="w-full rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 py-4 font-bold text-white shadow-lg shadow-purple-900/20 hover:opacity-95 active:scale-98 transition disabled:opacity-50"
        >
          {paymentMethod === "later"
            ? `Authorize ${formatRupee(amount)} via Pay Later`
            : `Pay ${formatRupee(amount)} via Bank UPI`}
        </button>
        <p className="mt-2.5 text-center text-[11px] text-slate-500">
          By proceeding, you authorize this transaction under NPCI UPI guidelines.
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAYMENT SUCCESS SCREEN
// ----------------------------------------------------
function SuccessScreen({ amount, merchantName, paymentMethod, navigate }) {
  const txId = "UPI" + Math.floor(100000000000 + Math.random() * 900000000000);

  return (
    <div className="pt-6 pb-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
        <CheckCircle2 size={56} className="text-emerald-600" />
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Payment Successful</h1>
        <p className="mt-0.5 text-xs text-slate-500">Transaction ID: {txId}</p>
        <div className="mt-3 text-4xl font-extrabold text-slate-900 tracking-tight">
          {formatRupee(amount)}
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-700">Paid to {merchantName}</p>
      </div>

      {/* Receipt Details Card */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left space-y-2.5 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Payment Mode</span>
          <span className="font-bold text-slate-900">
            {paymentMethod === "later" ? "FlexiPay Pay Later" : "UPI Direct (HDFC Bank)"}
          </span>
        </div>
        {paymentMethod === "later" && (
          <div className="flex justify-between text-slate-600">
            <span>Bill Repayment Date</span>
            <span className="font-bold text-purple-700">5th Nov 2026</span>
          </div>
        )}
        <div className="flex justify-between text-slate-600">
          <span>Rewards Earned</span>
          <span className="font-bold text-emerald-600">+25 FlexiPay Points</span>
        </div>
      </div>

      <div className="space-y-2.5 pt-2">
        <button
          onClick={() => navigate("/")}
          className="w-full rounded-2xl bg-purple-700 py-3.5 font-bold text-white shadow-md hover:bg-purple-800 transition"
        >
          Return to Home
        </button>
        <button
          onClick={() => navigate("/rewards")}
          className="w-full rounded-2xl border border-purple-200 bg-white py-3 font-semibold text-purple-700 hover:bg-purple-50 transition"
        >
          View My Reward Points
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// REWARDS SCREEN
// ----------------------------------------------------
function RewardsScreen({ points, setPoints }) {
  const [vouchers, setVouchers] = useState([
    { id: 1, title: "₹50 Instant Cashback", req: 500, code: "CASH50", redeemed: false },
    { id: 2, title: "₹100 Sharma Store Discount", req: 900, code: "SHARMA100", redeemed: false },
    { id: 3, title: "₹200 Amazon Gift Voucher", req: 1800, code: "AMZ200", redeemed: false }
  ]);

  const redeem = (v) => {
    if (points < v.req || v.redeemed) return;
    setPoints((p) => p - v.req);
    setVouchers((prev) =>
      prev.map((item) => (item.id === v.id ? { ...item, redeemed: true } : item))
    );
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Points Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-5 text-white shadow-lg shadow-amber-900/10">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-100">
          <Sparkles size={16} /> FlexiPay Rewards Club
        </div>
        <div className="mt-2 text-3xl font-extrabold">{points.toLocaleString("en-IN")}</div>
        <p className="text-xs text-amber-100 mt-0.5">Available Reward Points (1 Pt = ₹0.20)</p>
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3">Redeemable Offers</h2>
        <div className="space-y-3">
          {vouchers.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs"
            >
              <div>
                <div className="font-bold text-slate-900 text-sm">{v.title}</div>
                <div className="mt-0.5 text-xs text-slate-500">Requires {v.req} Points</div>
                {v.redeemed && (
                  <div className="mt-1.5 inline-block rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    Code: {v.code}
                  </div>
                )}
              </div>
              <button
                disabled={points < v.req || v.redeemed}
                onClick={() => redeem(v)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  v.redeemed
                    ? "bg-slate-100 text-slate-400 cursor-default"
                    : points >= v.req
                    ? "bg-purple-700 text-white hover:bg-purple-800"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {v.redeemed ? "Redeemed" : "Redeem"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MY QR SCREEN
// ----------------------------------------------------
function MyQrScreen() {
  return (
    <div className="pt-2 pb-6 text-center space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-900">My Personal UPI QR</h1>
        <p className="text-xs text-slate-500">Scan using any UPI app to receive money directly</p>
      </div>

      <div className="mx-auto w-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
        <QRCodeCanvas
          value="upi://pay?pa=rahul@flexipay&pn=Rahul%20Sharma&cu=INR"
          size={200}
        />
        <div className="mt-4">
          <div className="font-extrabold text-slate-900 text-base">Rahul Sharma</div>
          <div className="text-xs font-medium text-slate-500">rahul@flexipay</div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-700">
          <ShieldCheck size={14} />
          <span>Verified NPCI Virtual ID</span>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// HISTORY SCREEN
// ----------------------------------------------------
function HistoryScreen({ transactions }) {
  const [filter, setFilter] = useState("all");

  const filtered = transactions.filter((t) => {
    if (filter === "later") return t.type.includes("Later");
    if (filter === "upi") return t.type.includes("UPI");
    return true;
  });

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Payment History</h1>
        <span className="text-xs text-slate-500">{transactions.length} Transactions</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {["all", "later", "upi"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition capitalize ${
              filter === tab
                ? "bg-purple-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab === "all" ? "All" : tab === "later" ? "Pay Later" : "Bank UPI"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 font-bold text-purple-700">
                {tx.merchant[0]}
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
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PROFILE SCREEN
// ----------------------------------------------------
function ProfileScreen({ credit, creditLimit, points, onOpenRepay }) {
  return (
    <div className="space-y-4 pb-6">
      {/* User Header */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-xl font-bold text-white shadow-md">
          RS
        </div>
        <h2 className="mt-3 text-base font-extrabold text-slate-900">Rahul Sharma</h2>
        <p className="text-xs text-slate-500">rahul@flexipay • +91 98765 43210</p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-100">
          <ShieldCheck size={13} /> KYC Tier 2 Verified
        </span>
      </div>

      {/* Linked Bank Account */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Linked Bank Account
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
              <Building2 size={20} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">HDFC Bank</div>
              <div className="text-xs text-slate-500">Savings A/c •••• 4812</div>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-700">Primary</span>
        </div>
      </div>

      {/* Credit Summary & Repay */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">FlexiPay Credit Status</div>
            <div className="mt-0.5 text-lg font-bold text-slate-900">
              {formatRupee(credit)} available of {formatRupee(creditLimit)}
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
