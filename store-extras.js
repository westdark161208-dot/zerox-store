(()=>{
 const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 document.getElementById('footer-orders').onclick=()=>window.ZXOrderHistory.open();
 document.getElementById('footer-references').onclick=()=>window.ZXOrderHistory.openReferences();
 const adImage=document.getElementById('ad-image');if(adImage){adImage.tabIndex=0;adImage.setAttribute('role','button');adImage.setAttribute('aria-label','Ver promociones');adImage.onclick=()=>window.ZXStoreExtras.promotions(ZEROX_ADS[zeroxAdIndex]?.id);adImage.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();adImage.click();}};}
 const modal=make('dialog');modal.className='zx-promotions-modal';modal.setAttribute('aria-label','Promociones');document.body.append(modal);
 window.ZXStoreExtras={promotions(id){location.href='promotions.html'+(id?'?ad='+encodeURIComponent(id):'');}};
 // Activation awaits the owner's actual channel URL and artwork. No placeholder link is published.
 const channel={url:'https://whatsapp.com/channel/0029Vb7mKeG90x2qtiSx3330',image:'./assets/channel-zero-x.webp'};
 if(channel&&/^https:\/\/whatsapp\.com\/channel\/[A-Za-z0-9]+$/.test(channel.url||'')&&!sessionStorage.getItem('zx-channel-dismissed')){const invite=make('aside');invite.className='zx-channel-invite';if(channel.image){const img=make('img');img.src=channel.image;img.alt='Canal Zero’X Store';invite.append(img);}const link=make('a','Unirme al canal de WhatsApp ↗');link.href=channel.url;link.target='_blank';link.rel='noopener';const close=make('button','×');close.setAttribute('aria-label','Cerrar invitación');close.onclick=()=>{invite.remove();sessionStorage.setItem('zx-channel-dismissed','1');};invite.append(link,close);document.querySelector('.zerox-ad-zone')?.before(invite);}
})();
