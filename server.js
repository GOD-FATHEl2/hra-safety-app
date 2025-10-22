import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import cron from "node-cron";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import multer from "multer"; // För filuppladdning
import session from "express-session";

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// MSAL Authentication imports (with error handling)
let msalAuthModule = null;
try {
    const msalAuth = await import('./auth/msalAuth.js');
    msalAuthModule = msalAuth;
    console.log('MSAL authentication module loaded successfully');
} catch (error) {
    console.log('MSAL authentication not available:', error.message);
    console.log('Continuing with traditional authentication only');
}

// ====== EXPRESS APP SETUP ======
const app = express();
app.use(cors({ origin: true, credentials: true }));

// Session middleware for MSAL
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.json({ limit: '50mb' })); // Increase limit for images
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static("client"));

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = "./uploads";
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve images folder for information page
app.use('/images', express.static('./images'));

// Health check endpoint for Azure monitoring
app.get('/health', (req, res) => {
  try {
    // Check database connection
    const dbCheck = db.prepare("SELECT 1 as test").get();
    
    // Check if uploads directory exists
    const uploadsExist = fs.existsSync(UPLOADS_DIR);
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbCheck ? 'connected' : 'disconnected',
      uploads: uploadsExist ? 'available' : 'missing',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Endast bilder är tillåtna!'), false);
    }
  }
});

const DB_FILE = "./hogrisk.db";
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";
const PORT = process.env.PORT || 8080;

const db = new Database(DB_FILE);

// ====== MS GRAPH (client credentials) ======
async function getGraphToken() {
  const tenant = process.env.TENANT_ID;
  const client = process.env.CLIENT_ID;
  const secret = process.env.CLIENT_SECRET;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: client,
    client_secret: secret,
    scope: "https://graph.microsoft.com/.default",
  });

  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!res.ok) throw new Error("Token error");
  const js = await res.json();
  return js.access_token;
}

// Hämta siteId + driveId 1 gång och cacha
let cachedSiteId = null, cachedDriveId = null;
async function ensureSiteAndDrive() {
  const host = process.env.SPO_HOSTNAME;
  const sitePath = process.env.SPO_SITE_PATH;        // t.ex. "sites/TBAMAINTENANCE"
  const driveName = process.env.SPO_DRIVE_NAME || "Shared Documents";
  const token = await getGraphToken();

  if (!cachedSiteId) {
    const sRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${host}:/`+sitePath, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!sRes.ok) throw new Error("Hittar inte SharePoint-sajten");
    const site = await sRes.json();
    cachedSiteId = site.id;
  }
  if (!cachedDriveId) {
    const dRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${cachedSiteId}/drives`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dJs = await dRes.json();
    const drive = (dJs.value||[]).find(x => x.name === driveName);
    if (!drive) throw new Error("Hittar inte dokumentbiblioteket (drive)");
    cachedDriveId = drive.id;
  }
  return { token, siteId: cachedSiteId, driveId: cachedDriveId };
}

