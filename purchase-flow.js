/* Balance consent and read-only delivery tracking. Never submits a purchase. */
(()=>{
 const valid=id=>/^[a-f0-9-]{36}$/.test(id||'');
 const token=()=>{try{return JSON.parse(localStorage.getItem('zerox-session')||'null')?.token;}catch{return null;}};
 let consent=null,receiptDialog=null;const watchers=new Set();
 function confirmBalance({product,playerId,amount,paymentLabel}){
  if(consent)return Promise.resolve(false);
  return new Promise(resolve=>{
   const dialog=document.createElement('dialog');dialog.className='zx-balance-confirm';dialog.setAttribute('aria-labelledby','zx-balance-confirm-title');
   dialog.innerHTML='<h2 id="zx-balance-confirm-title">Aceptar pago con saldo</h2><p data-confirm-product></p><p data-confirm-player></p><strong data-confirm-amount></strong><p>Al aceptar, autorizas este pago y la entrega al ID indicado.</p><div><button type="button" data-confirm-cancel>Cancelar</button><button type="button" data-confirm-accept>Aceptar pago con saldo</button></div>';
   if(paymentLabel){dialog.querySelector('#zx-balance-confirm-title').textContent='Confirmar pago';dialog.querySelector('[data-confirm-accept]').textContent=paymentLabel;dialog.querySelector('strong + p').textContent='Continuarás al método elegido. La entrega comenzará después de confirmar el pago.';}
   dialog.querySelector('[data-confirm-product]').textContent=product;dialog.querySelector('[data-confirm-player]').textContent='ID de jugador: '+playerId;dialog.querySelector('[data-confirm-amount]').textContent=amount;
   let finished=false;const finish=accepted=>{if(finished)return;finished=true;consent=null;dialog.close();dialog.remove();resolve(accepted);};consent=()=>finish(false);
   dialog.querySelector('[data-confirm-cancel]').onclick=()=>finish(false);dialog.querySelector('[data-confirm-accept]').onclick=()=>finish(true);dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false);});dialog.addEventListener('close',()=>finish(false));document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-confirm-cancel]').focus();
  });
 }
 function openReceipt(id,kind="diamond"){
  if(!valid(id)||!token()||document.hidden)return;
  if(receiptDialog){const old=receiptDialog;old.close();old.remove();}
  const dialog=document.createElement('dialog');dialog.className='zx-receipt-frame';dialog.setAttribute('aria-label','Comprobante de compra');
  const close=document.createElement('button');close.type='button';close.className='zx-receipt-close';close.textContent='Cerrar comprobante ×';
  const frame=document.createElement('iframe');frame.title='Comprobante confirmado de Zero’X Store';frame.src='product-payment.html?kind='+(kind==='service'?'service':'diamond')+'&order='+encodeURIComponent(id)+'&embedded=1';
  close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();if(receiptDialog===dialog)receiptDialog=null;});dialog.append(close,frame);document.body.append(dialog);receiptDialog=dialog;dialog.showModal();close.focus();
 }
 function watchOrder(id,{request,onComplete=openReceipt,onState=()=>{},onError=()=>{}}){
  if(!valid(id))return ()=>{};
  const owner=token();let stopped=false,timer=null,busy=false,count=0;
  const stop=()=>{stopped=true;clearTimeout(timer);watchers.delete(watcher);};
  async function poll(){
   clearTimeout(timer);if(stopped||busy)return;if(!owner||owner!==token()){stop();return;}if(document.hidden)return;
   busy=true;try{const {order}=await request('/orders/'+id);if(stopped||owner!==token()||document.hidden)return;onState(order);
    if(order.state==='COMPLETED'){stop();onComplete(id);return;}if(order.state==='FAILED'){stop();return;}
   }catch(e){if(!stopped&&owner===token()&&!document.hidden)onError(e);}
   finally{busy=false;if(!stopped&&owner===token()&&!document.hidden){if(++count<120)timer=setTimeout(poll,5000);else{stop();onError(new Error('TRACKING_TIMEOUT'));}}}
  }
  const watcher={stop,poll};watchers.add(watcher);poll();return stop;
 }
 function clear(){consent?.();if(receiptDialog){const old=receiptDialog;old.close();old.remove();receiptDialog=null;}for(const w of [...watchers])w.stop();}
 window.addEventListener('pagehide',clear);window.addEventListener('zx-session-change',clear);window.addEventListener('storage',e=>{if(e.key==='zerox-session'||e.key===null)clear();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){consent?.();if(receiptDialog){const old=receiptDialog;old.close();old.remove();receiptDialog=null;}}else for(const w of watchers)w.poll();});
 window.ZXPurchaseFlow={confirmBalance,openReceipt,watchOrder};
})();
