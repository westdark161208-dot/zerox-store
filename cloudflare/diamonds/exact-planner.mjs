// Exact bounded/unbounded knapsack. Monetary units are BigInt; no candidate truncation.
export function decimalUnits(value, digits=6){
 const s=String(value),m=/^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(s);
 if(!m|| (m[2]||'').length>digits)throw Error('INVALID_DECIMAL');
 return BigInt(m[1])*10n**BigInt(digits)+BigInt((m[2]||'').padEnd(digits,'0')||'0');
}
const stable=(a,b)=>a.key<b.key?-1:a.key>b.key?1:0;
export function exactPlan(input,amount,{maxOperations=amount,budgetUnits=null}={}){
 if(!Number.isSafeInteger(amount)||amount<1||!Number.isSafeInteger(maxOperations)||maxOperations<1)throw Error('INVALID_LIMIT');
 const packs=[...input].sort(stable),dp=new Map([[0,new Map([[0,{cost:0n,counts:Array(packs.length).fill(0)}]])]]);
 if(new Set(packs.map(p=>p.key)).size!==packs.length)throw Error('DUPLICATE_PACK');
 const signature=s=>s.counts.join(',');
 for(let i=0;i<packs.length;i++){
  const p=packs[i];if(!Number.isSafeInteger(p.diamonds)||p.diamonds<1||typeof p.units!=='bigint'||p.units<0n||p.stock!==undefined&&(!Number.isSafeInteger(p.stock)||p.stock<0))throw Error('INVALID_PACK');
  let remaining=Math.min(Math.floor(amount/p.diamonds),maxOperations,p.stock??maxOperations);
  for(let size=1;remaining;size*=2){
   const q=Math.min(size,remaining);remaining-=q;const delta=q*p.diamonds,cost=BigInt(q)*p.units;
   // Descending amounts ensure each binary inventory group is consumed at most once.
   for(const n of [...dp.keys()].sort((a,b)=>b-a)){
    const target=n+delta;if(target>amount)continue;
    for(const [ops,s] of [...dp.get(n)]){
     const nextOps=ops+q,nextCost=s.cost+cost;if(nextOps>maxOperations||budgetUnits!==null&&nextCost>budgetUnits)continue;
     let states=dp.get(target);if(!states){states=new Map();dp.set(target,states);}
     const counts=[...s.counts];counts[i]+=q;const next={cost:nextCost,counts};
     const old=states.get(nextOps);if(old&&(old.cost<nextCost||old.cost===nextCost&&signature(old)<=signature(next)))continue;
     if([...states].some(([k,v])=>k<nextOps&&v.cost<=nextCost))continue;
     states.set(nextOps,next);for(const [k,v] of states)if(k>nextOps&&v.cost>=nextCost)states.delete(k);
    }
   }
  }
 }
 const best=[...(dp.get(amount)||[])].sort(([oa,a],[ob,b])=>a.cost<b.cost?-1:a.cost>b.cost?1:oa-ob||signature(a).localeCompare(signature(b)))[0];
 if(!best)throw Error('NO_EXACT_RECIPE');
 return {totalUnits:best[1].cost,operationCount:best[0],packs:packs.flatMap((p,i)=>best[1].counts[i]?[{...p,quantity:best[1].counts[i]}]:[])};
}