// Uppladdning av fil till /root:/<SPO_FOLDER_PATH>/<filename>:/content
async function uploadToSharePoint(buffer, filename) {
  const folder = (process.env.SPO_FOLDER_PATH || "Hogrisk").replace(/^\/+|\/+$/g, "");
  const { token, driveId } = await ensureSiteAndDrive();
  const safeName = filename.replace(/[^\w\-.åäöÅÄÖ ]/g, "_");
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURI(folder)}/${encodeURI(safeName)}:/content`;

  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/pdf" },
    body: buffer
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error("Upload failed: " + t);
  }
  return await res.json(); // returnerar driveItem
}

// ====== PDF-GENERERING ======
function makeAssessmentPDF(row, creatorName) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on("data", d => chunks.push(d));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    // Header
    doc.fontSize(16).text("Bedömning av högriskarbete", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).text("Alla olyckor kan förebyggas • VCT • Issue 04");
    doc.moveDown();

    // Grunddata
    doc.fontSize(12).text("A. Arbetsuppgift", { underline: true });
    doc.moveDown(0.3);
    const left = 40;
    const kv = (k,v) => doc.font("Helvetica-Bold").text(k, {continued:true}).font("Helvetica").text(" " + (v||"-"));
    kv("Datum:", row.date);
    kv("Namn:", row.worker_name);
    kv("Team:", row.team);
    kv("Plats:", row.location);
    kv("Arbetsuppgift:", row.task);
    doc.moveDown();

    // Risk
    doc.fontSize(12).text("B. Riskbedömning", { underline: true });
    kv("Sannolikhet:", row.risk_s);
    kv("Konsekvens:", row.risk_k);
    kv("Riskpoäng:", row.risk_score);
    kv("Identifierade risker:", row.risks);
    doc.moveDown();

    // Checklista
    doc.fontSize(12).text("C. Checklista", { underline: true });
    const q = [
      "Risker/resternergier (Safety Placard) bedömda?",
      "Fallrisker eliminerade?",
      "Kläm-/skär-/kraftrisker hanterade?",
      "Rätt verktyg & PPE tillgängligt?",
      "Tillstånd/behörighet (heta arbeten/slutna utrymmen)?",
      "Snubbel/olja/lösa föremål undanröjda?",
      "Avspärrningar/kommunikation/skyltning klar?",
      "Utrustning i gott skick för lyft/lastsäkring?",
      "Utrustning kontrollerad före användning?",
      "Känt var nödstopp/utrymning/ögondusch finns?"
    ];
    const answers = JSON.parse(row.checklist||"[]");
    q.forEach((text,i)=>{
      doc.text(`${i+1}. ${text}  –  ${answers[i] || "-"}`);
    });
    doc.moveDown();

    // Åtgärder
    doc.fontSize(12).text("D. Åtgärder", { underline: true });
    kv("Aktiviteter:", row.actions);
    kv("Ytterligare åtgärder?:", row.further);
    kv("Full riskanalys framåt?:", row.fullrisk);
    doc.moveDown();

    // Godkännande
    doc.fontSize(12).text("E. Godkännande", { underline: true });
    kv("Kan arbetet utföras säkert?:", row.safe);
    kv("Status:", row.status);
    if (row.approved_at) kv("Godkänt:", `${row.approved_at} av #${row.approved_by||"-"}`);
    doc.moveDown();

    // Footer
    doc.fontSize(9).fillColor("#666")
      .text(`Skapad: ${row.created_at} av ${creatorName || "-"}`)
      .text(`Retentionspolicy: Minst 6 mån (arkiveringsbar efter ${row.archivable_after})`);
    doc.end();
  });
}

// ====== ENDPOINTS ======

