// Scope of the first automatic RA delivery pilot. No production flags are modified here.
// Outside an expressly enabled pilot, preserve the existing checkout behavior.
export const FF110_PRODUCT_ID = 'zx-diamonds-110';
export const ff110PilotOnly = env => env?.RA_FF110_PILOT_ONLY === 'true';

export function assertFf110PilotProduct(env, product) {
  if (!ff110PilotOnly(env)) return;
  if (product?.id !== FF110_PRODUCT_ID || product?.diamonds !== 110) {
    throw Error('RA_FF110_PILOT_SCOPE');
  }
}

// Paid orders outside the authorized pilot must remain pending for manual review.
// Never submit them through RA in the pilot, including on resumed orders or webhooks.
export function ff110PilotDeliveryAllowed(env, order, plan) {
  if (!ff110PilotOnly(env)) return true;
  const p = plan?.packs?.[0];
  return order?.product_id === FF110_PRODUCT_ID &&
    order?.diamonds === 110 && plan?.provider === 'recargas-america' &&
    plan?.currency === 'USD' && plan?.region === 'US' && plan.packs.length === 1 &&
    p?.diamonds === 110 && p?.quantity === 1 &&
    p?.baseDiamonds === 100 && p?.bonusDiamonds === 10;
}

export function assertFf110PromotionPlan(env, line, preferred) {
  // Diamond bundles use a different payment+delivery engine and are not in scope
  // unless fulfilled entirely by Sixofire. This protects old ad/promotion flows.
  if (ff110PilotOnly(env) && line?.kind === 'diamonds' && preferred !== 'sixofire') {
    throw Error('PROMOTION_RA_PILOT_BLOCKED');
  }
}
