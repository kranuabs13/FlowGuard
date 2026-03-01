import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import cookieSession from "cookie-session";
import https from "https";
import fs from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("flowguard.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    subject TEXT,
    value REAL,
    stage TEXT, -- 'new', 'sent', 'waiting', 'won', 'lost'
    notes TEXT,
    is_finished INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS finished_threads (
    thread_id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deal_id INTEGER,
    action TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default settings if not exists
const seedSettings = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
seedSettings.run("vips", JSON.stringify(["emet.co.il", "nitzan@client.il"]));
seedSettings.run("rules", JSON.stringify({
  vip_sla_hours: 2,
  urgent_keywords: ["quote", "RFQ", "price", "BOM"],
  manager_email: "manager@emetdorcom.co.il"
}));

async function startServer() {
  const app = express();
  app.use(express.json());
  
  app.use(cookieSession({
    name: 'session',
    keys: ['flowguard-secret-key'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production' || fs.existsSync(path.join(os.homedir(), ".office-addin-dev-certs", "localhost.crt")),
    sameSite: 'none'
  }));

  const PORT = 3000;

  // --- OAuth Routes ---
  app.get('/api/auth/url', (req, res) => {
    const client_id = process.env.MICROSOFT_CLIENT_ID;
    const redirect_uri = `${process.env.APP_URL}/auth/callback`;
    
    if (!client_id) {
      return res.status(500).json({ error: "MICROSOFT_CLIENT_ID not configured" });
    }

    const params = new URLSearchParams({
      client_id,
      response_type: 'code',
      redirect_uri,
      response_mode: 'query',
      scope: 'offline_access User.Read Mail.Read Mail.ReadWrite',
      state: '12345'
    });

    res.json({ url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}` });
  });

  app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    const client_id = process.env.MICROSOFT_CLIENT_ID;
    const client_secret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirect_uri = `${process.env.APP_URL}/auth/callback`;

    try {
      const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
        client_id: client_id!,
        client_secret: client_secret!,
        code: code as string,
        redirect_uri,
        grant_type: 'authorization_code'
      }));

      // @ts-ignore
      req.session.tokens = response.data;
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Token exchange failed", error.response?.data || error.message);
      res.status(500).send("Authentication failed");
    }
  });

  app.get('/api/me', (req, res) => {
    // @ts-ignore
    res.json({ authenticated: !!req.session?.tokens });
  });

  app.get('/api/graph/messages', async (req, res) => {
    // @ts-ignore
    const tokens = req.session?.tokens;
    if (!tokens) return res.status(401).json({ error: "Not authenticated" });

    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me/messages?$top=10&$select=subject,from,receivedDateTime,isRead', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      res.json(response.data.value);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Graph API failed" });
    }
  });

  // --- Deal Routes ---
  app.get("/api/deals", (req, res) => {
    const deals = db.prepare("SELECT * FROM deals ORDER BY updated_at DESC").all();
    res.json(deals);
  });

  app.post("/api/deals", (req, res) => {
    const { customer_name, subject, value, stage, notes } = req.body;
    const info = db.prepare(
      "INSERT INTO deals (customer_name, subject, value, stage, notes) VALUES (?, ?, ?, ?, ?)"
    ).run(customer_name, subject, value, stage || 'new', notes);
    
    db.prepare("INSERT INTO audit_log (deal_id, action) VALUES (?, ?)").run(info.lastInsertRowid, "Created deal");
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/deals/:id", (req, res) => {
    const { stage, notes, value, is_finished } = req.body;
    db.prepare(
      "UPDATE deals SET stage = COALESCE(?, stage), notes = COALESCE(?, notes), value = COALESCE(?, value), is_finished = COALESCE(?, is_finished), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(stage, notes, value, is_finished, req.params.id);
    
    db.prepare("INSERT INTO audit_log (deal_id, action) VALUES (?, ?)").run(req.params.id, `Updated deal ${is_finished ? 'to finished' : ''}`);
    res.json({ success: true });
  });

  app.post("/api/threads/finish", (req, res) => {
    const { thread_id } = req.body;
    db.prepare("INSERT OR IGNORE INTO finished_threads (thread_id) VALUES (?)").run(thread_id);
    res.json({ success: true });
  });

  app.get("/api/threads/finished", (req, res) => {
    const threads = db.prepare("SELECT thread_id FROM finished_threads").all();
    res.json(threads.map((t: any) => t.thread_id));
  });

  // --- Settings & Audit ---
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const result = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = JSON.parse(curr.value);
      return acc;
    }, {});
    res.json(result);
  });

  app.post("/api/settings", (req, res) => {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
    res.json({ success: true });
  });

  app.get("/api/audit", (req, res) => {
    const logs = db.prepare("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 50").all();
    res.json(logs);
  });

  app.get("/api/escalations", (req, res) => {
    const overdueDeals = db.prepare(`
      SELECT * FROM deals 
      WHERE (stage = 'new' OR stage = 'waiting' OR stage = 'sent')
      AND updated_at < datetime('now', '-24 hours')
    `).all();
    
    res.json(overdueDeals);
  });

  app.get("/icon-64.png", (req, res) => {
    res.redirect("https://res-1.cdn.office.net/assets/mail/ic-addin-64.png");
  });

  app.get("/icon-128.png", (req, res) => {
    res.redirect("https://res-1.cdn.office.net/assets/mail/ic-addin-128.png");
  });

  app.get("/manifest.xml", (req, res) => {
    res.sendFile(path.join(__dirname, "manifest.xml"));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const homeDir = os.homedir();
  const certLocations = [
    path.join(homeDir, ".office-addin-dev-certs", "localhost.crt"),
    path.join(process.cwd(), "localhost.crt"),
    path.join(homeDir, "localhost.crt")
  ];
  const keyLocations = [
    path.join(homeDir, ".office-addin-dev-certs", "localhost.key"),
    path.join(process.cwd(), "localhost.key"),
    path.join(homeDir, "localhost.key")
  ];

  let certPath = certLocations.find(loc => fs.existsSync(loc));
  let keyPath = keyLocations.find(loc => fs.existsSync(loc));

  if (certPath && keyPath) {
    console.log(`[HTTPS] Found certificates at: ${certPath}`);
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    https.createServer(options, app).listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on https://localhost:${PORT}`);
    });
  } else {
    console.warn("[HTTPS] Certificates NOT found. Falling back to HTTP.");
    console.log(`Checked locations: ${certLocations.join(", ")}`);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`⚠️ Server running on http://localhost:${PORT} (Outlook will block this!)`);
    });
  }
}

startServer();
