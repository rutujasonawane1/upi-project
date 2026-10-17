import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
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
  X,
  Banknote,
  Wallet,
  ArrowDownLeft,
  FileText,
  Percent,
  RefreshCw,
  AlertCircle,
  Shield,
  ArrowLeft,
  Lock,
  MessageSquare,
  Cloud,
  LogOut
} from "lucide-react";
import "./index.css";
import { syncPublishBill, syncSubscribePayments, syncPublishOffer, isFirebaseActive } from "./firebaseSync";
import FirebaseSettingsModal from "./FirebaseSettingsModal";
import MerchantOnboardingFlow from "./MerchantOnboardingFlow";

// ----------------------------------------------------
// DEFAULT VERIFIED MERCHANT REGISTRY (Zero Hardcoding Foundation)
// ----------------------------------------------------
const DEFAULT_MERCHANTS = [
  {
    id: "sharma",
    slug: "sharma",
    name: "Sharma Super Store",
    ownerName: "Omprakash Sharma",
    phone: "+91 98201 44821",
    category: "grocery",
    city: "Mumbai",
    gstin: "27AABCU9603R1ZM",
    vpa: "sharma@flexipay",
    bank: {
      bankName: "HDFC Bank",
      accountNumber: "5010048219921",
      maskedAccount: "•••• 9921",
      ifsc: "HDFC0000240"
    },
    creditLimit: 150000,
    initialSales: 18450,
    initialUnsettled: 18450
  }
];

function getInitialMerchants() {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("flexiMerchants_registry");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
  }
  return DEFAULT_MERCHANTS;
}

function getInitialMerchant() {
  if (typeof window !== "undefined") {
    try {
      const registry = getInitialMerchants();
      const params = new URLSearchParams(window.location.search);
      const urlStore = params.get("store");
      if (urlStore) {
        const found = registry.find((m) => m.id === urlStore || m.slug === urlStore);
        if (found) {
          localStorage.setItem("flexipay_merchant_session", JSON.stringify(found));
          localStorage.setItem("flexiActiveStoreId", found.id);
          return found;
        }
      }
      const savedSession = localStorage.getItem("flexipay_merchant_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.id) {
          const inReg = registry.find((m) => m.id === parsed.id);
          return inReg || parsed;
        }
      }
      const savedActive = localStorage.getItem("flexiActiveStoreId");
      if (savedActive) {
        const found = registry.find((m) => m.id === savedActive);
        if (found) {
          localStorage.setItem("flexipay_merchant_session", JSON.stringify(found));
          return found;
        }
      }
    } catch (e) {}
  }
  return null;
}


