const express = require("express");
const path = require("path");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.static(path.join(__dirname, "public")));

// Illustrative rates per 1 ZAR (demo data only, not live market rates)
const RATES = { ZAR: 1, USD: 0.055, EUR: 0.05, GBP: 0.043, BWP: 0.75, ZMW: 1.5, MZN: 3.5 };
const FEE_PERCENT = 1.5;

const num = (v, d) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : d);

app.get("/health", (req, res) => res.json({ status: "healthy", time: new Date().toISOString() }));

// Loan repayment calculator with yearly balance schedule
app.get("/api/loan", (req, res) => {
  const principal = Math.min(Math.max(num(req.query.amount, 100000), 1000), 50000000);
  const annualRate = Math.min(Math.max(num(req.query.rate, 11.75), 0), 60);
  const months = Math.min(Math.max(Math.round(num(req.query.months, 60)), 1), 360);
  const r = annualRate / 100 / 12;
  const payment = r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
  let balance = principal, totalInterest = 0;
  const schedule = [{ month: 0, balance: principal }];
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    totalInterest += interest;
    balance = Math.max(balance - (payment - interest), 0);
    if (m % 12 === 0 || m === months) schedule.push({ month: m, balance: Math.round(balance * 100) / 100 });
  }
  res.json({
    principal, annualRate, months,
    monthlyPayment: Math.round(payment * 100) / 100,
    totalRepaid: Math.round(payment * months * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    schedule
  });
});

// Currency / remittance converter with transfer fee
app.get("/api/convert", (req, res) => {
  const from = (req.query.from || "ZAR").toUpperCase();
  const to = (req.query.to || "USD").toUpperCase();
  const amount = Math.max(num(req.query.amount, 1000), 0);
  if (!RATES[from] || !RATES[to]) return res.status(400).json({ error: "Unsupported currency", supported: Object.keys(RATES) });
  const fee = amount * FEE_PERCENT / 100;
  const rate = RATES[to] / RATES[from];
  res.json({
    from, to, amount, feePercent: FEE_PERCENT,
    fee: Math.round(fee * 100) / 100,
    rate: Math.round(rate * 10000) / 10000,
    received: Math.round((amount - fee) * rate * 100) / 100,
    note: "Illustrative demo rates only"
  });
});

// Savings goal projection with monthly compounding
app.get("/api/savings", (req, res) => {
  const start = Math.max(num(req.query.start, 5000), 0);
  const monthly = Math.max(num(req.query.monthly, 1000), 0);
  const rate = Math.min(Math.max(num(req.query.rate, 7), 0), 30);
  const years = Math.min(Math.max(Math.round(num(req.query.years, 10)), 1), 50);
  const r = rate / 100 / 12;
  let bal = start;
  const points = [{ year: 0, balance: start }];
  for (let m = 1; m <= years * 12; m++) {
    bal = bal * (1 + r) + monthly;
    if (m % 12 === 0) points.push({ year: m / 12, balance: Math.round(bal * 100) / 100 });
  }
  const contributed = start + monthly * years * 12;
  res.json({ start, monthly, rate, years, finalBalance: Math.round(bal * 100) / 100,
             totalContributed: contributed, interestEarned: Math.round((bal - contributed) * 100) / 100, points });
});

// Instance info - shows which instance served the request (proves scale-out)
app.get("/api/info", (req, res) => {
  res.json({
    instanceId: (process.env.WEBSITE_INSTANCE_ID || os.hostname()).slice(0, 12),
    siteName: process.env.WEBSITE_SITE_NAME || "local",
    region: process.env.REGION_NAME || "local",
    node: process.version,
    totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
    time: new Date().toISOString()
  });
});

// CPU load generator for autoscale testing (max 30s)
app.get("/api/load", (req, res) => {
  const seconds = Math.min(Math.max(parseInt(req.query.seconds) || 10, 1), 30);
  const end = Date.now() + seconds * 1000;
  let x = 0;
  while (Date.now() < end) { x += Math.sqrt(Math.random()); }
  res.json({ burned: `${seconds}s` });
});

app.listen(PORT, () => console.log(`FinServ Hub running on port ${PORT}`));
