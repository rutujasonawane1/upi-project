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
  Calendar
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
    amount: 2500,
    type: "FlexiPay Pay Later",
    date: "Today, 7:32 PM",
    utr: "429108420192",
    status: "Settled"
  },
  {
    id: "ord_1091",
    customer: "Priya Sharma",
    upiId: "priya@okaxis",
    amount: 850,
    type: "UPI Direct",
    date: "Today, 4:18 PM",
    utr: "429108119284",
    status: "Settled"
  },
  {
    id: "ord_1090",
    customer: "Rohan Mehta",
    upiId: "rohan@okhdfcbank",
    amount: 1420,
    type: "FlexiPay Pay Later",
    date: "Today, 1:40 PM",
    utr: "429091824712",
    status: "Settled"
  },
  {
    id: "ord_1089",
    customer: "Vikram Malhotra",
    upiId: "vikram@paytm",
    amount: 3200,
    type: "FlexiPay Pay Later",
    date: "Yesterday",
    utr: "428910492819",
    status: "Settled"
  },
  {
    id: "ord_1088",
    customer: "Ananya Iyer",
    upiId: "ananya@ibl",
    amount: 480,
    type: "UPI Direct",
    date: "Yesterday",
    utr: "428201948210",
    status: "Settled"
  }
];

function formatRupee(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function App() {
  const [tab, setTab] = useState("pos"); // "pos" | "transactions" | "qr"
  const [sales, setSales] = useState(18450);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);

  // POS State
  const [amount, setAmount] = useState("2500");
  const [customer, setCustomer] = useState("Walk-in Customer");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [paid, setPaid] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  const handleGenerate = () => {
    if (!amount || Number(amount) <= 0) return;
    setQrGenerated(true);
    setPaid(false);
  };

  const handleSimulatePayment = () => {
    const val = Number(amount) || 2500;
    setSales((s) => s + val);
    const newTx = {
      id: "ord_" + Date.now(),
      customer: customer || "Walk-in Customer",
      upiId: "customer@upi",
      amount: val,
      type: "FlexiPay Pay Later",
      date: "Just now",
      utr: String(Math.floor(400000000000 + Math.random() * 900000000000)),
      status: "Settled"
    };
    setTransactions((prev) => [newTx, ...prev]);
    setPaid(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Clean Google Pay for Business Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-gray-900">Sharma Super Store</h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active"></span>
              </div>
              <div className="text-xs text-gray-500">UPI ID: sharma@flexipay</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">Settlement Bank:</span>
            <span className="text-xs font-semibold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md">
              HDFC Bank •••• 9921
            </span>
          </div>
        </div>

        {/* Minimal Navigation Bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-8 border-t border-gray-100 text-sm">
          {[
            { id: "pos", label: "Receive Payment" },
            { id: "transactions", label: "Transactions" },
            { id: "qr", label: "Counter QR" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`py-3 font-medium transition border-b-2 -mb-[1px] ${
                tab === item.id
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-tab-enter">
        
        {/* Simple 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="text-xs font-medium text-gray-500">Today's Collections</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{formatRupee(sales)}</div>
            <div className="text-xs text-gray-400 mt-1">Direct settlement at 7:00 AM</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="text-xs font-medium text-gray-500">Total Transactions</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{transactions.length}</div>
            <div className="text-xs text-gray-400 mt-1">100% via UPI & FlexiPay</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="text-xs font-medium text-gray-500">MDR Charges</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">₹0.00</div>
            <div className="text-xs text-gray-400 mt-1">0% transaction fees</div>
          </div>
        </div>

        {/* Tab 1: POS Clean Collector */}
        {tab === "pos" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Input Form */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
              <h2 className="text-base font-bold text-gray-900">New Bill</h2>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Amount</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2.5 focus-within:border-blue-600">
                  <span className="text-2xl font-bold text-gray-400 mr-2">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-2xl font-bold text-gray-900 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Amount Shortcuts */}
              <div className="flex gap-2">
                {[250, 500, 1000, 2500].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      Number(amount) === preset
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!amount || Number(amount) <= 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                Generate QR Code
              </button>
            </div>

            {/* QR View */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center min-h-[320px]">
              {qrGenerated ? (
                <div className="space-y-4 animate-tab-enter w-full max-w-xs">
                  <div className="p-4 bg-white border border-gray-200 rounded-xl inline-block shadow-xs">
                    <QRCodeSVG
                      value={`upi://pay?pa=sharma@flexipay&pn=Sharma%20Super%20Store&am=${amount}&cu=INR`}
                      size={180}
                    />
                  </div>

                  <div>
                    <div className="text-2xl font-bold text-gray-900">{formatRupee(Number(amount))}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{customer}</div>
                  </div>

                  {!paid ? (
                    <button
                      onClick={handleSimulatePayment}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition"
                    >
                      Simulate Customer Payment
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Check size={16} /> Payment Received via FlexiPay
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 space-y-2">
                  <QrCode size={48} className="mx-auto text-gray-300" />
                  <p className="text-xs text-gray-500">Enter bill amount to display payment QR</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Clean Transactions Table */}
        {tab === "transactions" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Payment History</h2>
              <span className="text-xs text-gray-500">{transactions.length} orders</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 font-semibold">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Mode</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">UTR Reference</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-900">{tx.customer}</td>
                    <td className="px-5 py-3 text-blue-600 font-medium">{tx.type}</td>
                    <td className="px-5 py-3 font-bold text-gray-900">{formatRupee(tx.amount)}</td>
                    <td className="px-5 py-3 text-gray-500">{tx.date}</td>
                    <td className="px-5 py-3 font-mono text-gray-500">{tx.utr}</td>
                    <td className="px-5 py-3 text-emerald-600 font-semibold">{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Simple Counter QR */}
        {tab === "qr" && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm mx-auto text-center space-y-4">
            <h2 className="text-base font-bold text-gray-900">Counter Payment Standee</h2>
            <p className="text-xs text-gray-500">Scan using any UPI app to pay Sharma Super Store</p>

            <div className="p-4 border border-gray-200 rounded-xl inline-block bg-white shadow-xs">
              <QRCodeSVG
                value="upi://pay?pa=sharma@flexipay&pn=Sharma%20Super%20Store&cu=INR"
                size={210}
              />
            </div>

            <div>
              <div className="text-base font-bold text-gray-900">Sharma Super Store</div>
              <div className="text-xs text-gray-500 font-mono">sharma@flexipay</div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
            >
              <Printer size={14} /> Print QR Standee
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

// ----------------------------------------------------
// ROOT MOUNT
// ----------------------------------------------------
createRoot(document.getElementById("root")).render(<App />);
