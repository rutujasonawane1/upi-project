// ----------------------------------------------------
// FlexiPay Firebase Realtime Synchronization Module
// Enables instant global cross-device sync (Phone <-> Laptop)
// without needing a local sync-server or backend daemon.
// ----------------------------------------------------
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, off } from "firebase/database";

// Default template config - can be overridden in localStorage or via Settings Modal
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "upi-prototype-4c941.firebaseapp.com",
  databaseURL: "https://upi-prototype-4c941-default-rtdb.firebaseio.com",
  projectId: "upi-prototype-4c941",
  storageBucket: "upi-prototype-4c941.appspot.com",
  messagingSenderId: "",
  appId: ""
};

const STORAGE_KEY = "flexipay_firebase_config";

export function getActiveFirebaseConfig() {
  try {
    const custom = localStorage.getItem(STORAGE_KEY);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.databaseURL || parsed.projectId) return parsed;
    }
  } catch (e) {
    console.warn("Error reading stored firebase config:", e);
  }

  // Check Vite environment variables if provided
  if (import.meta.env?.VITE_FIREBASE_DATABASE_URL) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
    };
  }

  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(configObj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configObj));
    initDb(true);
    return true;
  } catch (e) {
    console.error("Failed to save Firebase config:", e);
    return false;
  }
}

export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
  initDb(true);
}

let dbInstance = null;
let currentApp = null;

function initDb(forceReinit = false) {
  if (dbInstance && !forceReinit) return dbInstance;

  const config = getActiveFirebaseConfig();
  if (!config.databaseURL && !config.projectId) {
    dbInstance = null;
    return null;
  }

  try {
    const appName = "flexipay-consumer-app";
    const existing = getApps().find(a => a.name === appName);
    currentApp = existing || initializeApp(config, appName);
    dbInstance = getDatabase(currentApp);
    console.log("[FirebaseSync] Connected to Realtime Database at:", config.databaseURL || config.projectId);
    return dbInstance;
  } catch (e) {
    console.warn("[FirebaseSync] Could not initialize Firebase DB:", e.message);
    dbInstance = null;
    return null;
  }
}

export function isFirebaseActive() {
  const db = initDb();
  return db !== null;
}

// ----------------------------------------------------
// REALTIME SYNC ACTIONS
// ----------------------------------------------------

/**
 * Consumer listens for live merchant bills
 */
export function syncSubscribeBill(callback) {
  const db = initDb();
  if (!db) return () => {};

  try {
    const billRef = ref(db, "flexipay/activeBill");
    const unsubscribe = onValue(billRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.amount) {
        callback(data);
      }
    });

    return () => off(billRef, "value", unsubscribe);
  } catch (e) {
    console.warn("[FirebaseSync] Bill listener error:", e);
    return () => {};
  }
}

/**
 * Consumer broadcasts payment completion to Merchant POS
 */
export async function syncPublishPayment(paymentData) {
  const db = initDb();
  if (!db) return false;

  try {
    const paymentRef = ref(db, "flexipay/lastPayment");
    await set(paymentRef, {
      ...paymentData,
      timestamp: Date.now()
    });
    return true;
  } catch (e) {
    console.warn("[FirebaseSync] Error publishing payment:", e);
    return false;
  }
}

/**
 * Consumer listens for live promotional merchant offers
 */
export function syncSubscribeOffer(callback) {
  const db = initDb();
  if (!db) return () => {};

  try {
    const offerRef = ref(db, "flexipay/activeOffer");
    const unsubscribe = onValue(offerRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.title) {
        callback(data);
      }
    });

    return () => off(offerRef, "value", unsubscribe);
  } catch (e) {
    console.warn("[FirebaseSync] Offer listener error:", e);
    return () => {};
  }
}