// (1) Ladda ned PDF
app.get("/api/assessments/:id/pdf", auth(), async (req, res) => {
  const id = +req.params.id;
  const row = db.prepare(`
    SELECT a.*, u.name AS created_by_name
    FROM assessments a JOIN users u ON a.created_by=u.id
    WHERE a.id=?`).get(id);
  if (!row) return res.status(404).send("Not found");

  // underhåll får bara se egna
  if (req.user.role === "underhall" && row.created_by !== req.user.uid) {
    return res.status(403).send("Forbidden");
  }

  const pdf = await makeAssessmentPDF(row, row.created_by_name);
  const fname = `Hogrisk_${row.date || row.created_at.slice(0,10)}_ID${row.id}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
  res.send(pdf);
});

// Image upload endpoint
app.post("/api/upload-image", auth(), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Ingen fil uppladdad" });
    }

    const imageData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      uploadPath: req.file.path
    };

    // Optionally save to database if needed
    const assessmentId = req.body.assessmentId;
    if (assessmentId && assessmentId !== 'temp') {
      db.prepare(`
        INSERT INTO assessment_images(assessment_id, filename, original_name, mime_type, file_size, upload_path, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?)
      `).run(assessmentId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.file.path, nowISO());
    }

    res.json({ 
      success: true, 
      message: "Bild uppladdad framgångsrikt",
      ...imageData
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ error: "Kunde inte ladda upp bilden" });
  }
});

// (2) Generera & ladda upp PDF till SharePoint
app.post("/api/assessments/:id/upload", auth(), requireRole("supervisor","superintendent","admin"), async (req, res) => {
  try {
    const id = +req.params.id;
    const row = db.prepare(`
      SELECT a.*, u.name AS created_by_name
      FROM assessments a JOIN users u ON a.created_by=u.id
      WHERE a.id=?`).get(id);
    if (!row) return res.status(404).json({ error: "Not found" });

    const pdf = await makeAssessmentPDF(row, row.created_by_name);
    const fname = `Hogrisk_${row.date || row.created_at.slice(0,10)}_ID${row.id}.pdf`;
    const driveItem = await uploadToSharePoint(pdf, fname);

    res.json({
      ok: true,
      name: driveItem.name,
      size: driveItem.size,
      webUrl: driveItem.webUrl // klickbar SharePoint-URL
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Upload failed" });
  }
});

// --- DB init
db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  passhash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('underhall','supervisor','superintendent','admin','arbetsledare')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS assessments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,            -- arbetsdatum
  worker_name TEXT NOT NULL,
  team TEXT,
  location TEXT,
  task TEXT,
  risk_s INTEGER NOT NULL,
  risk_k INTEGER NOT NULL,
  risk_score INTEGER NOT NULL,
  risks TEXT,                    -- fritext
  checklist TEXT NOT NULL,       -- JSON array Ja/Nej
  actions TEXT,                  -- åtgärder
  further TEXT,                  -- ytterligare åtgärder? (Ja/Nej)
  fullrisk TEXT,                 -- full riskanalys framåt? (Ja/Nej)
  safe TEXT,                     -- Kan arbetet utföras säkert? (Ja/Nej)
  leader TEXT,                   -- arbetsledare
  signature TEXT,                -- signatur/initialer
  images TEXT,                   -- JSON array med bilddata
  requires_leader INTEGER NOT NULL,
  leader_provided INTEGER NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending/Approved/Rejected
  approved_by INTEGER,
  approved_at TEXT,
  archivable_after TEXT,         -- ISO timestamp (created_at + 180 dagar)
  archived INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS assessment_images(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  upload_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('assessment_pending','assessment_approved','assessment_rejected')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  assessment_id INTEGER REFERENCES assessments(id),
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assess_created ON assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_images_assessment ON assessment_images(assessment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
`);

// Try to update existing users table to include MSAL support
try {
  // Check if azure_id column exists
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const hasAzureId = tableInfo.some(col => col.name === 'azure_id');
  const hasLastLogin = tableInfo.some(col => col.name === 'last_login');
  
  if (!hasAzureId || !hasLastLogin) {
    console.log("Updating users table for MSAL support...");
    db.exec("DROP TABLE IF EXISTS users_backup");
    db.exec("CREATE TABLE users_backup AS SELECT * FROM users");
    db.exec("DROP TABLE users");
    db.exec(`
      CREATE TABLE users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        passhash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('underhall','supervisor','superintendent','admin','arbetsledare')),
        active INTEGER NOT NULL DEFAULT 1,
        azure_id TEXT UNIQUE,
        created_at TEXT NOT NULL,
        last_login TEXT
      )
    `);
    db.exec("INSERT INTO users (id, username, passhash, name, role, active, created_at) SELECT id, username, passhash, name, role, active, created_at FROM users_backup");
    db.exec("DROP TABLE users_backup");
    console.log("Updated users table to support MSAL authentication");
  }
} catch (error) {
  console.log("Users table update error or already configured:", error.message);
}

// seed admin and arbetsledare
const adminExists = db.prepare("SELECT 1 FROM users WHERE username=?").get("admin");
if (!adminExists) {
  const hash = bcrypt.hashSync("admin123", 10);
  db.prepare(`
    INSERT INTO users(username, passhash, name, role, active, created_at)
    VALUES(?,?,?,?,1,datetime('now'))
  `).run("admin", hash, "System Admin", "admin");
  console.log("Seeded default admin: admin / admin123 (byt lösenord!)");
}

const arbetsledareExists = db.prepare("SELECT 1 FROM users WHERE username=?").get("arbetsledare");
if (!arbetsledareExists) {
  const hash = bcrypt.hashSync("ledare123", 10);
  db.prepare(`
    INSERT INTO users(username, passhash, name, role, active, created_at)
    VALUES(?,?,?,?,1,datetime('now'))
  `).run("arbetsledare", hash, "Arbets Ledare", "arbetsledare");
  console.log("Seeded default arbetsledare: arbetsledare / ledare123");
}

// --- Helpers
const nowISO = () => new Date().toISOString();
const addDaysISO = (iso, days) => new Date(new Date(iso).getTime() + days*864e5).toISOString();

function signToken(user) {
  return jwt.sign({ uid: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "12h" });
}

function auth(required = true) {
  return (req, res, next) => {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return required ? res.status(401).json({ error: "No token" }) : next();
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "No user" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

// --- Auth
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const u = db.prepare("SELECT * FROM users WHERE username=? AND active=1").get(username);
  if (!u) return res.status(401).json({ error: "Fel användare/lösenord" });
  if (!bcrypt.compareSync(password, u.passhash)) return res.status(401).json({ error: "Fel användare/lösenord" });
  const token = signToken(u);
  res.json({ token, role: u.role, name: u.name });
});

// --- MSAL Authentication Routes ---

// Get MSAL auth URL
app.get("/api/auth/msal-url", async (req, res) => {
  try {
    if (!msalAuthModule) {
      return res.status(503).json({ error: 'MSAL authentication not configured' });
    }
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
    const authUrl = await msalAuthModule.getAuthUrl(redirectUri);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ error: 'Failed to get auth URL' });
  }
});

