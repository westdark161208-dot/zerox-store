// Local only: creates a one-time access code and hashed SQL in a private directory.
// No network, stdout credentials, production credentials, or RA secrets.
import {mkdir,writeFile} from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {FOUNDER_USER_ID} from '../security/founder.mjs';
const dir=resolve(process.argv[2]||'');
if(!process.argv[2]||dir.includes('zerox-store')||dir.includes('zerox-ra-staging-review'))throw Error('Choose a private directory outside the repository');
await mkdir(dir,{mode:0o700,recursive:false});
const code=randomBytes(32).toString('base64url'),hash=createHash('sha256').update(code).digest('base64');
const expiry=new Date(Date.now()+15*60000).toISOString();
await writeFile(resolve(dir,'access-code.txt'),code,{mode:0o600,flag:'wx'});
await writeFile(resolve(dir,'grant.sql'),`INSERT INTO zx_login_grants(token_hash,user_id,expires_at) VALUES('${hash}','${FOUNDER_USER_ID}','${expiry}');\n`,{mode:0o600,flag:'wx'});
console.log('Private files prepared; grant expires in 15 minutes. No remote changes.');
