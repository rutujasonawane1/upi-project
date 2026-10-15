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
  CheckCircle2
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
    items: "Aashirvaad Atta 5kg, Fortune Oil 1L, Tata Salt, Amul Ghee",
    utr: "429108420192",
    mdr: "₹0.00 (0% Promo)",
    status: "Settled"
  },
  {
    id: "ord_1091",
    customer: "Priya Sharma",
    upiId: "priya@okaxis",
    amount: 850,
    type: "UPI Direct",
    date: "Today, 4:18 PM",
    items: "Cadbury Celebrations, Tropicana Juice, Britannia GoodDay",
    utr: "429108119284",
    mdr: "₹0.00 (Free UPI)",
    status: "Settled"
  },
  {
    id: "ord_1090",
    customer: "Rohan Mehta",
    upiId: "rohan@okhdfcbank",
    amount: 1420,
    type: "FlexiPay Pay Later",
    date: "Today, 1:40 PM",
    items: "Surf Excel 2kg, Dettol Handwash Refill, Vim Bar 3-Pack",
    utr: "429091824712",
    mdr: "₹0.00 (0% Promo)",
    status: "Settled"
  },
  {
    id: "ord_1089",
    customer: "Vikram Malhotra",
    upiId: "vikram@paytm",
    amount: 3200,
    type: "FlexiPay Pay Later",
    date: "Yesterday",
    items: "Dry Fruits Gift Box, Ferrero Rocher, Organic Honey 500g",
    utr: "428910492819",
    mdr: "₹0.00 (0% Promo)",
    status: "Settled"
  },
  {
    id: "ord_1088",
    customer: "Ananya Iyer",
    upiId: "ananya@ibl",
    amount: 480,
    type: "UPI Direct",
    date: "Yesterday",
    items: "Amul Butter 500g, Brown Bread, Epigamia Yogurt",
    utr: "428201948210",
    mdr: "₹0.00 (Free UPI)",
    status: "Settled"
  }
];

function formatRupee(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function App() {
  const [tab, setTab] = useState("pos"); // "pos" | "transactions" | "offers" | "qr"
  const [sales, setSales] = useState(18450);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [soundboxEnabled, setSoundboxEnabled] = useState(true);

  // POS State
  const [amount, setAmount] = useState("2500");
  const [customer, setCustomer] = useState("Walk-in Customer");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [paid, setPaid] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Custom Store Offer Campaign
  const [offer, setOffer] = useState({
    title: "Flat 10% Cashback up to ₹100",
    minSpend: 1000,
    rewardPts: 100
  });

  // Soundbox Voice Announcement
  const announceSoundbox = (amt) => {
    if (!soundboxEnabled) return;
    const text = `FlexiPay par ${amt} rupaye prapt hue.`;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.lang = "hi-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

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
      items: "Custom Billing Cart",
      utr: String(Math.floor(400000000000 + Math.random() * 900000000000)),
      mdr: "₹0.00 (0% Promo)",
      status: "Settled"
    };
    setTransactions((prev) => [newTx, ...prev]);
    setPaid(true);
    announceSoundbox(val);
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
              <div className="text-xs text-gray-500">
                GSTIN: 27AABCU9603R1ZM • UPI ID: sharma@flexipay
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Soundbox Toggle Button */}
            <button
              onClick={() => setSoundboxEnabled((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                soundboxEnabled
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}
              title="Toggle Audio Soundbox Voice Announcement"
            >
              {soundboxEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span className="hidden sm:inline">Soundbox: {soundboxEnabled ? "On" : "Off"}</span>
            </button>

            <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1.5 rounded-lg hidden sm:inline">
              HDFC Bank •••• 9921
            </span>
          </div>
        </div>

        {/* Minimal Navigation Bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-6 sm:gap-8 border-t border-gray-100 text-sm overflow-x-auto no-scrollbar">
          {[
            { id: "pos", label: "Receive Payment" },
            { id: "transactions", label: "Transactions" },
            { id: "offers", label: "Customer Offers" },
            { id: "qr", label: "Counter QR" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`py-3 font-medium transition border-b-2 -mb-[1px] whitespace-nowrap ${
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

        {/* Tab 2: Clean Transactions Table (With Clickable Receipt) */}
        {tab === "transactions" && (
          <TransactionsTab
            transactions={transactions}
            onSelectReceipt={(tx) => setSelectedReceipt(tx)}
          />
        )}

        {/* Tab 3: Customer Offers Builder */}
        {tab === "offers" && <OffersTab offer={offer} setOffer={setOffer} />}

        {/* Tab 4: Simple Counter QR */}
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

      {/* Tax Invoice Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-tab-enter">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Store Tax Invoice</h3>
                <p className="text-xs text-gray-500 font-mono">{selectedReceipt.id}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-4 text-center">
              <div className="text-3xl font-extrabold text-gray-900">
                {formatRupee(selectedReceipt.amount)}
              </div>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                ✓ Settled to HDFC Bank •••• 9921
              </p>
            </div>

            <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-xs border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium text-gray-900">{selectedReceipt.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items Purchased</span>
                <span className="font-medium text-gray-800 text-right max-w-[200px] truncate">
                  {selectedReceipt.items || "General Store Purchases"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Mode</span>
                <span className="font-medium text-blue-600">{selectedReceipt.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bank UTR</span>
                <span className="font-mono text-gray-700">{selectedReceipt.utr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">MDR Fee</span>
                <span className="font-semibold text-emerald-700">{selectedReceipt.mdr || "₹0.00"}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800"
              >
                Print Invoice
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50"
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
// TRANSACTIONS TAB WITH SEARCH
// ----------------------------------------------------
function TransactionsTab({ transactions, onSelectReceipt }) {
  const [search, setSearch] = useState("");

  const filtered = transactions.filter(
    (t) =>
      t.customer.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase()) ||
      t.utr.includes(search)
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Payment History</h2>
          <p className="text-xs text-gray-500">Click any row to view tax invoice receipt</p>
        </div>

        <input
          type="text"
          placeholder="Search customer or UTR..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3.5 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-600 w-full sm:w-64"
        />
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
          {filtered.map((tx) => (
            <tr
              key={tx.id}
              onClick={() => onSelectReceipt(tx)}
              className="hover:bg-gray-50/70 cursor-pointer transition"
            >
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
  );
}

// ----------------------------------------------------
// OFFERS TAB
// ----------------------------------------------------
function OffersTab({ offer, setOffer }) {
  const [title, setTitle] = useState(offer.title);
  const [minSpend, setMinSpend] = useState(offer.minSpend);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setOffer({
      title,
      minSpend: Number(minSpend),
      rewardPts: 100
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl border border-gray-200 space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-900">Customer Promotional Offer</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Reward customers who choose FlexiPay Pay Later at your store
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Offer Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-600"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Minimum Bill (₹)</label>
        <input
          type="number"
          value={minSpend}
          onChange={(e) => setMinSpend(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-600"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition"
      >
        {saved ? "✓ Offer Saved" : "Update Offer"}
      </button>

      {/* Customer Preview */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 mt-4 text-xs">
        <span className="text-[11px] font-semibold text-gray-500 uppercase">Live Preview on Consumer App</span>
        <div className="font-bold text-gray-900 text-sm mt-1">{offer.title}</div>
        <div className="text-gray-500 mt-0.5">
          Valid on orders above {formatRupee(offer.minSpend)} using FlexiPay Pay Later
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ROOT MOUNT
// ----------------------------------------------------
createRoot(document.getElementById("root")).render(<App />);
