import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const renderSource=source.slice(source.indexOf('function renderFreeFireCard('),source.indexOf('\n$("#zx-ff-form")'));
const render=vm.runInNewContext(renderSource+';renderFreeFireCard',{ZEROX_API:'https://example.test',Intl,esc:v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')});
test('shared player card escapes external profile text and bounds remote item image identifiers',()=>{
 const html=render({basicInfo:{nickname:'<img src=x onerror=alert(1)>',level:76,rank:314,liked:0,region:'US'},profileInfo:{avatarId:"x' onerror=alert(1)",clothes:['12345678','bad']},clanBasicInfo:{clanName:'<script>secret</script>'}},'1136210821');
 assert(!html.includes('<script>'));assert(html.includes('&lt;img'));assert(!html.includes('itemID=x'));assert(html.includes('itemID=12345678'));assert(html.includes('nivel.png'));assert(html.includes('rango.png'));assert(html.includes('likes.png'));assert(html.includes('region.png'));assert(html.includes('clan.png'));assert(html.includes('<strong>0</strong>'));
});
