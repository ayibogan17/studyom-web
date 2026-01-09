export const ROLE_KEYS = [
  "musician",
  "teacher",
  "producer",
  "studio_owner",
  "admin",
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

type RoleSource = {
  roles?: string[] | null;
  role?: string | null;
  isTeacher?: boolean | null;
  isProducer?: boolean | null;
  isStudioOwner?: boolean | null;
};

const roleKeySet = new Set(ROLE_KEYS);

export function normalizeRoles(source?: RoleSource | null): RoleKey[] {
  const roles = new Set<RoleKey>();
  if (!source) {
    roles.add("musician");
    return Array.from(roles);
  }

  if (Array.isArray(source.roles)) {
    source.roles.forEach((role) => {
      const normalized = typeof role === "string" ? role.trim().toLowerCase() : "";
      if (roleKeySet.has(normalized as RoleKey)) {
        roles.add(normalized as RoleKey);
      }
    });
  }

  if (source.role === "ADMIN") roles.add("admin");
  if (source.role === "STUDIO") roles.add("studio_owner");
  if (source.role === "USER") roles.add("musician");

  if (source.isTeacher) roles.add("teacher");
  if (source.isProducer) roles.add("producer");
  if (source.isStudioOwner) roles.add("studio_owner");

  roles.add("musician");

  return Array.from(roles);
}

export function hasRole(source: RoleSource | null | undefined, role: RoleKey): boolean {
  return normalizeRoles(source).includes(role);
}

export function mergeRoles(base: RoleKey[], next: RoleKey[]): RoleKey[] {
  const merged = new Set<RoleKey>(["musician"]);
  base.forEach((role) => merged.add(role));
  next.forEach((role) => merged.add(role));
  return Array.from(merged);
}

export function removeRoles(base: RoleKey[], remove: RoleKey[]): RoleKey[] {
  const next = new Set<RoleKey>(base);
  remove.forEach((role) => next.delete(role));
  if (!next.has("musician")) next.add("musician");
  return Array.from(next);
}
