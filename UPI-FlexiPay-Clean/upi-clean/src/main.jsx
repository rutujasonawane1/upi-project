import React, { useState, useEffect } from "react";
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
  ArrowUpRight
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import "./index.css";

// ----------------------------------------------------
// CLEAN REALISTIC TRANSACTION DATA (Google Pay style)
// ----------------------------------------------------
const INITIAL_TRANSACTIONS = [
  {
    id: "tx_101",
    merchant: "Sharma Super Store",
    upiId: "sharma@flexipay",
    initials: "SS",
    amount: 2500,
    date: "Today, 7:32 PM",
    mode: "FlexiPay Pay Later",
    utr: "429108420192",
    status: "Completed"
  },
  {
    id: "tx_102",
    merchant: "Zepto Groceries",
    upiId: "zepto@icici",
    initials: "ZG",
    amount: 840,
    date: "Today, 3:15 PM",
    mode: "FlexiPay Pay Later",
    utr: "429108119284",
    status: "Completed"
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
    status: "Completed"
  },
  {
    id: "tx_104",
    merchant: "Apollo Pharmacy",
    upiId: "apollopharmacy@hdfcbank",
    initials: "AP",
    amount: 610,
    date: "13 Oct 2026",
    mode: "FlexiPay Pay Later",
    utr: "428910492819",
    status: "Completed"
  },
  {
    id: "tx_105",
    merchant: "Croma Retail",
    upiId: "croma@kotak",
    initials: "CR",
    amount: 4200,
    date: "08 Oct 2026",
    mode: "FlexiPay Pay Later",
    utr: "428201948210",
    status: "Completed"
  }
];

