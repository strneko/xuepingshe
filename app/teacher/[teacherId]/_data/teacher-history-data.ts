import { HistoryScoreItem, HistoryScorePageResult, ScoreHistoryGranularity } from "../../../course/[courseId]/_types";
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

function toPrismaGranularity(granularity: ScoreHistoryGranularity) {
  if (granularity === "year") return "YEAR" as const;
  if (granularity === "month") return "MONTH" as const;
  if (granularity === "day") return "DAY" as const;
  return "SEMESTER" as const;
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

export async function getTeacherScoreHistoryPage(
  teacherId: string,
  granularity: ScoreHistoryGranularity,
  cursor: string | null,
  limit?: number,
): Promise<HistoryScorePageResult> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const rows = await prisma.teacherScoreHistory.findMany({
    where: {
      teacherId,
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
    return getHistoryPageFromList([], cursor, limit);
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
