(()=>{
 const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 document.getElementById('footer-orders').onclick=()=>window.ZXOrderHistory.open();
 document.getElementById('footer-references').onclick=()=>window.ZXCommunity.open();
 document.getElementById('footer-top').onclick=()=>window.ZXCommunity.top();
 document.getElementById('footer-account').onclick=()=>document.getElementById('open-account').click();
 document.getElementById('footer-diamonds').onclick=()=>zxOpenCatalog('Diamantes ilimitados');
 const adImage=document.getElementById('ad-image');if(adImage){adImage.tabIndex=0;adImage.setAttribute('role','button');adImage.setAttribute('aria-label','Ver promociones');adImage.onclick=()=>window.ZXStoreExtras.promotions(ZEROX_ADS[zeroxAdIndex]?.id);adImage.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();adImage.click();}};}
 const modal=make('dialog');modal.className='zx-promotions-modal';modal.setAttribute('aria-label','Promociones');document.body.append(modal);
 window.ZXStoreExtras={promotions(id){location.href='promotions.html'+(id?'?ad='+encodeURIComponent(id):'');}};
 function showGallery(){
   const gallery=document.querySelector('.ad-gallery');
   gallery.replaceChildren(...ZEROX_ADS.map(ad=>{
     const link=make('a'), image=make('img');
     link.href='promotions.html'+(ad.id?'?ad='+encodeURIComponent(ad.id):'');
     image.src=ad.image;image.alt='';link.append(image,make('strong',ad.title));
     return link;
   }));
 }
 showGallery();document.addEventListener('zx-ads-loaded',showGallery);
})();
