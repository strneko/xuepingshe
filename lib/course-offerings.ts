import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export async function getCurrentSemesterKey(date = new Date()) {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { key: "current_semester" },
      select: { value: true },
    });
    if (config?.value?.trim()) {
      return config.value.trim();
    }
  } catch {
    // best-effort: fall through
  }

  const envOverride = process.env.CURRENT_SEMESTER_KEY?.trim();
  if (envOverride) {
    return envOverride;
  }

  return autoComputeSemesterKey(date);
}

export function autoComputeSemesterKey(date = new Date()) {
  const year = date.getFullYear();
  const half = date.getMonth() < 6 ? "S1" : "S2";
  return `${year}-${half}`;
}

export function normalizeSemesterKey(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

export async function getSemesterSequence(): Promise<string[]> {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { key: "semester_sequence" },
      select: { value: true },
    });
    if (config?.value) {
      const parsed = JSON.parse(config.value);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      }
    }
  } catch {
    // best-effort: return empty
  }

  return [];
}

export async function setCurrentSemester(semesterKey: string) {
  await prisma.appConfig.upsert({
    where: { key: "current_semester" },
    update: { value: semesterKey },
    create: { key: "current_semester", value: semesterKey },
  });
}

export async function setSemesterSequence(sequence: string[]) {
  await prisma.appConfig.upsert({
    where: { key: "semester_sequence" },
    update: { value: JSON.stringify(sequence) },
    create: { key: "semester_sequence", value: JSON.stringify(sequence) },
  });
}

export async function advanceToNextSemester(): Promise<string | null> {
  const [sequence, current] = await Promise.all([
    getSemesterSequence(),
    getCurrentSemesterKey(),
  ]);

  const currentIndex = sequence.indexOf(current);
  if (currentIndex === -1 || currentIndex >= sequence.length - 1) {
    return null;
  }

  const next = sequence[currentIndex + 1];
  await setCurrentSemester(next);
  return next;
}

export async function retreatToPreviousSemester(): Promise<string | null> {
  const [sequence, current] = await Promise.all([
    getSemesterSequence(),
    getCurrentSemesterKey(),
  ]);

  const currentIndex = sequence.indexOf(current);
  if (currentIndex <= 0) {
    return null;
  }

  const prev = sequence[currentIndex - 1];
  await setCurrentSemester(prev);
  return prev;
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
