import {checkFounder} from './manual-recharges.js';
import {blank,change,publicView,VERSION} from '../../fx-studio/model.mjs';

const key='storefront/fx-studio/v1.json';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function onRequest({request,env}) {
  const edit=request.method==='POST';
  if(!edit && request.method!=='GET') return json({error:'METHOD'},405);
  const admin=edit||new URL(request.url).searchParams.has('editor');
  if(admin) {
    const denied=await checkFounder(request,env.STORE_IDENTITY);
    if(denied) return denied;
  }
  const store=env.MANUAL_APPEARANCE;
  if(!store) return json({error:'FX_STORAGE_UNAVAILABLE'},503);
  try {
    const file=await store.get(key);
    const state=file?await file.json():blank();
    if(state.version!==VERSION) return json({error:'UNSUPPORTED_VERSION'},409);
    const revision=file?.etag||'';
    if(!edit) return json(admin?{revision,state}:publicView(state));
    const body=await request.text();
    if(body.length>24000) return json({error:'TOO_LARGE'},413);
    let next;
    try {
      const input=JSON.parse(body);
      if(input.revision!==revision) return json({error:'CONFLICT'},409);
      next=change(state,input.command);
    } catch(e) {return json({error:e instanceof SyntaxError?'INVALID_JSON':e.message},400);}
    const data=JSON.stringify(next);
    if(data.length>4000000) return json({error:'FX_STORE_FULL'},413);
    const onlyIf=new Headers(revision?{'If-Match':'"'+revision+'"'}:{'If-None-Match':'*'});
    const saved=await store.put(key,data,{onlyIf,httpMetadata:{contentType:'application/json'}});
    return saved?json({revision:saved.etag}):json({error:'CONFLICT'},409);
  } catch {return json({error:'FX_STORAGE_UNAVAILABLE'},503);}
}
