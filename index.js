// WhatsApp AI Bot — Permanent Business Memory + Web Admin Chatbot + Payment Tracker
// WARNING: unofficial automation of a personal/Business WhatsApp account
// violates WhatsApp's Terms of Service and can get the number banned.

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const qrcode = require("qrcode");
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
} = require("baileys");

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const AUTH_DIR = path.join(__dirname, "auth");
const AUTH_BACKUP_DIR = path.join(DATA_DIR, "auth_backup");
const CONFIG_FILE = path.join(__dirname, "config.json");
const MEMORY_FILE = path.join(DATA_DIR, "business_memory.json");
const PAYMENTS_FILE = path.join(DATA_DIR, "payments.json");
const BLACKLIST_FILE = path.join(DATA_DIR, "blacklist.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(AUTH_BACKUP_DIR)) {
  fs.mkdirSync(AUTH_BACKUP_DIR, { recursive: true });
}

// ---------- Business Memory Engine ----------
function loadBusinessMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
    }
  } catch (e) {
    console.error("Error reading business memory:", e.message);
  }
  return {
    businessName: "imo Video Call Service",
    serviceDescription: "imo ভিডিও কলের মাধ্যমে নির্ধারিত সময়ের কাজ করা হয়।",
    welcomeGreeting:
      "👋 স্বাগতম। 😊\n\n📲 imo ভিডিও কলের মাধ্যমে নির্ধারিত সময়ের কাজ করা হয়।\n\n📦 প্যাকেজ:\n৫ মিনিট — ১০০ টাকা\n১০ মিনিট — ২০০ টাকা\n১৫ মিনিট — ৩০০ টাকা\n২০ মিনিট — ৪০০ টাকা\n৩০ মিনিট — ৫৫০ টাকা\n৪০ মিনিট — ৭০০ টাকা\n৫০ মিনিট — ৮৫০ টাকা\n৬০ মিনিট — ১,০০০ টাকা\n\n🎁 নতুনদের জন্য ২ মিনিটের স্যাম্পল — ৫০ টাকা।\n\n📌 স্যাম্পল নেওয়া হলে সেটি মূল কাজ নেওয়ার আগের যাচাই ধাপ। স্যাম্পলের পর মূল প্যাকেজ নির্বাচন করে কাজ নিতে হবে।\n\n👉 কাজ নিতে চাইলে প্রথমে আপনার পছন্দের প্যাকেজ জানান।",
    sample: {
      duration: "২ মিনিট",
      price: "৫০ টাকা",
      description: "নতুনদের জন্য কাজের আগের প্রমাণের যাচাই ধাপ। স্যাম্পল নেওয়ার পর মূল প্যাকেজ নির্বাচন করে কাজ নিতে হবে।",
    },
    packages: [
      { duration: "৫ মিনিট", price: "১০০ টাকা", minutes: 5, priceNum: 100 },
      { duration: "১০ মিনিট", price: "২০০ টাকা", minutes: 10, priceNum: 200 },
      { duration: "১৫ মিনিট", price: "৩০০ টাকা", minutes: 15, priceNum: 300 },
      { duration: "২০ মিনিট", price: "৪০০ টাকা", minutes: 20, priceNum: 400 },
      { duration: "৩০ মিনিট", price: "৫৫০ টাকা", minutes: 30, priceNum: 550 },
      { duration: "৪০ মিনিট", price: "৭০০ টাকা", minutes: 40, priceNum: 700 },
      { duration: "৫০ মিনিট", price: "৮৫০ টাকা", minutes: 50, priceNum: 850 },
      { duration: "৬০ মিনিট", price: "১,০০০ টাকা", minutes: 60, priceNum: 1000 },
    ],
    paymentInfo: {
      method: "বিকাশ / নগদ (Send Money)",
      number: "01625642420",
      instruction: "পেমেন্ট করার পর যে নম্বর থেকে টাকা পাঠিয়েছেন সেই নম্বর জানাতে হবে।",
    },
    deliveryInfo: {
      channel: "imo",
      number: "01898694648",
      instruction: "পেমেন্ট যাচাইয়ের পর imo-তে যোগাযোগের লিঙ্ক ও নম্বর দেওয়া হয়।",
    },
    rules: [
      "কখনোই নিজেকে বট বা AI বলবে না। তুমি মালিকের হয়ে স্বাভাবিক মানুষের মতো শান্ত ও আকর্ষণীয় ভঙ্গিতে কথা বলবে।",
      "আগে পেমেন্ট ছাড়া কোনো কাজ বা ফ্রি ভিডিও কল দেওয়া সম্ভব না।",
      "কেহ যদি ছবি বা ভিডিও চায়, তাকে স্পষ্টভাবে না করে বলবে যে ছবি/ভিডিও দেওয়া হয় না; দেখতে চাইলে ৫০ টাকা দিয়ে ২ মিনিটের স্যাম্পল দেখতে পারে।",
      "২ মিনিটের স্যাম্পল মূল কাজ নেওয়ার আগের প্রমাণের ধাপ। স্যাম্পলের পর মূল প্যাকেজ নির্বাচন করে সার্ভিস নিতে হবে।",
      "পেমেন্ট নিশ্চিত হওয়ার পর imo নম্বর 01898694648 দিয়ে সেখানে কানেক্ট হতে বলবে।",
    ],
    customLearnings: [],
  };
}

let businessMemory = loadBusinessMemory();

function saveBusinessMemory(newMem) {
  try {
    businessMemory = { ...businessMemory, ...newMem };
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(businessMemory, null, 2));
    // Auto recompile system prompt
    config.systemPrompt = compileSystemPrompt(businessMemory);
    saveConfig();
    return true;
  } catch (e) {
    console.error("Error saving business memory:", e.message);
    return false;
  }
}

function compileSystemPrompt(mem) {
  const packageList = (mem.packages || []).map((p) => `• ${p.duration} — ${p.price}`).join("\n");
  const rulesList = (mem.rules || []).map((r, i) => `${i + 1}. ${r}`).join("\n");
  const customList = (mem.customLearnings || []).map((c) => `• ${c}`).join("\n");

  return `তুমি একজন অত্যন্ত আন্তরিক, বিনয়ী ও আকর্ষণীয় পার্সোনাল সহকারী। তুমি সার্ভিস প্রোভাইডারের হয়ে কাস্টমারদের সাথে ব্যক্তিগত ও বন্ধুত্বপূর্ণ ভঙ্গিতে সরাসরি কথা বলছ।
⚠️ অতীব গুরুত্বপূর্ণ নিয়ম:
1. কখনোই নিজেকে বট, রোবট, কম্পিউটার বা AI বলবে না।
2. কোনো অবস্থাতেই নীতিবাক্য, উপদেশ, আইনি সতর্কবাণী বা প্রতারণার অভিযোগ করবে না। সবসময় শান্ত, মিষ্টি ও পেশাদার মানুষের মতো কথা বলবে।
3. কাস্টমার যদি টাকা পাঠিয়ে নম্বর বা লাস্ট ডিজিট দেয়, সাথে সাথে খুব মিষ্টি করে বলবে:
   "ধন্যবাদ! আপনার পেমেন্ট চেক করা হচ্ছে। কয়েক মিনিটের মধ্যে imo নম্বর ও কানেক্ট লিঙ্ক দিয়ে দেওয়া হচ্ছে, দয়া করে একটু অপেক্ষা করুন। 😊"
4. কাস্টমার যদি আগে ছবি, ভিডিও বা ফ্রি প্রমাণ চায়, স্পষ্টভাবে না করে বলবে:
   "আগে কোনো ছবি বা ভিডিও দেওয়া হয় না সোনা। কাজ যাচাই করার জন্য মাত্র ৫০ টাকা দিয়ে ২ মিনিটের লাইভ স্যাম্পল কল দেখে নিতে পারেন।"

【সার্ভিসের বিবরণ】
${mem.serviceDescription}

【প্যাকেজের তালিকা ও মূল্য】
${packageList}

【স্যাম্পল প্যাকেজ】
• ${mem.sample?.duration || "২ মিনিট"} — ${mem.sample?.price || "৫০ টাকা"} (${mem.sample?.description || "কাজের আগের প্রমাণের যাচাই ধাপ"})

【পেমেন্ট তথ্য】
• মাধ্যম: ${mem.paymentInfo?.method || "বিকাশ / নগদ (Send Money)"}
• নম্বর: ${mem.paymentInfo?.number || "01625642420"}
• নিয়ম: ${mem.paymentInfo?.instruction || "পেমেন্ট করার পর যে নম্বর থেকে টাকা পাঠিয়েছেন সেই নম্বর বা লাস্ট ৪ সংখ্যা জানাতে হবে।"}

【ডেলিভারি তথ্য】
• চ্যানেল: ${mem.deliveryInfo?.channel || "imo"} (${mem.deliveryInfo?.number || "01898694648"})
• নিয়ম: ${mem.deliveryInfo?.instruction || "পেমেন্ট যাচাইয়ের পর imo-তে যোগাযোগের তথ্য দেওয়া হয়।"}

【মূল নিয়মাবলী】
${rulesList}

${customList ? `【বিশেষ নির্দেশনা ও অফার】\n${customList}\n` : ""}
কাস্টমার শুরুতে বিস্তারিত জানতে চাইলে বা সালাম/হাই দিলে সংক্ষেপে মিষ্টি করে স্বাগত জানিয়ে প্যাকেজ ও স্যাম্পল অফার জানাবে:
${mem.welcomeGreeting}`;
}