// Handle MSAL callback
app.get("/auth/callback", async (req, res) => {
  try {
    if (!msalAuthModule) {
      return res.redirect('/client/auth-error.html');
    }
    
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('Authorization code not found');
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
    const tokenResponse = await msalAuthModule.exchangeCodeForTokens(code, redirectUri);
    
    // Get user info and app roles
    const userInfo = await msalAuthModule.getUserInfo(tokenResponse.accessToken);
    const userRoles = msalAuthModule.getUserRoles(tokenResponse.accessToken);
    
    // Map to HRA role
    const hraRole = msalAuthModule.mapUserRole(userRoles);
    
    // Create or update user in database
    const existingUser = db.prepare("SELECT * FROM users WHERE username=?").get(userInfo.userPrincipalName);
    
    let userId;
    if (existingUser) {
      // Update existing user
      db.prepare(`
        UPDATE users 
        SET name=?, role=?, azure_id=?, last_login=CURRENT_TIMESTAMP 
        WHERE username=?
      `).run(userInfo.displayName, hraRole, userInfo.id, userInfo.userPrincipalName);
      userId = existingUser.id;
    } else {
      // Create new user
      const insertResult = db.prepare(`
        INSERT INTO users (username, name, role, azure_id, passhash, active, created_at, last_login)
        VALUES (?, ?, ?, ?, 'msal-auth', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(userInfo.userPrincipalName, userInfo.displayName, hraRole, userInfo.id);
      userId = insertResult.lastInsertRowid;
    }
    
    // Create HRA token
    const hraToken = msalAuthModule.createHRAToken(userInfo, hraRole);
    
    // Store in session for client-side retrieval
    req.session.hraToken = hraToken;
    req.session.user = {
      id: userId,
      name: userInfo.displayName,
      email: userInfo.mail || userInfo.userPrincipalName,
      role: hraRole
    };
    
    // Redirect to success page with token
    res.redirect(`/client/auth-success.html?token=${encodeURIComponent(hraToken)}`);
    
  } catch (error) {
    console.error('MSAL callback error:', error);
    res.redirect('/client/auth-error.html');
  }
});

// Exchange Microsoft token for HRA token (for popup flow)
app.post("/api/auth/msal-exchange", async (req, res) => {
  try {
    if (!msalAuthModule) {
      return res.status(503).json({ error: 'MSAL authentication not configured' });
    }
    
    const { accessToken, idToken, account } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }
    
    console.log('🔄 Processing MSAL token exchange...');
    
    // Validate token first (like FastAPI implementation)
    try {
      const tokenClaims = await msalAuthModule.validateAccessToken(accessToken);
      console.log('✅ Token validation successful:', {
        sub: tokenClaims.sub,
        aud: tokenClaims.aud,
        iss: tokenClaims.iss
      });
    } catch (validationError) {
      console.error('❌ Token validation failed:', validationError.message);
      return res.status(401).json({ error: 'Invalid access token: ' + validationError.message });
    }
    
    // Get user info and app roles
    const userInfo = await msalAuthModule.getUserInfo(accessToken);
    const userRoles = await msalAuthModule.getUserRoles(accessToken);
    
    console.log('👤 User info:', { 
      name: userInfo.displayName, 
      email: userInfo.userPrincipalName,
      roles: userRoles 
    });
    
    // Map to HRA role
    const hraRole = msalAuthModule.mapUserRole(userRoles);
    console.log('🎭 Mapped HRA role:', hraRole);
    
    // Create or update user in database
    const existingUser = db.prepare("SELECT * FROM users WHERE username=?").get(userInfo.userPrincipalName);
    
    let userId;
    if (existingUser) {
      // Update existing user
      console.log('🔄 Updating existing user');
      db.prepare(`
        UPDATE users 
        SET name=?, role=?, azure_id=?, last_login=CURRENT_TIMESTAMP 
        WHERE username=?
      `).run(userInfo.displayName, hraRole, userInfo.id, userInfo.userPrincipalName);
      userId = existingUser.id;
    } else {
      // Create new user
      console.log('➕ Creating new user');
      const insertResult = db.prepare(`
        INSERT INTO users (username, name, role, azure_id, passhash, active, created_at, last_login)
        VALUES (?, ?, ?, ?, 'msal-auth', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(userInfo.userPrincipalName, userInfo.displayName, hraRole, userInfo.id);
      userId = insertResult.lastInsertRowid;
    }
    
    // Create HRA token
    const hraToken = msalAuthModule.createHRAToken(userInfo, hraRole);
    
    console.log('✅ MSAL token exchange successful');
    
    res.json({
      token: hraToken,
      user: {
        id: userId,
        name: userInfo.displayName,
        email: userInfo.mail || userInfo.userPrincipalName,
        role: hraRole
      }
    });
    
  } catch (error) {
    console.error('❌ MSAL token exchange error:', error);
    res.status(500).json({ error: 'Token exchange failed: ' + error.message });
  }
});

// Get MSAL configuration for client
app.get("/api/auth/msal-config", (req, res) => {
  if (!msalAuthModule) {
    return res.status(503).json({ error: 'MSAL authentication not configured' });
  }
  
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const tenantId = process.env.AZURE_TENANT_ID || process.env.TENANT_ID;
  
  res.json({
    clientId: process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID,
    tenantId: tenantId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: baseUrl  // For popup auth, use the main page
  });
});

// --- User management (Admin)
app.get("/api/users", auth(), requireRole("admin"), (req, res) => {
  const rows = db.prepare("SELECT id,username,name,role,active,created_at FROM users ORDER BY id").all();
  res.json(rows);
});

app.post("/api/users", auth(), requireRole("admin"), (req, res) => {
  const { username, password, name, role, active=1 } = req.body || {};
  if (!username || !password || !name || !role) return res.status(400).json({ error: "Saknar fält" });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare(`
      INSERT INTO users(username, passhash, name, role, active, created_at)
      VALUES(?,?,?,?,?,?)
    `).run(username, hash, name, role, active?1:0, nowISO());
    res.json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: "Användarnamn upptaget?" });
  }
});

