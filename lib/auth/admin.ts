let adminIdSet: Set<string> | null = null;

function getAdminIdSet(): Set<string> {
  if (adminIdSet) {
    return adminIdSet;
  }

  const raw = process.env.ADMIN_USER_IDS?.trim() ?? "";
  adminIdSet = new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );

  return adminIdSet;
}

export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) {
    return false;
  }

  return getAdminIdSet().has(userId);
}