// ---------- Payments & Orders Storage ----------
function loadPayments() {
  try {
    if (fs.existsSync(PAYMENTS_FILE)) {
      return JSON.parse(fs.readFileSync(PAYMENTS_FILE, "utf8"));
    }
  } catch (e) {
    console.error("Error loading payments:", e.message);
  }
  return [];
}

let paymentsList = loadPayments();

function savePayments(list) {
  try {
    paymentsList = list;
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(paymentsList, null, 2));
    return true;
  } catch (e) {
    console.error("Error saving payments:", e.message);
    return false;
  }
}

// Normalize Bengali numerals to English numerals
function normalizeDigits(str) {
  if (!str) return "";
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.replace(/[০-৯]/g, (d) => bnDigits.indexOf(d));
}

// Resolve customer real phone number from Baileys auth reverse LID mappings
function resolveCustomerPhone(jid) {
  if (!jid) return "Unknown";
  if (jid.endsWith("@s.whatsapp.net")) {
    return jid.split("@")[0].split(":")[0].replace(/\D/g, "");
  }
  if (jid.endsWith("@lid")) {
    const lid = jid.split("@")[0].split(":")[0];
    try {
      const revPath = path.join(AUTH_DIR, `lid-mapping-${lid}_reverse.json`);
      if (fs.existsSync(revPath)) {
        const val = JSON.parse(fs.readFileSync(revPath, "utf8"));
        if (val) return String(val).replace(/\D/g, "");
      }
      const dirPath = path.join(AUTH_DIR, `lid-mapping-${lid}.json`);
      if (fs.existsSync(dirPath)) {
        const val = JSON.parse(fs.readFileSync(dirPath, "utf8"));
        if (val) return String(val).replace(/\D/g, "");
      }
    } catch {}
    return lid;
  }
  return jid.split("@")[0].replace(/\D/g, "");
}

// Extract verified payment details from message
function extractPaymentDetails(text) {
  if (!text) return null;
  const normalized = normalizeDigits(text.trim());

  // Exclude messages that are mere inquiries or generic questions
  const isMereInquiry =
    /^(কত|কতো|koto|how much)\s*(টাকা|tk|taka)/i.test(normalized) ||
    /^(টাকা|tk)\s*(কত|কতো|koto)/i.test(normalized) ||
    /^(সরাসরি\s*কতো|আগে\s*কিছু\s*সিম্পল|আগে\s*দেখান|কালকে\s*আমার\s*থেকে|আমাকে\s*আগে)/i.test(normalized);
  if (isMereInquiry) return null;

  // Numbers belonging to the business (receiver accounts) to ignore
  const ourNumbers = ["01625642420", "01898694648", "8801625642420", "8801898694648"];

  // 1. Transaction ID match
  const trxMatch =
    normalized.match(/(?:trx\s*id|trxid|transaction\s*id|ট্রানজেকশন\s*আইডি|ট্রানজেকশন)\s*[:=\s-]*([a-zA-Z0-9]{6,16})/i) ||
    normalized.match(/\b([A-Z0-9]{8,12})\b/);
  let trxId = null;
  if (trxMatch && !/^(WHATSAPP|BKASH|NAGAD|MESSAGE|PAYMENT)$/i.test(trxMatch[1])) {
    trxId = trxMatch[1];
  }

  // 2. Full 11-digit Bangladeshi mobile number
  let fullPhone = null;
  const phoneMatches = normalized.matchAll(/(?:(?:\+|00)?88)?(01[3-9]\d{8})/g);
  for (const m of phoneMatches) {
    if (!ourNumbers.includes(m[1])) {
      fullPhone = m[1];
      break;
    }
  }

  // 3. Explicit Last digits pattern
  let lastDigits = null;
  const lastPatterns = [
    /(?:লাস্ট|লাষ্ট|শেষ|last|sesh|shesh)\s*(?:নাম্বার|নম্বর|ডিজিট|সংখ্যা|number|digits?|num)?\s*[:=\s-]*([0-9]{2,5})/i,
    /([0-9]{3,5})\s*(?:লাস্ট|last|theke|থেকে|দিয়ে|theke\s*dilam|থেকে\s*দিলাম)/i,
    /(?:দিলাম|পাঠালাম|পাঠিয়েছি|সেন্ড\s*করছি|sent|paid)\s*[:=\s-]*([0-9]{3,5})/i,
  ];
  for (const pat of lastPatterns) {
    const match = normalized.match(pat);
    if (match && match[1]) {
      lastDigits = match[1];
      break;
    }
  }

  // 4. Standalone 3-5 digits with explicit payment confirmation wording
  if (!fullPhone && !lastDigits) {
    const isExplicitPayment =
      /(?:টাকা\s*দিছি|টাকা\s*দিলাম|টাকা\s*পাঠাইছি|টাকা\s*পাঠিয়েছি|সেন্ড\s*করছি|send\s*korsi|paid|payment\s*done|taka\s*pathaisi)/i.test(
        normalized
      );
    const isolatedDigits = normalized.match(/\b([0-9]{3,5})\b/);
    if (isExplicitPayment && isolatedDigits) {
      lastDigits = isolatedDigits[1];
    }
  }

  // Must have at least one valid payment proof item
  if (!fullPhone && !lastDigits && !trxId) {
    return null;
  }

  let senderReference = fullPhone || (lastDigits ? `লাস্ট ${lastDigits}` : `TrxID: ${trxId}`);

  // Determine amount
  let amount = "৫০ টাকা (স্যাম্পল)";
  const amtMatch = normalized.match(/(\d{2,4})\s*(?:টাকা|tk|taka)/i) || normalized.match(/(?:টাকা|tk|taka)\s*(\d{2,4})/i);
  if (amtMatch) {
    amount = `${amtMatch[1]} টাকা`;
  }

  // Determine method
  const method = /নগদ|nagad/i.test(normalized) ? "নগদ" : "বিকাশ";

  return {
    senderReference,
    fullPhone,
    lastDigits,
    trxId,
    amount,
    method,
  };
}

// Detect and record payment submission from customer message
function detectAndRecordPayment(jid, text) {
  const details = extractPaymentDetails(text);
  if (!details) return; // Ignore messages that do not contain valid payment proof

  const customerPhone = resolveCustomerPhone(jid);
  const trimmed = text.trim();

  // Deduplicate if already recorded in last 10 minutes
  const recent = paymentsList.find(
    (p) => p.jid === jid && Date.now() - new Date(p.createdAt).getTime() < 600000
  );

  if (recent) {
    // If the previous record was missing phone/lastDigits, update it
    recent.senderReference = details.senderReference;
    recent.senderNumber = details.senderReference;
    recent.customerPhone = customerPhone;
    if (details.lastDigits) recent.lastDigits = details.lastDigits;
    if (details.fullPhone) recent.fullPhone = details.fullPhone;
    if (details.trxId) recent.trxId = details.trxId;
    savePayments(paymentsList);
    return;
  }

  const newPayment = {
    id: `pay-${Date.now()}`,
    jid,
    customerNumber: customerPhone,
    customerPhone: customerPhone,
    senderNumber: details.senderReference,
    senderReference: details.senderReference,
    lastDigits: details.lastDigits,
    fullPhone: details.fullPhone,
    trxId: details.trxId,
    amount: details.amount,
    method: details.method,
    package: "স্যাম্পল / প্যাকেজ",
    rawText: trimmed.slice(0, 300),
    status: "pending", // pending | verified | rejected
    createdAt: new Date().toISOString(),
  };

  paymentsList.unshift(newPayment);
  if (paymentsList.length > 500) paymentsList.length = 500;
  savePayments(paymentsList);

  addLog("info", `💳 [নতুন পেমেন্ট সাবমিট] কাস্টমার WhatsApp: ${customerPhone}, প্রমাণ: ${details.senderReference}`);
  console.log(`[Payment Detected]: WhatsApp ${customerPhone} submitted ${details.senderReference}`);
}

// ---------- Anti-Ban: Blacklist & Opt-Out Shield ----------
function loadBlacklist() {
  try {
    if (fs.existsSync(BLACKLIST_FILE)) {
      return JSON.parse(fs.readFileSync(BLACKLIST_FILE, "utf8"));
    }
  } catch (e) {
    console.error("Error reading blacklist:", e.message);
  }
  return [];
}

let blacklist = loadBlacklist();

function saveBlacklist(list) {
  try {
    blacklist = list;
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(blacklist, null, 2));
    return true;
  } catch (e) {
    console.error("Error saving blacklist:", e.message);
    return false;
  }
}

function isBlacklisted(phoneOrJid) {
  if (!phoneOrJid) return false;
  const clean = String(phoneOrJid).replace(/\D/g, "");
  return blacklist.some((b) => clean.includes(b.phone.replace(/\D/g, "")));
}

