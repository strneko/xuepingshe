import { prisma } from "@/lib/prisma";

export type BrowseHistoryKind = "COURSE" | "TEACHER" | "COMMUNITY_POST";

export interface BrowseHistoryEntry {
  id: string;
  kind: BrowseHistoryKind;
  targetId: string;
  title: string;
  href: string;
  visitedAt: Date;
}

type BrowseHistoryDelegate = {
  upsert: (args: {
    where: {
      userId_kind_targetId: {
        userId: string;
        kind: BrowseHistoryKind;
        targetId: string;
      };
    };
    update: {
      title: string;
      href: string;
      visitedAt: Date;
    };
    create: {
      userId: string;
      kind: BrowseHistoryKind;
      targetId: string;
      title: string;
      href: string;
      visitedAt: Date;
    };
  }) => Promise<unknown>;
  findMany: (args: {
    where: { userId: string };
    orderBy: Array<{ visitedAt: "desc" } | { updatedAt: "desc" }>;
    take: number;
  }) => Promise<BrowseHistoryEntry[]>;
};

function getBrowseHistoryDelegate() {
  const maybe = (prisma as unknown as { browseHistory?: BrowseHistoryDelegate }).browseHistory;
  return maybe && typeof maybe.upsert === "function" && typeof maybe.findMany === "function" ? maybe : null;
}

export async function recordBrowseHistory(input: {
  userId: string;
  kind: BrowseHistoryKind;
  targetId: string;
  title: string;
  href: string;
}) {
  const userId = input.userId.trim();
  const targetId = input.targetId.trim();
  const title = input.title.trim();
  const href = input.href.trim();

  if (!userId || !targetId || !title || !href) {
    return;
  }

  const visitedAt = new Date();
  const delegate = getBrowseHistoryDelegate();

  if (delegate) {
    await delegate.upsert({
      where: {
        userId_kind_targetId: {
          userId,
          kind: input.kind,
          targetId,
        },
      },
      update: {
        title,
        href,
        visitedAt,
      },
      create: {
        userId,
        kind: input.kind,
        targetId,
        title,
        href,
        visitedAt,
      },
    });
    return;
  }

  const fallbackId = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  await prisma.$executeRaw`
    INSERT INTO "BrowseHistory" ("id", "userId", "kind", "targetId", "title", "href", "visitedAt", "createdAt", "updatedAt")
    VALUES (${fallbackId}, ${userId}, CAST(${input.kind} AS "BrowseHistoryKind"), ${targetId}, ${title}, ${href}, ${visitedAt}, NOW(), NOW())
    ON CONFLICT ("userId", "kind", "targetId")
    DO UPDATE SET
      "title" = EXCLUDED."title",
      "href" = EXCLUDED."href",
      "visitedAt" = EXCLUDED."visitedAt",
      "updatedAt" = NOW();
  `;
}

export async function listBrowseHistory(userId: string, limit = 100): Promise<BrowseHistoryEntry[]> {
  const delegate = getBrowseHistoryDelegate();

  if (delegate) {
    return delegate.findMany({
      where: {
        userId,
      },
      orderBy: [{ visitedAt: "desc" }, { updatedAt: "desc" }],
      take: limit,
    });
  }

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      kind: BrowseHistoryKind;
      targetId: string;
      title: string;
      href: string;
      visitedAt: Date;
    }>
  >`
    SELECT "id", "kind", "targetId", "title", "href", "visitedAt"
    FROM "BrowseHistory"
    WHERE "userId" = ${userId}
    ORDER BY "visitedAt" DESC, "updatedAt" DESC
    LIMIT ${limit};
  `;

  return rows;
}
