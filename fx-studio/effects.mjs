import {drawVolume} from './volume.mjs';
// Normalized coordinates across all aspect ratios. No random jitter between frames.
const TAU=Math.PI*2, sin=Math.sin, cos=Math.cos;
const fract=n=>n-Math.floor(n);
const noise=n=>fract(sin(n*127.1+311.7)*43758.5453);
function ellipse(g,x,y,rx,ry) {
  g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);
}
function line(g,x,y,x2,y2) {g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();}
function halo(g,x,y,r,col) {
  const grad=g.createRadialGradient(x,y,0,x,y,r);
  grad.addColorStop(0,col);grad.addColorStop(1,col+'00');
  g.fillStyle=grad;g.fillRect(x-r,y-r,2*r,2*r);
}
function lightning(g,l,t) {
  const phase=fract(t*.38);
  if(phase>.23) return;
  const cycle=Math.floor(t*.38), x=(noise(cycle)-.5)*.6;
  g.save();g.globalAlpha*=.45+.55*Math.pow(cos(phase*22),2);g.strokeStyle=l.secondary;g.lineWidth=.008;
  g.globalCompositeOperation='screen';
  halo(g,x,-.09,.19,l.secondary);
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
    const depth=(i+1)/n;
    const h=(.15+.4*Math.sin(p*Math.PI))*(.7+.45*depth),sway=.07*sin(t*2+i);
    g.save();g.globalAlpha*=.48+.52*depth;
    const grad=g.createLinearGradient(0,y,0,y-h);
    grad.addColorStop(0,l.secondary);grad.addColorStop(.42,l.color);grad.addColorStop(1,l.color+'00');
    g.fillStyle=grad;g.beginPath();g.moveTo(x-.07,y);
    g.bezierCurveTo(x-.15,y-h*.5,x+sway,y-h*.8,x+sway*2,y-h);
    g.bezierCurveTo(x+sway*.6,y-h*.32,x+.14,y-h*.48,x+.07,y);g.fill();
    g.fillStyle=l.secondary;g.globalAlpha*=.62;g.beginPath();g.moveTo(x-.035,y);
    g.quadraticCurveTo(x-.05,y-h*.21,x+sway*.7,y-h*.62);
    g.quadraticCurveTo(x+.052,y-h*.25,x+.035,y);g.fill();g.restore();
  }
}
function particles(g,l,t,n) {
  for(let i=0;i<n*2;i++) {
    const depth=(i+1)/(n*2), perspective=.5+.75*depth;
    const a=i*2.39996, p=fract(noise(i+8)+t*(.05+noise(i)*.18)*perspective), spread=l.spread/100;
    g.save();g.globalAlpha*=.48+.52*depth;
    let x=(noise(i+31)-.5)*spread,y=(.5-p)*.9;
    if(l.type==='galaxy') {
      const r=Math.sqrt(i/(n*2))*.5*spread,theta=(i%3)*TAU/3+r*10+t*.18+noise(i)*.4;
      x=r*cos(theta);y=r*.48*sin(theta)+.03*cos(a+t*.16)*perspective;
    }
    g.strokeStyle=i%3?l.color:l.secondary;g.fillStyle=g.strokeStyle;
    const r=(.002+.006*noise(i+10))*perspective;
    if(l.type==='meteors') {
      x=(.5-p)*spread+(noise(i+11)-.5)*.4;y=(p-.5)*.85;
      const tail=g.createLinearGradient(x,y,x+.11*perspective,y-.08*perspective);tail.addColorStop(0,l.secondary);tail.addColorStop(1,l.color+'00');
      g.strokeStyle=tail;g.lineWidth=r;line(g,x,y,x+.11*perspective,y-.08*perspective);
    } else if(l.type==='sparks') {
      x+=.04*sin(a+t);g.lineWidth=r*.6;line(g,x-r*2,y,x+r*2,y);line(g,x,y-r*2,x,y+r*2);
    }
    ellipse(g,x,y,r,r);g.fill();g.restore();
  }
}
function frost(g,l,t,n) {
  for(let i=0;i<n;i++) {
    const a=i*2.4, r=(.2+.2*noise(i))*l.spread/100;
    g.save();g.translate(r*cos(a),r*sin(a));g.rotate(t*.09+a);g.lineWidth=.0025;
    for(let j=0;j<6;j++) {
      g.rotate(TAU/6);
      g.fillStyle=j%3===0?l.secondary:l.color;g.beginPath();g.moveTo(0,0);
      g.lineTo(-.01,-.018);g.lineTo(0,-.056);g.closePath();g.fill();
      line(g,0,0,0,-.052);line(g,0,-.022,.012,-.034);line(g,0,-.022,-.012,-.034);
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
      const y=(p-.5)*.8,r=(.32+.06*cos(y*4))*l.spread/100;
      g.strokeStyle=l.color;ellipse(g,0,y,r,.047);g.stroke();
      g.strokeStyle=l.secondary;g.beginPath();g.ellipse(0,y,r,.047,0,.12,1.9);g.stroke();
    } else {
      const r=(l.type==='aura'?.31+.04*sin(t+i):.06+.42*p)*l.spread/100;
      g.rotate(l.type==='aura'?sin(t*.3+i)*.7:0);const tilt=l.type==='aura'?.48+.13*cos(t*.4+i):.58;
      g.strokeStyle=l.color;ellipse(g,0,0,r,r*tilt);g.stroke();
      g.strokeStyle=l.secondary;g.lineWidth*=1.55;g.beginPath();g.ellipse(0,0,r,r*tilt,0,.25,2.4);g.stroke();
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
      drawVolume(g,l,t,n);if(l.type==='storm')lightning(g,l,t);break;
    case 'fire':flames(g,l,t,n);break;
    case 'galaxy':halo(g,0,0,.2,l.color);particles(g,l,t,n);break;
    case 'sparks':case 'meteors':particles(g,l,t,n);break;
    case 'frost':frost(g,l,t,n);break;
    case 'glow':
      for(let i=0;i<Math.ceil(n/4);i++) {
        const a=i*2.4+t*.15,r=.22*l.spread/100;
        const depth=(1+sin(a))/2,x=r*cos(a),y=r*.62*sin(a);
        halo(g,x,y,(.11+.07*(1+sin(t+i)))*(.76+.48*depth),i%2?l.color:l.secondary);
        halo(g,x-.01,y-.014,.018+.023*depth,l.secondary);
      }break;
    default:rings(g,l,t,n);
  }
  g.restore();
}
