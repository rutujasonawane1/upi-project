import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { QRCodeSVG } from "qrcode.react";
import "./index.css";

const initialTransactions = [
  { customer: "Sharma Super Store", amount: 2500, type: "FlexiPay Pay Later", status: "Successful" },
  { customer: "Customer 102", amount: 850, type: "UPI", status: "Successful" },
  { customer: "Customer 087", amount: 1200, type: "FlexiPay Pay Later", status: "Successful" },
];

function money(n) {
  return "₹" + n.toLocaleString("en-IN");
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [sales, setSales] = useState(18450);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [rewards, setRewards] = useState(320);
  const [amount, setAmount] = useState("");
  const [qrReady, setQrReady] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [offer, setOffer] = useState(null);
  const [offerCreated, setOfferCreated] = useState(false);

  const receivePayment = () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    setQrReady(true);
    setPaymentReceived(false);
  };

  const simulatePayment = () => {
    const value = Number(amount);
    if (!value || paymentReceived) return;
    setSales((s) => s + value);
    setTransactions((t) => [
      { customer: "Demo Customer", amount: value, type: "FlexiPay Pay Later", status: "Successful" },
      ...t,
    ]);
    setRewards((r) => r + 10);
    setPaymentReceived(true);
  };

  const createOffer = () => {
    setOffer({ name: "10% Cashback", minimum: 1000, reward: 100 });
    setOfferCreated(true);
  };

  const goReceive = () => {
    setPage("receive");
    setQrReady(false);
    setPaymentReceived(false);
    setAmount("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <button onClick={() => setPage("dashboard")} className="text-left">
            <div className="text-xl font-bold text-purple-700">FlexiPay</div>
            <div className="text-xs text-gray-500">Merchant</div>
          </button>
          <div className="rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
            Sharma Super Store
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-7">
        {page === "dashboard" && (
          <Dashboard
            sales={sales}
            transactions={transactions}
            rewards={rewards}
            offer={offer}
            onReceive={goReceive}
            onOffer={() => { setPage("offer"); setOfferCreated(false); }}
            onTransactions={() => setPage("transactions")}
          />
        )}

        {page === "receive" && (
          <ReceivePayment
            amount={amount}
            setAmount={setAmount}
            qrReady={qrReady}
            paymentReceived={paymentReceived}
            onGenerate={receivePayment}
            onSimulate={simulatePayment}
            onBack={() => setPage("dashboard")}
          />
        )}

        {page === "offer" && (
          <CreateOffer
            created={offerCreated}
            onCreate={createOffer}
            onBack={() => setPage("dashboard")}
          />
        )}

        {page === "transactions" && (
          <Transactions transactions={transactions} onBack={() => setPage("dashboard")} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white md:hidden">
        <div className="mx-auto flex max-w-5xl justify-around py-3 text-xs">
          <button onClick={() => setPage("dashboard")} className="font-medium text-purple-700">Dashboard</button>
          <button onClick={goReceive} className="font-medium text-gray-600">Receive</button>
          <button onClick={() => setPage("offer")} className="font-medium text-gray-600">Offers</button>
          <button onClick={() => setPage("transactions")} className="font-medium text-gray-600">Sales</button>
        </div>
      </nav>
    </div>
  );
}

function Dashboard({ sales, transactions, rewards, offer, onReceive, onOffer, onTransactions }) {
  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Merchant Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Simple view of your FlexiPay activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Today's Sales" value={money(sales)} />
        <Stat title="Transactions" value={transactions.length + 21} />
        <Stat title="Rewards Given" value={rewards} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={onReceive} className="rounded-xl bg-purple-700 p-5 text-left text-white shadow-sm transition hover:bg-purple-800">
          <div className="text-lg font-semibold">Receive Payment</div>
          <div className="mt-1 text-sm text-purple-100">Generate a demo QR and receive payment.</div>
        </button>
        <button onClick={onOffer} className="rounded-xl border border-purple-200 bg-white p-5 text-left shadow-sm hover:border-purple-400">
          <div className="text-lg font-semibold text-gray-900">Create Offer</div>
          <div className="mt-1 text-sm text-gray-500">Give customers simple rewards.</div>
        </button>
      </div>

      {offer && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="text-sm font-semibold text-green-800">Active Offer</div>
          <div className="mt-1 font-medium text-gray-900">{offer.name}</div>
          <div className="text-sm text-gray-600">
            Minimum purchase {money(offer.minimum)} · {offer.reward} Points
          </div>
        </div>
      )}

      <section className="rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Recent Transactions</h2>
          <button onClick={onTransactions} className="text-sm font-medium text-purple-700">View all</button>
        </div>
        <div>
          {transactions.slice(0, 3).map((t, i) => (
            <TransactionRow key={i} transaction={t} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function TransactionRow({ transaction }) {
  return (
    <div className="flex items-center justify-between border-b px-5 py-4 last:border-b-0">
      <div>
        <div className="font-medium text-gray-900">{transaction.customer}</div>
        <div className="mt-1 text-xs text-gray-500">{transaction.type}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-gray-900">{money(transaction.amount)}</div>
        <div className="mt-1 text-xs font-medium text-green-600">{transaction.status}</div>
      </div>
    </div>
  );
}

function ReceivePayment({ amount, setAmount, qrReady, paymentReceived, onGenerate, onSimulate, onBack }) {
  return (
    <div className="mx-auto max-w-xl space-y-5 pb-16">
      <button onClick={onBack} className="text-sm font-medium text-purple-700">← Dashboard</button>
      <div>
        <h1 className="text-2xl font-bold">Receive Payment</h1>
        <p className="mt-1 text-sm text-gray-500">Demo only — no real payment is processed.</p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <label className="text-sm font-medium text-gray-700">Amount</label>
        <div className="mt-2 flex items-center rounded-lg border px-3 focus-within:border-purple-500">
          <span className="text-gray-500">₹</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Enter amount"
            className="w-full border-0 p-3 outline-none"
          />
        </div>
        <button
          onClick={onGenerate}
          disabled={!amount}
          className="mt-4 w-full rounded-lg bg-purple-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Generate QR
        </button>
      </div>

      {qrReady && (
        <div className="rounded-xl border bg-white p-6 text-center">
          <div className="mx-auto w-fit rounded-lg border p-4">
            <QRCodeSVG value={`upi://pay?pa=sharma@flexipay&pn=Sharma%20Super%20Store&am=${amount}&cu=INR`} size={190} />
          </div>
          <div className="mt-4 font-semibold">Amount: {money(Number(amount))}</div>
          <div className="mt-1 text-xs text-gray-500">Dummy QR for project demonstration</div>

          {!paymentReceived ? (
            <button onClick={onSimulate} className="mt-5 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700">
              Simulate Customer Payment
            </button>
          ) : (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-left">
              <div className="font-semibold text-green-700">✓ Payment Received</div>
              <div className="mt-1 text-xl font-bold">{money(Number(amount))}</div>
              <div className="mt-2 text-sm text-gray-600">Payment Method: FlexiPay Pay Later</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateOffer({ created, onCreate, onBack }) {
  return (
    <div className="mx-auto max-w-xl space-y-5 pb-16">
      <button onClick={onBack} className="text-sm font-medium text-purple-700">← Dashboard</button>
      <div>
        <h1 className="text-2xl font-bold">Create Customer Offer</h1>
        <p className="mt-1 text-sm text-gray-500">Create one simple reward offer for the demo.</p>
      </div>

      <div className="space-y-4 rounded-xl border bg-white p-6">
        <Field label="Offer Name" value="10% Cashback" />
        <Field label="Minimum Purchase" value="₹1,000" />
        <Field label="Reward" value="100 Points" />
        <button onClick={onCreate} className="w-full rounded-lg bg-purple-700 px-4 py-3 font-semibold text-white hover:bg-purple-800">
          Create Offer
        </button>
      </div>

      {created && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 font-medium text-green-700">
          ✓ Offer Created
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input readOnly value={value} className="mt-2 w-full rounded-lg border bg-gray-50 px-3 py-3 text-gray-800 outline-none" />
    </div>
  );
}

function Transactions({ transactions, onBack }) {
  return (
    <div className="space-y-5 pb-16">
      <button onClick={onBack} className="text-sm font-medium text-purple-700">← Dashboard</button>
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="mt-1 text-sm text-gray-500">Basic merchant payment history.</p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="hidden grid-cols-4 gap-4 border-b bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600 sm:grid">
          <div>Customer</div><div>Amount</div><div>Payment Type</div><div>Status</div>
        </div>
        {transactions.map((t, i) => (
          <div key={i} className="grid gap-2 border-b px-5 py-4 last:border-b-0 sm:grid-cols-4 sm:items-center sm:gap-4">
            <div>
              <div className="text-xs text-gray-500 sm:hidden">Customer</div>
              <div className="font-medium">{t.customer}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 sm:hidden">Amount</div>
              <div className="font-semibold">{money(t.amount)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 sm:hidden">Payment Type</div>
              <div className="text-sm text-gray-600">{t.type}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 sm:hidden">Status</div>
              <div className="text-sm font-medium text-green-600">{t.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
