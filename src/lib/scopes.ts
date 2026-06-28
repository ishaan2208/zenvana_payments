import { apiGet, apiPost } from "@/lib/api-client";
import {
  type PortalProfile,
  setPortalProfile,
  setPortalToken,
} from "@/lib/auth";

export type PortalScopeType = "PROPERTY" | "RESTAURANT";

export type AccessibleScope = {
  scopeType: PortalScopeType;
  scopeId: number;
  name: string;
};

export type ScopesResponse = {
  scopes: AccessibleScope[];
  current: { scopeType: PortalScopeType; scopeId: number };
};

type SwitchScopeResponse = {
  token: string;
  profile: PortalProfile;
};

/** A stable key for a scope, since property #3 and restaurant #3 collide on id. */
export function scopeKey(scope: { scopeType: PortalScopeType; scopeId: number }) {
  return `${scope.scopeType}:${scope.scopeId}`;
}

export function listAccessibleScopes(token: string): Promise<ScopesResponse> {
  return apiGet<ScopesResponse>("/scopes", token);
}

/**
 * Switches the active property/restaurant. On success the new portal token and
 * profile are persisted so the next request (after a reload) is scoped correctly.
 */
export async function switchActiveScope(
  token: string,
  target: { scopeType: PortalScopeType; scopeId: number }
): Promise<SwitchScopeResponse> {
  const result = await apiPost<SwitchScopeResponse>("/scopes/switch", target, token);
  setPortalToken(result.token);
  setPortalProfile(result.profile);
  return result;
}
