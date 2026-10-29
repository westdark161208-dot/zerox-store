/* Support shell; no AI response or message submission is enabled. */
(()=>{
 if(document.getElementById('zx-umy-advisor'))return;
 const button=document.createElement('button');button.id='zx-umy-advisor';button.type='button';button.setAttribute('aria-label','Abrir Umy Advisor');button.setAttribute('aria-haspopup','dialog');button.textContent='✦';
 const dialog=document.createElement('dialog');dialog.id='zx-umy-dialog';
 dialog.innerHTML='<button type="button" data-close aria-label="Cerrar Umy Advisor">Cerrar ×</button><h2>Umy Advisor</h2><p>Tu espacio de ayuda Zero’X.</p><p>El chat de soporte estará disponible próximamente. Todavía no se envían mensajes desde este panel.</p><a href="https://wa.me/529514754210" target="_blank" rel="noopener">Contactar a Soporte</a>';
 document.body.append(button,dialog);
 button.onclick=()=>dialog.showModal();dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 dialog.querySelector('a').onclick=()=>dialog.close();
})();
