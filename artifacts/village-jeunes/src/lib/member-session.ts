export const MEMBER_TOKEN_KEY = "zoboroma_member_token";
export const MEMBER_PROFILE_KEY = "zoboroma_member_profile";
export const MEMBER_EXPIRES_KEY = "zoboroma_member_expires";

export type MemberIdentity = {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
};

export function getMemberIdentity(): MemberIdentity | null {
  const raw = sessionStorage.getItem(MEMBER_PROFILE_KEY);
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
  sessionStorage.setItem(MEMBER_TOKEN_KEY, session.token);
  sessionStorage.setItem(MEMBER_EXPIRES_KEY, session.expiresAt);
  sessionStorage.setItem(MEMBER_PROFILE_KEY, JSON.stringify(session.profile));
  window.dispatchEvent(new Event("zoboroma-member-session"));
}

export function clearMemberSession() {
  sessionStorage.removeItem(MEMBER_TOKEN_KEY);
  sessionStorage.removeItem(MEMBER_EXPIRES_KEY);
  sessionStorage.removeItem(MEMBER_PROFILE_KEY);
  window.dispatchEvent(new Event("zoboroma-member-session"));
}

export function hasMemberSession() {
  const token = sessionStorage.getItem(MEMBER_TOKEN_KEY);
  const expiresAt = sessionStorage.getItem(MEMBER_EXPIRES_KEY);
  if (!token) return false;
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
    clearMemberSession();
    return false;
  }
  return true;
}
