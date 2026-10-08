(()=>{
 const root='https://zerox-sixofire-api.westdark161208.workers.dev';
 const errors={COUPON_INVALID:'El código no existe o está desactivado.',COUPON_EXPIRED:'Este código ya caducó.',LOGIN_REQUIRED:'Inicia sesión para aplicar un código.',COUPON_RETAIL_ONLY:'Los códigos se usan con saldo Zero’X o Mercado Pago; no descuentan el coste del proveedor.'};
 const token=()=>{try{return JSON.parse(localStorage.getItem('zerox-session')||'null')?.token;}catch{return null;}};
 async function validate(code){const t=token();if(!t)throw Error('LOGIN_REQUIRED');const r=await fetch(root+'/api/coupons/validate',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify({code}),signal:AbortSignal.timeout(12000)}),b=await r.json();if(t!==token())throw Error('LOGIN_REQUIRED');if(!r.ok||!b.ok)throw Error(b.error||'COUPON_INVALID');return b.coupon;}
 function mount(host,subtotalCents,onchange=()=>{}){
  host.classList.add('zx-code-box');host.innerHTML='<label>Código de descuento<input type="text" maxlength="24" autocomplete="off" placeholder="ZX-…" aria-label="Código de descuento"></label><button type="button">Aplicar código</button><p role="status"></p>';
  const input=host.querySelector('input'),button=host.querySelector('button'),out=host.querySelector('p');let coupon=null,version=0,locked=false,retail=true;
  const state=()=>({couponCode:coupon?.code||'',discountCents:Math.floor(subtotalCents*(coupon?.percent||0)/100),amountCents:subtotalCents-Math.floor(subtotalCents*(coupon?.percent||0)/100)});
  const reset=()=>{coupon=null;version++;onchange(state());};input.oninput=()=>{reset();out.textContent='';};
  button.onclick=async()=>{if(locked||!retail)return;reset();const v=version,code=input.value.trim();if(!code){out.textContent='Sin código aplicado.';return;}button.disabled=true;out.textContent='Validando código…';try{const found=await validate(code);if(v!==version||locked||!retail)return;coupon=found;input.value=found.code;const s=state();out.textContent=found.percent+'% aplicado · Ahorras $'+(s.discountCents/100).toFixed(2)+' MXN · Total $'+(s.amountCents/100).toFixed(2)+' MXN';onchange(s);}catch(e){if(v===version)out.textContent=errors[e.message]||'No se pudo validar el código. Inténtalo otra vez.';}finally{button.disabled=locked||!retail;}};
  return {state,lock(value=true){locked=value;version++;input.disabled=value||!retail;button.disabled=value||!retail;},setRetail(value){retail=value;if(!value){reset();input.value='';out.textContent=errors.COUPON_RETAIL_ONLY;}else out.textContent='';input.disabled=locked||!retail;button.disabled=locked||!retail;}};
 }
 window.ZXCoupons={mount,validate,errors};
})();
