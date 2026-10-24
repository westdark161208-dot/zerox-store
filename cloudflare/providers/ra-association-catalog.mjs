// Administrative classification/recipe preview only. No network, prices or purchase flags changed.
import {createPlanner} from '../diamonds/catalog.mjs';
const integer=s=>Number(s.replace(/[.,]/g,''));
export function directDiamondPack(item,pack){
 const name=String(item?.name||'');
 if(item?.type!=='recharge'||!Number.isSafeInteger(item.id)||item.id<1||typeof item.sku!=='string'||!item.sku.trim()||
 !/\bfree\s*fire\b/i.test(name)||!/diamant|diamond/i.test(name)||
 /\b(pin|gift|code|codigo|código|tarjeta|card|membership|membres[ií]a|weekly|monthly|semanal|mensual|pase|pass|booyah)\b/i.test(name)||
 item.requiredFields?.length!==1||!['manual_id','player_id'].includes(item.requiredFields[0])||!Number.isFinite(Number(item.price))||Number(item.price)<=0)return false;
 // Require an explicit base + bonus statement, not a coincidental number elsewhere in the name.
 const expression=name.match(/(\d[\d.,]*)\s*(?:diamantes?|diamonds?)?\s*\+\s*(\d[\d.,]*)\s*(%)?/i);
 if(!expression||integer(expression[1])!==pack.base)return false;
 const bonus=expression[3]?pack.base*integer(expression[2])/100:integer(expression[2]);
 return bonus===pack.bonus&&pack.base+bonus===pack.total;
}
export function namedRegions(item){
 // The verified read contract has no structured region. Only explicit codes constrain it;
 // absence of a code is NOT evidence of global coverage. Founder must confirm coverage.
 const codes=String(item.name||'').match(/\b(?:US|BR|SAC|LATAM|EU|NA|IND|ID|SG|ME|TH|VN)\b/g)||[];
 return [...new Set(codes)];
}
export function compatibleAssociation(entry,pack,items){
 if(!entry)return false;
 const found=items.filter(i=>i.id===entry.productId),item=found[0];
 return found.length===1&&items.filter(i=>i.sku===entry.sku).length===1&&directDiamondPack(item,pack)&&
 item.sku===entry.sku&&item.name===entry.name&&entry.baseDiamonds===pack.base&&entry.bonusDiamonds===pack.bonus&&
 item.requiredFields[0]===(entry.playerField||'player_id')&&Array.isArray(entry.regions)&&entry.regions.length>0&&
 (!namedRegions(item).length||entry.regions.every(r=>namedRegions(item).includes(r)));
}
export function associationRecipes(products,associations){
 const regions=[...new Set(associations.flatMap(a=>a.status==='configured'?a.entry.regions:[]))].sort();
 if(!regions.length)return products.map(p=>({...p,status:'pending',recipes:[]}));
 const max=Math.max(1,...products.map(p=>p.diamonds));
 const planners=regions.map(region=>{
  const packs=associations.filter(a=>a.status==='configured'&&a.entry.regions.includes(region)).map(a=>({diamonds:a.total,costCents:1,productId:a.entry.productId,sku:a.entry.sku,baseDiamonds:a.entry.baseDiamonds,bonusDiamonds:a.entry.bonusDiamonds,playerField:a.entry.playerField}));
  return {region,plan:createPlanner(packs,max)};
 });
 return products.map(p=>{
  const recipes=[];for(const {region,plan} of planners){try{const packs=plan(p.diamonds).map(({costCents,...pack})=>pack);recipes.push({region,total:p.diamonds,operationCount:packs.reduce((n,x)=>n+x.quantity,0),packs});}catch{}}
  return {...p,status:recipes.length?'configured':'pending',recipes};
 });
}
