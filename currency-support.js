(()=>{
  const STORAGE_KEY='till.currency';
  const allowed=['CHF','EUR'];
  const getCurrency=()=>{
    const value=(localStorage.getItem(STORAGE_KEY)||'CHF').toUpperCase();
    return allowed.includes(value)?value:'CHF';
  };
  const setCurrency=value=>{
    const currency=allowed.includes(String(value).toUpperCase())?String(value).toUpperCase():'CHF';
    localStorage.setItem(STORAGE_KEY,currency);
    return currency;
  };

  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(input,options={})=>{
    const url=typeof input==='string'?input:(input?.url||'');
    if(url.includes('/api/payment/create-checkout-session') && options?.body){
      try{
        const payload=JSON.parse(options.body);
        payload.currency=getCurrency();
        options={...options,body:JSON.stringify(payload)};
      }catch{}
    }
    return nativeFetch(input,options);
  };

  function applyCurrency(){
    const currency=getCurrency();
    const selector=document.querySelector('#currencySelect');
    if(selector) selector.value=currency;

    document.querySelectorAll('.support-btn[data-support]').forEach(btn=>{
      const amount=Number(btn.dataset.support||0);
      if(amount) btn.textContent=`${currency} ${amount} unterstützen`;
    });

    const symbol=document.querySelector('[data-currency-symbol]');
    if(symbol) symbol.textContent=currency;

    const range=document.querySelector('[data-currency-range]');
    if(range) range.textContent=`Du kannst einen freiwilligen Betrag zwischen ${currency} 1 und ${currency} 200 wählen.`;

    const paymentHint=document.querySelector('[data-payment-currency-hint]');
    if(paymentHint){
      paymentHint.textContent=currency==='CHF'
        ? 'CHF: Zahlung über Stripe. Karte und – falls im Stripe-Konto verfügbar – TWINT.'
        : 'EUR: Zahlung über Stripe per Karte. TWINT wird bei EUR nicht angeboten.';
    }
  }

  async function refreshPaymentResult(){
    const result=document.querySelector('#paymentResult');
    if(!result) return;
    const sessionId=new URLSearchParams(location.search).get('session_id');
    if(!sessionId) return;
    try{
      const res=await nativeFetch(`/api/payment/session-status?session_id=${encodeURIComponent(sessionId)}`,{cache:'no-store'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok) return;
      if(data.paid){
        const amount=Number(data.amountTotal||0)/100;
        const currency=String(data.currency||'CHF').toUpperCase();
        result.textContent=`Zahlung bestätigt: ${currency} ${amount.toFixed(2)}. Vielen Dank für deine freiwillige Unterstützung!`;
        result.dataset.state='success';
      }
    }catch{}
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const selector=document.querySelector('#currencySelect');
    if(selector){
      selector.value=getCurrency();
      selector.addEventListener('change',()=>{setCurrency(selector.value);applyCurrency();});
    }
    applyCurrency();
    setTimeout(applyCurrency,250);
    setTimeout(applyCurrency,900);
    setTimeout(refreshPaymentResult,350);
  });
})();