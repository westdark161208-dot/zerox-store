/* One shared price list and exact-combination planner for browser and Worker.
   Values are MXN cents. Reference prices supplied by the store owner, not costs. */
(()=>{
 const packs=[{id:'d110-u',amount:110,providerId:'9149',publicCents:1700},{id:'d340-u',amount:341,providerId:'27107',publicCents:5600},{id:'d572-u',amount:572,providerId:'2622',publicCents:8700},{id:'d1166-u',amount:1166,providerId:'5352',publicCents:17000},{id:'d2398-u',amount:2398,providerId:'9725',publicCents:31000},{id:'d6160-u',amount:6160,providerId:'5317',publicCents:72000}];
 const references=[[7073,71338],[7898,78848],[8899,89037],[10065,101243],[10956,108601],[11869,119858],[12892,126723],[14058,138929],[15059,149118],[15884,156628],[17116,168682],[18029,179939],[19052,186804],[19987,197145],[20878,204503],[22044,216709],[22957,227966],[23958,238155],[24981,245020],[25894,256277],[27038,264584],[27951,275841],[28886,286182],[30008,295405],[31141,305101],[31966,312611],[32879,323868],[33880,334057],[34936,343432],[35937,353621],[36960,360486],[37873,371743],[39039,383949],[39930,391307],[40865,401648],[42097,413702],[43120,420567],[44033,431824],[44858,439334],[45859,449523],[47025,461729],[47916,469087],[49082,481293],[49852,487209]];
 const discounts=[2,4,6,8,10,12,13];
 // Minimize separate recargas, using only the five packs requested for combinations.
 const coins=packs.slice(1).reverse(),count=new Int32Array(50001).fill(100000),choice=new Int16Array(50001).fill(-1);count[0]=0;
 for(let n=1;n<=50000;n++)for(let i=0;i<coins.length;i++){const p=coins[i];if(n>=p.amount&&count[n-p.amount]+1<count[n]){count[n]=count[n-p.amount]+1;choice[n]=i;}}
 function plan(amount){if(!Number.isInteger(amount)||amount<1||amount>50000)throw Error('INVALID_DIAMONDS');const exact=packs.find(p=>p.amount===amount);if(exact)return [{...exact,count:1}];if(choice[amount]<0)throw Error('NO_EXACT_COMBINATION');const counts=new Map();for(let n=amount;n>0;){const p=coins[choice[n]];counts.set(p.id,(counts.get(p.id)||0)+1);n-=p.amount;}return coins.filter(p=>counts.has(p.id)).map(p=>({...p,count:counts.get(p.id)}));}
 function describe(rows){return rows.map(p=>p.amount.toLocaleString('en-US')+(p.count>1?' × '+p.count:'')).join(' + ');}
 const combos=references.map(([amount,referenceCents])=>({id:'combo-'+amount,amount,referenceCents,publicCents:Math.ceil(referenceCents*115/10000)*100,plan:plan(amount)}));
 function price(publicCents,tier=0){if(!Number.isInteger(tier)||tier<0||tier>7)throw Error('INVALID_TIER');return tier?Math.ceil(publicCents*(100-discounts[tier-1])/100):publicCents;}
 const products=[...packs.map(p=>({...p,plan:plan(p.amount)})),...combos];
 globalThis.ZXDiamonds=Object.freeze({packs,combos,products,discounts,plan,describe,price});
})();
