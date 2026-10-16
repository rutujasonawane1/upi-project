# UPI FlexiPay • Next-Gen Credit & Merchant POS Ecosystem

A production-grade fintech ecosystem combining **UPI Direct**, **Buy Now, Pay Later (BNPL)**, **Account Aggregator (AA)** onboarding, and **Merchant Working Capital Line** underwriting compliant with RBI Digital Lending Guidelines (DLG).

---

## 📑 Architecture Overview

The project is split into three interconnected components designed to run simultaneously:

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     FlexiPay Consumer App       │                 │      FlexiPay Merchant POS      │
│     http://localhost:5173       │                 │      http://localhost:5174      │
│  - UPI & FlexiPay Scan & Pay    │                 │  - Dynamic Bill & QR Generator  │
│  - Account Aggregator (AA) Flow │                 │  - Soundbox Voice Broadcast     │
│  - KFS & Authentic OTP Autopay  │                 │  - Store Working Capital Credit │
└────────────────┬────────────────┘                 └────────────────┬────────────────┘
                 │                                                   │
                 │                 HTTP & Polling                    │
                 └──────────────►  http://localhost:4000  ◄───────────┘
                                 ┌─────────────────────────┐
                                 │   Real-Time Sync Server │
                                 │      (sync-server.js)   │
                                 └─────────────────────────┘
```

1. **Consumer Application (`UPI-FlexiPay-Clean/upi-clean`)** — Port `5173`:
   - Mobile-first UPI super-app with instant credit limit, UPI scan & pay, biometric/PIN authorization.
   - Interactive RBI Account Aggregator (AA) bank linking modal.
   - KFS (Key Fact Statement) financial disclosures, SMS push alert, and digit-box OTP verification.
   - Styled with FlexiPay's modern warm orange (`#F47920`), slate gradient cards, and Plus Jakarta Sans typography.

2. **Merchant POS Application (`FlexiPay-Merchant-Clean/flexipay-merchant`)** — Port `5174`:
   - Countertop POS terminal with dynamic bill generator and UPI QR standee.
   - Real-time Soundbox audio announcement (`Web Speech API` with multi-language Hindi/English support).
   - Merchant Working Capital revolving credit line underwritten by GSTR-3B filings and daily QR volume.
   - 4-step Draw & Repay wizards with regulatory KFS disclosures, SMS OTP, and Equated Daily Installments (EDI).

3. **Real-Time Relay Server (`sync-server.js`)** — Port `4000`:
   - Zero-dependency Node.js HTTP server managing live state between the consumer and merchant.
   - Relays generated bills, instant payment confirmations, promotional offers, and soundbox triggers.

---

## 🛠️ Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- A modern web browser (Chrome, Edge, Safari, or Firefox)

---

## 🚀 Quick Start Guide

### Step 1: Start the Real-Time Sync Server
Open a terminal in the root project folder (`d:\upi project`):
```bash
node sync-server.js
```
> Server will start listening at `http://localhost:4000`. Keep this terminal running.

---

### Step 2: Start the Merchant POS Application
Open a second terminal window:
```bash
cd "d:\upi project\FlexiPay-Merchant-Clean\flexipay-merchant"
npm install
npm run dev
```
> The Merchant POS will run at **`http://localhost:5174`**.

---

### Step 3: Start the Consumer UPI Application
Open a third terminal window:
```bash
cd "d:\upi project\UPI-FlexiPay-Clean\upi-clean"
npm install
npm run dev
```
> The Consumer UPI App will run at **`http://localhost:5173`**.

---

## 🧪 Interactive Testing & Verification Journeys

Open both browser tabs side-by-side to experience the live two-way synchronization:
- Left window: **Merchant POS** (`http://localhost:5174`)
- Right window: **Consumer App** (`http://localhost:5173`)