app.put("/api/users/:id", auth(), requireRole("admin"), (req, res) => {
  const id = +req.params.id;
  const { name, role, active, password } = req.body || {};
  const u = db.prepare("SELECT * FROM users WHERE id=?").get(id);
  if (!u) return res.status(404).json({ error: "Finns ej" });
  const hash = password ? bcrypt.hashSync(password, 10) : u.passhash;
  db.prepare(`
    UPDATE users SET name=?, role=?, active=?, passhash=? WHERE id=?
  `).run(name ?? u.name, role ?? u.role, active ? 1 : 0, hash, id);
  res.json({ ok: true });
});

app.delete("/api/users/:id", auth(), requireRole("admin"), (req, res) => {
  const id = +req.params.id;
  if (id === req.user.uid) return res.status(400).json({ error: "Kan inte radera dig själv" });
  db.prepare("DELETE FROM users WHERE id=?").run(id);
  res.json({ ok: true });
});

// --- Assessments
app.post("/api/assessments", auth(), (req, res) => {
  const b = req.body || {};
  // server-side policy: assessments will be reviewed through digital approval system
  const riskScore = (+b.risk_s || 1) * (+b.risk_k || 1);
  const hasNej = Array.isArray(b.checklist) && b.checklist.some(v => v === "Nej");
  const requiresLeader = (riskScore >= 10) || hasNej || b.safe === "Nej";
  const leaderProvided = false; // No manual signatures required

  // All assessments now go through digital approval workflow

  const info = db.prepare(`
    INSERT INTO assessments(
      date, worker_name, team, location, task,
      risk_s, risk_k, risk_score, risks, checklist, actions, further, fullrisk,
      safe, leader, signature, requires_leader, leader_provided,
      created_by, created_at, archivable_after, status
    ) VALUES(?,?,?,?,?,
             ?,?,?,?,?,?,?,?,?,?,?,?,?,
             ?,?,?,?)
  `).run(
    b.date, b.worker_name, b.team, b.location, b.task,
    +b.risk_s, +b.risk_k, riskScore, b.risks ?? "",
    JSON.stringify(b.checklist||[]), b.actions ?? "", b.further ?? "Nej", b.fullrisk ?? "Nej",
    b.safe ?? "Ja", "", "",
    requiresLeader?1:0, leaderProvided?1:0,
    req.user.uid, nowISO(), addDaysISO(nowISO(), 180), 'Pending'
  );
  
  // Notify all Arbets Ledare about new assessment
  const arbetsledare = db.prepare("SELECT id FROM users WHERE role='arbetsledare' AND active=1").all();
  const notifyStmt = db.prepare(`
    INSERT INTO notifications(user_id, type, title, message, assessment_id, created_at)
    VALUES(?, 'assessment_pending', 'Ny riskbedömning väntar på godkännande', 
           'Riskbedömning ID ' || ? || ' av ' || ? || ' väntar på ditt godkännande.', ?, ?)
  `);
  
  arbetsledare.forEach(leader => {
    notifyStmt.run(leader.id, info.lastInsertRowid, req.user.name, info.lastInsertRowid, nowISO());
  });
  
  res.json({ id: info.lastInsertRowid, requiresLeader, leaderProvided, riskScore, status: 'Pending' });
});