function formatRupee(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const [creditLimit] = useState(25000);
  const [credit, setCredit] = useState(() => Number(localStorage.getItem("flexiCredit") || 22500));
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("flexiTx");
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Active Scan / Payment state
  const [amount, setAmount] = useState(2500);
  const [merchant, setMerchant] = useState("Sharma Super Store");
  const [vpa, setVpa] = useState("sharma@flexipay");
  const [method, setMethod] = useState("later"); // "later" | "bank"
  const [repayModal, setRepayModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem("flexiCredit", credit);
    localStorage.setItem("flexiTx", JSON.stringify(transactions));
  }, [credit, transactions]);

  // Execute payment
  const handlePay = () => {
    const newTx = {
      id: "tx_" + Date.now(),
      merchant: merchant,
      upiId: vpa,
      initials: merchant.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      amount: amount,
      date: "Just now",
      mode: method === "later" ? "FlexiPay Pay Later" : "HDFC Bank •••• 4812",
      utr: String(Math.floor(400000000000 + Math.random() * 900000000000)),
      status: "Completed"
    };

    if (method === "later") {
      setCredit((c) => Math.max(0, c - amount));
    }

    setTransactions((prev) => [newTx, ...prev]);
    navigate("/success");
  };

  // Repay dues
  const handleRepay = () => {
    const due = creditLimit - credit;
    if (due <= 0) return;
    setCredit(creditLimit);
    setTransactions((prev) => [
      {
        id: "tx_" + Date.now(),
        merchant: "FlexiPay Repayment",
        upiId: "repay@flexipay",
        initials: "FP",
        amount: due,
        date: "Just now",
        mode: "HDFC Bank •••• 4812",
        utr: String(Math.floor(400000000000 + Math.random() * 900000000000)),
        status: "Completed"
      },
      ...prev
    ]);
    setRepayModal(false);
  };

  return (
    <div className="min-h-screen bg-white sm:bg-gray-100 flex justify-center font-sans">
      
      {/* Clean Device Container */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col sm:shadow-lg sm:border-x sm:border-gray-200">
        
        {/* Simple Minimal Top Bar */}
        <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-20">
          {location.pathname === "/" ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                R
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Rahul Sharma</div>
                <div className="text-xs text-gray-500">rahul@flexipay</div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-gray-700 hover:text-black flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/qr")}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-full"
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

          {location.pathname === "/history" && (
            <HistoryView
              transactions={transactions}
              onSelectTx={(tx) => setSelectedTx(tx)}
            />
          )}
        </main>

        {/* Bottom Minimal Navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-3 px-4 z-20">
          <button
            onClick={() => navigate("/")}
            className={`flex flex-col items-center gap-1 text-xs ${
              location.pathname === "/" ? "text-blue-600 font-semibold" : "text-gray-500"
            }`}
          >
            <div className={`p-1 rounded-full ${location.pathname === "/" ? "bg-blue-50" : ""}`}>
              <Building2 size={20} />
            </div>
            <span>Home</span>
          </button>

          <button
            onClick={() => navigate("/scan")}
            className="flex flex-col items-center gap-1 text-xs text-gray-700"
          >
            <div className="w-11 h-11 -mt-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 active:scale-95 transition">
              <Scan size={20} />
            </div>
            <span className="font-medium text-gray-900">Scan</span>
          </button>

          <button
            onClick={() => navigate("/history")}
            className={`flex flex-col items-center gap-1 text-xs ${
              location.pathname === "/history" ? "text-blue-600 font-semibold" : "text-gray-500"
            }`}
          >
            <div className={`p-1 rounded-full ${location.pathname === "/history" ? "bg-blue-50" : ""}`}>
              <History size={20} />
            </div>
            <span>Activity</span>
          </button>
        </nav>

        {/* Minimal Repay Modal */}
        {repayModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-tab-enter">
              <h3 className="text-base font-semibold text-gray-900">Pay FlexiPay Bill</h3>
              <p className="text-xs text-gray-500 mt-1">Due by 5 Nov • 0% Interest</p>

              <div className="my-5 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="text-xs text-gray-500">Amount Due</div>
                <div className="text-2xl font-bold text-gray-900 mt-0.5">
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
                  className="flex-1 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
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
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-base font-bold">
                  {selectedTx.initials}
                </div>
                <div className="text-xl font-bold text-gray-900 mt-2">
                  {formatRupee(selectedTx.amount)}
                </div>
                <div className="text-sm font-semibold text-gray-900 mt-0.5">{selectedTx.merchant}</div>
                <div className="text-xs text-gray-500">{selectedTx.date}</div>
              </div>

              <div className="py-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid Using</span>
                  <span className="font-medium text-gray-900">{selectedTx.mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">UPI Transaction ID</span>
                  <span className="font-mono text-gray-800">{selectedTx.utr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="text-emerald-700 font-semibold">{selectedTx.status}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl mt-2"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ----------------------------------------------------
// GOOGLE PAY STYLE HOME VIEW
// ----------------------------------------------------
function HomeView({ credit, creditLimit, transactions, navigate, onSelectTx, onRepayClick }) {
  const used = creditLimit - credit;

  const people = [
    { name: "Sharma Store", initials: "SS", amount: 2500, vpa: "sharma@flexipay" },
    { name: "Zepto", initials: "ZG", amount: 650, vpa: "zepto@icici" },
    { name: "Swiggy", initials: "SW", amount: 380, vpa: "swiggy@axis" },
    { name: "Apollo", initials: "AP", amount: 520, vpa: "apollo@hdfc" }
  ];

  return (
    <div className="space-y-6">
      
      {/* Clean Primary Credit Card (Flat, zero gradients, confident typography) */}
      <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            FlexiPay Pay Later
          </span>
          <span className="text-xs font-medium text-gray-500">
            Limit: {formatRupee(creditLimit)}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {formatRupee(credit)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Available to spend at any UPI QR</div>
        </div>

        {used > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Current bill</div>
              <div className="text-sm font-bold text-gray-900">{formatRupee(used)} due on 5 Nov</div>
            </div>
            <button
              onClick={onRepayClick}
              className="px-4 py-1.5 text-xs font-semibold text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50 transition"
            >
              Pay bill
            </button>
          </div>
        )}
      </div>

      {/* Clean 4 Action Grid (Google Pay minimal circles) */}
      <div className="grid grid-cols-4 gap-2 text-center pt-1">
        <button
          onClick={() => navigate("/scan")}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-13 h-13 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition">
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
          onClick={() => navigate("/qr")}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-13 h-13 rounded-full bg-gray-50 text-gray-700 flex items-center justify-center group-hover:bg-gray-100 transition">
            <QrCode size={22} />
          </div>
          <span className="text-xs font-medium text-gray-800">My QR</span>
        </button>

        <button
          onClick={() => navigate("/history")}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-13 h-13 rounded-full bg-gray-50 text-gray-700 flex items-center justify-center group-hover:bg-gray-100 transition">
            <History size={22} />
          </div>
          <span className="text-xs font-medium text-gray-800">History</span>
        </button>
      </div>

      {/* Recent Merchants (Google Pay style circular contact row) */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Frequent Merchants
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
          {people.map((p, i) => (
            <button
              key={i}
              onClick={() => navigate("/scan")}
              className="flex flex-col items-center gap-1.5 min-w-[64px]"
            >
              <div className="w-13 h-13 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center font-semibold text-sm hover:ring-2 hover:ring-blue-500 transition">
                {p.initials}
              </div>
              <span className="text-xs text-gray-700 font-medium truncate max-w-[68px]">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Clean Transaction List (Google Pay simple rows) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Recent Activity
          </span>
          <button
            onClick={() => navigate("/history")}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            See all
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {transactions.slice(0, 4).map((tx) => (
            <div
              key={tx.id}
              onClick={() => onSelectTx(tx)}
              className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 -mx-2 px-2 rounded-xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold">
                  {tx.initials}
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
                  {tx.mode.includes("Later") ? "Pay Later" : "Bank UPI"}
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
// SCAN VIEW (Clean & Direct)
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

  return (
    <div className="space-y-6">
      <div className="text-center pt-2">
        <h2 className="text-lg font-bold text-gray-900">Scan & Pay</h2>
        <p className="text-xs text-gray-500">Scan any store QR code to pay using FlexiPay</p>
      </div>

      {/* Clean Scanner Box */}
      <div className="w-56 h-56 mx-auto rounded-2xl border-2 border-gray-300 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
        <Scan size={48} className="text-gray-400" />
        <span className="text-xs text-gray-500 mt-3 font-medium">Point camera at QR code</span>
      </div>

      {/* Select Demo Store */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Or Tap Nearby Store (Demo)
        </div>
        <div className="space-y-2">
          {stores.map((s, i) => (
            <div
              key={i}
              onClick={() => handleSelectStore(s)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                merchant === s.name
                  ? "border-blue-600 bg-blue-50/50"
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

      {/* Amount input */}
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1">Enter Amount</label>
        <div className="flex items-center border border-gray-300 rounded-xl px-4 py-2.5 focus-within:border-blue-600">
          <span className="text-xl font-bold text-gray-500 mr-2">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full text-2xl font-bold text-gray-900 outline-none"
            placeholder="0"
          />
        </div>
      </div>

      <button
        onClick={() => navigate("/pay")}
        disabled={!amount || amount <= 0}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
      >
        Proceed to Pay {formatRupee(amount)}
      </button>
    </div>
  );
}

// ----------------------------------------------------
// PAYMENT VIEW (Clean Google Pay Bottom Sheet)
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
          Payment Option
        </div>

        <div className="space-y-2.5">
          {/* FlexiPay Option */}
          <label
            onClick={() => setMethod("later")}
            className={`p-4 rounded-xl border block cursor-pointer transition ${
              method === "later"
                ? "border-blue-600 bg-blue-50/40"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="payopt"
                checked={method === "later"}
                onChange={() => setMethod("later")}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">FlexiPay Pay Later</span>
                  <span className="text-xs font-semibold text-blue-700">30-day 0% interest</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Available credit: {formatRupee(credit)}
                </div>
              </div>
            </div>
          </label>

          {/* Bank Option */}
          <label
            onClick={() => setMethod("bank")}
            className={`p-4 rounded-xl border block cursor-pointer transition ${
              method === "bank"
                ? "border-blue-600 bg-blue-50/40"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="payopt"
                checked={method === "bank"}
                onChange={() => setMethod("bank")}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-bold text-gray-900">HDFC Bank •••• 4812</div>
                <div className="text-xs text-gray-500 mt-0.5">Instant UPI debit</div>
              </div>
            </div>
          </label>
        </div>
      </div>

      <button
        onClick={onPay}
        disabled={method === "later" && !isEligible}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-base shadow-sm transition disabled:opacity-50"
      >
        {method === "later"
          ? `Pay ${formatRupee(amount)} using FlexiPay`
          : `Pay ${formatRupee(amount)} via UPI`}
      </button>
    </div>
  );
}

// ----------------------------------------------------
// SUCCESS VIEW (Clean Google Pay Checkmark)
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
            {method === "later" ? "FlexiPay Pay Later (0% interest)" : "HDFC Bank •••• 4812"}
          </span>
        </div>
        {method === "later" && (
          <div className="flex justify-between">
            <span className="text-gray-500">Repayment Date</span>
            <span className="font-semibold text-gray-900">5 Nov 2026</span>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate("/")}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
      >
        Done
      </button>
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
      <p className="text-xs text-gray-500">Scan to pay Rahul Sharma directly</p>

      <div className="p-6 rounded-2xl border border-gray-200 bg-white inline-block shadow-sm">
        <QRCodeCanvas value="upi://pay?pa=rahul@flexipay&pn=Rahul%20Sharma" size={200} />
        <div className="mt-4 text-sm font-bold text-gray-900">Rahul Sharma</div>
        <div className="text-xs text-gray-500 font-mono">rahul@flexipay</div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// HISTORY VIEW
// ----------------------------------------------------
function HistoryView({ transactions, onSelectTx }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
        <p className="text-xs text-gray-500">All past UPI and FlexiPay orders</p>
      </div>

      <div className="divide-y divide-gray-100">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            onClick={() => onSelectTx(tx)}
            className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 -mx-2 px-2 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold">
                {tx.initials}
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
                {tx.mode.includes("Later") ? "Pay Later" : "Bank UPI"}
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
createRoot(document.getElementById("root")).render(
  <HashRouter>
    <App />
  </HashRouter>
);
