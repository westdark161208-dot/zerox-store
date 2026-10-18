// Reuses the original provider section and styles; excludes all production scripts.
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../../',import.meta.url);
const source=await readFile(new URL('control.html',root),'utf8');
const section=source.match(/<section id="providers"[\s\S]*?<\/section>/)?.[0];
if(!section)throw Error('Original provider section missing');
const allowed=new Set(['ra-catalog-check','provider-check','provider-balance']);
let html=section.replace(/<button\b([^>]*)>/g,(all,attrs)=>allowed.has(attrs.match(/id="([^"]+)"/)?.[1])?all:all.replace('>',' disabled>'));
html=html.replace(/<form\b[^>]*>/g,'<form inert>');
const css=(await Promise.all(['control.css','panel-theme.css','console.css'].map(p=>readFile(new URL(p,root),'utf8')))).join('\n');
await writeFile(new URL('control-preview.mjs',import.meta.url),'// Generated from original panel; regenerate with build-control-preview.mjs\nexport const providerSection='+JSON.stringify(html)+';\nexport const controlStyle='+JSON.stringify(css)+';\n');
