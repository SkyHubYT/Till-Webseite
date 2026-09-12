async function loadPublicSettings(){
  try{
    const res=await fetch('/api/settings');
    if(!res.ok) return;
    const s=await res.json();
    if(s.siteTitle) document.title = document.title.replace('Till Gaming & Dev', s.siteTitle);
    const heroLead=document.querySelector('.hero .lead');
    if(heroLead && s.heroText) heroLead.textContent=s.heroText;
    const ytLink=document.querySelector('a[href="https://www.youtube.com/"]');
    if(ytLink && s.youtubeUrl) ytLink.href=s.youtubeUrl;
    const mailLinks=[...document.querySelectorAll('a[href^="mailto:"]')];
    mailLinks.forEach(a=>{
      if(s.contactEmail){
        a.href=`mailto:${s.contactEmail}`;
        if(a.textContent.includes('@')) a.textContent=s.contactEmail;
      }
    });
    const supportButtons=[...document.querySelectorAll('.support-btn[data-support]')];
    if(Array.isArray(s.supportAmounts)){
      supportButtons.forEach((btn,i)=>{
        const amount=s.supportAmounts[i];
        if(amount){ btn.dataset.support=amount; btn.textContent=`CHF ${amount} unterstützen`; }
      });
    }
  }catch{}
}
loadPublicSettings();

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

$$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

const menuToggle = $('.menu-toggle');
const nav = $('.main-nav');

// Über mich und Team auf allen Seiten automatisch in die Haupt-/Hamburger-Navigation einfügen.
if(nav){
  const ensureNavLink = (href, label, navKey) => {
    if(nav.querySelector(`a[href="${href}"]`)) return;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    link.dataset.nav = navKey;
    const supportLink = nav.querySelector('a[href="/unterstuetzen"]');
    if(supportLink) nav.insertBefore(link, supportLink);
    else nav.appendChild(link);
  };
  ensureNavLink('/ueber-mich', 'Über mich', 'about');
  ensureNavLink('/team', 'Team', 'team');
}

if(menuToggle && nav){
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  $$('.main-nav a').forEach(a => a.addEventListener('click',()=>nav.classList.remove('open')));
}

const page = document.body.dataset.page;
if(page) {
  const active = $(`[data-nav="${page}"]`);
  if(active) active.classList.add('active');
}

let toastTimer;
function toast(message){
  const el = $('#toast');
  if(!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 2600);
}

const projectButtons = $$('.filter[data-filter]');
const projectCards = $$('.project-card[data-category]');
if(projectButtons.length){
  function applyProjectFilter(filter){
    let shown = 0;
    projectButtons.forEach(b=>b.classList.toggle('active', b.dataset.filter===filter));
    projectCards.forEach(card=>{
      const visible = filter==='all' || card.dataset.category===filter;
      card.hidden = !visible;
      if(visible) shown++;
    });
    const empty = $('#emptyProjects');
    if(empty) empty.hidden = shown !== 0;
  }
  projectButtons.forEach(btn=>btn.addEventListener('click',()=>applyProjectFilter(btn.dataset.filter)));
  const param = new URLSearchParams(location.search).get('filter');
  if(param && ['minecraft','gaming','dev','youtube','engagement'].includes(param)) applyProjectFilter(param);
}

let paymentsEnabled = false;
async function loadPaymentStatus(){
  const statusEl = $('#paymentStatus');
  if(!statusEl) return;
  try{
    const res = await fetch('/api/payment/status', {cache:'no-store'});
    const data = await res.json();
    paymentsEnabled = Boolean(data.enabled);
    statusEl.textContent = paymentsEnabled
      ? 'Sichere Online-Zahlung ist aktiv. Du wirst für die Zahlung zu Stripe weitergeleitet.'
      : 'Online-Zahlungen sind noch nicht vollständig eingerichtet. Es wird aktuell kein Geld übertragen.';
  }catch{
    paymentsEnabled = false;
    statusEl.textContent = 'Der Zahlungsstatus konnte gerade nicht geladen werden. Es wird keine Zahlung gestartet.';
  }
}
loadPaymentStatus();

