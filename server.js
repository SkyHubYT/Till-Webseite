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
const PAYMENT_ENABLED = String(process.env.PAYMENT_ENABLED || 'false') === 'true';

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin-user.json');

const DEFAULT_SETTINGS = {
  siteTitle: 'Till Gaming & Dev',
  youtubeUrl: 'https://www.youtube.com/',
  contactEmail: process.env.CONTACT_TO || 'contact@example.com',
  supportAmounts: [5, 10, 20],
  heroText: 'Minecraft, Gaming, Entwicklung und kreative Projekte.',
  maintenanceMode: false
};

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], fontSrc: ["'self'"], objectSrc: ["'none'"],
      baseUri: ["'self'"], frameAncestors: ["'none'"]
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: 'till.sid',
  secret: process.env.SESSION_SECRET || 'development-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: IS_PROD, maxAge: 1000 * 60 * 60 * 8 }
}));

function clean(v, max) { return String(v || '').trim().slice(0, max); }
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }
function ensureSettings() { if (!fs.existsSync(SETTINGS_FILE)) writeJson(SETTINGS_FILE, DEFAULT_SETTINGS); }
function getSettings() { ensureSettings(); return { ...DEFAULT_SETTINGS, ...readJson(SETTINGS_FILE, DEFAULT_SETTINGS) }; }

app.use((req, res, next) => {
  const pathname = req.path;
  const allowed = pathname === '/maintenance' || pathname === '/maintenance.html' || pathname === '/admin' || pathname === '/admin.html' || pathname === '/admin.js' || pathname === '/style.css' || pathname === '/health' || pathname.startsWith('/assets/') || pathname.startsWith('/api/admin/');
  if (allowed || req.session?.admin === true) return next();
  if (!getSettings().maintenanceMode) return next();
  if (pathname.startsWith('/api/')) return res.status(503).json({ error: 'Die Webseite befindet sich aktuell im Wartungsmodus.', maintenance: true });
  return res.redirect(302, '/maintenance');
});

const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Zu viele Nachrichten. Bitte versuche es später erneut.' } });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, standardHeaders: true, legacyHeaders: false, message: { error: 'Zu viele Login-Versuche. Bitte versuche es später erneut.' } });
const paymentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 12, standardHeaders: true, legacyHeaders: false, message: { error: 'Zu viele Zahlungsanfragen. Bitte versuche es später erneut.' } });

async function ensureAdmin() {
  if (fs.existsSync(ADMIN_FILE)) return;
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('ADMIN_PASSWORD fehlt. Bitte als Umgebungsvariable setzen.');
  writeJson(ADMIN_FILE, { username, passwordHash: await bcrypt.hash(password, 12) });
}
function requireAdmin(req, res, next) { if (req.session?.admin === true) return next(); return res.status(401).json({ error: 'Nicht angemeldet.' }); }

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
function getBaseUrl(req) {
  const configured = clean(process.env.PUBLIC_BASE_URL, 500);
  if (configured && /^https?:\/\//i.test(configured)) return configured.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}
function escapeHtml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }

async function sendContactViaResend({ to, name, email, subject, message }) {
  if (!process.env.RESEND_API_KEY) return false;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM || 'Till Website <onboarding@resend.dev>', to: [to], reply_to: email, subject: `[Website] ${subject}`, text: `Neue Kontaktanfrage\n\nName: ${name}\nE-Mail: ${email}\nBetreff: ${subject}\n\nNachricht:\n${message}`, html: `<div><h2>Neue Kontaktanfrage</h2><p>${escapeHtml(name)}</p><p>${escapeHtml(email)}</p><p>${escapeHtml(subject)}</p><p>${escapeHtml(message)}</p></div>` })
  });
  if (!response.ok) throw new Error('Resend konnte die Nachricht nicht versenden.');
  return true;
}
async function sendContactViaSmtp({ to, name, email, subject, message }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return false;
  await transporter.sendMail({ from: `"Till Website" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`, to, replyTo: email, subject: `[Website] ${subject}`, text: message });
  return true;
}

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/maintenance', (req, res) => res.sendFile(path.join(__dirname, 'maintenance.html')));
app.get('/kontakt', (req, res) => res.sendFile(path.join(__dirname, 'kontakt.html')));
app.get('/projekte', (req, res) => res.sendFile(path.join(__dirname, 'projekte.html')));
app.get('/unterstuetzen', (req, res) => res.sendFile(path.join(__dirname, 'shop.html')));
app.get('/impressum', (req, res) => res.sendFile(path.join(__dirname, 'impressum.html')));
app.get('/zahlung-erfolgreich', (req, res) => res.sendFile(path.join(__dirname, 'payment-success.html')));

app.get('/api/settings', (req, res) => { const s = getSettings(); res.json({ ...s, maintenanceMode: Boolean(s.maintenanceMode) }); });
app.get('/api/contact/status', (req, res) => res.json({ enabled: Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) }));
app.get('/api/payment/status', (req, res) => res.json({ enabled: PAYMENT_ENABLED && Boolean(process.env.STRIPE_SECRET_KEY), provider: 'stripe', currency: 'CHF', methods: ['card', 'twint'] }));

