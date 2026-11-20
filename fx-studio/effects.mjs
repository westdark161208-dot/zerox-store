// Normalized coordinates across all aspect ratios. No random jitter between frames.
const TAU=Math.PI*2, sin=Math.sin, cos=Math.cos;
const fract=n=>n-Math.floor(n);
const noise=n=>fract(sin(n*127.1+311.7)*43758.5453);
const mix=(a,b,t)=>a+(b-a)*t;
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const sprites=new Map();
function valueNoise(x,y) {
  let u=fract(x),v=fract(y);
  u=u*u*(3-2*u);v=v*v*(3-2*v);
  const i=Math.floor(x)+Math.floor(y)*157;
  return mix(mix(noise(i),noise(i+1),u),mix(noise(i+157),noise(i+158),u),v);
}
function vaporSprite(l,variant) {
  const key=l.color+l.secondary+variant;
  if(sprites.has(key)) return sprites.get(key);
  const sprite=document.createElement('canvas');sprite.width=sprite.height=64;
  const ctx=sprite.getContext('2d'), pixels=ctx.createImageData(64,64);
  const base=rgb(l.color),light=rgb(l.secondary);
  for(let y=0;y<64;y++) for(let x=0;x<64;x++) {
    const nx=(x-31.5)/32,ny=(y-31.5)/32,rad=Math.max(0,1-Math.hypot(nx,ny));
    const warp=valueNoise(x*.045+variant,y*.06)*2;
    const turbulence=.55*valueNoise(x*.08+warp,y*.07+variant)+.3*valueNoise(x*.16,y*.15+warp)+.15*valueNoise(x*.32+variant,y*.32);
    const p=4*(x+64*y);
    for(let c=0;c<3;c++) pixels.data[p+c]=mix(base[c],light[c],turbulence*turbulence*.85);
    pixels.data[p+3]=255*Math.min(1,Math.pow(rad,.9)*Math.max(0,turbulence-.22)*2.4);
  }
  ctx.putImageData(pixels,0,0);
  if(sprites.size>=48)sprites.delete(sprites.keys().next().value);
  sprites.set(key,sprite);
  return sprite;
}
function ellipse(g,x,y,rx,ry) {
  g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);
}
function line(g,x,y,x2,y2) {g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();}
function halo(g,x,y,r,col) {
  const grad=g.createRadialGradient(x,y,0,x,y,r);
  grad.addColorStop(0,col);grad.addColorStop(1,col+'00');
  g.fillStyle=grad;g.fillRect(x-r,y-r,2*r,2*r);
}
function vapor(g,l,t,n) {
  const cloudy=l.type!=='smoke', rx=.32*l.spread/100, ry=cloudy?.11:.22;
  for(let i=0;i<n;i++) {
    const a=TAU*i/n+t*(cloudy?.12:.22), sw=t*.45+i*1.9;
    const x=rx*cos(a)+.06*sin(sw), y=ry*sin(a)+.055*sin(sw*1.4);
    const r=(cloudy?.51:.42)+noise(i)*.18+.07*sin(sw*.7);
    g.save();g.translate(x,y);g.rotate(.45*sin(sw)+a*.18);
    g.drawImage(vaporSprite(l,i%3),-r/2,-r*.38,r,r*.76);g.restore();
  }
}
function lightning(g,l,t) {
  const phase=fract(t*.38);
  if(phase>.23) return;
  const cycle=Math.floor(t*.38), x=(noise(cycle)-.5)*.6;
  g.save();g.globalAlpha*=.45+.55*Math.pow(cos(phase*22),2);g.strokeStyle=l.secondary;g.lineWidth=.008;
  let px=x,py=-.23;
  for(let j=1;j<=6;j++) {
    const nx=x+(noise(cycle*7+j)-.5)*.19,ny=py+.07;
    line(g,px,py,nx,ny);if(j===3)line(g,nx,ny,nx+.09,ny+.04);px=nx;py=ny;
  }
  g.restore();
}
function flames(g,l,t,n) {
  for(let i=0;i<n;i++) {
    const p=fract(i/n+t*.28),x=(noise(i)-.5)*.8*l.spread/100,y=.31-.14*p;
    const h=.15+.4*Math.sin(p*Math.PI),sway=.07*sin(t*2+i);
    const grad=g.createLinearGradient(0,y,0,y-h);
    grad.addColorStop(0,l.secondary);grad.addColorStop(.42,l.color);grad.addColorStop(1,l.color+'00');
    g.fillStyle=grad;g.beginPath();g.moveTo(x-.07,y);
    g.bezierCurveTo(x-.15,y-h*.5,x+sway,y-h*.8,x+sway*2,y-h);
    g.bezierCurveTo(x+sway*.6,y-h*.32,x+.14,y-h*.48,x+.07,y);g.fill();
  }
}
function particles(g,l,t,n) {
  for(let i=0;i<n*2;i++) {
    const a=i*2.39996, p=fract(noise(i+8)+t*(.05+noise(i)*.18)), spread=l.spread/100;
    let x=(noise(i+31)-.5)*spread,y=(.5-p)*.9;
    if(l.type==='galaxy') {
      const r=Math.sqrt(i/(n*2))*.5*spread,theta=(i%3)*TAU/3+r*10+t*.18+noise(i)*.4;
      x=r*cos(theta);y=r*.54*sin(theta);
    }
    g.strokeStyle=i%3?l.color:l.secondary;g.fillStyle=g.strokeStyle;
    const r=.002+.006*noise(i+10);
    if(l.type==='meteors') {
      x=(.5-p)*spread+(noise(i+11)-.5)*.4;y=(p-.5)*.85;
      const tail=g.createLinearGradient(x,y,x+.11,y-.08);tail.addColorStop(0,l.secondary);tail.addColorStop(1,l.color+'00');
      g.strokeStyle=tail;g.lineWidth=r;line(g,x,y,x+.11,y-.08);
    } else if(l.type==='sparks') {
      x+=.04*sin(a+t);g.lineWidth=r*.6;line(g,x-r*2,y,x+r*2,y);line(g,x,y-r*2,x,y+r*2);
    }
    ellipse(g,x,y,r,r);g.fill();
  }
}
function frost(g,l,t,n) {
  for(let i=0;i<n;i++) {
    const a=i*2.4, r=(.2+.2*noise(i))*l.spread/100;
    g.save();g.translate(r*cos(a),r*sin(a));g.rotate(t*.09+a);g.lineWidth=.0025;
    for(let j=0;j<6;j++) {
      g.rotate(TAU/6);line(g,0,0,0,-.042);line(g,0,-.022,.012,-.034);line(g,0,-.022,-.012,-.034);
    }
    g.restore();
  }
}
function rings(g,l,t,n) {
  const count=Math.min(8,Math.ceil(n/3));
  for(let i=0;i<count;i++) {
    const p=fract(t*.17+i/count);g.save();
    g.globalAlpha*=1-p;g.lineWidth=.004+(1-p)*.009;
    if(l.type==='hologram') {
      const y=p-.5;g.fillStyle=l.color;g.fillRect(-.4*l.spread/100,y,.8*l.spread/100,.009);
      line(g,-.4,y+.018,-.16+.06*sin(t+i),y+.018);
    } else {
      const r=(l.type==='aura'?.31+.04*sin(t+i):.06+.42*p)*l.spread/100;
      g.rotate(l.type==='aura'?sin(t*.3+i)*.7:0);ellipse(g,0,0,r,r*(l.type==='aura'?.55:.74));g.stroke();
    }
    g.restore();
  }
}
export function paint(g,l,time,width,height,quality=1) {
  const t=time*l.speed/100,unit=Math.min(width,height)*l.size/100;
  const n=Math.max(2,Math.round((4+l.density*.19)*quality));
  g.save();g.translate(width*l.x/100,height*l.y/100);g.rotate(l.direction*Math.PI/180);g.scale(unit,unit);
  g.globalAlpha=(l.opacity/100)*(l.intensity/100);
  g.globalCompositeOperation='screen';g.strokeStyle=l.secondary;g.shadowColor=l.color;
  g.shadowBlur=l.brightness/100*5*quality;
  if(l.blur && 'filter' in g)g.filter='blur('+l.blur*quality*.35+'px)';
  switch(l.type) {
    case 'smoke': case 'cloud': case 'storm':
      vapor(g,l,t,n);if(l.type==='storm')lightning(g,l,t);break;
    case 'fire':flames(g,l,t,n);break;
    case 'galaxy':halo(g,0,0,.2,l.color);particles(g,l,t,n);break;
    case 'sparks':case 'meteors':particles(g,l,t,n);break;
    case 'frost':frost(g,l,t,n);break;
    case 'glow':
      for(let i=0;i<Math.ceil(n/4);i++) {
        const a=i*2.4+t*.15,r=.22*l.spread/100;
        halo(g,r*cos(a),r*sin(a),.12+.09*(1+sin(t+i)),i%2?l.color:l.secondary);
      }break;
    default:rings(g,l,t,n);
  }
  g.restore();
}