// Check for angry or opt-out customer messages to prevent reports & bans
function checkOptOutTrigger(text) {
  if (!text) return false;
  const norm = normalizeDigits(text.toLowerCase());
  const optOutPatterns = [
    /\bstop\b/i,
    /\bunsubscribe\b/i,
    /(?:মেসেজ|ম্যাসেজ|msg)\s*(?:দিবা\s*না|দিবেন\s*না|করবেন\s*না|দিও\s*না|বন্ধ\s*কর)/i,
    /(?:বিরক্ত\s*করবেন\s*না|বিরক্ত\s*করবা\s*না|বিরক্ত\s*করিও\s*না)/i,
    /(?:ব্লক\s*করব|ব্লক\s*মারব|block\s*kori|block\s*korbo)/i,
    /(?:পুলিশ|থানা|মামলা|জিডি|সাইবার\s*ক্রাইম|cyber\s*crime|police)/i,
    /(?:প্রতারক|বাটপার|চিটার|ফালতু|ভুয়া\s*পেজ|দালাল)/i,
    /(?:দরকার\s*নাই|লাগব\s*না|চাই\s*না|বাদ\s*দে)/i,
  ];
  return optOutPatterns.some((p) => p.test(norm));
}

// ---------- Anti-Ban: Session Auto-Backup Engine ----------
function backupAuthSession() {
  try {
    if (!fs.existsSync(AUTH_DIR)) return;
    if (!fs.existsSync(AUTH_BACKUP_DIR)) {
      fs.mkdirSync(AUTH_BACKUP_DIR, { recursive: true });
    }
    const files = fs.readdirSync(AUTH_DIR);
    for (const f of files) {
      if (f.endsWith(".json")) {
        fs.copyFileSync(path.join(AUTH_DIR, f), path.join(AUTH_BACKUP_DIR, f));
      }
    }
    console.log(`[Anti-Ban]: Auth session snapshot saved to ${AUTH_BACKUP_DIR}`);
  } catch (e) {
    console.warn("Session backup notice:", e.message);
  }
}
setInterval(backupAuthSession, 3600000); // Hourly backup

// ---------- Anti-Ban: Safety Stats & Outbound Rate Limiting Engine ----------
const OUTBOUND_QUEUE_DELAY_MIN = 3500; // 3.5s minimum between outgoing messages across chats
const OUTBOUND_QUEUE_DELAY_MAX = 6500; // 6.5s max jitter
const MAX_MESSAGES_PER_MINUTE = 12; // burst prevention
const MAX_MESSAGES_PER_DAY = 250; // daily health cap

let safetyStats = {
  todayOutboundCount: 0,
  todayDate: new Date().toISOString().split("T")[0],
  burstWindow: [],
  queueLength: 0,
  healthScore: 100,
  status: "protected",
};

function checkDailySafetyCounter() {
  const today = new Date().toISOString().split("T")[0];
  if (safetyStats.todayDate !== today) {
    safetyStats.todayDate = today;
    safetyStats.todayOutboundCount = 0;
  }
}

// Queue for outbound messages to eliminate burst spikes
const outboundQueue = [];
let isQueueProcessing = false;

function enqueueOutboundMessage(jid, text, key = null) {
  return new Promise((resolve, reject) => {
    outboundQueue.push({ jid, text, key, resolve, reject, enqueuedAt: Date.now() });
    safetyStats.queueLength = outboundQueue.length;
    processOutboundQueue();
  });
}

// Subtle natural variations to defeat spam-hash detection
function applyAntiSpamVariation(text) {
  if (!text) return text;
  const zeroWidths = ["\u200B", "\u200C", "\u200D", ""];
  const zw = zeroWidths[Math.floor(Math.random() * zeroWidths.length)];
  return text + zw;
}

async function processOutboundQueue() {
  if (isQueueProcessing || outboundQueue.length === 0) return;
  isQueueProcessing = true;

  while (outboundQueue.length > 0) {
    const item = outboundQueue.shift();
    safetyStats.queueLength = outboundQueue.length;

    try {
      if (!sock && !config.metaGatewayActive) {
        item.reject(new Error("হোয়াটসঅ্যাপ সক্রিয় নেই (Baileys বা Meta Cloud API কোনোটিই কানেক্টেড নয়)"));
        continue;
      }

      checkDailySafetyCounter();

      // Burst Rate Limiter check (last 60s)
      const now = Date.now();
      safetyStats.burstWindow = safetyStats.burstWindow.filter((t) => now - t < 60000);
      if (safetyStats.burstWindow.length >= MAX_MESSAGES_PER_MINUTE) {
        const oldest = safetyStats.burstWindow[0];
        const waitMs = Math.max(2000, 60000 - (now - oldest) + 1000);
        addLog("warn", `🛡️ [Anti-Ban Rate Limiter]: Burst spike prevented. Waiting ${(waitMs / 1000).toFixed(1)}s`);
        await delay(waitMs);
      }

      // Daily limit guard
      if (safetyStats.todayOutboundCount >= MAX_MESSAGES_PER_DAY) {
        addLog("warn", "🛡️ [Anti-Ban Protection]: Daily safe limit (250/day) reached. Message paused for account safety.");
        item.reject(new Error("Daily message limit reached"));
        continue;
      }

      // 1. Human reading simulation (blue ticks receipt delay for Baileys)
      if (item.key && sock && !config.metaGatewayActive) {
        await delay(800 + Math.random() * 1400); // 0.8s - 2.2s read delay
        try {
          await sock.readMessages([item.key]);
        } catch {}
      }

      // 2. Realistic human typing simulation based on message length
      const charCount = item.text.length;
      const baseTypingMs = Math.min(5500, Math.max(1800, charCount * 30));
      const jitterMs = Math.floor(Math.random() * 1200);
      const totalTypingTime = baseTypingMs + jitterMs;

      if (sock && !config.metaGatewayActive) {
        try {
          await sock.sendPresenceUpdate("composing", item.jid);
        } catch {}
      }
      await delay(totalTypingTime);

      if (sock && !config.metaGatewayActive) {
        try {
          await sock.sendPresenceUpdate("paused", item.jid);
        } catch {}
        await delay(300 + Math.random() * 400);
      }

      // 3. Dynamic anti-spam variation
      const dynamicText = applyAntiSpamVariation(item.text);

      // 4. Send message (Meta Official Cloud API or Baileys)
      let sent = null;
      if (config.metaGatewayActive) {
        sent = await sendMetaCloudMessage(item.jid, dynamicText);
      } else if (sock) {
        sent = await sock.sendMessage(item.jid, { text: dynamicText });
        if (sent?.key?.id) {
          botMessageIds.add(sent.key.id);
          setTimeout(() => botMessageIds.delete(sent.key.id), 120000);
        }
      }

      safetyStats.todayOutboundCount++;
      safetyStats.burstWindow.push(Date.now());
      addLog("out", "bot → " + resolveCustomerPhone(item.jid) + ": " + dynamicText.slice(0, 70));
      console.log(`[out - Anti-Ban Safe]: ${item.jid}: ${dynamicText.slice(0, 80)}...`);

      item.resolve(sent);

      // 5. Mandatory cooldown buffer between different chats
      const coolDown = OUTBOUND_QUEUE_DELAY_MIN + Math.random() * (OUTBOUND_QUEUE_DELAY_MAX - OUTBOUND_QUEUE_DELAY_MIN);
      await delay(coolDown);
    } catch (err) {
      console.error("Queue send error:", err);
      item.reject(err);
    }
  }

  isQueueProcessing = false;
}