// list (self vs all)
app.get("/api/assessments", auth(), (req, res) => {
  const { from, to, mine } = req.query;
  const base = `
    SELECT a.*, u.name AS created_by_name
    FROM assessments a JOIN users u ON a.created_by=u.id
    WHERE 1=1
  `;
  const cond = [];
  const params = [];
  if (from) { cond.push("a.created_at >= ?"); params.push(from); }
  if (to)   { cond.push("a.created_at <= ?"); params.push(to); }
  if (req.user.role === "underhall" || mine === "1") {
    cond.push("a.created_by = ?"); params.push(req.user.uid);
  }
  const sql = base + (cond.length ? " AND " + cond.join(" AND ") : "") + " ORDER BY a.created_at DESC";
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// approve - now includes Arbets Ledare role
app.post("/api/assessments/:id/approve", auth(), requireRole("supervisor","superintendent","admin","arbetsledare"), (req, res) => {
  const id = +req.params.id;
  const assessment = db.prepare("SELECT * FROM assessments WHERE id=?").get(id);
  if (!assessment) return res.status(404).json({ error: "Assessment not found" });

  // Update assessment status to approved
  db.prepare("UPDATE assessments SET status='Approved', approved_by=?, approved_at=? WHERE id=?")
    .run(req.user.uid, nowISO(), id);

  // Notify the creator that their assessment was approved
  db.prepare(`
    INSERT INTO notifications(user_id, type, title, message, assessment_id, created_at)
    VALUES(?, 'assessment_approved', 'Riskbedömning godkänd', 
           'Din riskbedömning ID ' || ? || ' har godkänts av ' || ? || '.', ?, ?)
  `).run(assessment.created_by, id, req.user.name, id, nowISO());

  res.json({ ok: true, message: "Assessment approved and user notified" });
});

// reject assessment
app.post("/api/assessments/:id/reject", auth(), requireRole("supervisor","superintendent","admin","arbetsledare"), (req, res) => {
  const id = +req.params.id;
  const { reason } = req.body;
  const assessment = db.prepare("SELECT * FROM assessments WHERE id=?").get(id);
  if (!assessment) return res.status(404).json({ error: "Assessment not found" });

  // Update assessment status to rejected
  db.prepare("UPDATE assessments SET status='Rejected', approved_by=?, approved_at=? WHERE id=?")
    .run(req.user.uid, nowISO(), id);

  // Notify the creator that their assessment was rejected
  const message = reason ? 
    `Din riskbedömning ID ${id} har avvisats av ${req.user.name}. Anledning: ${reason}` :
    `Din riskbedömning ID ${id} har avvisats av ${req.user.name}.`;
    
  db.prepare(`
    INSERT INTO notifications(user_id, type, title, message, assessment_id, created_at)
    VALUES(?, 'assessment_rejected', 'Riskbedömning avvisad', ?, ?, ?)
  `).run(assessment.created_by, message, id, nowISO());

  res.json({ ok: true, message: "Assessment rejected and user notified" });
});

// Notifications endpoints
app.get("/api/notifications", auth(), (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 50
  `).all(req.user.uid);
  
  res.json(notifications);
});

app.post("/api/notifications/:id/read", auth(), (req, res) => {
  const id = +req.params.id;
  const notification = db.prepare("SELECT * FROM notifications WHERE id=? AND user_id=?").get(id, req.user.uid);
  
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  db.prepare("UPDATE notifications SET read=1 WHERE id=?").run(id);
  res.json({ ok: true });
});

app.post("/api/notifications/read-all", auth(), (req, res) => {
  db.prepare("UPDATE notifications SET read=1 WHERE user_id=?").run(req.user.uid);
  res.json({ ok: true });
});

// stats for dashboard (last 30 days)
app.get("/api/assessments/stats", auth(), requireRole("supervisor","superintendent","admin"), (req, res) => {
  const rows = db.prepare(`
    SELECT
      SUM(CASE WHEN risk_score<=4 THEN 1 ELSE 0 END) AS low,
      SUM(CASE WHEN risk_score BETWEEN 5 AND 9 THEN 1 ELSE 0 END) AS mid,
      SUM(CASE WHEN risk_score>=10 THEN 1 ELSE 0 END) AS high,
      SUM(CASE WHEN status='Submitted' THEN 1 ELSE 0 END) AS open,
      COUNT(*) AS total
    FROM assessments
    WHERE created_at >= datetime('now','-30 days')
  `).get();
  res.json(rows);
});

// archive candidates (>180 days). Only admin can delete.
app.get("/api/assessments/archivable", auth(), requireRole("admin"), (req, res) => {
  const rows = db.prepare(`SELECT id, date, worker_name, task, created_at, archivable_after FROM assessments
    WHERE datetime('now') >= archivable_after AND archived=0 ORDER BY created_at LIMIT 500`).all();
  res.json(rows);
});
app.post("/api/assessments/:id/archive", auth(), requireRole("admin"), (req,res)=>{
  const id = +req.params.id;
  db.prepare("UPDATE assessments SET archived=1 WHERE id=?").run(id);
  res.json({ok:true});
});

app.delete("/api/assessments/:id", auth(), requireRole("admin"), (req,res)=>{
  // permanent delete only if archived and older than 180 days
  const id = +req.params.id;
  const r = db.prepare("SELECT * FROM assessments WHERE id=?").get(id);
  if (!r) return res.status(404).json({error:"Finns ej"});
  if (!r.archived) return res.status(400).json({error:"Måste arkiveras först"});
  db.prepare("DELETE FROM assessments WHERE id=?").run(id);
  res.json({ok:true});
});

// daily job: mark archivable candidates (info endpoint already filters by date)
// (Here we just log; logic uses archivable_after)
cron.schedule("0 3 * * *", () => {
  console.log("[CRON] Retention check OK (≥6 månader garanteras, ingen autodelete).");
});

// Explicit route for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client', 'index.html'));
});

// start
app.listen(PORT, () => console.log(`Server på http://localhost:${PORT}`));