### 🛒 Flow 1: Dynamic QR Bill Generation & Soundbox Voice Alert
1. In the **Merchant POS** (`http://localhost:5174`), stay on the **POS & Billing** tab.
2. Select a quick preset or enter a bill amount (e.g., `₹1,420`), then click **Generate Payment QR**.
3. In the **Consumer App** (`http://localhost:5173`), tap **Scan QR** or click the banner reading *"Active Merchant Bill Detected"*.
4. Notice the exact bill of `₹1,420` from *Sharma Super Store* automatically loads with any promotional cashback discount.
5. Select payment mode: **UPI FlexiPay (30-day interest-free)** or linked Bank Account.
6. Tap **Pay** and authorize with your UPI PIN.
7. **Observe immediate real-time sync**:
   - The Consumer App shows instant payment success and points reward.
   - The Merchant POS updates the bill state to **Paid & Settled**.
   - The Merchant Soundbox automatically plays a high-clarity voice announcement:
     > *"FlexiPay par ₹1,420 prapt hue!"*
   - The transaction immediately appears in the merchant's **Transactions** ledger.

---

### 🏦 Flow 2: Account Aggregator (AA) Bank Linking
1. In the **Consumer App** (`http://localhost:5173`), navigate to the **Cards & Accounts** tab.
2. Click **Link Bank via Account Aggregator**.
3. The interactive AA consent screen displays RBI-regulated disclosures (purpose, data cadence, and validity).
4. Tap **Fetch Bank Accounts via OTP**.
5. An authentic SMS push banner will simulate an incoming OTP. Tap **Tap to Auto-Fill** (or type the 4 digits).
6. Verify and view your bank accounts fetched directly from the AA gateway with verified account balances.

---

### 💼 Flow 3: Merchant Working Capital Credit Line (KFS & OTP)
1. In the **Merchant POS** (`http://localhost:5174`), click the **Store Credit** tab.
2. Notice the pre-sanctioned working capital card (e.g., `₹1,50,000` limit based on GSTIN turnover).
3. Click **Draw to Bank Account**:
   - **Step 1 (Amount & Velocity)**: Enter an amount (e.g., `₹25,000`) and choose a tenure velocity (30, 60, or 90 days).
   - **Step 2 (Key Fact Statement - KFS)**: Review RBI Digital Lending Guideline disclosures: Net Disbursal, Equated Daily Installment (EDI), interest rate, and zero pre-closure fees. Check the consent box.
   - **Step 3 (SMS OTP Authorization)**: An authentic Equitas SFB SMS notification banner drops down. Click **Tap to Auto-Fill** to input the 4-digit code.
   - **Step 4 (Instant IMPS Disbursal)**: View confirmation with IMPS reference number; funds are credited to HDFC Bank and active credit balance is updated.
4. **Early Repayment**:
   - Click **Repay Store Credit**.
   - Choose **Full Settlement** or **Custom Partial**, select funding channel (HDFC auto-debit or QR collections sweep), and authorize with OTP. The credit limit replenishes instantly with zero penalty.

---

## 🎨 Theme & Design Language

Both applications share the **FlexiPay Clean Design System**:
- **Primary Brand Color**: `#F47920` (FlexiPay warm orange) + hover `#E06710`
- **Subtle Accents**: `bg-orange-50`, `border-orange-200`, `ring-[#F47920]`
- **Hero Dark Cards**: `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 border border-slate-800`
- **Typography**: Google Font **Plus Jakarta Sans** with clean numeric alignments
- **Modal Viewports**: Full-screen portal modals (`fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md`) with background body scroll lock

---

## 📦 Production Build

To produce optimized production builds:

```bash
# Build Merchant POS App
cd "d:\upi project\FlexiPay-Merchant-Clean\flexipay-merchant"
npm run build

# Build Consumer App
cd "d:\upi project\UPI-FlexiPay-Clean\upi-clean"
npm run build
```

Both projects compile using Vite with output bundles placed in their respective `dist/` directories.

---

## 🛡️ Regulatory Compliance Architecture

- **RBI Digital Lending Guidelines (DLG)**: Strict Key Fact Statement (KFS) presentation before any credit line disbursal.
- **Cooling-off Period**: Transparent 3-day penalty-free exit terms for borrowers.
- **Equated Daily Installment (EDI)**: Automated micro-sweeps from daily QR settlements without bulk monthly EMI burden.
- **Account Aggregator (AA) Framework**: Granular, time-bound consent architecture with one-time authorization tokens.