// ---------- Official Meta / Facebook WhatsApp Cloud API Engine ----------
async function sendMetaCloudMessage(toPhoneOrJid, text) {
  if (!config.metaAccessToken || !config.metaPhoneNumberId) {
    throw new Error("Meta Access Token বা Phone Number ID কনফিগার করা নেই। অনুগ্রহ করে সেটিংস থেকে প্রদান করুন।");
  }

  // Extract pure phone digits (e.g. 88017xxxxxxxx)
  let cleanPhone = String(toPhoneOrJid).replace(/@.*$/, "").replace(/\D/g, "");
  if (cleanPhone.startsWith("01")) cleanPhone = "88" + cleanPhone;

  const dynamicText = applyAntiSpamVariation(text);
  const url = `https://graph.facebook.com/v21.0/${config.metaPhoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.metaAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "text",
      text: { preview_url: false, body: dynamicText },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errMsg = data.error?.message || JSON.stringify(data.error) || "Meta Cloud API Error";
    addLog("error", `Meta Cloud Error (${cleanPhone}): ${errMsg}`);
    throw new Error(errMsg);
  }

  const msgId = data.messages?.[0]?.id;
  if (msgId) {
    botMessageIds.add(msgId);
    setTimeout(() => botMessageIds.delete(msgId), 120000);
  }

  addLog("out", `[Meta Official] bot → ${cleanPhone}: ${dynamicText.slice(0, 70)}`);
  console.log(`[out - Meta Official Cloud]: ${cleanPhone}: ${dynamicText.slice(0, 80)}...`);
  return data;
}

async function fetchMetaAccountDetails(token, phoneNumberId) {
  if (!token || !phoneNumberId) throw new Error("Token and Phone Number ID are required");
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to fetch Meta account details");
  }
  return data;
}

// ---------- Config Engine ----------
const DEFAULT_CONFIG = {
  systemPrompt: compileSystemPrompt(businessMemory),
  aiProvider: "gemini",
  aiApiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "",
  aiBaseUrl: "https://api.openai.com/v1",
  aiModel: "gemini-3.5-flash-lite",
  allowGroups: false,
  replyDelayMs: 1500,
  botActive: true,
  ownerNumber: "",
  // Meta / Facebook WhatsApp Cloud API Config
  metaGatewayActive: false,
  metaAccessToken: process.env.META_ACCESS_TOKEN || "",
  metaPhoneNumberId: process.env.META_PHONE_NUMBER_ID || "",
  metaWabaId: process.env.META_WABA_ID || "",
  metaVerifyToken: process.env.META_VERIFY_TOKEN || "wa_bot_verify_token_2026",
};

let config = { ...DEFAULT_CONFIG };
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    config = { ...DEFAULT_CONFIG, ...saved, aiApiKey: saved.aiApiKey || config.aiApiKey };
  } else {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
} catch {}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error("Config save error:", e.message);
  }
}

// ---------- App State ----------
let sock = null;
let reconnectTimeout = null;
let status = "starting"; // starting | waiting_qr | connected | reconnecting | stopped
let qrDataUrl = null;
let pairingCode = null;
let lastError = null;
const log = []; // { at, kind, text }
const chatHistory = new Map(); // jid -> [{role, content}]
const lastReplyAt = new Map(); // jid -> ts
const botMessageIds = new Set(); // tracks bot-sent messages to avoid loops

function addLog(kind, text) {
  log.unshift({ at: new Date().toISOString(), kind, text });
  if (log.length > 300) log.length = 300;
}

// Gemini Safety Settings (Bypass all false positives and refusals)
const GEMINI_SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" },
];

// ---------- AI Multi-Model Resilient Calling ----------
async function aiReply(history) {
  if (!config.aiApiKey) throw new Error("AI API key set kora hoyni (dashboard e dite hobe)");

  const isGemini =
    config.aiProvider === "gemini" ||
    config.aiApiKey.startsWith("AIzaSy") ||
    config.aiApiKey.startsWith("AQ.");

  if (isGemini) {
    // gemini-3.5-flash-lite is prioritized because it has the highest availability on free tier
    const requestedModel =
      config.aiModel && !config.aiModel.startsWith("gpt-")
        ? config.aiModel
        : "gemini-3.5-flash-lite";

    const modelsToTry = [
      requestedModel,
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3-flash-preview",
      "gemini-flash-latest",
    ];
    const uniqueModels = [...new Set(modelsToTry)];

    const contents = history.slice(-12).map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    }));
    while (contents.length > 0 && contents[0].role !== "user") {
      contents.shift();
    }
    const body = {
      contents,
      safetySettings: GEMINI_SAFETY_SETTINGS,
    };
    if (config.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: config.systemPrompt }],
      };
    }

    let lastErr = null;
    for (const m of uniqueModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${config.aiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          lastErr = new Error(data.error?.message || `Gemini error [${res.status}]`);
          console.warn(`Gemini model ${m} notice:`, lastErr.message);
          continue; // try next model
        }
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) return reply;
      } catch (e) {
        lastErr = e;
        console.warn(`Gemini request to ${m} notice:`, e.message);
      }
    }
    throw lastErr || new Error("Gemini reply dite parini");
  }

  // OpenAI or OpenAI-compatible
  const model = config.aiModel || "gpt-4o-mini";
  const res = await fetch(`${config.aiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.aiApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: config.systemPrompt },
        ...history.slice(-12),
      ],
      max_tokens: 600,
    }),
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`AI error [${res.status}]: ${bodyText.slice(0, 300)}`);
  const data = JSON.parse(bodyText);
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("AI khali reply dilo");
  return reply;
}

// Single prompt AI runner for Admin Chat and teaching
async function aiReplySingle(systemInstruction, userText) {
  if (!config.aiApiKey) throw new Error("AI API key set kora hoyni");

  const isGemini =
    config.aiProvider === "gemini" ||
    config.aiApiKey.startsWith("AIzaSy") ||
    config.aiApiKey.startsWith("AQ.");

  if (isGemini) {
    const modelsToTry = [
      "gemini-3.5-flash-lite",
      config.aiModel || "gemini-3.5-flash",
      "gemini-3.5-flash",
    ];
    const unique = [...new Set(modelsToTry)];

    for (const m of unique) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${config.aiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: userText }] }],
              systemInstruction: { parts: [{ text: systemInstruction }] },
              safetySettings: GEMINI_SAFETY_SETTINGS,
            }),
          }
        );
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) return reply;
      } catch {}
    }
    throw new Error("Gemini AI reply dite parini");
  }

  // OpenAI fallback
  const res = await fetch(`${config.aiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.aiApiKey}`,
    },
    body: JSON.stringify({
      model: config.aiModel || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userText },
      ],
      max_tokens: 700,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// ---------- Message text extraction ----------
function extractText(m) {
  const msg = m.message;
  if (!msg) return null;
  const candidates = [
    msg.conversation,
    msg.extendedTextMessage?.text,
    msg.imageMessage?.caption,
    msg.videoMessage?.caption,
    msg.documentMessage?.caption,
    msg.ephemeralMessage?.message?.conversation,
    msg.ephemeralMessage?.message?.extendedTextMessage?.text,
    msg.viewOnceMessage?.message?.conversation,
    msg.viewOnceMessage?.message?.extendedTextMessage?.text,
    msg.viewOnceMessageV2?.message?.conversation,
    msg.viewOnceMessageV2?.message?.extendedTextMessage?.text,
  ];
  return candidates.find((t) => typeof t === "string" && t.trim()) || null;
}

// ---------- Owner Command & Self-Chat Handler ----------
async function sendOwnerReply(jid, text) {
  if (!sock) return;
  const replyWithHeader = text.startsWith("🤖") ? text : `🤖 ${text}`;
  try {
    const sent = await sock.sendMessage(jid, { text: replyWithHeader });
    if (sent?.key?.id) {
      botMessageIds.add(sent.key.id);
      setTimeout(() => botMessageIds.delete(sent.key.id), 120000);
    }
    addLog("out", "[To Owner]: " + text.slice(0, 80));
    console.log(`[To Owner]: ${text.slice(0, 100)}...`);
  } catch (err) {
    console.error("sendOwnerReply error:", err);
  }
}

