const mysql = require("mysql2/promise");

const DEFAULT_DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.TIDB_URL ||
  "mysql://4PNQGpZwzama1C3.root:hCGVB0zTbqfI4cpL@gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com:4000/whatsapp_bot";

let pool = null;

function getPool() {
  if (!pool) {
    try {
      pool = mysql.createPool({
        uri: DEFAULT_DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 5,
        maxIdle: 5,
        idleTimeout: 60000,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });
    } catch (e) {
      console.error("[DB Pool Init Error]:", e.message);
      pool = null;
    }
  }
  return pool;
}

// Ensure database tables exist
async function initDb() {
  const p = getPool();
  if (!p) return false;

  try {
    const connection = await p.getConnection();
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS bot_config (
          key_name VARCHAR(100) PRIMARY KEY,
          value_data LONGTEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS business_memory (
          id INT PRIMARY KEY,
          memory_json LONGTEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id VARCHAR(100) PRIMARY KEY,
          sender_jid VARCHAR(100),
          method VARCHAR(50),
          amount VARCHAR(50),
          last_digits VARCHAR(50),
          status VARCHAR(50),
          raw_json LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS system_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          level VARCHAR(20),
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log("[TiDB] Database tables initialized successfully.");
      return true;
    } finally {
      connection.release();
    }
  } catch (e) {
    console.error("[TiDB Init Error]:", e.message);
    return false;
  }
}

// Configuration handlers
async function loadConfigFromDb() {
  const p = getPool();
  if (!p) return null;
  try {
    const [rows] = await p.query("SELECT key_name, value_data FROM bot_config");
    if (!rows || rows.length === 0) return null;
    const config = {};
    for (const r of rows) {
      try {
        config[r.key_name] = JSON.parse(r.value_data);
      } catch {
        config[r.key_name] = r.value_data;
      }
    }
    return config;
  } catch (e) {
    console.error("[TiDB Load Config Error]:", e.message);
    return null;
  }
}

async function saveConfigToDb(key, value) {
  const p = getPool();
  if (!p) return false;
  try {
    const valStr = typeof value === "object" ? JSON.stringify(value) : String(value);
    await p.query(
      `INSERT INTO bot_config (key_name, value_data) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE value_data = VALUES(value_data)`,
      [key, valStr]
    );
    return true;
  } catch (e) {
    console.error("[TiDB Save Config Error]:", e.message);
    return false;
  }
}

async function saveFullConfigToDb(configObj) {
  const p = getPool();
  if (!p || !configObj) return false;
  try {
    for (const [k, v] of Object.entries(configObj)) {
      await saveConfigToDb(k, v);
    }
    return true;
  } catch (e) {
    console.error("[TiDB Save Full Config Error]:", e.message);
    return false;
  }
}

// Business Memory handlers
async function loadBusinessMemoryFromDb() {
  const p = getPool();
  if (!p) return null;
  try {
    const [rows] = await p.query("SELECT memory_json FROM business_memory WHERE id = 1 LIMIT 1");
    if (rows && rows.length > 0 && rows[0].memory_json) {
      return JSON.parse(rows[0].memory_json);
    }
    return null;
  } catch (e) {
    console.error("[TiDB Load Business Memory Error]:", e.message);
    return null;
  }
}

async function saveBusinessMemoryToDb(memoryObj) {
  const p = getPool();
  if (!p || !memoryObj) return false;
  try {
    const jsonStr = JSON.stringify(memoryObj);
    await p.query(
      `INSERT INTO business_memory (id, memory_json) VALUES (1, ?)
       ON DUPLICATE KEY UPDATE memory_json = VALUES(memory_json)`,
      [jsonStr]
    );
    return true;
  } catch (e) {
    console.error("[TiDB Save Business Memory Error]:", e.message);
    return false;
  }
}

// Payments handlers
async function loadPaymentsFromDb() {
  const p = getPool();
  if (!p) return [];
  try {
    const [rows] = await p.query("SELECT * FROM payments ORDER BY created_at DESC LIMIT 200");
    return rows.map((r) => {
      let parsed = {};
      try {
        if (r.raw_json) parsed = JSON.parse(r.raw_json);
      } catch {}
      return {
        id: r.id,
        jid: r.sender_jid,
        method: r.method,
        amount: r.amount,
        lastDigits: r.last_digits,
        status: r.status,
        ...parsed,
        createdAt: r.created_at,
      };
    });
  } catch (e) {
    console.error("[TiDB Load Payments Error]:", e.message);
    return [];
  }
}

async function savePaymentToDb(payment) {
  const p = getPool();
  if (!p || !payment || !payment.id) return false;
  try {
    const rawJson = JSON.stringify(payment);
    await p.query(
      `INSERT INTO payments (id, sender_jid, method, amount, last_digits, status, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         sender_jid = VALUES(sender_jid),
         method = VALUES(method),
         amount = VALUES(amount),
         last_digits = VALUES(last_digits),
         status = VALUES(status),
         raw_json = VALUES(raw_json)`,
      [
        payment.id,
        payment.jid || payment.sender_jid || "",
        payment.method || "",
        payment.amount || "",
        payment.lastDigits || payment.last_digits || "",
        payment.status || "pending",
        rawJson,
      ]
    );
    return true;
  } catch (e) {
    console.error("[TiDB Save Payment Error]:", e.message);
    return false;
  }
}

// System Logs
async function addLogToDb(level, message) {
  const p = getPool();
  if (!p) return false;
  try {
    await p.query("INSERT INTO system_logs (level, message) VALUES (?, ?)", [
      level || "info",
      message || "",
    ]);
    return true;
  } catch (e) {
    return false;
  }
}

async function getRecentLogsFromDb(limit = 100) {
  const p = getPool();
  if (!p) return [];
  try {
    const [rows] = await p.query(
      "SELECT id, level as kind, message as text, created_at as at FROM system_logs ORDER BY id DESC LIMIT ?",
      [limit]
    );
    return rows;
  } catch (e) {
    console.error("[TiDB Get Logs Error]:", e.message);
    return [];
  }
}

module.exports = {
  getPool,
  initDb,
  loadConfigFromDb,
  saveConfigToDb,
  saveFullConfigToDb,
  loadBusinessMemoryFromDb,
  saveBusinessMemoryToDb,
  loadPaymentsFromDb,
  savePaymentToDb,
  addLogToDb,
  getRecentLogsFromDb,
};
