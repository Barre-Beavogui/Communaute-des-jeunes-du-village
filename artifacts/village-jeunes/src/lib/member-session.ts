export const MEMBER_TOKEN_KEY = "zoboroma_member_token";
export const MEMBER_PROFILE_KEY = "zoboroma_member_profile";
export const MEMBER_EXPIRES_KEY = "zoboroma_member_expires";

// La session membre est gardée dans localStorage pour survivre à la fermeture
// de l’onglet ou du navigateur (le jeton reste valable 30 jours côté API).
// Les anciennes sessions enregistrées dans sessionStorage sont reprises.
function readItem(key: string) {
  try {
    const value = localStorage.getItem(key);
    if (value !== null) return value;
    const legacy = sessionStorage.getItem(key);
    if (legacy !== null) {
      localStorage.setItem(key, legacy);
      sessionStorage.removeItem(key);
    }
    return legacy;
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Stockage indisponible (navigation privée stricte) : la session
    // ne sera simplement pas retenue.
  }
}

function removeItem(key: string) {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    // Rien à nettoyer si le stockage est indisponible.
  }
}

export function getMemberToken() {
  return hasMemberSession() ? readItem(MEMBER_TOKEN_KEY) : null;
}

export type MemberIdentity = {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
};

export function getMemberIdentity(): MemberIdentity | null {
  const raw = readItem(MEMBER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MemberIdentity;
  } catch {
    clearMemberSession();
    return null;
  }
}

export function saveMemberSession(session: {
  token: string;
  expiresAt: string;
  profile: MemberIdentity;
}) {
  writeItem(MEMBER_TOKEN_KEY, session.token);
  writeItem(MEMBER_EXPIRES_KEY, session.expiresAt);
  writeItem(MEMBER_PROFILE_KEY, JSON.stringify(session.profile));
  window.dispatchEvent(new Event("zoboroma-member-session"));
}

export function updateMemberIdentity(profile: MemberIdentity) {
  writeItem(MEMBER_PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event("zoboroma-member-session"));
}

export function clearMemberSession() {
  removeItem(MEMBER_TOKEN_KEY);
  removeItem(MEMBER_EXPIRES_KEY);
  removeItem(MEMBER_PROFILE_KEY);
  window.dispatchEvent(new Event("zoboroma-member-session"));
}

export function hasMemberSession() {
  const token = readItem(MEMBER_TOKEN_KEY);
  const expiresAt = readItem(MEMBER_EXPIRES_KEY);
  if (!token) return false;
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
    clearMemberSession();
    return false;
  }
  return true;
}