async function startSupportPayment(amount, button){
  if(!paymentsEnabled){ toast('Online-Zahlungen sind noch nicht vollständig eingerichtet'); return; }
  const consent = Boolean($('#paymentConsent')?.checked);
  if(!consent){ toast('Bitte zuerst die Hinweise bestätigen'); $('#paymentConsent')?.focus(); return; }
  if(!Number.isFinite(amount) || amount < 1 || amount > 200){ toast('Bitte einen Betrag zwischen CHF 1 und CHF 200 wählen'); return; }
  const originalText = button?.textContent;
  if(button){ button.disabled = true; button.textContent = 'Stripe wird geöffnet...'; }
  try{
    const response = await fetch('/api/payment/create-checkout-session', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({amount, consent:true})
    });
    const data = await response.json().catch(()=>({}));
    if(!response.ok || !data.url) throw new Error(data.error || 'Zahlung konnte nicht vorbereitet werden.');
    window.location.assign(data.url);
  }catch(err){
    toast(err.message || 'Zahlung konnte nicht gestartet werden');
    if(button){ button.disabled = false; button.textContent = originalText; }
  }
}

$$('.support-btn').forEach(btn => btn.addEventListener('click', () => startSupportPayment(Number(btn.dataset.support || 0), btn)));
const customSupportBtn = $('#customSupportBtn');
if(customSupportBtn){
  customSupportBtn.addEventListener('click', () => {
    const input = $('#customSupportAmount');
    startSupportPayment(Number(input?.value || 0), customSupportBtn);
  });
}
if(new URLSearchParams(location.search).get('payment') === 'cancelled') toast('Zahlung wurde abgebrochen – es wurde nichts belastet');

async function verifyPaymentSuccess(){
  const paymentResult = $('#paymentResult');
  if(!paymentResult) return;
  const sessionId = new URLSearchParams(location.search).get('session_id');
  if(!sessionId){ paymentResult.textContent='Es wurde keine Zahlungs-ID gefunden.'; return; }
  try{
    const res=await fetch(`/api/payment/session-status?session_id=${encodeURIComponent(sessionId)}`, {cache:'no-store'});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error || 'Zahlungsstatus konnte nicht geprüft werden.');
    if(data.paid){
      const amount = Number(data.amountTotal || 0) / 100;
      paymentResult.textContent=`Zahlung bestätigt: CHF ${amount.toFixed(2)}. Vielen Dank für deine freiwillige Unterstützung!`;
      paymentResult.dataset.state='success';
    } else {
      paymentResult.textContent='Die Zahlung ist noch nicht als bezahlt bestätigt.';
      paymentResult.dataset.state='pending';
    }
  }catch(err){ paymentResult.textContent=err.message; }
}
verifyPaymentSuccess();

const form=$('#contactForm');
async function loadContactStatus(){
  if(!form) return;
  const status=$('#contactStatus');
  try{
    const res=await fetch('/api/contact/status',{cache:'no-store'});
    const data=await res.json();
    if(status && data.enabled) status.textContent='Kontakt ist online. Deine Nachricht wird direkt an Till gesendet.';
    if(status && !data.enabled) status.textContent='Direkter Mailversand ist noch nicht eingerichtet. Du kannst weiterhin die angezeigte E-Mail-Adresse verwenden.';
  }catch{}
}
loadContactStatus();

if(form) form.addEventListener('submit', async e=>{
  e.preventDefault();
  const submitBtn = $('#contactSubmit');
  const status = $('#contactStatus');
  const payload = {
    name: $('#name')?.value.trim(),
    email: $('#email')?.value.trim(),
    subject: $('#subject')?.value.trim(),
    message: $('#message')?.value.trim(),
    privacyConsent: Boolean($('#privacyConsent')?.checked)
  };
  if(!payload.name || !payload.email || !payload.subject || !payload.message || !payload.privacyConsent){
    if(status) status.textContent = 'Bitte alle Felder ausfüllen und dem Datenschutz zustimmen.';
    toast('Bitte alle Pflichtfelder ausfüllen');
    return;
  }
  try{
    if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Wird gesendet...'; }
    if(status) status.textContent = 'Nachricht wird gesendet...';
    const response = await fetch('/api/contact', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    const data = await response.json().catch(()=>({}));
    if(!response.ok){
      const extra = data.fallbackEmail ? ` Alternativ kannst du an ${data.fallbackEmail} schreiben.` : '';
      throw new Error((data.error || 'Nachricht konnte nicht gesendet werden.') + extra);
    }
    form.reset();
    if(status) status.textContent = 'Danke! Deine Nachricht wurde erfolgreich an Till gesendet.';
    toast('Nachricht erfolgreich gesendet ✓');
  }catch(err){
    if(status) status.textContent = err.message || 'Beim Senden ist ein Fehler aufgetreten.';
    toast('Senden fehlgeschlagen');
  }finally{
    if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = 'Nachricht senden'; }
  }
});
