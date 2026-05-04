import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { getUploadLocalRoot } from "@/lib/upload/constants";

export const runtime = "nodejs";

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  return MIME_MAP[ext] ?? "application/octet-stream";
}

export async function GET(
  _: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathSegments } = await context.params;
    const safePath = pathSegments.join("/");

    if (safePath.includes("..")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const absolutePath = path.join(getUploadLocalRoot(), safePath);
    await fs.access(absolutePath);

    const stream = createReadStream(absolutePath);
    const mimeType = getMimeType(absolutePath);

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