async function handleOwnerChat(m, jid, text) {
  if (m.key.id && botMessageIds.has(m.key.id)) return;
  if (text.startsWith("🤖 ")) return;

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  addLog("in", "[Owner] " + trimmed);
  console.log(`[Owner command]: ${trimmed}`);

  // 1. Help Menu
  if (lower === "/help" || lower === "!help" || lower === "help" || lower === "মেনু" || lower === "menu") {
    const helpMsg = 
`🤖 *WhatsApp AI Bot Control Panel*
স্বাগতম! আপনি এখান থেকে পুরো বট নিয়ন্ত্রণ ও ব্যবসায়িক নির্দেশ দিতে পারবেন:

📚 *বটকে শেখানো (Teach & Instructions):*
• \`/teach <নতুন নিয়ম>\`
  বটের মূল ইনস্ট্রাকশন সেট করুন (পুরোনোটা মুছে নতুন সেট হবে)।
• \`/add <তথ্য>\`
  বর্তমান নিয়মের সাথে নতুন কোনো তথ্য যোগ করুন।
• \`/prompt\`
  বট বর্তমানে কাস্টমারদের কি নিয়মে রিপ্লাই দিচ্ছে তা দেখুন।
• \`/resetprompt\`
  ইনস্ট্রাকশন ডিফল্ট অবস্থায় ফিরিয়ে নিন।

⚙️ *বট নিয়ন্ত্রণ (Bot Controls):*
• \`/pause\` বা \`/stop\` - সাময়িকভাবে কাস্টমার অটো-রিপ্লাই বন্ধ করুন।
• \`/resume\` বা \`/start\` - পুনরায় কাস্টমার অটো-রিপ্লাই চালু করুন।
• \`/status\` - বটের লাইভ অবস্থা দেখুন।
• \`/payments\` - শেষ ৫টি পেমেন্ট সাবমিশন দেখুন।

👥 *অন্যান্য:*
• \`/groups on\` / \`/groups off\` - গ্রুপে রিপ্লাই।
• \`/delay <ms>\` - রিপ্লাই ডিলে।

💡 _টিপস: আপনি কমান্ড ছাড়াও সরাসরি যে কোনো নির্দেশ স্বাভাবিক বাংলায় লিখতে পারেন (যেমন: "কাস্টমারদের বলো ডেলিভারি ২ দিন লাগবে"), বট তা বুঝে ব্যবসায়িক মেমোরিতে সংরক্ষণ করে নেবে।_`;
    return await sendOwnerReply(jid, helpMsg);
  }

  // 2. Status
  if (lower === "/status" || lower === "!status" || lower === "status" || lower === "অবস্থা") {
    const statusMsg =
`📊 *বটের বর্তমান অবস্থা:*
• অটো-রিপ্লাই: ${config.botActive !== false ? "চালু আছে ✅" : "বন্ধ (Paused) ⏸️"}
• AI প্রোভাইডার: ${config.aiProvider}
• মডেল: ${config.aiModel}
• গ্রুপে রিপ্লাই: ${config.allowGroups ? "হ্যাঁ (On)" : "না (Off)"}
• রিপ্লাই ডিলে: ${config.replyDelayMs}ms
• পেন্ডিং পেমেন্ট: ${paymentsList.filter((p) => p.status === "pending").length} টি

📝 *বর্তমান কাস্টমার ইনস্ট্রাকশন:*
"${config.systemPrompt}"`;
    return await sendOwnerReply(jid, statusMsg);
  }

  // 3. View Payments
  if (lower === "/payments" || lower === "!payments" || lower === "পেমেন্ট") {
    const recent = paymentsList.slice(0, 5);
    if (!recent.length) {
      return await sendOwnerReply(jid, "💳 এখনো কোনো পেমেন্ট জমা পড়েনি।");
    }
    const payText = recent
      .map(
        (p, i) =>
          `${i + 1}. কাস্টমার: ${p.customerNumber}\n   নম্বর: ${p.senderNumber} (${p.amount})\n   স্ট্যাটাস: ${p.status}`
      )
      .join("\n\n");
    return await sendOwnerReply(jid, `💳 *শেষ পেমেন্ট রিকোয়েস্টসমূহ:*\n\n${payText}\n\nড্যাশবোর্ড (http://localhost:${PORT}) থেকে ভেরিফাই করতে পারবেন।`);
  }

  // 4. View Prompt
  if (lower === "/prompt" || lower === "!prompt") {
    return await sendOwnerReply(jid, `📝 *বর্তমান কাস্টমার ইনস্ট্রাকশন:*\n\n"${config.systemPrompt}"`);
  }

  // 5. Reset Prompt
  if (lower === "/resetprompt") {
    businessMemory = loadBusinessMemory();
    config.systemPrompt = compileSystemPrompt(businessMemory);
    saveConfig();
    return await sendOwnerReply(jid, `🔄 *ইনস্ট্রাকশন ডিফল্ট মেমোরি অনুযায়ী সেট করা হয়েছে:*\n\n"${config.systemPrompt}"`);
  }

  // 6. Pause
  if (lower === "/pause" || lower === "!pause" || lower === "/stop" || lower === "stop") {
    config.botActive = false;
    saveConfig();
    return await sendOwnerReply(jid, `⏸️ *অটো-রিপ্লাই সাময়িকভাবে বন্ধ করা হয়েছে!* \nকাস্টমারদের মেসেজ এলেও বট কোনো অটো-রিপ্লাই দেবে না। \nআবার চালু করতে \`/resume\` বা \`/start\` লিখুন।`);
  }

  // 7. Resume
  if (lower === "/resume" || lower === "!resume" || lower === "/start" || lower === "start") {
    config.botActive = true;
    saveConfig();
    return await sendOwnerReply(jid, `▶️ *অটো-রিপ্লাই পুনরায় চালু করা হয়েছে!* \nএখন থেকে কাস্টমারদের ইনস্ট্রাকশন অনুযায়ী স্বয়ংক্রিয় রিপ্লাই দেওয়া হবে।`);
  }

  // 8. Teach (/teach, /instruct, /setprompt)
  if (lower.startsWith("/teach ") || lower.startsWith("!teach ") || lower.startsWith("/instruct ") || lower.startsWith("/setprompt ")) {
    const newPrompt = trimmed.replace(/^(\/teach|\!teach|\/instruct|\/setprompt)\s+/i, "").trim();
    if (!newPrompt) {
      return await sendOwnerReply(jid, "⚠️ অনুগ্রহ করে ইনস্ট্রাকশন লিখে দিন। যেমন:\n`/teach তুমি আমাদের কাপড়ের দোকানের সহকারী...`");
    }
    config.systemPrompt = newPrompt;
    saveConfig();
    return await sendOwnerReply(jid, `✅ *নতুন ইনস্ট্রাকশন সফলভাবে সেট করা হয়েছে!*\n\nকাস্টমাররা এখন থেকে এই নিয়মে রিপ্লাই পাবে:\n"${config.systemPrompt}"`);
  }

  // 9. Add info (/add, /note)
  if (lower.startsWith("/add ") || lower.startsWith("!add ") || lower.startsWith("/note ")) {
    const extra = trimmed.replace(/^(\/add|\!add|\/note)\s+/i, "").trim();
    if (!extra) {
      return await sendOwnerReply(jid, "⚠️ অনুগ্রহ করে যে তথ্যটি যোগ করতে চান তা লিখুন। যেমন:\n`/add ঢাকা সিটির বাইরে ডেলিভারি চার্জ ১২০ টাকা।`");
    }
    if (!businessMemory.customLearnings) businessMemory.customLearnings = [];
    businessMemory.customLearnings.push(extra);
    saveBusinessMemory(businessMemory);
    return await sendOwnerReply(jid, `✅ *নতুন তথ্য স্থায়ী মেমোরিতে যুক্ত করা হয়েছে!*\n\nআপডেটকৃত সম্পূর্ণ ইনস্ট্রাকশন:\n"${config.systemPrompt}"`);
  }

  // 10. Groups toggle
  if (lower === "/groups on") {
    config.allowGroups = true;
    saveConfig();
    return await sendOwnerReply(jid, "✅ গ্রুপে অটো-রিপ্লাই চালু করা হয়েছে (Groups: ON)।");
  }
  if (lower === "/groups off") {
    config.allowGroups = false;
    saveConfig();
    return await sendOwnerReply(jid, "❌ গ্রুপে অটো-রিপ্লাই বন্ধ করা হয়েছে (Groups: OFF)।");
  }

  // 11. Delay setting
  if (lower.startsWith("/delay ")) {
    const ms = Number(trimmed.replace(/^\/delay\s+/i, "").trim());
    if (Number.isFinite(ms) && ms >= 0) {
      config.replyDelayMs = ms;
      saveConfig();
      return await sendOwnerReply(jid, `⏱️ রিপ্লাই ডিলে সেট করা হয়েছে: ${ms}ms`);
    }
  }

  // 12. Model setting
  if (lower.startsWith("/model ")) {
    const model = trimmed.replace(/^\/model\s+/i, "").trim();
    if (model) {
      config.aiModel = model;
      saveConfig();
      return await sendOwnerReply(jid, `🤖 AI মডেল পরিবর্তন করা হয়েছে: ${model}`);
    }
  }

  // 13. Natural Language Conversational Assistant
  await handleOwnerNaturalChat(jid, trimmed);
}

async function handleOwnerNaturalChat(jid, userText) {
  const adminPrompt = `তুমি একজন বুদ্ধিমান WhatsApp Business AI Bot Manager এবং Owner-এর বিশ্বস্ত সহকারী।
তুমি সরাসরি বটের মালিকের সাথে কথা বলছ। মালিক তোমাকে তার ব্যবসার নিয়ম শেখাতে পারে, রেট পরিবর্তন করতে বলতে পারে বা নির্দেশনা দিতে পারে।

বর্তমান ব্যবসায়িক মেমোরি:
${JSON.stringify(businessMemory, null, 2)}

মালিকের সাথে ব্যবহারের নিয়ম:
1. মালিক যদি কোনো নতুন নিয়ম, অফার, প্যাকেজ, বিকাশ নম্বর বা শর্ত যোগ/পরিবর্তন করতে বলে:
   - আন্তরিকভাবে বাংলায় নিশ্চিত করবে যে তুমি তা বুঝেছ এবং মেমোরিতে সেভ করেছ।
   - উত্তরের শেষে অবশ্যই ঠিক এই ট্যাগটি যুক্ত করবে:
   [UPDATE_MEMORY: <JSON object containing any updated fields, e.g. {"paymentInfo": {"number": "017..."}} or {"rules": [...]} or {"customLearnings": [...]}>]
2. মালিক যদি সাধারণ প্রশ্ন করে বা পরীক্ষা করার জন্য কথা বলে, চমৎকার ও পেশাদারভাবে বাংলায় উত্তর দাও।`;

  try {
    const reply = await aiReplySingle(adminPrompt, userText);

    // Check for memory update tag
    const match = reply.match(/\[UPDATE_MEMORY:\s*([\s\S]*?)\]/);
    let cleanReply = reply.replace(/\[UPDATE_MEMORY:\s*[\s\S]*?\]/, "").trim();

    if (match && match[1]) {
      try {
        const parsedUpdate = JSON.parse(match[1].trim());
        saveBusinessMemory(parsedUpdate);
        cleanReply += `\n\n💾 *ব্যবসায়িক মেমোরি সফলভাবে আপডেট ও স্থায়ীভাবে সেভ করা হয়েছে!*`;
      } catch (err) {
        console.warn("Could not parse memory update json:", err.message);
      }
    }

    await sendOwnerReply(jid, cleanReply);
  } catch (e) {
    console.error("Owner AI reply error:", e);
    await sendOwnerReply(
      jid,
      `⚠️ ক্ষমা করবেন, প্রসেস করতে সমস্যা হয়েছে: ${e.message}\nআপনি সরাসরি কমান্ড ব্যবহার করতে পারেন, যেমন:\n\`/teach <আপনার নিয়ম>\` বা \`/add <তথ্য>\``
    );
  }
}

