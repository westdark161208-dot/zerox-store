import {DatabaseSync} from 'node:sqlite';
// Dedicated local journal, never the store or Zerito databases. Keep on durable disk.
export class Journal {
 constructor(path){this.db=new DatabaseSync(path);this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
 CREATE TABLE IF NOT EXISTS requests(nonce TEXT PRIMARY KEY,at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS operations(id TEXT PRIMARY KEY,hash TEXT NOT NULL,reference TEXT,result TEXT NOT NULL);`);}
 authorize(nonce,now){
 this.db.exec('BEGIN IMMEDIATE');try{
 this.db.prepare('DELETE FROM requests WHERE at<?').run(now-120000);
 const count=this.db.prepare('SELECT COUNT(*) AS n FROM requests WHERE at>?').get(now-60000).n;
 if(count>=30||this.db.prepare('SELECT 1 FROM requests WHERE nonce=?').get(nonce)){this.db.exec('ROLLBACK');return false;}
 this.db.prepare('INSERT INTO requests VALUES(?,?)').run(nonce,now);this.db.exec('COMMIT');return true;
 }catch(e){this.db.exec('ROLLBACK');throw e;}}
 claim(id,hash){const changed=this.db.prepare("INSERT OR IGNORE INTO operations(id,hash,result) VALUES(?,?,?)").run(id,hash,JSON.stringify({status:'UNKNOWN'})).changes;return {created:changed===1,...this.get(id)};}
 get(id){const row=this.db.prepare('SELECT * FROM operations WHERE id=?').get(id);return row?{...row,result:JSON.parse(row.result)}:null;}
 save(id,result){this.db.prepare('UPDATE operations SET result=?,reference=COALESCE(?,reference) WHERE id=?').run(JSON.stringify(result),result.reference||null,id);}
 close(){this.db.close();}
}