// ----------------------------------------------------
// REALISTIC MERCHANT TRANSACTION DATA (Google Pay Business style)
// ----------------------------------------------------
const INITIAL_TRANSACTIONS = [
  {
    id: "ord_1092",
    customer: "Rutuja Sonawane",
    upiId: "rutuja@flexipay",
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

function MerchantTerminal({ currentMerchant, onLogout }) {
  const [tab, setTab] = useState("pos"); // "pos" | "transactions" | "offers" | "qr" | "analytics"

  // Namespaced state per active merchant
  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem(`flexiMerchant_${currentMerchant.id}_sales`);
    return saved !== null && !isNaN(Number(saved)) ? Number(saved) : (currentMerchant.initialSales !== undefined ? currentMerchant.initialSales : 18450);
  });

  const [unsettledBalance, setUnsettledBalance] = useState(() => {
    const saved = localStorage.getItem(`flexiMerchant_${currentMerchant.id}_unsettled`);
    return saved !== null && !isNaN(Number(saved)) ? Number(saved) : (currentMerchant.initialUnsettled !== undefined ? currentMerchant.initialUnsettled : 18450);
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem(`flexiMerchant_${currentMerchant.id}_tx`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return currentMerchant.id === "sharma" ? INITIAL_TRANSACTIONS : [];
  });

  const [soundboxEnabled, setSoundboxEnabled] = useState(true);
  const [voiceLang, setVoiceLang] = useState("hi-standard"); // "hi-standard" (default) | "hi-ab" | "en-IN"
  const cycleVoice = () => {
    setVoiceLang((prev) => {
      if (prev === "hi-standard") return "hi-ab";
      if (prev === "hi-ab") return "en-IN";
      return "hi-standard";
    });
  };
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [settledToast, setSettledToast] = useState(false);
  const [settledToastAmount, setSettledToastAmount] = useState(0);
  const [liveSyncToast, setLiveSyncToast] = useState(null);

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
  const [showCloudSettings, setShowCloudSettings] = useState(false);
  const [cloudActive, setCloudActive] = useState(isFirebaseActive());

  // Role Mode: "owner" (Full access: settlements, bank settings, loans) vs "cashier" (Billing + Soundbox only)
  const [merchantRole, setMerchantRole] = useState(() => {
    return localStorage.getItem(`flexiMerchant_${currentMerchant.id}_role`) || "owner";
  });
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleHistory, setSettleHistory] = useState(() => {
    const saved = localStorage.getItem(`flexiMerchant_${currentMerchant.id}_settleHistory`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return currentMerchant.id === "sharma"
      ? [{ id: "set_9821", amount: 12500, fee: 25, net: 12475, type: "T+0 Instant", time: "Yesterday, 6:45 PM", status: "Transferred" }]
      : [];
  });

  const toggleMerchantRole = () => {
    const next = merchantRole === "owner" ? "cashier" : "owner";
    setMerchantRole(next);
    localStorage.setItem(`flexiMerchant_${currentMerchant.id}_role`, next);
  };

  // Sync Registry and State Persistence per active store
  useEffect(() => {
    try {
      localStorage.setItem("flexiActiveStoreId", currentMerchant.id);
      localStorage.setItem(`flexiMerchant_${currentMerchant.id}_sales`, String(sales));
      localStorage.setItem(`flexiMerchant_${currentMerchant.id}_unsettled`, String(unsettledBalance));
      localStorage.setItem(`flexiMerchant_${currentMerchant.id}_tx`, JSON.stringify(transactions));
      localStorage.setItem(`flexiMerchant_${currentMerchant.id}_settleHistory`, JSON.stringify(settleHistory));
    } catch (e) {}
  }, [currentMerchant.id, sales, unsettledBalance, transactions, settleHistory]);


  // Auto scroll to top on tab change so features are instantly visible without scrolling
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  // Pre-load Speech Synthesis Voices and unlock audio on initial user touch
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    const unlockAudio = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          if (ctx.state === "suspended") ctx.resume();
        }
      } catch (e) {}
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // Soundbox Voice & Chime Announcement
  const playChime = () => {
    try {
      if (typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext)) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Chime error:", e);
    }
  };

  const announceSoundbox = (amt, forcedMode) => {
    console.log("[Soundbox] Announcing payment received:", amt);
    playChime();

    if (!soundboxEnabled) return;
    const mode = forcedMode || voiceLang;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const allVoices = window.speechSynthesis.getVoices();

        const maleHindiVoice = allVoices.find(
          (v) =>
            v.lang.toLowerCase().startsWith("hi") &&
            (v.name.toLowerCase().includes("male") ||
              v.name.toLowerCase().includes("hemant") ||
              v.name.toLowerCase().includes("rishi") ||
              v.name.toLowerCase().includes("madhur") ||
              v.name.toLowerCase().includes("deep"))
        );
        const anyHindiVoice = allVoices.find((v) => v.lang.toLowerCase().startsWith("hi"));
        const indianMaleVoice = allVoices.find(
          (v) => v.lang.toUpperCase().includes("IN") && v.name.toLowerCase().includes("male")
        );
        const indianVoice = allVoices.find((v) => v.lang.toUpperCase().includes("IN"));

        const chosenVoice = maleHindiVoice || anyHindiVoice || indianMaleVoice || indianVoice;
        const isDevanagari = chosenVoice && chosenVoice.lang.toLowerCase().startsWith("hi");

        let text = "";
        let pitch = 1.0;
        let rate = 0.95;
        let lang = "hi-IN";

        if (mode === "hi-standard") {
          // 1. Previous Standard Hindi Soundbox (DEFAULT)
          text = isDevanagari
            ? `FlexiPay पर ${amt} रुपये प्राप्त हुए.`
            : `FlexiPay par ${amt} rupaye prapt hue.`;
          pitch = 1.0;
          rate = 0.95;
          lang = chosenVoice ? chosenVoice.lang : "hi-IN";
        } else if (mode === "hi-ab") {
          // 2. Amitabh Bachchan Style Script (Simulated Tribute)
          text = isDevanagari
            ? `देवियों और सज्जनों, FlexiPay पर ${amt} रुपये प्राप्त हुए!`
            : `Deviyo aur sajjano, FlexiPay par ${amt} rupaye prapt huye!`;
          pitch = 0.65;
          rate = 0.85;
          lang = chosenVoice ? chosenVoice.lang : "hi-IN";
        } else {
          // 3. English Soundbox
          text = `Received ${amt} rupees on FlexiPay.`;
          pitch = 1.0;
          rate = 0.95;
          lang = "en-IN";
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        if (chosenVoice && (mode === "hi-standard" || mode === "hi-ab")) {
          utterance.voice = chosenVoice;
        } else if (mode === "en-IN") {
          const engVoice = allVoices.find((v) => v.lang.includes("IN") || v.lang.startsWith("en"));
          if (engVoice) utterance.voice = engVoice;
        }
        utterance.pitch = pitch;
        utterance.rate = rate;
        utterance.volume = 1.0;

        utterance.onerror = (e) => console.warn("[Soundbox speech error]", e);
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Speech synthesis error:", err);
      }
    }
  };

  // Cross-App Synchronization Bus (BroadcastChannel + LocalStorage Event)
  const soundboxEnabledRef = React.useRef(soundboxEnabled);
  const voiceLangRef = React.useRef(voiceLang);
  useEffect(() => {
    soundboxEnabledRef.current = soundboxEnabled;
    voiceLangRef.current = voiceLang;
  }, [soundboxEnabled, voiceLang]);

  useEffect(() => {
    let channel = null;

    const processIncomingPayment = (payload) => {
      console.log("[Merchant Received Sync Event]", payload);
      if (!payload || payload.amount === undefined || payload.amount === null) return;
      const amt = Number(payload.amount);
      const mode = payload.mode || "Buy Now, Pay Later";
      const custName = payload.customer || "Rutuja Sonawane";

      setSales((prev) => prev + amt);
      setUnsettledBalance((prev) => prev + amt);
      setLastPaidMode(mode);
      setPaid(true);

      const newTx = {
        id: "ord_" + (payload.timestamp || Date.now()),
        customer: custName,
        upiId: payload.upiId || "rutuja@flexipay",
        initials: "RS",
        amount: amt,
        type: mode,
        date: "Just now (Live)",
        items: "FlexiPay Consumer Checkout",
        utr: String(payload.utr || Math.floor(400000000000 + Math.random() * 900000000000)),
        mdr: "₹0.00 (0% Promo)",
        status: "Settled",
        phone: "+91 98201 44821"
      };

      setTransactions((prev) => [newTx, ...prev]);

      // Announce immediately via soundbox
      announceSoundbox(amt, voiceLangRef.current);

      // Show high-priority toast
      setLiveSyncToast(`Received ${formatRupee(amt)} from ${custName} via ${mode}`);
      setTimeout(() => setLiveSyncToast(null), 6000);
    };

    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("flexipay_bus");
        channel.onmessage = (event) => {
          console.log("[Merchant flexipay_bus message]", event?.data);
          if (!event || !event.data) return;
          const { type, payload } = event.data;
          if (type === "PAYMENT_COMPLETED" && payload) {
            processIncomingPayment(payload);
          }
        };
      }
    } catch (e) {
      console.warn("Merchant BroadcastChannel error:", e);
    }

    const handleStorage = (e) => {
      console.log("[Merchant storage event]", e.key, e.newValue);
      if (e.key === "flexiLastSyncPayment" && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          processIncomingPayment(payload);
        } catch (err) {
          console.warn("Storage sync parse error:", err);
        }
      }
    };

    // Firebase Cloud Realtime Listener (Global cross-device sync)
    const unsubscribeFirebase = syncSubscribePayments((p) => {
      console.log("[Merchant Firebase Payment Event]", p);
      processIncomingPayment(p);
    });

    // Fast polling to sync-server on port 4000 to bridge cross-origin port isolation
    let lastPollTime = Date.now();
    const pollInterval = setInterval(() => {
      fetch(`http://localhost:4000/api/poll-payment?since=${lastPollTime}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.newPayments && data.newPayments.length > 0) {
            lastPollTime = data.serverTime || Date.now();
            data.newPayments.forEach(p => {
              processIncomingPayment(p);
            });
          }
        })
        .catch(() => {
          // Sync server offline or restarting
        });
    }, 700);

    return () => {
      clearInterval(pollInterval);
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
      if (unsubscribeFirebase) unsubscribeFirebase();
    };
  }, []);

  // Quick Cart Items
  const quickItems = [
    { name: "Grocery Essentials", price: 850 },
    { name: "Pooja & Ghee Hamper", price: 1420 },
    { name: "Monthly Super Saver", price: 2500 }
  ];

  // Custom Store Offer Campaign (with LocalStorage initial state)
  const [offer, setOffer] = useState(() => {
    try {
      const saved = localStorage.getItem("flexiMerchantOffer");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {
      title: "Flat 10% Cashback on Buy Now, Pay Later",
      minSpend: 1000,
      rewardPts: 100,
      cashbackCap: 150
    };
  });

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(currentMerchant.vpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleGenerate = () => {
    if (!amount || Number(amount) <= 0) return;
    setQrGenerated(true);
    setPaid(false);

    // Broadcast generated bill to Consumer App (via Relay Server + localStorage + BroadcastChannel)
    const billPayload = {
      amount: Number(amount),
      merchant: currentMerchant.name,
      vpa: currentMerchant.vpa,
      customer: customer || "Walk-in Customer",
      timestamp: Date.now()
    };
    try {
      // 1. Firebase Realtime Cloud Publish (cross-device)
      syncPublishBill(billPayload);

      // 2. Local relay server publish
      fetch("http://localhost:4000/api/bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billPayload)
      }).catch(() => {});

      localStorage.setItem("flexiPosBill", JSON.stringify(billPayload));
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("flexipay_bus");
        bc.postMessage({ type: "POS_BILL_GENERATED", payload: billPayload });
        setTimeout(() => {
          try { bc.close(); } catch (e) {}
        }, 1000);
      }
    } catch (e) {
      console.warn("Bill broadcast error:", e);
    }
  };

  const handleSimulatePayment = (mode = "Buy Now, Pay Later") => {
    const val = Number(amount) || 2500;
    setSales((s) => s + val);
    setUnsettledBalance((b) => b + val);
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
      upiId: mode.includes("Later") ? "rutuja@flexipay" : "customer@okaxis",
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
    if (merchantRole === "cashier") {
      alert("Permission Denied: Cashier accounts cannot initiate bank payouts. Switch to Owner role.");
      return;
    }
    setSettleModalOpen(true);
  };

  const [merchantCreditLimit, setMerchantCreditLimit] = useState(150000);
  const [merchantBorrowed, setMerchantBorrowed] = useState(() => {
    const saved = localStorage.getItem("flexiMerchantBorrowed");
    const num = Number(saved);
    return isNaN(num) ? 0 : num;
  });

  const navItems = [
    { id: "pos", label: "POS & Bill", icon: CreditCard },
    { id: "credit", label: "Store Credit", icon: Banknote },
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
      {/* ---------------------------------------------------- */}
      {/* MAANG-TIER COMMAND HEADER (Stripe / Square Terminal) */}
      {/* ---------------------------------------------------- */}
      <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-30 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          
          {/* Store Branding (Private Terminal Isolation) */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#F47920] to-amber-500 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-md shadow-orange-500/20 shrink-0 border border-white/10">
              {currentMerchant.name ? currentMerchant.name[0] : "S"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                  {currentMerchant.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified POS
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-400 truncate mt-0.5">
                <button
                  onClick={handleCopyVpa}
                  className="font-mono text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer shrink-0 transition"
                  title="Click to copy UPI ID"
                >
                  <span>{currentMerchant.vpa}</span>
                  <Copy size={11} />
                </button>
                {copiedVpa && <span className="text-emerald-400 font-bold text-[10px]">Copied!</span>}
                <span className="hidden sm:inline text-slate-600">• GSTIN: {currentMerchant.gstin || "27AABCU9603R1ZM"}</span>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Interactive Soundbox Control Pill */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
              <button
                onClick={() => setSoundboxEnabled((prev) => !prev)}
                className={`p-1.5 sm:px-2.5 sm:py-1 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  soundboxEnabled
                    ? "bg-[#F47920] text-white shadow-xs"
                    : "bg-transparent text-slate-500 hover:text-slate-300"
                }`}
                title="Toggle Soundbox Speaker"
              >
                {soundboxEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span className="hidden lg:inline">{soundboxEnabled ? "Soundbox On" : "Muted"}</span>
              </button>

              {soundboxEnabled && (
                <>
                  <button
                    onClick={cycleVoice}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      voiceLang === "hi-standard"
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : voiceLang === "hi-ab"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Switch voice: Standard Hindi, AB Hindi, English"
                  >
                    {voiceLang === "hi-standard"
                      ? "🗣️ Standard"
                      : voiceLang === "hi-ab"
                      ? "🎙️ AB (हिंदी)"
                      : "🇬🇧 English"}
                  </button>
                  <button
                    onClick={() => announceSoundbox(amount || 2500)}
                    className="px-2 py-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 rounded-lg transition cursor-pointer flex items-center gap-1"
                    title="Test Voice Announcement"
                  >
                    <Volume2 size={13} />
                    <span className="hidden sm:inline">Test</span>
                  </button>
                </>
              )}
            </div>

            {/* Cloud Sync Status */}
            <button
              onClick={() => setShowCloudSettings(true)}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-2xl border transition flex items-center gap-1.5 cursor-pointer ${
                cloudActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
              }`}
              title="Configure Firebase Realtime Cloud Sync"
            >
              <Cloud size={14} className={cloudActive ? "text-emerald-400" : "text-slate-500"} />
              <span className="hidden sm:inline">{cloudActive ? "Cloud Live" : "Cloud Sync"}</span>
            </button>

            {/* Staff Role Switcher */}
            <button
              onClick={toggleMerchantRole}
              className={`px-2.5 py-1.5 text-[11px] font-black rounded-2xl border transition flex items-center gap-1 cursor-pointer ${
                merchantRole === "owner"
                  ? "bg-white text-slate-950 border-white shadow-xs"
                  : "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30"
              }`}
              title="Click to toggle Cashier Mode vs Store Owner Mode"
            >
              <span>{merchantRole === "owner" ? "👑 Owner" : "🧑‍💼 Cashier"}</span>
            </button>

            {/* Bank Payout Badge (Desktop Only) */}
            <div
              onClick={() => {
                if (merchantRole === "owner") setSettleModalOpen(true);
              }}
              className={`hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-2xl transition ${
                merchantRole === "owner" ? "cursor-pointer hover:border-slate-700" : "opacity-75"
              }`}
              title={merchantRole === "owner" ? "Click to view Settlement breakdown" : "Settlement locked in Cashier mode"}
            >
              <Building2 size={14} className="text-slate-400" />
              <div className="text-left">
                <div className="text-[9px] text-slate-500 leading-tight">Settlement A/C</div>
                <div className="text-xs font-bold text-slate-200 leading-tight">
                  {(currentMerchant.bank?.bankName || "HDFC Bank").split(" ")[0]} {currentMerchant.bank?.maskedAccount || "•••• 9921"}
                </div>
              </div>
            </div>

            {/* Logout Store Terminal Button */}
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition flex items-center gap-1 cursor-pointer"
              title="Logout of this store's private terminal"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout Store</span>
            </button>
          </div>
        </div>

        {/* Desktop Segmented Navigation Tabs */}
        <div className="hidden md:flex max-w-6xl mx-auto px-6 gap-1.5 border-t border-slate-800/80 text-xs py-1.5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`py-2 px-3.5 font-bold rounded-xl transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  active
                    ? "bg-[#F47920] text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon size={15} />
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
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
                active ? "text-[#F47920] font-bold" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon size={20} className={active ? "text-[#F47920] stroke-[2.4]" : "text-slate-400"} />
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
              className="px-2 py-1.5 rounded-lg bg-orange-50 text-[#F47920] hover:bg-orange-100 border border-orange-200 transition flex items-center gap-1 shrink-0 text-xs font-bold cursor-pointer"
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
              <div className="p-2.5 sm:p-3 rounded-xl bg-orange-50/80 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="text-xs text-slate-700">
                    <strong className="font-semibold text-slate-900">Auto-Settlement:</strong> Tomorrow 7:00 AM (T+1 Free) or Instant T+0
                  </span>
                </div>
                <button
                  onClick={handleInstantSettle}
                  className={`self-stretch sm:self-auto text-center px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    merchantRole === "owner"
                      ? "bg-[#F47920] hover:bg-[#E06710] text-white shadow-xs"
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  }`}
                  title={merchantRole === "owner" ? "Open Settlement & Payout breakdown" : "Cashier cannot initiate bank settlements"}
                >
                  <Building2 size={13} />
                  <span>
                    {merchantRole === "owner"
                      ? unsettledBalance > 0
                        ? `Instant Settle (${formatRupee(unsettledBalance)})`
                        : "All Settled (₹0)"
                      : "Settle Locked (Cashier)"}
                  </span>
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
            Payout initiated! {formatRupee(settledToastAmount)} transferred to HDFC Bank A/C ending in 9921.
          </div>
        )}

        {/* Real-time Customer Payment Live Sync Alert */}
        {liveSyncToast && (
          <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg animate-tab-enter">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0"></span>
              <span>🔔 LIVE PAYMENT: {liveSyncToast}</span>
            </div>
            <button
              onClick={() => setLiveSyncToast(null)}
              className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs ml-2 cursor-pointer"
            >
              Dismiss
            </button>
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
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 bg-orange-50 text-[#F47920] rounded-lg">
                  Counter #01
                </span>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 block mb-1">
                  Enter Bill Amount (₹)
                </label>
                <div className="flex items-center border-2 border-slate-200 rounded-xl px-3.5 py-1.5 sm:py-2 focus-within:border-[#F47920] transition bg-slate-50/50">
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
                      className={`py-1.5 sm:py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        Number(amount) === preset
                          ? "bg-[#F47920] text-white border-[#F47920] shadow-xs"
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
                  className="flex-1 py-2.5 sm:py-3.5 bg-[#F47920] hover:bg-[#E06710] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
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
                  className="w-full text-left text-[11px] font-semibold text-[#F47920] hover:text-[#E06710] flex items-center justify-between cursor-pointer py-1"
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
                            className="p-1.5 text-left rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 transition group cursor-pointer"
                          >
                            <div className="text-[10px] font-semibold text-slate-800 truncate group-hover:text-[#F47920]">
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
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#F47920]"
                        placeholder="Customer Name (Optional)"
                      />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#F47920]"
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
                      value={`upi://pay?pa=${currentMerchant.vpa}&pn=${encodeURIComponent(currentMerchant.name)}&am=${amount}&cu=INR`}
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

                  {/* SmartSoundbox Voice Indicator */}
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-left flex items-center justify-between gap-2 max-w-sm mx-auto w-full">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                        <span>{voiceLang === "hi-ab" ? "🎙️" : "🔊"}</span>
                        <span>
                          Soundbox:{" "}
                          {voiceLang === "hi-standard"
                            ? "Standard Hindi (Default)"
                            : voiceLang === "hi-ab"
                            ? "AB Hindi (Simulated)"
                            : "English"}
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-800 truncate font-medium">
                        {voiceLang === "hi-standard"
                          ? `"FlexiPay पर ₹${Number(amount || 0).toLocaleString("en-IN")} रुपये प्राप्त हुए."`
                          : voiceLang === "hi-ab"
                          ? `"देवियों और सज्जनों, FlexiPay पर ₹${Number(amount || 0).toLocaleString("en-IN")} रुपये प्राप्त हुए!"`
                          : `"Received ₹${Number(amount || 0).toLocaleString("en-IN")} on FlexiPay."`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => announceSoundbox(amount || 2500)}
                      className="px-2 py-1 text-[10px] font-bold bg-[#F47920] hover:bg-[#E06710] text-white rounded-lg transition shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
                      title="Test Voice Announcement"
                    >
                      <Volume2 size={11} />
                      <span>Hear Voice</span>
                    </button>
                  </div>

                  {!paid ? (
                    <div className="space-y-2 pt-1 w-full max-w-sm mx-auto">
                      <button
                        onClick={() => handleSimulatePayment("Buy Now, Pay Later")}
                        className="w-full py-2.5 bg-[#F47920] hover:bg-[#E06710] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
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
                      value={`upi://pay?pa=${currentMerchant.vpa}&pn=${encodeURIComponent(currentMerchant.name)}&cu=INR`}
                      size={160}
                    />
                  </div>

                  <div>
                    <div className="text-sm sm:text-base font-bold text-slate-900">{currentMerchant.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{currentMerchant.vpa}</div>
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
        {/* TAB: STORE WORKING CAPITAL CREDIT LINE (Sprint 3)    */}
        {/* ==================================================== */}
        {tab === "credit" && (
          <StoreCreditTab
            currentMerchant={currentMerchant}
            sales={sales}
            transactions={transactions}
            creditLimit={currentMerchant.creditLimit || merchantCreditLimit}
            borrowed={merchantBorrowed}
            setBorrowed={setMerchantBorrowed}
          />
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
        {tab === "qr" && <StandeeTab currentMerchant={currentMerchant} onOpenDisplay={() => setCustomerDisplayOpen(true)} />}

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
      {customerDisplayOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto"
          onClick={() => setCustomerDisplayOpen(false)}
        >
          <button
            onClick={() => setCustomerDisplayOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X size={24} />
          </button>

          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl animate-tab-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#F47920] -mx-6 -mt-6 p-4 rounded-t-3xl text-white">
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">Scan to Pay</div>
              <div className="text-xl font-black mt-0.5">{currentMerchant.name}</div>
            </div>

            <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl inline-block shadow-sm">
              <QRCodeSVG
                value={
                  qrGenerated && amount
                    ? `upi://pay?pa=${currentMerchant.vpa}&pn=${encodeURIComponent(currentMerchant.name)}&am=${amount}&cu=INR`
                    : `upi://pay?pa=${currentMerchant.vpa}&pn=${encodeURIComponent(currentMerchant.name)}&cu=INR`
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
              <div className="text-xs font-mono text-slate-500 mt-0.5">UPI ID: {currentMerchant.vpa}</div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-semibold">
              <span className="px-1.5 py-0.5 bg-slate-100 rounded">GPay</span>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded">PhonePe</span>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded">Paytm</span>
              <span className="px-1.5 py-0.5 bg-orange-50 text-[#F47920] rounded font-bold border border-orange-200">FlexiPay</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ---------------------------------------------------- */}
      {/* MOBILE-RESPONSIVE TAX INVOICE MODAL (Bottom Sheet)   */}
      {/* ---------------------------------------------------- */}
      {selectedReceipt && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-tab-enter max-h-[90vh] overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Sharma Super Store Invoice</h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedReceipt.id}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
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
                <span className={`font-semibold ${selectedReceipt.type.includes("Later") ? "text-purple-700" : "text-[#F47920]"}`}>
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
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={14} /> Print Invoice
              </button>
              <button
                onClick={() => {
                  alert(`Invoice link sent via WhatsApp to ${selectedReceipt.customer}`);
                }}
                className="py-2.5 px-3 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Share2 size={14} /> WhatsApp
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="py-2.5 px-3 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ---------------------------------------------------- */}
      {/* ENTERPRISE MERCHANT SETTLEMENT MODAL (T+0 vs T+1)     */}
      {/* ---------------------------------------------------- */}
      {settleModalOpen && createPortal(
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4"
          onClick={() => setSettleModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-tab-enter max-h-[92vh] overflow-y-auto my-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F47920] flex items-center justify-center font-bold">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Bank Payout Settlement</h3>
                  <p className="text-[11px] text-slate-500">
                    {currentMerchant.name} • {currentMerchant.bank?.bankName || "HDFC Bank"} A/C {currentMerchant.bank?.maskedAccount || "•••• 9921"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSettleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Ledger Balance */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-1">
              <span className="text-[11px] text-slate-300 font-medium">Unsettled Gross Balance</span>
              <div className="text-3xl font-black">{formatRupee(unsettledBalance)}</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1">
                <CheckCircle2 size={12} />
                <span>Verified across {transactions.length} customer collections</span>
              </div>
            </div>

            {/* Payout Options: T+1 vs T+0 */}
            <div className="space-y-2.5 text-xs">
              <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Choose Settlement Speed</span>

              {/* T+1 Standard (Free) */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Standard Payout (T+1)</span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Zero Fee
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tomorrow at 7:00 AM • Direct NEFT/RTGS</div>
                </div>
                <span className="font-black text-slate-900">{formatRupee(unsettledBalance)}</span>
              </div>

              {/* T+0 Instant Settlement (Real World 0.20% IMPS Fee) */}
              <div className="p-3.5 rounded-xl border-2 border-[#F47920] bg-orange-50/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Instant Payout (T+0 IMPS)</span>
                      <span className="text-[9px] font-bold text-[#F47920] bg-white px-1.5 py-0.2 rounded border border-orange-200">
                        Within 15 Seconds
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Immediate credit to {currentMerchant.bank?.bankName || "HDFC Bank"} A/C {currentMerchant.bank?.maskedAccount || "•••• 9921"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-[#F47920]">{formatRupee(Math.max(0, unsettledBalance - Math.round(unsettledBalance * 0.002)))}</div>
                    <div className="text-[10px] text-slate-400">Net to bank</div>
                  </div>
                </div>

                {/* Deductions Breakdown */}
                <div className="p-2.5 bg-white/80 rounded-xl border border-orange-200/80 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Amount:</span>
                    <span>{formatRupee(unsettledBalance)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Instant IMPS Switch Fee (0.20%):</span>
                    <span>-{formatRupee(Math.round(unsettledBalance * 0.002))}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>MDR on FlexiPay (0% Promo):</span>
                    <span className="text-emerald-700 font-semibold">₹0.00 (Waived)</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1">
                    <span>Net Transfer Amount:</span>
                    <span className="text-[#F47920]">{formatRupee(Math.max(0, unsettledBalance - Math.round(unsettledBalance * 0.002)))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Execute Instant Settle Action */}
            <div className="pt-2 space-y-2">
              <button
                disabled={unsettledBalance <= 0}
                onClick={() => {
                  const fee = Math.round(unsettledBalance * 0.002);
                  const net = Math.max(0, unsettledBalance - fee);
                  const newEntry = {
                    id: "set_" + Date.now(),
                    amount: unsettledBalance,
                    fee,
                    net,
                    type: "T+0 Instant",
                    time: "Just now",
                    status: "Transferred"
                  };
                  setSettleHistory((prev) => [newEntry, ...prev]);
                  setSettledToastAmount(unsettledBalance);
                  setUnsettledBalance(0);
                  setSettleModalOpen(false);
                  setSettledToast(true);
                  setTimeout(() => setSettledToast(false), 4500);
                }}
                className="w-full py-3 bg-[#F47920] hover:bg-[#E06710] disabled:opacity-50 text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Building2 size={16} />
                <span>Confirm Instant Payout ({formatRupee(Math.max(0, unsettledBalance - Math.round(unsettledBalance * 0.002)))})</span>
              </button>
              <p className="text-[10px] text-center text-slate-400">
                Complies with RBI Master Directions on Payment Aggregators & Merchant Settlements
              </p>
            </div>
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
  );
}

// ----------------------------------------------------
// ROOT APP COMPONENT (Merchant Gateway & Session Isolation Guard)
// ----------------------------------------------------
export default function App() {
  const [merchants, setMerchants] = useState(getInitialMerchants);
  const [currentMerchant, setCurrentMerchant] = useState(getInitialMerchant);

  const handleSelectMerchant = (merchant) => {
    setMerchants((prev) => {
      const exists = prev.some((m) => m.id === merchant.id);
      const updated = exists ? prev : [merchant, ...prev];
      try {
        localStorage.setItem("flexiMerchants_registry", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    try {
      localStorage.setItem("flexipay_merchant_session", JSON.stringify(merchant));
      localStorage.setItem("flexiActiveStoreId", merchant.id);
    } catch (e) {}
    setCurrentMerchant(merchant);
  };

  const handleLogoutMerchant = () => {
    try {
      localStorage.removeItem("flexipay_merchant_session");
      localStorage.removeItem("flexiActiveStoreId");
      const url = new URL(window.location.href);
      url.searchParams.delete("store");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    } catch (e) {}
    setCurrentMerchant(null);
  };

  if (!currentMerchant) {
    return (
      <MerchantOnboardingFlow
        registeredMerchants={merchants}
        onComplete={handleSelectMerchant}
      />
    );
  }

  return (
    <MerchantTerminal
      key={currentMerchant.id}
      currentMerchant={currentMerchant}
      onLogout={handleLogoutMerchant}
    />
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
            className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#F47920] w-full"
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
                  ? "bg-white text-[#F47920] shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => alert("Statement exported for FY 2026-27")}
          className="text-[#F47920] text-[11px] font-semibold hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
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
                        : "bg-orange-50 text-[#F47920] border border-orange-100"
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
                        : "bg-orange-50 text-[#F47920] border border-orange-200"
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
                  <span className="text-[#F47920] font-semibold hover:underline">View Slip →</span>
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
    const updatedOffer = {
      title,
      minSpend: Number(minSpend),
      cashbackCap: Number(cashbackCap),
      rewardPts: 100
    };
    setOffer(updatedOffer);
    setSaved(true);

    try {
      // 1. Firebase Realtime Cloud publish
      syncPublishOffer(updatedOffer);

      // 2. Local relay server publish
      fetch("http://localhost:4000/api/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOffer)
      }).catch(() => {});

      localStorage.setItem("flexiMerchantOffer", JSON.stringify(updatedOffer));
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("flexipay_bus");
        bc.postMessage({ type: "OFFER_UPDATED", payload: updatedOffer });
        setTimeout(() => {
          try { bc.close(); } catch (e) {}
        }, 1000);
      }
    } catch (e) {
      console.warn("Offer broadcast error:", e);
    }

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
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-[#F47920]"
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
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-[#F47920]"
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
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-[#F47920]"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-[#F47920] hover:bg-[#E06710] text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
        >
          {saved ? "✓ Campaign Updated Successfully" : "Update Store Offer"}
        </button>
      </div>

      {/* Live Consumer App Simulation Preview */}
      <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200 text-xs space-y-2">
        <span className="text-[10px] sm:text-[11px] font-bold text-[#F47920] uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={12} /> Live Preview on FlexiPay Consumer App
        </span>
        <div className="bg-white p-3 rounded-lg border border-orange-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#F47920] text-white flex items-center justify-center font-bold text-xs shrink-0">
              %
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 truncate">{title}</div>
              <div className="text-[10px] text-slate-500 truncate">
                Orders &gt; {formatRupee(minSpend)} • Cap {formatRupee(cashbackCap)}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#F47920] bg-orange-50 px-2 py-1 rounded shrink-0">
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
function StandeeTab({ currentMerchant, onOpenDisplay }) {
  const store = currentMerchant || {
    name: "Sharma Super Store",
    vpa: "sharma@flexipay"
  };

  return (
    <div className="max-w-md mx-auto space-y-4 text-center">
      
      {/* Physical Standee Card with Indian UPI Aesthetic */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        
        {/* Top Standee Header Banner */}
        <div className="bg-[#F47920] -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 p-4 text-white mb-5">
          <div className="text-[10px] sm:text-xs font-bold tracking-wider uppercase opacity-90">Accepted Here</div>
          <div className="text-base sm:text-lg font-black tracking-tight mt-0.5">UPI • Buy Now, Pay Later</div>
        </div>

        {/* QR Code Container */}
        <div className="p-3 sm:p-4 bg-white border-2 border-slate-200 rounded-2xl inline-block shadow-sm">
          <QRCodeSVG
            value={`upi://pay?pa=${store.vpa}&pn=${encodeURIComponent(store.name)}&cu=INR`}
            size={190}
          />
        </div>

        {/* Store Title & VPA */}
        <div className="mt-3">
          <div className="text-base sm:text-lg font-extrabold text-slate-900">{store.name}</div>
          <div className="text-xs font-mono font-semibold text-slate-600 mt-0.5">{store.vpa}</div>
        </div>

        {/* Supported UPI Apps Row */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 sm:gap-2.5 text-[10px] text-slate-500 font-semibold flex-wrap">
          <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200">GPay</span>
          <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200">PhonePe</span>
          <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200">Paytm</span>
          <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200">BHIM</span>
          <span className="px-2 py-0.5 bg-orange-50 text-[#F47920] rounded border border-orange-200 font-bold">FlexiPay</span>
        </div>
      </div>

      {/* Standee Actions */}
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <button
          onClick={onOpenDisplay}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#F47920] hover:bg-[#E06710] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
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
                <span className="text-[#F47920]">UPI Direct</span>
                <span className="text-slate-900">
                  {formatRupee(upiSales)} ({Math.round((upiSales / Math.max(1, sales)) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#F47920] rounded-full"
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
// ----------------------------------------------------
// AUTHENTIC BANKING OTP VERIFICATION COMPONENT
// ----------------------------------------------------
function AuthenticOtpVerification({
  title,
  actionDesc,
  phone = "+91 98*** **129",
  amount,
  sender = "Equitas SFB",
  accent = "blue",
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
      setError("Please enter the complete 4-digit OTP.");
      return;
    }

    if (entered !== generatedOtp) {
      setError("Incorrect OTP code. Please enter the code received via SMS.");
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
      : "bg-[#F47920] hover:bg-[#E06710] text-white";

  const accentBorderClass =
    accent === "emerald"
      ? "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
      : "focus:border-[#F47920] focus:ring-1 focus:ring-[#F47920]";

  return (
    <div className="space-y-4 flex-1 text-center py-1 animate-tab-enter">
      {/* Authentic Incoming Mobile SMS Push Notification Banner */}
      {showSmsPush && (
        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl flex items-start gap-2.5 border border-slate-700 text-left animate-tab-enter">
          <div className="w-8 h-8 rounded-full bg-[#F47920] text-white flex items-center justify-center shrink-0 mt-0.5">
            <MessageSquare size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span className="font-bold text-slate-200 uppercase tracking-wider">{sender} • SMS Alert</span>
              <span>Just now</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              <strong className="text-white font-mono text-xs font-black tracking-widest">{generatedOtp}</strong> is your authorization code for {actionDesc || "transaction"} of {formatRupee(amount)}. Valid for 10 mins.
            </p>
            <button
              type="button"
              onClick={handleAutoFill}
              className="mt-2 text-[10px] font-extrabold text-[#F47920] hover:text-orange-300 bg-orange-500/20 px-2.5 py-1 rounded-md border border-orange-400/30 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition"
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
              <span>Verifying with SFB Switch...</span>
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
// UNCLUTTERED 4-STEP DRAW CREDIT WIZARD (KFS Consent & OTP Flow)
// ----------------------------------------------------
function DrawCreditModal({ availableCredit, creditLimit, borrowed, onClose, onConfirm }) {
  const [step, setStep] = useState(1); // 1: Amount & Tenure, 2: KFS Consent, 3: OTP Verification, 4: Success Receipt
  const [amount, setAmount] = useState(Math.min(25000, availableCredit));
  const [tenureDays, setTenureDays] = useState(60); // 30, 60, 90
  const [kfsConsent, setKfsConsent] = useState(true);
  const [utr] = useState(() => "IMPS" + Math.floor(400000000000 + Math.random() * 900000000000));

  // Dynamic EDI Calculations
  const monthlyRate = 0.0099; // 0.99% / month
  const tenureMonths = tenureDays / 30;
  const estimatedInterest = Math.round(amount * monthlyRate * tenureMonths);
  const totalRepayable = amount + estimatedInterest;
  const dailyEdi = Math.ceil(totalRepayable / tenureDays);

  // Lock background body scroll while popup is open
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleFinalDone = () => {
    onConfirm(amount);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 3) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 my-auto border border-slate-100 max-h-[92vh] flex flex-col animate-tab-enter"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header & Step Indicator */}
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#F47920] text-white flex items-center justify-center shadow-xs">
                <Banknote size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                  {step === 1 && "Draw Store Credit"}
                  {step === 2 && "Key Fact Statement (KFS)"}
                  {step === 3 && "Security Verification"}
                  {step === 4 && "Disbursal Successful"}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {step === 1 && "Configure amount and repayment velocity"}
                  {step === 2 && "RBI Digital Lending Guidelines (DLG)"}
                  {step === 3 && "Verify with 4-digit authorization OTP"}
                  {step === 4 && "Funds routed directly via instant IMPS"}
                </p>
              </div>
            </div>
            {step !== 4 && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Clean Step Pills */}
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {[
              { num: 1, label: "Amount" },
              { num: 2, label: "KFS" },
              { num: 3, label: "OTP" },
              { num: 4, label: "Done" }
            ].map((s) => (
              <div
                key={s.num}
                className={`h-1.5 rounded-full transition-all ${
                  step >= s.num ? "bg-[#F47920]" : "bg-slate-100"
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: AMOUNT & REPAYMENT CONFIG (Uncluttered & Spacious) */}
        {step === 1 && (
          <div className="space-y-4 flex-1">
            <div className="space-y-1.5 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Available Line: {formatRupee(availableCredit)}
              </span>
              <div className="flex items-center justify-center border-2 border-slate-200 rounded-2xl p-3 focus-within:border-[#F47920] transition bg-slate-50/50">
                <span className="text-3xl font-black text-slate-400 mr-2">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.min(availableCredit, Math.max(0, Number(e.target.value))))}
                  className="w-48 text-3xl font-black text-slate-900 outline-none bg-transparent text-center"
                  max={availableCredit}
                />
              </div>
            </div>

            {/* Smart Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[10000, 25000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(Math.min(availableCredit, preset))}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    amount === preset
                      ? "bg-[#F47920] text-white border-[#F47920] shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  ₹{(preset / 1000)}k
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(availableCredit)}
                className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  amount === availableCredit
                    ? "bg-[#F47920] text-white border-[#F47920] shadow-xs"
                    : "bg-orange-50 text-[#F47920] border-orange-200 hover:bg-orange-100"
                }`}
              >
                Max Line
              </button>
            </div>

            {/* Repayment Velocity Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Choose Repayment Velocity</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 30, title: "30 Days", tag: "Fast" },
                  { days: 60, title: "60 Days", tag: "Recommended" },
                  { days: 90, title: "90 Days", tag: "Low Stress" }
                ].map((plan) => {
                  const estEdi = Math.ceil((amount + (amount * monthlyRate * (plan.days / 30))) / plan.days);
                  return (
                    <button
                      key={plan.days}
                      type="button"
                      onClick={() => setTenureDays(plan.days)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        tenureDays === plan.days
                          ? "border-[#F47920] bg-orange-50/70 ring-1 ring-[#F47920]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="text-[11px] font-bold text-slate-900">{plan.title}</div>
                      <div className="text-xs font-black text-[#F47920] mt-0.5">{formatRupee(estEdi)}/d</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{plan.tag}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Destination Bank Account Mini Bar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-700">Credit into: <strong>HDFC Bank •••• 9921</strong></span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                IMPS Instant
              </span>
            </div>

            {/* Action */}
            <button
              onClick={() => setStep(2)}
              disabled={amount <= 0 || amount > availableCredit}
              className="w-full py-3.5 bg-[#F47920] hover:bg-[#E06710] text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>Review Key Fact Statement (KFS)</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: KEY FACT STATEMENT (KFS) CONSENT */}
        {step === 2 && (
          <div className="space-y-4 flex-1">
            <div className="p-2.5 bg-orange-50/70 border border-orange-200 rounded-xl text-[11px] text-orange-950 flex items-center justify-between">
              <span>Lender: <strong>Equitas Small Finance Bank Ltd.</strong></span>
              <span className="font-mono text-[10px] text-[#F47920]">RBI/DLG/SFB/891</span>
            </div>

            {/* KFS Financial Disclosures Table */}
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Sanctioned Drawdown</span>
                <span className="font-extrabold text-slate-900">{formatRupee(amount)}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Net Disbursal to Bank</span>
                <span className="font-extrabold text-emerald-700">{formatRupee(amount)} (100%)</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Daily EDI Deduction</span>
                <span className="font-bold text-[#F47920]">{formatRupee(dailyEdi)} / day</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Interest Rate (Reducing)</span>
                <span className="font-semibold text-slate-800">0.99% / mo (Flat ~{formatRupee(estimatedInterest)})</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Processing Fee</span>
                <span className="font-bold text-emerald-700">₹0.00 (Waived)</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Pre-closure Penalty</span>
                <span className="font-bold text-emerald-700">₹0.00 (Nil)</span>
              </div>
              <div className="p-2.5 flex justify-between bg-slate-50/60">
                <span className="text-slate-500">Cooling-Off / Look-Up</span>
                <span className="font-semibold text-slate-800">3 Days (Exit with 0 fee)</span>
              </div>
            </div>

            {/* Mandatory Regulatory Consent Checkbox */}
            <label className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={kfsConsent}
                onChange={(e) => setKfsConsent(e.target.checked)}
                className="mt-0.5 accent-[#F47920] shrink-0"
              />
              <span className="text-slate-700 text-[11px] leading-relaxed">
                I have read and agree to the <strong>Key Fact Statement (KFS)</strong> terms and authorize daily EDI holdback sweeps from QR settlements under RBI Digital Lending Guidelines.
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!kfsConsent}
                className="w-2/3 py-3 bg-[#F47920] hover:bg-[#E06710] text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>Accept & Request OTP</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AUTHENTIC OTP VERIFICATION */}
        {step === 3 && (
          <AuthenticOtpVerification
            title="Enter Authorization OTP"
            actionDesc="credit line disbursal"
            amount={amount}
            phone="+91 98*** **129"
            sender="Equitas SFB"
            accent="orange"
            onSuccess={() => setStep(4)}
            onBack={() => setStep(2)}
            submitLabel={`Verify & Disburse ${formatRupee(amount)}`}
          />
        )}

        {/* STEP 4: SUCCESS RECEIPT */}
        {step === 4 && (
          <div className="space-y-4 flex-1 text-center py-2 animate-tab-enter">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Check size={36} strokeWidth={3} />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">IMPS Disbursal Completed</span>
              <h4 className="text-2xl font-black text-slate-900 mt-1">{formatRupee(amount)}</h4>
              <p className="text-xs text-slate-500 mt-1">
                Credited directly to <strong>HDFC Bank Current A/C •••• 9921</strong>
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">IMPS Reference No:</span>
                <span className="font-mono font-bold text-slate-900">{utr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily EDI Holdback:</span>
                <span className="font-bold text-[#F47920]">{formatRupee(dailyEdi)} / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Repayment Period:</span>
                <span className="font-semibold text-slate-800">{tenureDays} Days (Starting 11:59 PM)</span>
              </div>
            </div>

            <button
              onClick={handleFinalDone}
              className="w-full py-3.5 bg-[#F47920] hover:bg-[#E06710] text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md"
            >
              Done (Return to Store Credit)
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}

// ----------------------------------------------------
// UNCLUTTERED 4-STEP REPAY CREDIT WIZARD (Consent & OTP Flow)
// ----------------------------------------------------
function RepayCreditModal({ borrowed, creditLimit, sales, onClose, onConfirm }) {
  const [step, setStep] = useState(1); // 1: Amount & Source, 2: Terms & Consent, 3: OTP Verification, 4: Success Receipt
  const [repayType, setRepayType] = useState("full"); // "full" | "custom"
  const [customAmount, setCustomAmount] = useState(borrowed);
  const [source, setSource] = useState("bank"); // "bank" | "settlement" | "upi"
  const [repayConsent, setRepayConsent] = useState(true);
  const [utr] = useState(() => "REP" + Math.floor(400000000000 + Math.random() * 900000000000));

  const effectiveAmount = repayType === "full" ? borrowed : Math.min(borrowed, Math.max(100, customAmount));
  const restoredCredit = creditLimit - (borrowed - effectiveAmount);
  const savedInterest = Math.round(effectiveAmount * 0.0099 * 1.5);

  // Lock background body scroll while popup is open
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleFinalDone = () => {
    onConfirm(effectiveAmount);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 3) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 my-auto border border-slate-100 max-h-[92vh] flex flex-col animate-tab-enter"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header & Step Indicator */}
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <ArrowDownLeft size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                  {step === 1 && "Repay Store Credit"}
                  {step === 2 && "Pre-Closure Consent"}
                  {step === 3 && "Mandate Authorization"}
                  {step === 4 && "Repayment Completed"}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {step === 1 && "Select repayment amount and funding source"}
                  {step === 2 && "Review loan clearance terms and savings"}
                  {step === 3 && "Enter 4-digit authorization security PIN"}
                  {step === 4 && "Credit limit replenished immediately"}
                </p>
              </div>
            </div>
            {step !== 4 && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Clean Step Pills */}
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {[
              { num: 1, label: "Amount" },
              { num: 2, label: "Consent" },
              { num: 3, label: "OTP" },
              { num: 4, label: "Done" }
            ].map((s) => (
              <div
                key={s.num}
                className={`h-1.5 rounded-full transition-all ${
                  step >= s.num ? "bg-emerald-600" : "bg-slate-100"
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: REPAYMENT AMOUNT & SOURCE */}
        {step === 1 && (
          <div className="space-y-4 flex-1">
            {/* Outstanding Hero Card */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Loan Balance</span>
              <div className="text-2xl font-black">{formatRupee(borrowed)}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">Zero Pre-closure charges</div>
            </div>

            {/* Full vs Partial Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Select Settlement Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRepayType("full")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    repayType === "full"
                      ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">Full Settlement</div>
                  <div className="text-sm font-black text-emerald-700 mt-0.5">{formatRupee(borrowed)}</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRepayType("custom");
                    setCustomAmount(Math.round(borrowed / 2));
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    repayType === "custom"
                      ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">Custom Partial</div>
                  <div className="text-sm font-black text-[#F47920] mt-0.5">{formatRupee(customAmount)}</div>
                </button>
              </div>

              {repayType === "custom" && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-tab-enter text-xs">
                  <div className="flex items-center border border-slate-300 rounded-xl px-3 py-1.5 bg-white focus-within:border-emerald-600">
                    <span className="font-bold text-slate-400 mr-2">₹</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Math.min(borrowed, Math.max(0, Number(e.target.value))))}
                      className="w-full font-bold text-slate-900 outline-none"
                      max={borrowed}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[0.25, 0.5, 0.75, 1.0].map((frac) => (
                      <button
                        key={frac}
                        type="button"
                        onClick={() => setCustomAmount(Math.round(borrowed * frac))}
                        className="py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-100"
                      >
                        {frac * 100}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Repayment Channel */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Select Payment Channel</label>
              <div className="space-y-1.5 text-xs">
                <label
                  onClick={() => setSource("bank")}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    source === "bank"
                      ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input type="radio" checked={source === "bank"} onChange={() => setSource("bank")} className="accent-emerald-600" />
                    <div>
                      <div className="font-bold text-slate-900">HDFC Bank Auto-Debit (•••• 9921)</div>
                      <div className="text-[10px] text-slate-500">Verified IMPS e-Mandate</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Default</span>
                </label>

                <label
                  onClick={() => setSource("settlement")}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    source === "settlement"
                      ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input type="radio" checked={source === "settlement"} onChange={() => setSource("settlement")} className="accent-emerald-600" />
                    <div>
                      <div className="font-bold text-slate-900">Offset Today's QR Collections</div>
                      <div className="text-[10px] text-slate-500">Balance: {formatRupee(sales)} available</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#F47920] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">Instant Sweep</span>
                </label>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => setStep(2)}
              disabled={effectiveAmount <= 0}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Review &amp; Authorize Repayment</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: PRE-CLOSURE TERMS & CONSENT */}
        {step === 2 && (
          <div className="space-y-4 flex-1">
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Settlement Sum</span>
                <span className="font-extrabold text-slate-900">{formatRupee(effectiveAmount)}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Restored Credit Line</span>
                <span className="font-bold text-emerald-700">{formatRupee(restoredCredit)}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Pre-Payment Charges</span>
                <span className="font-bold text-emerald-700">₹0.00 (Zero Penalty)</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Future Interest Saved</span>
                <span className="font-semibold text-emerald-700">~{formatRupee(savedInterest)}</span>
              </div>
            </div>

            {/* Checkbox Consent */}
            <label className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={repayConsent}
                onChange={(e) => setRepayConsent(e.target.checked)}
                className="mt-0.5 accent-emerald-600 shrink-0"
              />
              <span className="text-slate-700 text-[11px] leading-relaxed">
                I authorize early repayment of <strong>{formatRupee(effectiveAmount)}</strong> via {source === "settlement" ? "QR settlement sweep" : "HDFC auto-debit"} towards store credit line clearance.
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!repayConsent}
                className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>Proceed to OTP</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AUTHENTIC OTP VERIFICATION */}
        {step === 3 && (
          <AuthenticOtpVerification
            title="Mandate Authorization"
            actionDesc="working capital repayment"
            amount={effectiveAmount}
            phone="+91 98*** **129"
            sender="Equitas SFB"
            accent="emerald"
            onSuccess={() => setStep(4)}
            onBack={() => setStep(2)}
            submitLabel={`Authorize Repay of ${formatRupee(effectiveAmount)}`}
          />
        )}

        {/* STEP 4: SUCCESS RECEIPT */}
        {step === 4 && (
          <div className="space-y-4 flex-1 text-center py-2 animate-tab-enter">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Check size={36} strokeWidth={3} />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Repayment Successful</span>
              <h4 className="text-2xl font-black text-slate-900 mt-1">{formatRupee(effectiveAmount)}</h4>
              <p className="text-xs text-slate-500 mt-1">
                Store credit line replenished to <strong>{formatRupee(restoredCredit)}</strong>
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Settlement UTR:</span>
                <span className="font-mono font-bold text-slate-900">{utr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Channel:</span>
                <span className="font-semibold text-slate-800">
                  {source === "settlement" ? "Today's QR Collections Sweep" : "HDFC Bank Auto-Debit"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Foreclosure Fee:</span>
                <span className="font-bold text-emerald-700">₹0.00 (Nil)</span>
              </div>
            </div>

            <button
              onClick={handleFinalDone}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md"
            >
              Done (Return to Store Credit)
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}

// ----------------------------------------------------
// STORE WORKING CAPITAL CREDIT LINE TAB (Sprint 3 / PDF Core)
// ----------------------------------------------------
function StoreCreditTab({ currentMerchant, sales, transactions, creditLimit, borrowed, setBorrowed }) {
  const [drawModal, setDrawModal] = useState(false);
  const [repayModal, setRepayModal] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const availableCredit = creditLimit - borrowed;

  const handleDrawConfirm = (amount) => {
    const nextBorrowed = borrowed + amount;
    setBorrowed(nextBorrowed);
    localStorage.setItem("flexiMerchantBorrowed", String(nextBorrowed));
    setDrawModal(false);
    const bankName = currentMerchant?.bank?.bankName || "HDFC Bank";
    const masked = currentMerchant?.bank?.maskedAccount || "•••• 9921";
    setSuccessToast(`✓ Successfully disbursed ${formatRupee(amount)} via IMPS to ${bankName} A/C ${masked}!`);
    setTimeout(() => setSuccessToast(""), 6000);
  };

  const handleRepayConfirm = (amount) => {
    const nextBorrowed = Math.max(0, borrowed - amount);
    setBorrowed(nextBorrowed);
    localStorage.setItem("flexiMerchantBorrowed", String(nextBorrowed));
    setRepayModal(false);
    setSuccessToast(`✓ Repayment of ${formatRupee(amount)} successful! Restored credit line to ${formatRupee(creditLimit - nextBorrowed)}.`);
    setTimeout(() => setSuccessToast(""), 6000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs animate-tab-enter">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Hero Working Capital Card */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 text-white p-5 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-orange-500/20 text-[#F47920] border border-orange-500/30">
                Merchant Working Capital Line
              </span>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                ● Pre-Sanctioned via GSTR
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {formatRupee(availableCredit)}
            </h2>
            <p className="text-xs text-slate-300 max-w-md">
              Instant revolving credit for inventory & vendor payouts. Based on your daily UPI QR throughput and GSTR-3B filings.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              onClick={() => setDrawModal(true)}
              disabled={availableCredit <= 0}
              className="px-5 py-3.5 bg-[#F47920] hover:bg-[#E06710] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Banknote size={16} />
              <span>Draw to Bank Account</span>
            </button>
            {borrowed > 0 && (
              <button
                onClick={() => setRepayModal(true)}
                className="px-4 py-3.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold border border-emerald-400/40 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowDownLeft size={16} />
                <span>Repay {formatRupee(borrowed)}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Metric Stats along bottom */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Total Sanctioned</span>
            <span className="font-bold text-sm">{formatRupee(creditLimit)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Daily Auto-Deduction (EDI)</span>
            <span className="font-bold text-sm text-emerald-400">
              {borrowed > 0 ? "₹350 / day" : "₹0 (No active draw)"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Interest Rate</span>
            <span className="font-bold text-sm">0.99% / mo</span>
          </div>
        </div>
      </div>

      {/* Underwriting Breakdown: QR Collections + GSTR Integration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Card 1: GSTR & QR Data Intelligence */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Digital Underwriting Intelligence</h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Verified GSTN
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Credit limits dynamically increase as your store processes higher daily UPI & FlexiPay volume.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">GSTIN {currentMerchant?.gstin || "27AABCU9603R1ZM"}</div>
                <div className="text-[10px] text-slate-500">GSTR-3B Average Turnover: ₹4.8 Lakhs / mo</div>
              </div>
              <span className="text-emerald-600 font-bold text-[11px]">Clean</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Daily QR Velocity</div>
                <div className="text-[10px] text-slate-500">Today: {formatRupee(sales)} across {transactions.length} orders</div>
              </div>
              <span className="text-[#F47920] font-bold text-[11px]">Growing</span>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-purple-900 text-[11px]">
              💡 <strong>Growth Tip:</strong> Process ₹5,000 more in customer FlexiPay orders this week to unlock a ₹2,00,000 credit limit.
            </div>
          </div>
        </div>

        {/* Card 2: EDI Repayment Mechanism */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Equated Daily Installment (EDI)</h3>
            {borrowed > 0 && (
              <button
                onClick={() => setRepayModal(true)}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Prepay Early</span> &gt;
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Zero bulk monthly EMI stress. Repayments automatically deduct in tiny micro-amounts from daily QR collections before bank settlement.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Active Drawn Principal:</span>
              <span className="font-bold text-slate-900">{formatRupee(borrowed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Daily EDI Holdback:</span>
              <span className="font-bold text-emerald-700">
                {borrowed > 0 ? "₹350 from today's payout" : "₹0.00 (No active draw)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lender Partner:</span>
              <span className="font-bold text-slate-800">Equitas Small Finance Bank</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-[11px]">
              <span className="text-slate-500">Early Pre-Closure Fee:</span>
              <span className="font-bold text-emerald-700">₹0.00 (Zero Penalty)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck size={16} className="text-[#F47920] shrink-0" />
            <span>Compliant with RBI Digital Lending Framework for MSMEs.</span>
          </div>
        </div>

      </div>

      {/* Advanced Draw Funds Modal */}
      {drawModal && (
        <DrawCreditModal
          availableCredit={availableCredit}
          creditLimit={creditLimit}
          borrowed={borrowed}
          onClose={() => setDrawModal(false)}
          onConfirm={handleDrawConfirm}
        />
      )}

      {/* Advanced Repay Funds Modal */}
      {repayModal && (
        <RepayCreditModal
          borrowed={borrowed}
          creditLimit={creditLimit}
          sales={sales}
          onClose={() => setRepayModal(false)}
          onConfirm={handleRepayConfirm}
        />
      )}

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