// ---------- Bot Lifecycle ----------
async function startBot() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (sock) {
    try {
      sock.ev.removeAllListeners();
      sock.end();
    } catch {}
    sock = null;
  }

  status = "starting";
  lastError = null;
  qrDataUrl = null;

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // If auth directory has abandoned/unregistered credentials from previous pairing, clear them so fresh QR can generate
    if (state.creds && !state.creds.registered && state.creds.me && !pairingCode) {
      console.log("Found abandoned/unregistered credentials. Resetting auth for fresh QR...");
      try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(startBot, 500);
      return;
    }

    let version;
    try {
      const v = await fetchLatestBaileysVersion();
      version = v.version;
    } catch (e) {
      console.warn("Could not fetch latest Baileys version, using default:", e.message);
    }

    sock = makeWASocket({
      version,
      auth: state,
      browser: Browsers.windows("Chrome"),
      markOnlineOnConnect: false,
      logger: pino({ level: "silent" }),
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        try {
          qrDataUrl = await qrcode.toDataURL(qr);
          status = "waiting_qr";
          addLog("info", "QR ready — dashboard e scan korun");
          console.log(await qrcode.toString(qr, { type: "terminal", small: true }));
          console.log("QR: open http://localhost:" + PORT + " and scan with WhatsApp > Linked devices");
        } catch (e) {
          addLog("error", "QR banate parini: " + e.message);
        }
      }
      if (connection === "open") {
        status = "connected";
        qrDataUrl = null;
        pairingCode = null;
        addLog("info", "WhatsApp e login success ✅");
        console.log("Connected to WhatsApp");

        // Send a welcome control panel message to the owner's Message Yourself chat
        try {
          const ownerJid = sock.user?.id ? sock.user.id.split(":")[0] + "@s.whatsapp.net" : null;
          if (ownerJid) {
            const welcomeText = 
`🤖 *WhatsApp AI Business Bot Connected & Active!*

বট সফলভাবে কানেক্ট হয়েছে। আপনার ব্যবসায়িক মেমোরি ও প্যাকেজসমূহ স্থায়ীভাবে লোড করা হয়েছে।

📌 *প্রয়োজনীয় কমান্ড:*
• \`/help\` - সব কমান্ড ও নির্দেশিকা
• \`/status\` - লাইভ অবস্থা ও সেটিংস
• \`/payments\` - শেষ পেমেন্ট সাবমিশনসমূহ
• \`/teach <নতুন নিয়ম>\` - কাস্টমারদের কি বলবে তা শেখাতে
• \`/add <তথ্য>\` - নতুন কোনো তথ্য যোগ করতে
• \`/pause\` - সাময়িকভাবে অটো-রিপ্লাই থামাতে
• \`/resume\` - পুনরায় চালু করতে

ওয়েব ড্যাশবোর্ড: http://localhost:${PORT} ✅`;
            await sendOwnerReply(ownerJid, welcomeText);
          }
        } catch (err) {
          console.warn("Could not send welcome message to owner:", err.message);
        }
      }
      if (connection === "close") {
        const code = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = code === DisconnectReason.loggedOut;
        const isStaleAuth = !state.creds?.registered && (code === 401 || code === 408 || code === 428);

        if (isLoggedOut || isStaleAuth) {
          status = "waiting_qr";
          qrDataUrl = null;
          pairingCode = null;
          addLog("warn", "সেশন রিসেট হয়েছে। নতুন QR কোড তৈরি হচ্ছে... (code " + code + ")");
          console.log("Logged out or stale uncompleted session (code " + code + ") — clearing old session and generating fresh QR...");
          try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
          chatHistory.clear();
          if (reconnectTimeout) clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(startBot, 1000);
          return;
        }
        status = "reconnecting";
        addLog("warn", "কানেকশন ড্রপ হয়েছে, পুনরায় চেষ্টা করা হচ্ছে... (code " + code + ")");
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(startBot, 3000);
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      for (const m of messages) {
        try {
          const jid = m.key.remoteJid;
          if (!jid || jid === "status@broadcast") continue;

          const text = extractText(m);
          if (!text) continue;

          // Identify if this is the owner's self-chat ("You / Message yourself")
          const ownerNumber = sock.user?.id ? sock.user.id.split("@")[0].split(":")[0] : null;
          const ownerLid = sock.user?.lid ? sock.user.lid.split("@")[0].split(":")[0] : null;

          const isSelfChat = Boolean(
            (ownerNumber && (jid.startsWith(ownerNumber) || jid.split("@")[0] === ownerNumber)) ||
            (ownerLid && (jid.startsWith(ownerLid) || jid.split("@")[0] === ownerLid)) ||
            jid === sock.user?.id ||
            (config.ownerNumber && jid.includes(config.ownerNumber))
          );

          if (isSelfChat) {
            // Process owner command or teaching directly from WhatsApp chat!
            await handleOwnerChat(m, jid, text);
            continue;
          }

          // For customer chats:
          // 1. Ignore messages sent by ourselves to customers
          if (m.key.fromMe) continue;

          // 2. Automatic payment detection from customer message
          detectAndRecordPayment(jid, text);

          // 🛡️ Anti-Ban: Opt-Out & Angry Customer Shield (prevents reports & bans)
          if (checkOptOutTrigger(text)) {
            const customerPhone = resolveCustomerPhone(jid);
            if (!isBlacklisted(jid)) {
              blacklist.push({
                phone: customerPhone,
                jid,
                reason: "opt-out / angry customer trigger",
                addedAt: new Date().toISOString(),
              });
              saveBlacklist(blacklist);
              addLog("warn", `🛡️ [Anti-Ban]: Opt-out/ঝুঁকিপূর্ণ শব্দ শনাক্ত — ${customerPhone} কে ব্ল্যাকলিস্ট করা হয়েছে`);
            }
            continue;
          }

          // 🛡️ Anti-Ban: Blacklist check
          if (isBlacklisted(jid)) {
            console.log(`[Anti-Ban]: Ignored message from blacklisted user: ${jid}`);
            continue;
          }

          // 3. Ignore customer messages if bot is paused
          if (config.botActive === false) {
            console.log(`[Bot paused] Skipped auto-reply to ${jid}`);
            continue;
          }

          // 4. Ignore group chats if disabled
          if (jid.endsWith("@g.us") && !config.allowGroups) continue;

          addLog("in", (jid.split("@")[0] || jid) + ": " + text);
          console.log(`[in] ${jid}: ${text}`);

          const history = chatHistory.get(jid) || [];
          history.push({ role: "user", content: text });
          if (history.length > 24) history.splice(0, history.length - 24);

          // anti-spam cooldown per chat (2 seconds)
          const now = Date.now();
          const last = lastReplyAt.get(jid) || 0;
          if (now - last < 2000) continue;
          lastReplyAt.set(jid, now);

          const reply = await aiReply(history);
          history.push({ role: "assistant", content: reply });
          chatHistory.set(jid, history);

          // 🛡️ Anti-Ban: Send through Human Mimicry Rate-Limited Queue
          try {
            await enqueueOutboundMessage(jid, reply, m.key);
          } catch (err) {
            addLog("error", "Anti-Ban queue send error: " + err.message);
          }
        } catch (e) {
          addLog("error", "Reply dite problem: " + e.message);
          console.error("reply error:", e);
        }
      }
    });
  } catch (err) {
    lastError = err.message;
    addLog("error", "startBot error: " + err.message);
    console.error("startBot failed:", err);
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- Express Dashboard & APIs ----------
const app = express();
app.use(express.json());

// 1. Bot State
app.get("/api/state", (req, res) => {
  res.json({
    status,
    qr: qrDataUrl,
    pairingCode,
    activeGateway: config.metaGatewayActive ? "meta_cloud" : "baileys",
    metaConfigured: Boolean(config.metaAccessToken && config.metaPhoneNumberId),
    metaPhoneNumberId: config.metaPhoneNumberId || "",
    error: lastError,
    log: log.slice(0, 80),
    hasKey: Boolean(config.aiApiKey),
    provider:
      config.aiProvider ||
      (config.aiApiKey.startsWith("AIzaSy") || config.aiApiKey.startsWith("AQ.") ? "gemini" : "openai"),
    model: config.aiModel,
    aiBaseUrl: config.aiBaseUrl,
    allowGroups: config.allowGroups,
    systemPrompt: config.systemPrompt,
    replyDelayMs: config.replyDelayMs,
    botActive: config.botActive !== false,
  });
});

// Official WhatsApp Pairing Code endpoint (Login with Phone Number)
app.post("/api/pairing-code", async (req, res) => {
  try {
    let { phoneNumber } = req.body || {};
    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ ok: false, error: "হোয়াটসঅ্যাপ ফোন নম্বর দিন (যেমন: 017xxxxxxxx বা 88017xxxxxxxx)" });
    }

    phoneNumber = phoneNumber.replace(/\D/g, "");
    if (phoneNumber.startsWith("01")) {
      phoneNumber = "88" + phoneNumber;
    }

    if (!sock) {
      return res.status(503).json({ ok: false, error: "বট চালু হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন..." });
    }

    if (status === "connected") {
      return res.status(400).json({ ok: false, error: "হোয়াটসঅ্যাপ ইতিমধ্যে সফলভাবে কানেক্ট করা আছে!" });
    }

    // Request official WhatsApp pairing code
    const rawCode = await sock.requestPairingCode(phoneNumber);
    // Format code: e.g. ABCD-1234
    const code = rawCode?.match(/.{1,4}/g)?.join("-") || rawCode;
    pairingCode = code;

    addLog("info", `📱 অফিসিয়াল পেয়ারিং কোড তৈরি হয়েছে: ${code} (${phoneNumber})`);
    console.log(`[Official Pairing Code]: ${code} for ${phoneNumber}`);
    res.json({ ok: true, code, phoneNumber });
  } catch (err) {
    console.error("Pairing code error:", err);
    res.status(500).json({ ok: false, error: err.message || "পেয়ারিং কোড তৈরি করতে সমস্যা হয়েছে" });
  }
});

