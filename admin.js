
const $ = s => document.querySelector(s);

let toastTimer;
function toast(message){
  const el = $('#toast');
  if(!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'),2200);
}

async function api(url, options={}){
  const res = await fetch(url, {
    credentials:'same-origin',
    headers:{'Content-Type':'application/json', ...(options.headers||{})},
    ...options
  });
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || 'Fehler');
  return data;
}

function showLogin(){
  $('#loginView').hidden = false;
  $('#dashboardView').hidden = true;
}
function showDashboard(){
  $('#loginView').hidden = true;
  $('#dashboardView').hidden = false;
}

async function checkSession(){
  try{
    const data = await api('/api/admin/me');
    if(data.authenticated){
      showDashboard();
      await loadSettings();
    } else showLogin();
  }catch{
    showLogin();
  }
}

$('#adminLoginForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const status = $('#adminLoginStatus');
  try{
    status.textContent = 'Login wird geprüft...';
    await api('/api/admin/login',{
      method:'POST',
      body:JSON.stringify({
        username:$('#adminUser').value.trim(),
        password:$('#adminPassword').value
      })
    });
    $('#adminLoginForm').reset();
    showDashboard();
    await loadSettings();
    toast('Erfolgreich eingeloggt');
  }catch(err){
    status.textContent = err.message;
    toast('Login fehlgeschlagen');
  }
});

$('#logoutBtn').addEventListener('click', async ()=>{
  try{ await api('/api/admin/logout',{method:'POST',body:'{}'}); }catch{}
  showLogin();
  toast('Ausgeloggt');
});

async function loadSettings(){
  const data = await api('/api/admin/settings');
  const s = data.settings;
  $('#siteTitle').value = s.siteTitle || '';
  $('#heroText').value = s.heroText || '';
  $('#youtubeUrl').value = s.youtubeUrl || '';
  $('#contactEmail').value = s.contactEmail || '';
  $('#support1').value = s.supportAmounts?.[0] ?? 5;
  $('#support2').value = s.supportAmounts?.[1] ?? 10;
  $('#support3').value = s.supportAmounts?.[2] ?? 20;
}

$('#settingsForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const status = $('#settingsStatus');
  try{
    status.textContent = 'Wird gespeichert...';
    await api('/api/admin/settings',{
      method:'PUT',
      body:JSON.stringify({
        siteTitle:$('#siteTitle').value.trim(),
        heroText:$('#heroText').value.trim(),
        youtubeUrl:$('#youtubeUrl').value.trim(),
        contactEmail:$('#contactEmail').value.trim(),
        supportAmounts:[
          Number($('#support1').value),
          Number($('#support2').value),
          Number($('#support3').value)
        ]
      })
    });
    status.textContent = 'Einstellungen gespeichert ✓';
    toast('Einstellungen gespeichert');
  }catch(err){
    status.textContent = err.message;
    toast('Speichern fehlgeschlagen');
  }
});

$('#passwordForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const status=$('#passwordStatus');
  const p1=$('#newPassword').value;
  const p2=$('#newPassword2').value;
  if(p1!==p2){
    status.textContent='Die neuen Passwörter stimmen nicht überein.';
    return;
  }
  try{
    await api('/api/admin/password',{
      method:'PUT',
      body:JSON.stringify({
        currentPassword:$('#currentPassword').value,
        newPassword:p1
      })
    });
    $('#passwordForm').reset();
    status.textContent='Passwort erfolgreich geändert ✓';
    toast('Passwort geändert');
  }catch(err){
    status.textContent=err.message;
    toast('Passwortänderung fehlgeschlagen');
  }
});

checkSession();
