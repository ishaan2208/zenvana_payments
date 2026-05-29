const TOKEN_KEY = "paymentsPortalToken";
const PROFILE_KEY = "paymentsPortalProfile";

export type PortalProfile = {
  subUserId: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  propertyId: number | null;
  restaurantId: number | null;
  portalScope: "PROPERTY" | "RESTAURANT";
  userId: number;
};

export function getPortalToken(): string | null {
  if (typeof window === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${TOKEN_KEY}=`));
  if (!cookie) return null;
  return decodeURIComponent(cookie.split("=")[1] ?? "");
}

export function setPortalToken(token: string): void {
  if (typeof window === "undefined") return;
  const maxAgeSeconds = 60 * 60 * 12; // 12 hours
  const secureAttr = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureAttr}`;
}

export function clearPortalToken(): void {
  if (typeof window === "undefined") return;
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function setPortalProfile(profile: PortalProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getPortalProfile(): PortalProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PortalProfile;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPortalProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_KEY);
}

export function clearPortalSession(): void {
  clearPortalToken();
  clearPortalProfile();
}