// ---------- Meta / Facebook WhatsApp Cloud API Webhook ----------
app.get("/api/webhook/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const expectedToken = config.metaVerifyToken || "wa_bot_verify_token_2026";
  if (mode === "subscribe" && token === expectedToken) {
    console.log("[Meta Webhook]: Verified successfully with challenge:", challenge);
    addLog("info", "✅ Meta Webhook সফলভাবে ভেরিফাই হয়েছে!");
    return res.status(200).send(challenge);
  }
  console.warn("[Meta Webhook Verification Failed]: Token mismatch or invalid request");
  res.status(403).send("Verification token mismatch");
});

app.post("/api/webhook/whatsapp", async (req, res) => {
  // Always return 200 immediately to Meta so webhook delivery succeeds
  res.status(200).send("EVENT_RECEIVED");

  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const val = change.value;
        if (!val || !val.messages) continue;

        for (const msg of val.messages) {
          if (msg.type !== "text" || !msg.text?.body) continue;

          const from = msg.from; // Customer phone (e.g. 88017xxxxxxxx)
          const text = msg.text.body.trim();
          const jid = from + "@s.whatsapp.net";

          console.log(`[Meta Inbound]: ${from}: ${text}`);
          addLog("in", `[Meta] ${from}: ${text}`);

          // 1. Payment detection
          detectAndRecordPayment(jid, text);

          // 2. Opt-out & angry customer protection
          if (checkOptOutTrigger(text)) {
            if (!isBlacklisted(from)) {
              blacklist.push({
                phone: from,
                jid,
                reason: "opt-out / angry customer trigger (Meta)",
                addedAt: new Date().toISOString(),
              });
              saveBlacklist(blacklist);
              addLog("warn", `🛡️ [Meta Anti-Ban]: Opt-out শনাক্ত — ${from} কে ব্ল্যাকলিস্ট করা হয়েছে`);
            }
            continue;
          }

          if (isBlacklisted(from)) {
            console.log(`[Meta Anti-Ban]: Ignored blacklisted user ${from}`);
            continue;
          }

          if (config.botActive === false) {
            console.log(`[Bot paused] Skipped Meta auto-reply to ${from}`);
            continue;
          }

          // 3. AI Reply
          const history = chatHistory.get(jid) || [];
          history.push({ role: "user", content: text });
          if (history.length > 24) history.splice(0, history.length - 24);

          const reply = await aiReply(history);
          history.push({ role: "assistant", content: reply });
          chatHistory.set(jid, history);

          // 4. Send outbound reply via Meta Cloud API
          try {
            await sendMetaCloudMessage(from, reply);
          } catch (err) {
            console.error("Meta send reply error:", err.message);
          }
        }
      }
    }
  } catch (err) {
    console.error("Meta Webhook processing error:", err.message);
  }
});

// Meta Status & Profile Endpoint
app.get("/api/meta/status", async (req, res) => {
  let profile = null;
  let connectionValid = false;

  if (config.metaAccessToken && config.metaPhoneNumberId) {
    try {
      profile = await fetchMetaAccountDetails(config.metaAccessToken, config.metaPhoneNumberId);
      connectionValid = true;
    } catch (e) {
      profile = { error: e.message };
    }
  }

  res.json({
    ok: true,
    activeGateway: config.metaGatewayActive ? "meta_cloud" : "baileys",
    config: {
      metaGatewayActive: Boolean(config.metaGatewayActive),
      metaPhoneNumberId: config.metaPhoneNumberId || "",
      metaWabaId: config.metaWabaId || "",
      hasToken: Boolean(config.metaAccessToken),
      metaVerifyToken: config.metaVerifyToken || "wa_bot_verify_token_2026",
    },
    connectionValid,
    profile,
  });
});

