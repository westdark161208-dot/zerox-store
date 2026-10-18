// Fail closed once the private transport is configured, even if its enable flag is lost.
export const raPrivateMode = env => env?.RA_ADMIN_READ_ENABLED === 'true' || env?.RA_ADMIN_READ_TRANSPORT === 'service-binding';
export const raFinancialConflict = env => ['RA_DELIVERY_ENABLED','RA_CONTRACT_VERIFIED','DIAMOND_PRODUCTION_ENABLED'].some(key => env?.[key] === 'true' || env?.[key] === true);
export function requireLegacyRa(env) { if (raPrivateMode(env)) throw Error('RA_PRIVATE_READ_ONLY'); }
