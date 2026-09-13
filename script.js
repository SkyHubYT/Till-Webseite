const DEFAULT_YOUTUBE_URL = 'https://www.youtube.com/@tills109';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function normalizeYoutubeUrl(url) {
  const value = String(url || '').trim();
  if (!value || /^https?:\/\/(www\.)?youtube\.com\/?$/i.test(value)) return DEFAULT_YOUTUBE_URL;
  return value;
}

async function loadPublicSettings() {
  try {
    const response = await fetch('/api/settings', { cache: 'no-store' });
    if (!response.ok) return;
    const settings = await response.json();

    const youtubeUrl = normalizeYoutubeUrl(settings.youtubeUrl);
    $$('a[data-youtube-link]').forEach(link => {
      link.href = youtubeUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });

    if (settings.contactEmail) {
      $$('a[href^="mailto:"]').forEach(link => {
        link.href = `mailto:${settings.contactEmail}`;
        if (link.textContent.includes('@')) link.textContent = settings.contactEmail;
      });
    }

    if (Array.isArray(settings.supportAmounts)) {
      $$('.support-btn[data-support]').forEach((button, index) => {
        const amount = Number(settings.supportAmounts[index]);
        if (Number.isFinite(amount) && amount > 0) button.dataset.support = String(amount);
      });
    }
  } catch {}
}

$$('[data-year]').forEach(element => {
  element.textContent = new Date().getFullYear();
});

const nav = $('.main-nav');
const menuToggle = $('.menu-toggle');
const page = document.body.dataset.page;

if (nav) {
  const navItems = [
    ['home', '/', 'Home'],
    ['about', '/ueber-mich', 'Über mich'],
    ['projects', '/projekte', 'Projekte'],
    ['politics', '/politik', 'Politik / EVP'],
    ['youtube', DEFAULT_YOUTUBE_URL, 'YouTube'],
    ['team', '/team', 'Team'],
    ['contact', '/kontakt', 'Kontakt']
  ];

  nav.innerHTML = navItems.map(([key, href, label]) => {
    const external = key === 'youtube' ? ' data-youtube-link target="_blank" rel="noopener noreferrer"' : '';
    return `<a data-nav="${key}" href="${href}"${external}>${label}</a>`;
  }).join('');

  if (page) {
    const active = nav.querySelector(`[data-nav="${page}"]`);
    if (active) active.classList.add('active');
  }
}

function setMenuState(open) {
  if (!nav || !menuToggle) return;
  nav.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Navigation schliessen' : 'Navigation öffnen');
}

if (nav && menuToggle) {
  menuToggle.addEventListener('click', () => setMenuState(!nav.classList.contains('open')));
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuState(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenuState(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1180) setMenuState(false);
  }, { passive: true });
}

const header = $('.site-header');
const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

