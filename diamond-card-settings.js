// Shared by the storefront, draft editor and Worker validation. Missing keys inherit.
(() => {
  const ranges = {
    width:['Ancho del recuadro (%)',68,100,100], height:['Altura mínima (px)',76,240,92],
    padding:['Espaciado interior (px)',6,18,8], neon:['Intensidad del borde (%)',0,100,64],
    glow:['Resplandor exterior (px)',0,26,11], font:['Tamaño del nombre (px)',14,30,20],
    shine:['Iluminación del nombre (%)',0,100,42], scale:['Escala de la ilustración (%)',55,100,96],
    x:['Posición horizontal (%)',0,100,50], y:['Posición vertical (%)',0,100,100]
  };
  const colors = {
    main:'Color principal',border:'Borde neón',shadow:'Resplandor exterior',background:'Fondo',
    metal:'Metal base',light:'Luz del nombre',badgeColor:'Texto de insignia',badgeBorder:'Borde de insignia',
    badgeGlow:'Luz de insignia',buy:'Botón Comprar',plus:'Botón +'
  };
  function valid(settings) {
    if (!settings || Array.isArray(settings) || typeof settings!=='object') return false;
    return Object.entries(settings).every(([key,value])=>{
      if (Object.hasOwn(colors,key)) return typeof value==='string' && /^#[0-9a-f]{6}$/i.test(value);
      if (Object.hasOwn(ranges,key)) return Number.isInteger(value) && value>=ranges[key][1] && value<=ranges[key][2];
      if (key==='badgeOn') return typeof value==='boolean';
      return key==='badgeText' && typeof value==='string' && value.trim().length>0 && value.length<=32;
    });
  }
  function resolve(raw,accent) {
    const saved=valid(raw)?raw:{};
    const main=saved.main||accent, border=saved.border||main;
    return {...Object.fromEntries(Object.entries(ranges).map(([key,r])=>[key,r[3]])),
      main,border,shadow:border,light:border,background:'#0b0c13',metal:'#c9d0df',
      buy:main,plus:main,badgeColor:'#ffffff',badgeBorder:border,badgeGlow:border,
      badgeOn:false,badgeText:'PROMOCIÓN',...saved};
  }
  globalThis.ZXCardSettings=Object.freeze({ranges,colors,valid,resolve});
})();
