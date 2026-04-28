import { randomBytes } from "crypto";

export function getCurrentSemesterKey(date = new Date()) {
  const year = date.getFullYear();
  const half = date.getMonth() < 6 ? "S1" : "S2";
  return `${year}-${half}`;
}

export function normalizeSemesterKey(value: unknown, fallback = getCurrentSemesterKey()) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

export function buildInviteCode(semesterKey: string) {
  const safeSemesterKey =
    semesterKey
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 6)
      .toUpperCase() || "TERM";
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `INV-${safeSemesterKey}-${suffix}`;
}
