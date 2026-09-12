
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
        if(amount){
          btn.dataset.support=amount;
          btn.textContent=`CHF ${amount} unterstützen`;
        }
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
  toastTimer = setTimeout(()=>el.classList.remove('show'), 2200);
}

// Project filters
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
  if(param && ['minecraft','gaming','dev','youtube'].includes(param)) applyProjectFilter(param);
}


// Voluntary support demo
$$('.support-btn').forEach(btn => btn.addEventListener('click', () => {
  const amount = Number(btn.dataset.support || 0);
  toast(`Demo: CHF ${amount.toFixed(2)} Unterstützung gewählt`);
}));

const customSupportBtn = $('#customSupportBtn');
if(customSupportBtn){
  customSupportBtn.addEventListener('click', () => {
    const input = $('#customSupportAmount');
    const amount = Number(input?.value || 0);
    if(!amount || amount < 1) return toast('Bitte einen Betrag ab CHF 1 eingeben');
    toast(`Demo: CHF ${amount.toFixed(2)} Unterstützung gewählt`);
  });
}

// Contact
const form=$('#contactForm');
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
    if(submitBtn){
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet...';
    }
    if(status) status.textContent = 'Nachricht wird gesendet...';

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(()=>({}));

    if(!response.ok){
      throw new Error(data.error || 'Nachricht konnte nicht gesendet werden.');
    }

    form.reset();
    if(status) status.textContent = 'Danke! Deine Nachricht wurde erfolgreich an Till gesendet.';
    toast('Nachricht erfolgreich gesendet ✓');
  }catch(err){
    if(status) status.textContent = err.message || 'Beim Senden ist ein Fehler aufgetreten.';
    toast('Senden fehlgeschlagen');
  }finally{
    if(submitBtn){
      submitBtn.disabled = false;
      submitBtn.textContent = 'Nachricht senden';
    }
  }
});
