export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

const WRITE_ROLES: readonly MemberRole[] = ["OWNER", "ADMIN", "MEMBER"];

export function canWrite(role: MemberRole | null): boolean {
  return role !== null && WRITE_ROLES.includes(role);
}

export function canRead(role: MemberRole | null): boolean {
  return role !== null;
}

/**
 * Returns the role of a user in a workspace, or null if not a member.
 * Callers must treat null as "not found" (not "forbidden") so that the
 * existence of other workspaces' resources is never leaked.
 */
export function roleFor(
  memberships: ReadonlyArray<{ workspaceId: string; role: MemberRole }>,
  workspaceId: string,
): MemberRole | null {
  return memberships.find((m) => m.workspaceId === workspaceId)?.role ?? null;
}
