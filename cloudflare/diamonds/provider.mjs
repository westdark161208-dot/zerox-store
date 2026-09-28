// No endpoint, SKU, credential or successful response is assumed.
export const disabledProvider=Object.freeze({
 enabled:false,name:'unconfigured',supportsIdempotency:false,
 async submit(){throw Error('PROVIDER_NOT_CONFIGURED');},
 async lookup(){return {status:'UNKNOWN'};},
 async verifyPlayer(){return {available:false};}
});
/* Future adapter contract:
 submit({sku,playerId,idempotencyKey}) / lookup({idempotencyKey,reference})
 return {status:SUCCESS|PROCESSING|NOT_ACCEPTED|UNKNOWN,reference?,receipt?}.
 NOT_ACCEPTED must mean provider has authoritatively confirmed no charge/delivery.
 A timeout or 5xx is UNKNOWN, never NOT_ACCEPTED.
 Adapter must redact credentials and personal data from receipt; cap it to 4 KB.
 */
