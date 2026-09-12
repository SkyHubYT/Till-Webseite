require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const IS_PROD = process.env.NODE_ENV === 'production';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data');

fs.mkdirSync(DATA_DIR, { recursive: true });

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin-user.json');

const DEFAULT_SETTINGS = {
  siteTitle: 'Till Gaming & Dev',
  youtubeUrl: 'https://www.youtube.com/',
  contactEmail: process.env.CONTACT_TO || 'tillscheidegget@gmail.com',
  supportAmounts: [5, 10, 20],
  heroText: 'Minecraft, Gaming, Entwicklung und kreative Projekte.'
};

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false }));

if (!process.env.SESSION_SECRET) {
  console.warn('WARNUNG: SESSION_SECRET fehlt. Vor echtem Online-Betrieb unbedingt setzen.');
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'development-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: 1000 * 60 * 60 * 8
  }
}));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Nachrichten. Bitte versuche es später erneut.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Login-Versuche. Bitte versuche es später erneut.' }
});

function clean(v, max) {
  return String(v || '').trim().slice(0, max);
}

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function ensureSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    writeJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  }
}

function getSettings() {
  ensureSettings();
  return readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
}

async function ensureAdmin() {
  if (fs.existsSync(ADMIN_FILE)) return;

  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error('ADMIN_PASSWORD fehlt. Bitte als Umgebungsvariable setzen.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  writeJson(ADMIN_FILE, { username, passwordHash });
  console.log('Admin-Konto wurde initial erstellt.');
}

function requireAdmin(req, res, next) {
  if (req.session?.admin === true) return next();
  return res.status(401).json({ error: 'Nicht angemeldet.' });
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Clean URLs
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/kontakt', (req, res) => res.sendFile(path.join(__dirname, 'kontakt.html')));
app.get('/projekte', (req, res) => res.sendFile(path.join(__dirname, 'projekte.html')));
app.get('/unterstuetzen', (req, res) => res.sendFile(path.join(__dirname, 'shop.html')));
app.get('/impressum', (req, res) => res.sendFile(path.join(__dirname, 'impressum.html')));

// Public settings
app.get('/api/settings', (req, res) => {
  const s = getSettings();
  res.json({
    siteTitle: s.siteTitle,
    youtubeUrl: s.youtubeUrl,
    contactEmail: s.contactEmail,
    supportAmounts: s.supportAmounts,
    heroText: s.heroText
  });
});

// Contact form
app.post('/api/contact', contactLimiter, async (req, res) => {
  const name = clean(req.body.name, 100);
  const email = clean(req.body.email, 200);
  const subject = clean(req.body.subject, 160);
  const message = clean(req.body.message, 5000);
  const privacyConsent = req.body.privacyConsent === true;

  if (!name || !email || !subject || !message || !privacyConsent) {
    return res.status(400).json({ error: 'Bitte alle Pflichtfelder ausfüllen.' });
  }

  if (!validEmail(email)) {
    return res.status(400).json({ error: 'Bitte eine gültige E-Mail-Adresse eingeben.' });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ error: 'Der Mailversand ist noch nicht eingerichtet.' });
  }

  try {
    const settings = getSettings();

    await transporter.sendMail({
      from: `"Till Website" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: settings.contactEmail || process.env.CONTACT_TO,
      replyTo: email,
      subject: `[Website] ${subject}`,
      text:
`Neue Kontaktanfrage über die Webseite

Name: ${name}
E-Mail: ${email}
Betreff: ${subject}

Nachricht:
${message}
`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto">
          <h2>Neue Kontaktanfrage über deine Webseite</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>E-Mail:</strong> ${escapeHtml(email)}</p>
          <p><strong>Betreff:</strong> ${escapeHtml(subject)}</p>
          <hr>
          <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        </div>
      `
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ error: 'Die Nachricht konnte gerade nicht gesendet werden.' });
  }
});

// Admin auth
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const username = clean(req.body.username, 80);
  const password = String(req.body.password || '');
  const admin = readJson(ADMIN_FILE, null);

  if (!admin) {
    return res.status(500).json({ error: 'Admin-Konto fehlt.' });
  }

  const okUser = username === admin.username;
  const okPass = okUser && await bcrypt.compare(password, admin.passwordHash);

  if (!okPass) {
    return res.status(401).json({ error: 'Benutzername oder Passwort falsch.' });
  }

  req.session.admin = true;
  req.session.adminUser = admin.username;
  res.json({ ok: true });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/admin/me', (req, res) => {
  res.json({
    authenticated: req.session?.admin === true,
    username: req.session?.adminUser || null
  });
});

app.get('/api/admin/settings', requireAdmin, (req, res) => {
  res.json({ settings: getSettings() });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const siteTitle = clean(req.body.siteTitle, 120);
  const heroText = clean(req.body.heroText, 300);
  const youtubeUrl = clean(req.body.youtubeUrl, 500);
  const contactEmail = clean(req.body.contactEmail, 200);
  const amounts = Array.isArray(req.body.supportAmounts)
    ? req.body.supportAmounts.map(Number)
    : [];

  if (
    !siteTitle ||
    !heroText ||
    !youtubeUrl ||
    !validEmail(contactEmail) ||
    amounts.length !== 3 ||
    amounts.some(v => !Number.isFinite(v) || v < 1 || v > 10000)
  ) {
    return res.status(400).json({ error: 'Ungültige Einstellungen.' });
  }

  const settings = {
    siteTitle,
    heroText,
    youtubeUrl,
    contactEmail,
    supportAmounts: amounts
  };

  writeJson(SETTINGS_FILE, settings);
  res.json({ ok: true, settings });
});

app.put('/api/admin/password', requireAdmin, async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');

  if (newPassword.length < 8) {
    return res.status(400).json({
      error: 'Das neue Passwort muss mindestens 8 Zeichen haben.'
    });
  }

  const admin = readJson(ADMIN_FILE, null);
  if (!admin) {
    return res.status(500).json({ error: 'Admin-Konto fehlt.' });
  }

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Aktuelles Passwort ist falsch.' });
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  writeJson(ADMIN_FILE, admin);

  res.json({ ok: true });
});

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, env: IS_PROD ? 'production' : 'development' });
});

app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
  maxAge: IS_PROD ? '1h' : 0
}));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Nicht gefunden.' });
  }
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

Promise.resolve()
  .then(ensureSettings)
  .then(ensureAdmin)
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Till Website läuft auf ${HOST}:${PORT}`);
      console.log(`Modus: ${IS_PROD ? 'production' : 'development'}`);
      console.log(`Datenordner: ${DATA_DIR}`);
    });
  })
  .catch(err => {
    console.error('Server konnte nicht gestartet werden:', err.message);
    process.exit(1);
  });
