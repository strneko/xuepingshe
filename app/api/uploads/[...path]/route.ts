import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { getStorageDriver, resolveStorageType } from "@/lib/upload/storage";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return MIME_MAP[ext] ?? "application/octet-stream";
}

export async function GET(
  _: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathSegments } = await context.params;
    const storageKey = pathSegments.join("/");

    if (storageKey.includes("..")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Try to find the resource to get its storage type
    const resource = await prisma.courseResource.findFirst({
      where: { storageKey, status: "ACTIVE" },
      select: { storageType: true },
    });

    // Fall back to env-configured storage type for legacy files (e.g. avatars from before schema migration)
    const driver = getStorageDriver(resource?.storageType ?? resolveStorageType());
    const stream = await driver.openReadStream(storageKey);
    const mimeType = getMimeType(storageKey);

    return new NextResponse(Readable.toWeb(stream) as unknown as BodyInit, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }
}
