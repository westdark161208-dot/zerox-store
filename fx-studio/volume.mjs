// RGB stores incident light after self-shadowing. Alpha stores integrated density.
const width = 128, height = 104, variants = 3;
const tiles = [], tinted = new Map();
let loading;

export function loadVolumes() {
  if (loading) return loading;
  loading = new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', {willReadFrequently:true});
      try {
        for (let i = 0; i < variants * 2; i++) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(image, (i % variants)*width, Math.floor(i/variants)*height,
            width, height, 0, 0, width, height);
          tiles.push(ctx.getImageData(0, 0, width, height).data);
        }
      } catch {
        tiles.length = 0;
      }
      if (tiles.length) window.dispatchEvent(new Event('zx-fx-volumes-ready'));
      resolve(tiles.length > 0);
    };
    image.onerror = () => resolve(false);
    image.src = new URL('../assets/fx/cloud-light-v1.png', import.meta.url).href;
  });
  return loading;
}

function tintedTile(layer, variant) {
  const key = layer.color + layer.secondary + variant;
  if (tinted.has(key)) return tinted.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const out = ctx.createImageData(width, height), source = tiles[variant];
  const palette = new Uint8ClampedArray(256*3);
  for (let c = 0; c < 3; c++) {
    const offset = 1 + 2*c;
    const primary = parseInt(layer.color.slice(offset, offset+2), 16);
    const highlight = parseInt(layer.secondary.slice(offset, offset+2), 16);
    for (let i = 0; i < 256; i++) {
      const light = i/255, blend = Math.max(0, (light-.47)/.53);
      palette[3*i+c] = primary*(.19+light*.9)*(1-blend) + highlight*blend;
    }
  }
  for (let p = 0; p < source.length; p += 4) {
    const k = 3*source[p];
    out.data[p] = palette[k];
    out.data[p+1] = palette[k+1];
    out.data[p+2] = palette[k+2];
    out.data[p+3] = source[p+3];
  }
  ctx.putImageData(out, 0, 0);
  if (tinted.size >= 36) tinted.delete(tinted.keys().next().value);
  tinted.set(key, canvas);
  return canvas;
}

export function drawVolume(g, layer, time, count) {
  loadVolumes();
  const smoke = layer.type === 'smoke';
  const puffs = [], total = Math.max(3, Math.ceil(count*(smoke ? .85 : .65)));
  const baseAlpha = g.globalAlpha;
  // Shadows occlude the rear puffs. Additive blending would erase their interiors.
  g.globalCompositeOperation = 'source-over';
  g.shadowBlur = 0;
  for (let i = 0; i < total; i++) {
    const phase = i*2*Math.PI/total + time*(smoke ? .24 : .13);
    const depth = Math.sin(phase);
    const perspective = .82 + .24*depth;
    const drift = time*.49 + i*2.4;
    const x = Math.cos(phase)*.35*layer.spread/100 + .021*Math.sin(drift);
    const y = depth*(smoke ? .18 : .13) + .032*Math.cos(drift*1.2);
    const size = (.46 + .055*Math.sin(drift))*perspective;
    puffs.push({i, x, y, size, depth, drift});
  }
  puffs.sort((a,b) => a.depth-b.depth);
  for (const {i,x,y,size,depth,drift} of puffs) {
    const h = size*(smoke ? .68 : .87)*(1+.06*Math.sin(drift));
    const sprite = tiles.length && tintedTile(layer, i%variants+(smoke ? variants : 0));
    g.globalAlpha = baseAlpha*(.76+.18*depth)*(.67+.33*layer.brightness/100);
    if (sprite) {
      if (smoke) {
        g.save();
        g.translate(x,y);
        g.rotate(.25*Math.sin(drift*.8));
        g.transform(1,.12*Math.sin(drift*.7),.18*Math.cos(drift),1,0,0);
        g.drawImage(sprite,-size/2,-h/2,size,h);
        g.restore();
      } else {
        g.drawImage(sprite,x-size/2,y-h/2,size,h);
      }
    } else {
      const grad = g.createRadialGradient(x,y,0,x,y,size/2);
      grad.addColorStop(0,layer.secondary);grad.addColorStop(.45,layer.color+'aa');grad.addColorStop(1,layer.color+'00');
      g.fillStyle=grad;g.fillRect(x-size/2,y-size/2,size,size);
    }
  }
  g.globalAlpha = baseAlpha;
}
