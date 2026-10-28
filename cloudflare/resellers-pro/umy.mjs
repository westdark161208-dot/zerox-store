import {SUPPORT,fail,jsonBody,uuid} from './accounts.mjs';
export function umyReady(env){return !!(env.UMY_WHATSAPP_TOKEN&&/^\d+$/.test(env.UMY_PHONE_NUMBER_ID||'')&&/^v\d+\.0$/.test(env.UMY_GRAPH_VERSION||'')&&/^[a-z0-9_]+$/.test(env.UMY_APPLICATION_TEMPLATE||''));}
export function applicationText(a){return `🌸 Umy · Solicitud Zero’X Resellers\n\n📋 Folio: ${a.id}\n📧 Correo: ${a.email}\n👤 Usuario: ${a.username}\n🏪 Tienda: ${a.store_name}\n📱 WhatsApp: ${a.phone}\n📈 Ventas semanales: ${a.weekly_sales}\n💬 Motivo: ${a.reason}\n\n💵 Depósito inicial mínimo: $200 MXN. Conservará el importe en saldo después de verificar el pago.\n📎 Comprobante adjunto. Validar antes de aprobar o acreditar.\n🔐 Revisión: https://zeroxstore.com/control#r-control`;}
export async function notifyApplication(env,id){
 if(!umyReady(env))return 'pending';
 const claim=await env.DB.prepare("UPDATE zx_r_umy_outbox SET status='sending',last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE application_id=? AND status IN ('pending','failed')").bind(id).run();
 if(!claim.meta.changes)return (await env.DB.prepare('SELECT status FROM zx_r_umy_outbox WHERE application_id=?').bind(id).first())?.status||'pending';
 let sending=false;
 try{
  const a=await env.DB.prepare('SELECT * FROM zx_r_applications WHERE id=?').bind(id).first();if(!a)throw new Error('MISSING_APPLICATION');
  const file=await env.MEDIA.get(a.receipt_key);if(!file)throw new Error('MISSING_RECEIPT');
  const bytes=file.arrayBuffer?await file.arrayBuffer():await new Response(file.body).arrayBuffer();
  const root=`https://graph.facebook.com/${env.UMY_GRAPH_VERSION}/${env.UMY_PHONE_NUMBER_ID}`;
  const form=new FormData();form.set('messaging_product','whatsapp');form.set('type',a.receipt_mime);form.set('file',new Blob([bytes],{type:a.receipt_mime}),'comprobante.'+(a.receipt_mime==='image/png'?'png':'jpg'));
  const headers={Authorization:'Bearer '+env.UMY_WHATSAPP_TOKEN};const media=await fetch(root+'/media',{method:'POST',headers,body:form,signal:AbortSignal.timeout(15000)});const uploaded=await media.json();if(!media.ok||!uploaded.id)throw new Error('MEDIA_REJECTED');
  // Approved template: image header and seven body text variables, in this order.
  const values=[a.id,a.email,a.username,a.store_name,a.phone,String(a.weekly_sales),a.reason];
  const payload={messaging_product:'whatsapp',to:SUPPORT,type:'template',template:{name:env.UMY_APPLICATION_TEMPLATE,language:{code:env.UMY_TEMPLATE_LANGUAGE||'es_MX'},components:[{type:'header',parameters:[{type:'image',image:{id:uploaded.id}}]},{type:'body',parameters:values.map(v=>({type:'text',text:v.replace(/\s+/g,' ').slice(0,1500)}))}]}};
  sending=true;
  const res=await fetch(root+'/messages',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
  const data=await res.json();if(!res.ok){if(res.status>=400&&res.status<500)sending=false;throw new Error('MESSAGE_REJECTED')}
  if(!data.messages?.[0]?.id)throw new Error('NO_MESSAGE_ID');
  await env.DB.prepare("UPDATE zx_r_umy_outbox SET status='accepted',message_id=?,updated_at=CURRENT_TIMESTAMP WHERE application_id=?").bind(data.messages[0].id,id).run();return 'accepted';
 }catch(e){const status=sending?'uncertain':'failed';await env.DB.prepare('UPDATE zx_r_umy_outbox SET status=?,last_error=?,updated_at=CURRENT_TIMESTAMP WHERE application_id=?').bind(status,sending?'CHECK_WHATSAPP_BEFORE_RETRY':'NOT_SENT',id).run();return status}
}
export async function umyRoute(request,env,url,user,json){
 if(!url.pathname.startsWith('/api/admin/resellers/portal/umy'))return null;
 if(!user.isFounder)fail('FORBIDDEN',403);
 if(request.method==='GET'){const rows=await env.DB.prepare('SELECT application_id,status,last_error,updated_at FROM zx_r_umy_outbox ORDER BY updated_at DESC LIMIT 100').all();return json({ok:true,configured:umyReady(env),recipient:SUPPORT,notifications:rows.results});}
 if(request.method==='POST'&&url.pathname.endsWith('/retry')){const b=await jsonBody(request);if(!uuid(b.id))fail('INVALID_ID');return json({ok:true,status:await notifyApplication(env,b.id)});}
 return null;
}
