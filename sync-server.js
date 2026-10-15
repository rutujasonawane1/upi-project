const http = require("http");

let lastPayment = null;
let lastOffer = null;
let lastBill = null;
let paymentsList = [];

const server = http.createServer((req, res) => {
  // Enable CORS for any localhost port (5173, 5174, etc.)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/pay" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        data.id = data.id || "ord_" + Date.now();
        data.timestamp = Date.now();
        lastPayment = data;
        paymentsList.unshift(data);
        console.log("[SyncServer] Received payment: ₹" + data.amount + " from " + data.customer);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, payment: data }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (url.pathname === "/api/poll-payment" && req.method === "GET") {
    const since = Number(url.searchParams.get("since") || 0);
    const newPayments = paymentsList.filter(p => p.timestamp > since);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      lastPayment,
      newPayments,
      serverTime: Date.now()
    }));
    return;
  }

  if (url.pathname === "/api/offer" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        lastOffer = JSON.parse(body);
        console.log("[SyncServer] Updated offer:", lastOffer.title);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (url.pathname === "/api/offer" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ offer: lastOffer }));
    return;
  }

  if (url.pathname === "/api/bill" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        lastBill = JSON.parse(body);
        console.log("[SyncServer] Bill generated: ₹" + lastBill.amount);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (url.pathname === "/api/bill" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ bill: lastBill }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`[SyncServer] Real-time UPI Relay Server running at http://localhost:${PORT}`);
});
