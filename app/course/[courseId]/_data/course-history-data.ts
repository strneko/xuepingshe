import { HistoryScoreItem, HistoryScorePageResult, ScoreHistoryGranularity } from "../_types";
import { prisma } from "@/lib/prisma";

const DEFAULT_HISTORY_PAGE_SIZE = 12;

function normalizeHistoryLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_HISTORY_PAGE_SIZE;
  }

  return Math.min(30, Math.max(1, Math.floor(limit)));
}

function createHistoryCursor(item: HistoryScoreItem) {
  return item.id;
}

function formatMonthLabel(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function formatDayLabel(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function createTimeLabel(granularity: ScoreHistoryGranularity, index: number) {
  if (granularity === "semester") {
    const startYear = 2025 - Math.floor(index / 2);
    const endYear = startYear + 1;
    const semester = (index % 2) + 1;
    return `${startYear}-${endYear}-${semester}`;
  }

  if (granularity === "year") {
    return String(2026 - index);
  }

  if (granularity === "month") {
    const date = new Date(2026, 2, 1);
    date.setMonth(date.getMonth() - index);
    return formatMonthLabel(date);
  }

  const date = new Date(2026, 2, 4);
  date.setDate(date.getDate() - index);
  return formatDayLabel(date);
}

function toNullableScore(value: number, seed: number, mod: number) {
  if ((seed + mod) % 19 === 0) {
    return null;
  }

  return Number(value.toFixed(1));
}

function createHistoryScoreRecord(
  courseId: string,
  granularity: ScoreHistoryGranularity,
  index: number,
): HistoryScoreItem {
  const id = `${granularity}-${courseId}-${index + 1}`;
  const seed = courseId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 17;

  const base = 3.8 + (seed % 11) / 10;
  const attitude = toNullableScore(Math.min(5, base - 0.1 + ((seed + 1) % 4) / 10), seed, 1);
  const content = toNullableScore(Math.min(5, base - 0.2 + ((seed + 2) % 5) / 10), seed, 2);
  const method = toNullableScore(Math.min(5, base - 0.3 + ((seed + 3) % 6) / 10), seed, 3);
  const effect = toNullableScore(Math.min(5, base - 0.4 + ((seed + 4) % 7) / 10), seed, 4);
  const interaction = toNullableScore(Math.min(5, base - 0.2 + ((seed + 5) % 5) / 10), seed, 5);
  const resource = toNullableScore(Math.min(5, base - 0.3 + ((seed + 6) % 6) / 10), seed, 6);
  const improve = toNullableScore(Math.min(5, base - 0.1 + ((seed + 7) % 4) / 10), seed, 7);

  const scoreValues = [attitude, content, method, effect, interaction, resource, improve].filter(
    (item): item is number => item !== null,
  );
  const overallScore =
    scoreValues.length > 0
      ? Number((scoreValues.reduce((sum, item) => sum + item, 0) / scoreValues.length).toFixed(1))
      : null;

  return {
    id,
    timeLabel: createTimeLabel(granularity, index),
    overallScore,
    attitude,
    content,
    method,
    effect,
    interaction,
    resource,
    improve,
  };
}

function getHistorySourceCount(granularity: ScoreHistoryGranularity) {
  if (granularity === "semester") {
    return 24;
  }

  if (granularity === "year") {
    return 12;
  }

  if (granularity === "month") {
    return 36;
  }

  return 120;
}

function buildHistorySource(courseId: string, granularity: ScoreHistoryGranularity) {
  const count = getHistorySourceCount(granularity);

  return Array.from({ length: count }, (_, index) => createHistoryScoreRecord(courseId, granularity, index));
}

function getHistoryPageFromList(
  historyList: HistoryScoreItem[],
  cursor: string | null,
  limit?: number,
): HistoryScorePageResult {
  const pageSize = normalizeHistoryLimit(limit);
  const startIndex = cursor ? historyList.findIndex((item) => createHistoryCursor(item) === cursor) + 1 : 0;
  const safeStartIndex = Math.max(0, startIndex);
  const items = historyList.slice(safeStartIndex, safeStartIndex + pageSize);
  const nextItem = historyList[safeStartIndex + pageSize];

  return {
    items,
    nextCursor: nextItem ? createHistoryCursor(nextItem) : null,
    hasMore: Boolean(nextItem),
    total: historyList.length,
  };
}

function toPrismaGranularity(granularity: ScoreHistoryGranularity) {
  if (granularity === "year") return "YEAR" as const;
  if (granularity === "month") return "MONTH" as const;
  if (granularity === "day") return "DAY" as const;
  return "SEMESTER" as const;
}

export async function getCourseScoreHistoryPage(
  courseId: string,
  granularity: ScoreHistoryGranularity,
  cursor: string | null,
  limit?: number,
): Promise<HistoryScorePageResult> {
  const rows = await prisma.courseScoreHistory.findMany({
    where: {
      courseId,
      granularity: toPrismaGranularity(granularity),
    },
    orderBy: [{ sortOrder: "asc" }],
    select: {
      cursorKey: true,
      timeLabel: true,
      overallScore: true,
      attitude: true,
      content: true,
      method: true,
      effect: true,
      interaction: true,
      resource: true,
      improve: true,
    },
  });

  if (rows.length === 0) {
    return getHistoryPageFromList(buildHistorySource(courseId, granularity), cursor, limit);
  }

  const source: HistoryScoreItem[] = rows.map((row) => ({
    id: row.cursorKey,
    timeLabel: row.timeLabel,
    overallScore: row.overallScore,
    attitude: row.attitude,
    content: row.content,
    method: row.method,
    effect: row.effect,
    interaction: row.interaction,
    resource: row.resource,
    improve: row.improve,
  }));

  return getHistoryPageFromList(source, cursor, limit);
}
