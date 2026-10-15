import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QRCodeSVG } from "qrcode.react";
import {
  Store,
  QrCode,
  Receipt,
  Tag,
  Volume2,
  VolumeX,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Share2,
  Printer,
  Sparkles,
  Download,
  IndianRupee,
  RefreshCw,
  Building2,
  Filter,
  Check
} from "lucide-react";
import "./index.css";

const INITIAL_TRANSACTIONS = [
  { id: "TX9841", customer: "Demo Customer", amount: 2500, type: "FlexiPay Pay Later", status: "Successful", time: "Just now" },
  { id: "TX9840", customer: "Pooja Verma", amount: 850, type: "UPI Direct", status: "Successful", time: "10 mins ago" },
  { id: "TX9839", customer: "Amit Patel", amount: 1200, type: "FlexiPay Pay Later", status: "Successful", time: "42 mins ago" },
  { id: "TX9838", customer: "Rajesh Kumar", amount: 3100, type: "FlexiPay Pay Later", status: "Successful", time: "2 hours ago" },
  { id: "TX9837", customer: "Sneha Nair", amount: 420, type: "UPI Direct", status: "Successful", time: "3 hours ago" }
];

function formatRupee(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function App() {
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "receive" | "standee" | "offers" | "ledger"
  const [sales, setSales] = useState(18450);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [soundboxEnabled, setSoundboxEnabled] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState("");

  // Bill & QR Generator State
  const [billAmount, setBillAmount] = useState("2500");
  const [qrReady, setQrReady] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(false);

  // Store Offer State
  const [offer, setOffer] = useState({
    title: "Flat 10% Cashback",
    minSpend: 1000,
    rewardPts: 100,
    active: true
  });

  // Soundbox Announcement Simulator (Speech Synthesis)
  const triggerSoundbox = (amt) => {
    if (!soundboxEnabled) return;
    const text = `FlexiPay par ${amt} rupaye prapt hue.`;
    setAudioFeedback(`🔊 "FlexiPay pe ₹${amt} prapt hue"`);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.lang = "hi-IN";
      window.speechSynthesis.speak(utterance);
    }

    setTimeout(() => setAudioFeedback(""), 4500);
  };

  // Generate QR for Customer
  const handleGenerateQr = () => {
    const val = Number(billAmount);
    if (!val || val <= 0) return;
    setQrReady(true);
    setPaymentReceived(false);
  };

  // Simulate Payment Received
  const simulatePaymentReceived = () => {
    const val = Number(billAmount) || 2500;
    setSales((s) => s + val);
    const newTx = {
      id: "TX" + Math.floor(1000 + Math.random() * 9000),
      customer: "Walk-in Customer",
      amount: val,
      type: "FlexiPay Pay Later",
      status: "Successful",
      time: "Just now"
    };
    setTransactions((prev) => [newTx, ...prev]);
    setPaymentReceived(true);
    triggerSoundbox(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Top Merchant Brand Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-700 text-white shadow-md">
              <Store size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-base font-extrabold text-slate-900">Sharma Super Store</span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                  <ShieldCheck size={12} /> Verified Merchant
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">UPI VPA: <b>sharma@flexipay</b></p>
            </div>
          </div>

          {/* Soundbox Status Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundboxEnabled((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition border ${
                soundboxEnabled
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
              title="Toggle Merchant Audio Soundbox"
            >
              {soundboxEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span className="hidden sm:inline">Soundbox: {soundboxEnabled ? "Active" : "Muted"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mx-auto flex max-w-6xl overflow-x-auto px-4 sm:px-6 border-t border-slate-100 no-scrollbar">
          {[
            { id: "dashboard", label: "Store Dashboard", icon: TrendingUp },
            { id: "receive", label: "Receive Payment (QR)", icon: QrCode },
            { id: "standee", label: "Counter Standee", icon: Printer },
            { id: "offers", label: "Customer Offers", icon: Tag },
            { id: "ledger", label: "Transactions Ledger", icon: Receipt }
          ].map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition ${
                  active
                    ? "border-purple-700 text-purple-700 bg-purple-50/40"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Audio Announcement Alert Banner */}
      {audioFeedback && (
        <div className="sticky top-[105px] z-30 bg-purple-900 text-white px-4 py-2.5 text-center text-xs font-bold shadow-md animate-in fade-in duration-200 flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-amber-400" />
          <span>{audioFeedback}</span>
        </div>
      )}

      {/* Main Body */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {activeTab === "dashboard" && (
          <DashboardTab
            sales={sales}
            transactions={transactions}
            offer={offer}
            onReceive={() => {
              setActiveTab("receive");
              setQrReady(false);
              setPaymentReceived(false);
            }}
            onStandee={() => setActiveTab("standee")}
            onSoundboxTest={() => triggerSoundbox(2500)}
            onViewLedger={() => setActiveTab("ledger")}
          />
        )}

        {activeTab === "receive" && (
          <ReceiveTab
            amount={billAmount}
            setAmount={setBillAmount}
            qrReady={qrReady}
            paymentReceived={paymentReceived}
            onGenerate={handleGenerateQr}
            onSimulate={simulatePaymentReceived}
            onReset={() => {
              setQrReady(false);
              setPaymentReceived(false);
            }}
          />
        )}

        {activeTab === "standee" && <StandeeTab />}

        {activeTab === "offers" && <OffersTab offer={offer} setOffer={setOffer} />}

        {activeTab === "ledger" && <LedgerTab transactions={transactions} />}
      </main>
    </div>
  );
}

// ----------------------------------------------------
// DASHBOARD TAB
// ----------------------------------------------------
function DashboardTab({ sales, transactions, offer, onReceive, onStandee, onSoundboxTest, onViewLedger }) {
  const payLaterCount = transactions.filter((t) => t.type.includes("Later")).length;
  const payLaterPercent = Math.round((payLaterCount / transactions.length) * 100) || 68;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Merchant POS Overview</h1>
          <p className="mt-0.5 text-xs text-slate-500">Live store collections and UPI FlexiPay settlements</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onSoundboxTest}
            className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-50 transition"
          >
            <Volume2 size={15} />
            <span>Test Soundbox</span>
          </button>
          <button
            onClick={onReceive}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition"
          >
            <QrCode size={15} />
            <span>Generate Bill QR</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Today's Collections"
          value={formatRupee(sales)}
          badge="+14% vs yesterday"
          badgeType="positive"
          subtitle="Direct UPI & FlexiPay"
        />
        <KpiCard
          title="Transactions Count"
          value={transactions.length}
          badge="100% Success"
          badgeType="positive"
          subtitle="All transactions verified"
        />
        <KpiCard
          title="FlexiPay Pay Later Share"
          value={`${payLaterPercent}%`}
          badge="Higher Basket Value"
          badgeType="highlight"
          subtitle="Average order: ₹2,100"
        />
        <KpiCard
          title="Next Bank Settlement"
          value={formatRupee(sales)}
          badge="Tomorrow 07:00 AM"
          badgeType="neutral"
          subtitle="0% MDR • HDFC Bank"
        />
      </div>

      {/* Action Banners */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-900 to-indigo-900 p-6 text-white shadow-md">
          <div className="relative z-10">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-200">
              Quick Collect
            </span>
            <h3 className="mt-2 text-xl font-bold">Generate Dynamic Bill QR</h3>
            <p className="mt-1 text-xs text-purple-200 max-w-sm">
              Enter customer's bill amount and display a custom QR code for instant scan.
            </p>
            <button
              onClick={onReceive}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-purple-900 shadow hover:bg-purple-50 transition"
            >
              <span>Open POS Terminal</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Counter Display
          </span>
          <h3 className="mt-2 text-xl font-bold text-slate-900">Official Store Standee</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Showcase your counter standee card accepting Google Pay, PhonePe, Paytm, and FlexiPay.
          </p>
          <button
            onClick={onStandee}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
          >
            <span>View Standee Card</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>

      {/* Recent Ledger Preview */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-purple-700" />
            <h2 className="font-bold text-slate-900 text-sm">Recent Store Collections</h2>
          </div>
          <button
            onClick={onViewLedger}
            className="text-xs font-bold text-purple-700 hover:underline"
          >
            View Full Ledger →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.slice(0, 4).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/60 transition">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 font-bold text-sm">
                  {tx.customer[0]}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm leading-tight">{tx.customer}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {tx.time} • <span className="font-medium text-purple-700">{tx.type}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">+{formatRupee(tx.amount)}</div>
                <div className="mt-0.5 text-[10px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                  <CheckCircle2 size={11} /> {tx.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, badge, badgeType, subtitle }) {
  const badgeClasses =
    badgeType === "positive"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : badgeType === "highlight"
      ? "bg-purple-50 text-purple-700 border-purple-100"
      : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{title}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${badgeClasses}`}>
          {badge}
        </span>
      </div>
      <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tracking-tight">{value}</div>
      <p className="mt-1 text-[11px] text-slate-400 font-medium">{subtitle}</p>
    </div>
  );
}

// ----------------------------------------------------
// RECEIVE PAYMENT TAB (POS DYNAMIC QR)
// ----------------------------------------------------
function ReceiveTab({ amount, setAmount, qrReady, paymentReceived, onGenerate, onSimulate, onReset }) {
  const presets = [100, 250, 500, 1000, 2500];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">POS Payment Terminal</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Generate an instant dynamic QR for your customer
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Bill Amount (₹)
        </label>
        <div className="mt-2 flex items-center rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-100">
          <span className="text-2xl font-extrabold text-slate-400 mr-2">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-3xl font-extrabold text-slate-900 outline-none"
            placeholder="0"
          />
        </div>

        {/* Quick Amount Presets */}
        <div className="mt-3 flex gap-2">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(String(p))}
              className={`flex-1 rounded-xl py-1.5 text-xs font-bold border transition ${
                Number(amount) === p
                  ? "bg-purple-700 text-white border-purple-700"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-200"
              }`}
            >
              ₹{p}
            </button>
          ))}
        </div>

        <button
          onClick={onGenerate}
          disabled={!amount || Number(amount) <= 0}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 py-3.5 font-bold text-white shadow-md hover:opacity-95 transition disabled:opacity-50"
        >
          Generate Dynamic Bill QR
        </button>
      </div>

      {qrReady && (
        <div className="rounded-3xl border border-purple-200 bg-white p-6 text-center shadow-md animate-in fade-in duration-300">
          <div className="inline-block rounded-2xl border-4 border-purple-100 p-4 bg-white shadow-sm">
            <QRCodeSVG
              value={`upi://pay?pa=sharma@flexipay&pn=Sharma%20Super%20Store&am=${amount}&cu=INR`}
              size={200}
            />
          </div>

          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatRupee(Number(amount))}
            </div>
            <p className="text-xs text-slate-500 font-medium">Sharma Super Store • sharma@flexipay</p>
          </div>

          {!paymentReceived ? (
            <div className="mt-5 space-y-2">
              <button
                onClick={onSimulate}
                className="w-full rounded-2xl bg-emerald-600 py-3.5 font-bold text-white shadow-md hover:bg-emerald-700 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                <span>Simulate Customer Payment</span>
              </button>
              <p className="text-[11px] text-slate-400">
                Simulates customer scanning this QR on their mobile app and paying via FlexiPay
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>Payment Received Successfully!</span>
              </div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-950">
                {formatRupee(Number(amount))}
              </div>
              <p className="mt-1 text-xs text-emerald-700 font-medium">
                Method: FlexiPay Pay Later (0% MDR fee applied)
              </p>
              <button
                onClick={onReset}
                className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
              >
                Collect Another Bill
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// COUNTER STANDEE TAB
// ----------------------------------------------------
function StandeeTab() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">Official Counter Standee</h1>
        <p className="text-xs text-slate-500">Display this at your billing cash counter</p>
      </div>

      {/* Realistic Acrylic Standee Card */}
      <div className="rounded-3xl border-2 border-slate-300 bg-gradient-to-b from-purple-800 via-purple-700 to-indigo-900 p-6 text-white shadow-2xl text-center">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase text-purple-200">
          <ShieldCheck size={16} /> Verified UPI & FlexiPay Merchant
        </div>

        <h2 className="mt-2 text-xl font-extrabold">Sharma Super Store</h2>
        <p className="text-xs text-purple-200">UPI ID: sharma@flexipay</p>

        {/* QR Code Container */}
        <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-5 shadow-lg">
          <QRCodeSVG
            value="upi://pay?pa=sharma@flexipay&pn=Sharma%20Super%20Store&cu=INR"
            size={200}
          />
          <p className="mt-3 text-[11px] font-bold text-slate-800">SCAN & PAY WITH ANY UPI APP</p>
        </div>

        {/* Supported UPI Brand Marks */}
        <div className="mt-5 rounded-2xl bg-white/10 p-3 backdrop-blur-xs">
          <p className="text-[10px] font-semibold tracking-wider text-purple-200 uppercase mb-2">
            Accepted Here
          </p>
          <div className="flex items-center justify-center gap-3 text-xs font-bold">
            <span className="rounded bg-white/15 px-2 py-0.5">Google Pay</span>
            <span className="rounded bg-white/15 px-2 py-0.5">PhonePe</span>
            <span className="rounded bg-white/15 px-2 py-0.5">Paytm</span>
            <span className="rounded bg-white/15 px-2 py-0.5">FlexiPay</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// STORE OFFERS TAB
// ----------------------------------------------------
function OffersTab({ offer, setOffer }) {
  const [title, setTitle] = useState(offer.title);
  const [minSpend, setMinSpend] = useState(offer.minSpend);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setOffer({
      title,
      minSpend: Number(minSpend),
      rewardPts: 100,
      active: true
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Customer Promotional Offer</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Reward customers who pay using FlexiPay Pay Later at your store
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700">Offer Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-purple-600"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">Minimum Bill Value (₹)</label>
          <input
            type="number"
            value={minSpend}
            onChange={(e) => setMinSpend(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-purple-600"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full rounded-2xl bg-purple-700 py-3.5 font-bold text-white shadow-md hover:bg-purple-800 transition"
        >
          {saved ? "✓ Offer Saved & Active" : "Update Store Offer"}
        </button>
      </div>

      {/* Offer Preview Card */}
      <div className="rounded-3xl border border-purple-100 bg-purple-50/60 p-5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
          Customer View Preview
        </span>
        <div className="mt-2 text-base font-bold text-slate-900">{offer.title}</div>
        <p className="mt-0.5 text-xs text-slate-600">
          On orders above {formatRupee(offer.minSpend)} using FlexiPay Pay Later • Earn 100 Reward Points
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// TRANSACTIONS LEDGER TAB
// ----------------------------------------------------
function LedgerTab({ transactions }) {
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t) =>
    t.customer.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Collections Ledger</h1>
          <p className="mt-0.5 text-xs text-slate-500">Real-time payment settlements log</p>
        </div>

        <input
          type="text"
          placeholder="Search customer or payment type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium outline-none focus:border-purple-600 w-full sm:w-64"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/80 font-bold text-slate-600">
            <tr>
              <th className="px-6 py-3.5">Transaction ID</th>
              <th className="px-6 py-3.5">Customer</th>
              <th className="px-6 py-3.5">Payment Method</th>
              <th className="px-6 py-3.5">Amount</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-3.5 font-mono text-slate-500">{t.id}</td>
                <td className="px-6 py-3.5 font-bold text-slate-900">{t.customer}</td>
                <td className="px-6 py-3.5 text-purple-700 font-semibold">{t.type}</td>
                <td className="px-6 py-3.5 font-bold text-slate-900">{formatRupee(t.amount)}</td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 size={11} /> {t.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-slate-500">{t.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ROOT MOUNT
// ----------------------------------------------------
createRoot(document.getElementById("root")).render(<App />);