let toastTimer;
function toast(message) {
  const element = $('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2600);
}

const projectButtons = $$('.filter[data-filter]');
const projectCards = $$('.project-card[data-category]');
if (projectButtons.length) {
  function applyProjectFilter(filter) {
    let shown = 0;
    projectButtons.forEach(button => button.classList.toggle('active', button.dataset.filter === filter));
    projectCards.forEach(card => {
      const visible = filter === 'all' || card.dataset.category === filter;
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    const empty = $('#emptyProjects');
    if (empty) empty.hidden = shown !== 0;
  }

  projectButtons.forEach(button => button.addEventListener('click', () => applyProjectFilter(button.dataset.filter)));
  const filter = new URLSearchParams(location.search).get('filter');
  if (filter && ['minecraft', 'gaming', 'dev', 'youtube', 'engagement'].includes(filter)) applyProjectFilter(filter);
}

let paymentsEnabled = false;
async function loadPaymentStatus() {
  const status = $('#paymentStatus');
  if (!status) return;
  try {
    const response = await fetch('/api/payment/status', { cache: 'no-store' });
    const data = await response.json();
    paymentsEnabled = Boolean(data.enabled);
    status.textContent = paymentsEnabled
      ? 'Sichere Online-Zahlung über Stripe ist aktiv.'
      : 'Online-Zahlungen sind noch nicht vollständig eingerichtet. Es wird aktuell kein Geld übertragen.';
  } catch {
    paymentsEnabled = false;
    status.textContent = 'Der Zahlungsstatus konnte gerade nicht geladen werden. Es wird keine Zahlung gestartet.';
  }
}

async function startSupportPayment(amount, button) {
  if (!paymentsEnabled) {
    toast('Online-Zahlungen sind noch nicht vollständig eingerichtet');
    return;
  }
  if (!$('#paymentConsent')?.checked) {
    toast('Bitte zuerst die Hinweise bestätigen');
    $('#paymentConsent')?.focus();
    return;
  }
  if (!Number.isFinite(amount) || amount < 1 || amount > 200) {
    toast('Bitte einen Betrag zwischen 1 und 200 wählen');
    return;
  }

  const originalText = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = 'Stripe wird geöffnet...';
  }

  try {
    const response = await fetch('/api/payment/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, consent: true })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) throw new Error(data.error || 'Zahlung konnte nicht vorbereitet werden.');
    location.assign(data.url);
  } catch (error) {
    toast(error.message || 'Zahlung konnte nicht gestartet werden');
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

$$('.support-btn[data-support]').forEach(button => {
  button.addEventListener('click', () => startSupportPayment(Number(button.dataset.support || 0), button));
});

$('#customSupportBtn')?.addEventListener('click', event => {
  startSupportPayment(Number($('#customSupportAmount')?.value || 0), event.currentTarget);
});

if (new URLSearchParams(location.search).get('payment') === 'cancelled') {
  toast('Zahlung wurde abgebrochen – es wurde nichts belastet');
}

async function verifyPaymentSuccess() {
  const result = $('#paymentResult');
  if (!result) return;
  const sessionId = new URLSearchParams(location.search).get('session_id');
  if (!sessionId) {
    result.textContent = 'Es wurde keine Zahlungs-ID gefunden.';
    return;
  }

  try {
    const response = await fetch(`/api/payment/session-status?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Zahlungsstatus konnte nicht geprüft werden.');
    if (data.paid) {
      const amount = Number(data.amountTotal || 0) / 100;
      const currency = String(data.currency || 'CHF').toUpperCase();
      result.textContent = `Zahlung bestätigt: ${currency} ${amount.toFixed(2)}. Vielen Dank für deine freiwillige Unterstützung!`;
      result.dataset.state = 'success';
    } else {
      result.textContent = 'Die Zahlung ist noch nicht als bezahlt bestätigt.';
      result.dataset.state = 'pending';
    }
  } catch (error) {
    result.textContent = error.message;
  }
}

const contactForm = $('#contactForm');
async function loadContactStatus() {
  if (!contactForm) return;
  try {
    const response = await fetch('/api/contact/status', { cache: 'no-store' });
    const data = await response.json();
    const status = $('#contactStatus');
    if (!status) return;
    status.textContent = data.enabled
      ? 'Kontakt ist online. Deine Nachricht wird direkt an Till gesendet.'
      : 'Direkter Mailversand ist noch nicht eingerichtet. Du kannst die angezeigte E-Mail-Adresse verwenden.';
  } catch {}
}

if (contactForm) {
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const submitButton = $('#contactSubmit');
    const status = $('#contactStatus');
    const payload = {
      name: $('#name')?.value.trim(),
      email: $('#email')?.value.trim(),
      subject: $('#subject')?.value.trim(),
      message: $('#message')?.value.trim(),
      privacyConsent: Boolean($('#privacyConsent')?.checked)
    };

    if (!payload.name || !payload.email || !payload.subject || !payload.message || !payload.privacyConsent) {
      if (status) status.textContent = 'Bitte alle Felder ausfüllen und dem Datenschutz zustimmen.';
      toast('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Wird gesendet...';
      }
      if (status) status.textContent = 'Nachricht wird gesendet...';

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const fallback = data.fallbackEmail ? ` Alternativ kannst du an ${data.fallbackEmail} schreiben.` : '';
        throw new Error((data.error || 'Nachricht konnte nicht gesendet werden.') + fallback);
      }

      contactForm.reset();
      if (status) status.textContent = 'Danke! Deine Nachricht wurde erfolgreich an Till gesendet.';
      toast('Nachricht erfolgreich gesendet ✓');
    } catch (error) {
      if (status) status.textContent = error.message || 'Beim Senden ist ein Fehler aufgetreten.';
      toast('Senden fehlgeschlagen');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Nachricht senden';
      }
    }
  });
}

loadPublicSettings();
loadPaymentStatus();
verifyPaymentSuccess();
loadContactStatus();
