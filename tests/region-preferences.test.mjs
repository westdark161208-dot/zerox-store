import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Exercise real selector events and storage without calling any live API.
function setup(saved, blocked=false) {
  class Element extends EventTarget {
    value=''; dataset={}; children=[]; hidden=true; textContent=''; attrs={}; open=false;
    replaceChildren(...children){this.children=children;}
    setAttribute(key,value){this.attrs[key]=value;}
    showModal(){this.open=true;}
    close(){this.open=false;}
    focus(){this.focused=true;}
    append(child){this.children.push(child);}
    click(){this.dispatchEvent(new Event('click'));}
    scrollIntoView(){this.scrolled=true;}
  }
  const ids=['zx-region-dialog','zx-region-open','zx-country','currency','zx-region-rate','zx-payment-methods','zx-region-close','zx-region-done','zx-currency-carousel','zx-currency-prev','zx-currency-next','zx-guide-currency'];
  const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
  const writes=[]; let rendered='';
  elements.currency.addEventListener('change',()=>{rendered=elements.currency.value;});
  const ctx=vm.createContext({Event,document:{getElementById:id=>elements[id],createElement:()=>new Element()},localStorage:{
    getItem(){if(blocked)throw Error('Storage denied');return saved;},
    setItem(key,value){if(blocked)throw Error('Storage denied');writes.push(JSON.parse(value));}
  }});
  vm.runInContext(readFileSync(new URL('../regional-config.js',import.meta.url),'utf8'),ctx);
  vm.runInContext(readFileSync(new URL('../region-selector.js',import.meta.url),'utf8'),ctx);
  return {elements,writes,rendered:()=>rendered};
}
test('country and currency restore independently and update the existing price renderer',()=>{
  const {elements:e,writes,rendered}=setup('{"country":"US","currency":"COP"}');
  assert.equal(e['zx-country'].value,'US'); assert.equal(rendered(),'COP');
  e['zx-country'].value='MX';e['zx-country'].dispatchEvent(new Event('change'));
  assert.equal(e.currency.value,'COP'); assert.deepEqual(writes.at(-1),{country:'MX',currency:'COP'});
  e.currency.value='USD';e.currency.dispatchEvent(new Event('change'));
  assert.equal(e['zx-country'].value,'MX'); assert.equal(rendered(),'USD');
  assert.match(e['zx-region-rate'].textContent,/estimados/);
  assert.equal(e['zx-payment-methods'].hidden,true);
});
test('corrupt or unsupported saved preferences recover to Mexico/MXN',()=>{
  for(const saved of ['{','{"country":"??","currency":"BAD"}','null']) {
    const {elements:e,rendered}=setup(saved);
    assert.equal(e['zx-country'].value,'MX'); assert.equal(rendered(),'MXN');
  }
});
test('blocked storage does not prevent changing preferences or opening/closing selector',()=>{
  const {elements:e}=setup(null,true);
  e['zx-region-open'].dispatchEvent(new Event('click'));assert.equal(e['zx-region-dialog'].open,true);
  e.currency.value='USD';e.currency.dispatchEvent(new Event('change'));
  assert.match(e['zx-region-open'].attrs['aria-label'],/México.*USD/);
  e['zx-region-done'].dispatchEvent(new Event('click'));
  assert.equal(e['zx-region-dialog'].open,false);assert.equal(e['zx-region-open'].focused,true);
});
test('currency carousel updates actual price renderer and preserves independent country',()=>{
 const {elements:e,rendered}=setup('{"country":"MX","currency":"MXN"}');const cards=e['zx-currency-carousel'].children;assert.equal(cards.length,5);cards[1].click();assert.equal(rendered(),'USD');assert.equal(e['zx-country'].value,'MX');assert.equal(cards[1].attrs['aria-pressed'],'true');e['zx-currency-prev'].click();assert.equal(rendered(),'MXN');e['zx-currency-prev'].click();assert.equal(rendered(),'BRL');e['zx-guide-currency'].click();assert.equal(e['zx-region-dialog'].open,true);
});
