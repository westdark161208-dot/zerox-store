// Customer checkout deliberately excludes cash/OXXO: cash is a manual wallet credit.
export function publicMethods(method='all'){
 if(!['all','card','spei'].includes(method))throw Error('INVALID_PAYMENT_METHOD');
 const excluded=method==='card'?['account_money','ticket','bank_transfer','atm']:method==='spei'?['credit_card','debit_card','account_money','ticket','atm']:['ticket','atm'];
 return {excluded_payment_types:excluded.map(id=>({id})),...(method==='spei'?{default_payment_method_id:'clabe'}:{})};
}
export function validContact(value){return typeof value==='string'&&/^\+?[0-9 ()-]{8,24}$/.test(value)&&value.replace(/\D/g,'').length>=8&&value.replace(/\D/g,'').length<=15;}
export async function saveContact(db,orderId,userId,phone){if(!validContact(phone))return;await db.prepare('CREATE TABLE IF NOT EXISTS zx_purchase_contacts(order_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,phone TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();await db.prepare('INSERT INTO zx_purchase_contacts(order_id,user_id,phone) VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(orderId,userId,phone).run();}
