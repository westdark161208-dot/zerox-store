// Inputs must be identities resolved by currentUser(), never request JSON.
const CREATOR = new Set(['catalog.manage', 'content.manage', 'resellers.manage',
  'payments.test', 'providers.read', 'wallet.audit']);
export function permissionsFor(user) {
  if (!user || user.status !== 'active') return [];
  return ['sessions.self', 'wallet.self', ...(user.isFounder === true ? CREATOR : [])];
}
export function can(user, permission) {
  return permissionsFor(user).includes(permission);
}
// Role assignment and critical financial writes are deliberately not exposed here.
