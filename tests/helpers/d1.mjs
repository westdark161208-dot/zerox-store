import {DatabaseSync} from 'node:sqlite';
// Synchronous transaction body models D1.batch atomicity even when callers overlap.
export function database() {
  const sql=new DatabaseSync(':memory:');
  const wrap=(text,args=[])=>({
    bind(...values){return wrap(text,values)},
    async first(){return sql.prepare(text).get(...args)||null},
    async all(){return {results:sql.prepare(text).all(...args)}},
    runSync(){return {meta:{changes:Number(sql.prepare(text).run(...args).changes)}}},
    async run(){return this.runSync()}
  });
  return {sql,prepare:wrap,async batch(statements){
    sql.exec('BEGIN');
    try {const result=statements.map(s=>s.runSync());sql.exec('COMMIT');return result}
    catch(error){sql.exec('ROLLBACK');throw error}
  }};
}
