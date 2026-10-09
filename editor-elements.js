// Fixed commercial-content targets. No arbitrary selectors or executable HTML.
globalThis.ZXEditorElements=Object.freeze([
 {id:'footer-brand',selector:'.footer-brand',label:'Pie de página · marca'},
 {id:'footer-tagline',selector:'.footer-grid>div>small',label:'Pie de página · subtítulo'},
 ...[1,2,3].map(n=>({id:'hero-badge-'+n,selector:'.hero-badges>span:nth-child('+n+')',label:'Portada · distintivo '+n})),
 {id:'guide-title',selector:'.zx-intro-card h2',label:'Free Fire · título de guía'},
 ...[1,2,3].map(n=>({id:'guide-step-'+n,selector:'.zx-steps p:nth-of-type('+n+')',label:'Free Fire · paso '+n})),
 {id:'hero-eyebrow',selector:'.hero-copy .eyebrow',label:'Portada · encabezado'},
 ...[1,2,3,4].map(n=>({id:'hero-title-'+n,selector:'.hero-title span:nth-child('+n+')',label:'Portada · título '+n})),
 {id:'hero-tagline',selector:'.hero-tagline',label:'Portada · subtítulo'},
 {id:'hero-description',selector:'.hero-copy > p:not(.hero-tagline)',label:'Portada · descripción'},
 {id:'hero-action',selector:'.hero-copy .cta',label:'Portada · botón'},
 {id:'hero-background',selector:'.hero',label:'Portada · imagen de fondo',imageOnly:true},
 ...['freefire','minecraft','roblox','call-of-duty','streaming','accounts','clans','honor','resellers'].map(zone=>({id:'zone-'+zone,selector:'.zx-hub-card[data-zone="'+zone+'"]',label:'Sección · '+zone,card:true})),
 ...globalThis.ZXGameSections.map(s=>({id:'game-'+s.id,selector:'.zx-hub-card[data-game-section="'+s.id+'"]',label:'Sección · '+s.name,card:true})),
 {id:'zone-zerito',selector:'.zx-hub-card[data-zone="zerito"]',label:'Sección · Zerito Bot',card:true},
 ...['first','unlimited'].map(zone=>({id:'ff-'+zone,selector:'[data-zx-sub="'+zone+'"]',label:'Free Fire · '+zone,card:true})),
 ...['Pases Booyah','Cajas y Fragmentos','Likes'].map((zone,i)=>({id:'ff-other-'+i,selector:'.zx-sub-grid [data-open-cat="'+zone+'"]',label:'Free Fire · '+zone,card:true}))
]);