// Meta Config Update Endpoint
app.post("/api/meta/config", async (req, res) => {
  try {
    const { metaAccessToken, metaPhoneNumberId, metaWabaId, metaVerifyToken, metaGatewayActive } = req.body || {};

    if (typeof metaAccessToken === "string" && metaAccessToken.trim()) config.metaAccessToken = metaAccessToken.trim();
    if (typeof metaPhoneNumberId === "string" && metaPhoneNumberId.trim()) config.metaPhoneNumberId = metaPhoneNumberId.trim();
    if (typeof metaWabaId === "string" && metaWabaId.trim()) config.metaWabaId = metaWabaId.trim();
    if (typeof metaVerifyToken === "string" && metaVerifyToken.trim()) config.metaVerifyToken = metaVerifyToken.trim();
    if (typeof metaGatewayActive === "boolean") config.metaGatewayActive = metaGatewayActive;

    saveConfig();

    let profile = null;
    let verified = false;
    if (config.metaAccessToken && config.metaPhoneNumberId) {
      try {
        profile = await fetchMetaAccountDetails(config.metaAccessToken, config.metaPhoneNumberId);
        verified = true;
        addLog("info", `✅ Meta Official WhatsApp ভেরিফাইড: ${profile.display_phone_number || config.metaPhoneNumberId}`);
      } catch (err) {
        addLog("warn", `Meta credentials verification warning: ${err.message}`);
      }
    }

    res.json({ ok: true, verified, profile, config });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Meta Test Message Endpoint
app.post("/api/meta/test", async (req, res) => {
  try {
    const { toPhone, testMessage } = req.body || {};
    if (!toPhone) return res.status(400).json({ ok: false, error: "টেস্ট মেসেজ পাঠানোর জন্য ফোন নম্বর দিন" });

    const msg = testMessage || "🤖 এটি WhatsApp Official Meta Cloud API থেকে পাঠানো টেস্ট মেসেজ। সংযোগ সম্পূর্ণ সফল! ✅";
    const result = await sendMetaCloudMessage(toPhone, msg);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 2. Business Memory Endpoints
app.get("/api/business", (req, res) => {
  res.json({
    memory: businessMemory,
    compiledPrompt: config.systemPrompt,
  });
});

app.post("/api/business", (req, res) => {
  try {
    const updated = req.body || {};
    saveBusinessMemory(updated);
    addLog("info", "ড্যাশবোর্ড থেকে ব্যবসায়িক মেমোরি আপডেট করা হয়েছে");
    res.json({ ok: true, memory: businessMemory, prompt: config.systemPrompt });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 3. Payments Tracker Endpoints
app.get("/api/payments", (req, res) => {
  res.json({
    payments: paymentsList,
    stats: {
      total: paymentsList.length,
      pending: paymentsList.filter((p) => p.status === "pending").length,
      verified: paymentsList.filter((p) => p.status === "verified").length,
      rejected: paymentsList.filter((p) => p.status === "rejected").length,
    },
  });
});

app.post("/api/payments/verify", async (req, res) => {
  try {
    const { id } = req.body || {};
    const item = paymentsList.find((p) => p.id === id);
    if (!item) return res.status(404).json({ ok: false, error: "Payment not found" });

    item.status = "verified";
    item.verifiedAt = new Date().toISOString();
    savePayments(paymentsList);

    // Auto send confirmation and imo delivery details to customer
    const verifyMsg = 
`✅ *আপনার পেমেন্ট সফলভাবে যাচাই করা হয়েছে!*

📲 এখনই imo-তে কানেক্ট করুন:
*imo নম্বর:* ${businessMemory.deliveryInfo?.number || "01898694648"}

imo-তে মেসেজে আপনার পেমেন্ট করা নম্বরের শেষ ৪ সংখ্যা লিখে দিন। আপনাকে ধন্যবাদ! 😊`;

    if (sock && item.jid) {
      try {
        await enqueueOutboundMessage(item.jid, verifyMsg);
        addLog("out", `[Verified Delivery Queued to ${item.customerNumber}]`);
      } catch (err) {
        console.warn("Could not queue WhatsApp message to customer:", err.message);
      }
    }

    addLog("info", `পেমেন্ট ভেরিফাই করা হয়েছে: ${item.customerNumber}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/payments/reject", async (req, res) => {
  try {
    const { id } = req.body || {};
    const item = paymentsList.find((p) => p.id === id);
    if (!item) return res.status(404).json({ ok: false, error: "Payment not found" });

    item.status = "rejected";
    savePayments(paymentsList);
    addLog("warn", `পেমেন্ট বাতিল করা হয়েছে: ${item.customerNumber}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/payments/delete", (req, res) => {
  try {
    const { id } = req.body || {};
    paymentsList = paymentsList.filter((p) => p.id !== id);
    savePayments(paymentsList);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Clean and filter payments list (removes inquiries/junk)
app.post("/api/payments/clean", (req, res) => {
  try {
    const cleaned = [];
    const seen = new Set();
    for (const p of paymentsList) {
      const details =
        extractPaymentDetails(p.rawText) ||
        (p.senderNumber &&
        p.senderNumber !== "উল্লেখ করেনি" &&
        !["01625642420", "01898694648"].includes(p.senderNumber)
          ? {
              senderReference: p.senderNumber,
              fullPhone: p.senderNumber.length === 11 ? p.senderNumber : null,
              lastDigits: p.senderNumber.length <= 5 ? p.senderNumber : null,
              trxId: null,
              amount: p.amount || "৫০ টাকা",
              method: p.method || "বিকাশ",
            }
          : null);

      if (details) {
        const resolvedPhone = resolveCustomerPhone(p.jid);
        const key = `${resolvedPhone}_${details.senderReference}`;
        if (!seen.has(key)) {
          seen.add(key);
          cleaned.push({
            ...p,
            customerNumber: resolvedPhone,
            customerPhone: resolvedPhone,
            senderNumber: details.senderReference,
            senderReference: details.senderReference,
            lastDigits: details.lastDigits,
            fullPhone: details.fullPhone,
            trxId: details.trxId,
            amount: details.amount,
            method: details.method,
          });
        }
      }
    }
    paymentsList = cleaned;
    savePayments(paymentsList);
    addLog("info", `পেমেন্ট তালিকা পরিষ্কার করা হয়েছে। আসল পেমেন্ট: ${paymentsList.length}টি`);
    res.json({ ok: true, count: paymentsList.length, payments: paymentsList });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 4. Admin Conversational AI Trainer Chat Endpoint
app.post("/api/admin/chat", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ ok: false, error: "Message is required" });
    }

    const adminPrompt = `তুমি একজন দক্ষ WhatsApp Business AI Bot Manager এবং Owner-এর ব্যক্তিগত সহকারী।
মালিক সরাসরি তোমার সাথে ব্রাউজারের অ্যাডমিন চ্যাটে কথা বলছেন। মালিক তোমাকে ব্যবসার নিয়ম শেখাতে পারে, রেট পরিবর্তন করতে বলতে পারে বা নির্দেশনা দিতে পারে।

বর্তমান ব্যবসায়িক মেমোরি:
${JSON.stringify(businessMemory, null, 2)}

মালিকের সাথে ব্যবহারের নিয়ম:
1. মালিক যদি কোনো নতুন নিয়ম, অফার, প্যাকেজ, বিকাশ নম্বর বা শর্ত যোগ/পরিবর্তন করতে বলে:
   - আন্তরিকভাবে বাংলায় নিশ্চিত করবে যে তুমি তা বুঝেছ এবং মেমোরিতে সেভ করেছ।
   - উত্তরের শেষে অবশ্যই ঠিক এই ট্যাগটি যুক্ত করবে:
   [UPDATE_MEMORY: <JSON object containing any updated fields, e.g. {"paymentInfo": {"number": "017..."}} or {"rules": [...]} or {"customLearnings": [...]}>]
2. মালিক যদি সাধারণ প্রশ্ন করে বা পরীক্ষা করার জন্য কথা বলে, চমৎকার ও পেশাদারভাবে বাংলায় উত্তর দাও।`;

    const reply = await aiReplySingle(adminPrompt, message.trim());

    // Check for memory update tag
    const match = reply.match(/\[UPDATE_MEMORY:\s*([\s\S]*?)\]/);
    let cleanReply = reply.replace(/\[UPDATE_MEMORY:\s*[\s\S]*?\]/, "").trim();
    let memoryUpdated = false;

    if (match && match[1]) {
      try {
        const parsedUpdate = JSON.parse(match[1].trim());
        saveBusinessMemory(parsedUpdate);
        cleanReply += `\n\n💾 *ব্যবসায়িক মেমোরি সফলভাবে আপডেট ও স্থায়ীভাবে সেভ করা হয়েছে!*`;
        memoryUpdated = true;
      } catch (err) {
        console.warn("Could not parse memory update json:", err.message);
      }
    }

    res.json({
      ok: true,
      reply: cleanReply,
      memoryUpdated,
      businessMemory,
      systemPrompt: config.systemPrompt,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 5. Anti-Ban & Account Safety APIs
app.get("/api/safety/stats", (req, res) => {
  checkDailySafetyCounter();
  const score = Math.max(
    65,
    100 -
      safetyStats.burstWindow.length * 3 -
      Math.floor((safetyStats.todayOutboundCount / MAX_MESSAGES_PER_DAY) * 25)
  );
  safetyStats.healthScore = score;

  res.json({
    ok: true,
    stats: {
      ...safetyStats,
      maxDaily: MAX_MESSAGES_PER_DAY,
      maxPerMinute: MAX_MESSAGES_PER_MINUTE,
      blacklistCount: blacklist.length,
    },
    blacklist,
  });
});

app.post("/api/blacklist", (req, res) => {
  try {
    const { phone, reason } = req.body || {};
    if (!phone) return res.status(400).json({ ok: false, error: "ফোন নম্বর দিন" });
    const clean = phone.replace(/\D/g, "");
    if (!clean) return res.status(400).json({ ok: false, error: "সঠিক ফোন নম্বর দিন" });

    if (!isBlacklisted(clean)) {
      blacklist.push({
        phone: clean,
        jid: clean + "@s.whatsapp.net",
        reason: reason || "ম্যানুয়াল ব্ল্যাকলিস্ট",
        addedAt: new Date().toISOString(),
      });
      saveBlacklist(blacklist);
      addLog("info", `🛡️ ব্ল্যাকলিস্টে নম্বর যুক্ত করা হয়েছে: ${clean}`);
    }
    res.json({ ok: true, blacklist });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.delete("/api/blacklist", (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ ok: false, error: "ফোন নম্বর দিন" });
    const clean = phone.replace(/\D/g, "");
    blacklist = blacklist.filter((b) => !b.phone.includes(clean));
    saveBlacklist(blacklist);
    addLog("info", `🛡️ ব্ল্যাকলিস্ট থেকে নম্বর সরানো হয়েছে: ${clean}`);
    res.json({ ok: true, blacklist });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 6. General Config & Controls
app.post("/api/config", (req, res) => {
  const { systemPrompt, aiProvider, aiApiKey, aiModel, aiBaseUrl, allowGroups, replyDelayMs, botActive } =
    req.body || {};
  if (typeof systemPrompt === "string" && systemPrompt.trim()) config.systemPrompt = systemPrompt.trim();
  if (typeof aiProvider === "string" && aiProvider.trim()) config.aiProvider = aiProvider.trim();
  if (typeof aiApiKey === "string" && aiApiKey.trim()) config.aiApiKey = aiApiKey.trim();
  if (typeof aiModel === "string" && aiModel.trim()) config.aiModel = aiModel.trim();
  if (typeof aiBaseUrl === "string" && aiBaseUrl.trim()) config.aiBaseUrl = aiBaseUrl.trim();
  if (typeof allowGroups === "boolean") config.allowGroups = allowGroups;
  if (typeof botActive === "boolean") config.botActive = botActive;
  if (Number.isFinite(Number(replyDelayMs))) config.replyDelayMs = Math.max(0, Number(replyDelayMs));
  saveConfig();
  addLog("info", "Settings save hoyeche");
  res.json({ ok: true });
});

app.post("/api/restart", async (req, res) => {
  try {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (sock) {
      try { sock.ev.removeAllListeners(); } catch {}
      try { sock.end(); } catch {}
      sock = null;
    }
    if (status === "stopped") {
      try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
    }
    status = "starting";
    qrDataUrl = null;
    addLog("info", "Bot restart kora hocche...");
    startBot().catch((e) => {
      lastError = e.message;
      addLog("error", "Bot restart korte parini: " + e.message);
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/logout", async (req, res) => {
  try {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (sock) {
      try { sock.ev.removeAllListeners(); } catch {}
      try { await sock.logout(); } catch {}
      try { sock.end(); } catch {}
      sock = null;
    }
    try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
    chatHistory.clear();
    status = "starting";
    qrDataUrl = null;
    addLog("info", "Logout kora holo — notun QR asche");
    startBot().catch((e) => {
      lastError = e.message;
      addLog("error", "Bot start korte parini: " + e.message);
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Explicit Reset QR & Pairing State Endpoint
app.post("/api/reset-qr", async (req, res) => {
  try {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (sock) {
      try { sock.ev.removeAllListeners(); } catch {}
      try { sock.end(); } catch {}
      sock = null;
    }
    try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
    chatHistory.clear();
    status = "starting";
    qrDataUrl = null;
    pairingCode = null;
    addLog("info", "🔄 QR কোড রিসেট করা হয়েছে — নতুন ফ্রেশ QR কোড তৈরি হচ্ছে...");
    startBot().catch((e) => {
      lastError = e.message;
      addLog("error", "Bot start korte parini: " + e.message);
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

process.on("SIGINT", () => {
  if (sock) try { sock.end(); } catch {}
  process.exit(0);
});

process.on("SIGTERM", () => {
  if (sock) try { sock.end(); } catch {}
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Dashboard: http://localhost:${PORT}`);
  startBot().catch((e) => {
    lastError = e.message;
    addLog("error", "Bot start korte parini: " + e.message);
    console.error(e);
  });
});