app.post('/api/payment/create-checkout-session', paymentLimiter, async (req, res) => {
  if (!PAYMENT_ENABLED || !process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Online-Zahlungen sind noch nicht vollständig eingerichtet.' });
  const amount = Number(req.body.amount);
  if (req.body.consent !== true || !Number.isFinite(amount) || amount < 1 || amount > 200) return res.status(400).json({ error: 'Ungültige Zahlungsanfrage.' });
  const baseUrl = getBaseUrl(req);
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', `${baseUrl}/zahlung-erfolgreich?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${baseUrl}/unterstuetzen?payment=cancelled`);
  params.set('payment_method_types[0]', 'card'); params.set('payment_method_types[1]', 'twint');
  params.set('line_items[0][price_data][currency]', 'chf'); params.set('line_items[0][price_data][product_data][name]', 'Freiwillige Projekt-Unterstützung');
  params.set('line_items[0][price_data][unit_amount]', String(Math.round(amount * 100))); params.set('line_items[0][quantity]', '1');
  try {
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
    const data = await stripeResponse.json();
    if (!stripeResponse.ok || !data.url) return res.status(502).json({ error: 'Die Zahlungsseite konnte gerade nicht erstellt werden.' });
    res.json({ url: data.url });
  } catch { res.status(502).json({ error: 'Der Zahlungsanbieter ist gerade nicht erreichbar.' }); }
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const name = clean(req.body.name, 100), email = clean(req.body.email, 200), subject = clean(req.body.subject, 160), message = clean(req.body.message, 5000);
  if (!name || !validEmail(email) || !subject || !message || req.body.privacyConsent !== true) return res.status(400).json({ error: 'Bitte alle Pflichtfelder korrekt ausfüllen.' });
  const to = getSettings().contactEmail || process.env.CONTACT_TO;
  try {
    let sent = false;
    if (process.env.RESEND_API_KEY) { try { sent = await sendContactViaResend({ to, name, email, subject, message }); } catch {} }
    if (!sent) { try { sent = await sendContactViaSmtp({ to, name, email, subject, message }); } catch {} }
    if (!sent) return res.status(503).json({ error: 'Der Mailversand ist noch nicht eingerichtet.', fallbackEmail: to });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Die Nachricht konnte gerade nicht gesendet werden.', fallbackEmail: to }); }
});

app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const admin = readJson(ADMIN_FILE, null);
  const ok = admin && clean(req.body.username, 80) === admin.username && await bcrypt.compare(String(req.body.password || ''), admin.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Benutzername oder Passwort falsch.' });
  req.session.regenerate(err => { if (err) return res.status(500).json({ error: 'Login konnte nicht abgeschlossen werden.' }); req.session.admin = true; req.session.adminUser = admin.username; res.json({ ok: true }); });
});
app.post('/api/admin/logout', requireAdmin, (req, res) => req.session.destroy(() => { res.clearCookie('till.sid'); res.json({ ok: true }); }));
app.get('/api/admin/me', (req, res) => res.json({ authenticated: req.session?.admin === true, username: req.session?.adminUser || null }));
app.get('/api/admin/settings', requireAdmin, (req, res) => res.json({ settings: getSettings() }));
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const current = getSettings();
  const settings = {
    siteTitle: clean(req.body.siteTitle, 120), heroText: clean(req.body.heroText, 300), youtubeUrl: clean(req.body.youtubeUrl, 500),
    contactEmail: clean(req.body.contactEmail, 200), supportAmounts: Array.isArray(req.body.supportAmounts) ? req.body.supportAmounts.map(Number) : [],
    maintenanceMode: typeof req.body.maintenanceMode === 'boolean' ? req.body.maintenanceMode : Boolean(current.maintenanceMode)
  };
  if (!settings.siteTitle || !settings.heroText || !settings.youtubeUrl || !validEmail(settings.contactEmail) || settings.supportAmounts.length !== 3 || settings.supportAmounts.some(v => !Number.isFinite(v) || v < 1 || v > 200)) return res.status(400).json({ error: 'Ungültige Einstellungen.' });
  writeJson(SETTINGS_FILE, settings); res.json({ ok: true, settings });
});
app.put('/api/admin/maintenance', requireAdmin, (req, res) => { const settings = getSettings(); settings.maintenanceMode = req.body.enabled === true; writeJson(SETTINGS_FILE, settings); res.json({ ok: true, enabled: settings.maintenanceMode }); });
app.put('/api/admin/password', requireAdmin, async (req, res) => {
  const admin = readJson(ADMIN_FILE, null), currentPassword = String(req.body.currentPassword || ''), newPassword = String(req.body.newPassword || '');
  if (!admin || newPassword.length < 12 || !await bcrypt.compare(currentPassword, admin.passwordHash)) return res.status(400).json({ error: 'Passwort konnte nicht geändert werden.' });
  admin.passwordHash = await bcrypt.hash(newPassword, 12); writeJson(ADMIN_FILE, admin); res.json({ ok: true });
});

app.get('/health', (req, res) => { const settings = getSettings(); res.json({ ok: true, env: IS_PROD ? 'production' : 'development', maintenance: Boolean(settings.maintenanceMode) }); });
app.use(express.static(path.join(__dirname), { extensions: ['html'], maxAge: IS_PROD ? '1h' : 0, setHeaders(res, filePath) { if (filePath.endsWith('admin.html') || filePath.endsWith('admin.js') || filePath.endsWith('maintenance.html')) res.setHeader('Cache-Control', 'no-store'); } }));
app.use((req, res) => { if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Nicht gefunden.' }); res.status(404).sendFile(path.join(__dirname, 'index.html')); });

Promise.resolve().then(ensureSettings).then(ensureAdmin).then(() => app.listen(PORT, HOST, () => console.log(`Till Website läuft auf ${HOST}:${PORT}`))).catch(err => { console.error('Server konnte nicht gestartet werden:', err.message); process.exit(1); });