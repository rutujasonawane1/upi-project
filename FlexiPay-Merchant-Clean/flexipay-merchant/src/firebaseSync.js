// ----------------------------------------------------
// FlexiPay Firebase Realtime Synchronization Module
// Enables instant global cross-device sync (Laptop <-> Phone)
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
    // Reload database instance on change
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
  // Valid if either databaseURL or projectId exists
  if (!config.databaseURL && !config.projectId) {
    dbInstance = null;
    return null;
  }

  try {
    const appName = "flexipay-merchant-app";
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
 * Merchant publishes a newly generated bill to Firebase
 */
export async function syncPublishBill(billData) {
  const db = initDb();
  if (!db) return false;

  try {
    const billRef = ref(db, "flexipay/activeBill");
    await set(billRef, {
      ...billData,
      updatedAt: Date.now()
    });
    return true;
  } catch (e) {
    console.warn("[FirebaseSync] Error publishing bill:", e);
    return false;
  }
}

/**
 * Merchant listens for incoming customer payments
 */
export function syncSubscribePayments(callback) {
  const db = initDb();
  if (!db) return () => {};

  try {
    const paymentRef = ref(db, "flexipay/lastPayment");
    const unsubscribe = onValue(paymentRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.amount) {
        callback(data);
      }
    });

    return () => off(paymentRef, "value", unsubscribe);
  } catch (e) {
    console.warn("[FirebaseSync] Payment listener error:", e);
    return () => {};
  }
}

/**
 * Merchant publishes promotional store offers
 */
export async function syncPublishOffer(offerData) {
  const db = initDb();
  if (!db) return false;

  try {
    const offerRef = ref(db, "flexipay/activeOffer");
    await set(offerRef, {
      ...offerData,
      updatedAt: Date.now()
    });
    return true;
  } catch (e) {
    console.warn("[FirebaseSync] Error publishing offer:", e);
    return false;
  }
}
