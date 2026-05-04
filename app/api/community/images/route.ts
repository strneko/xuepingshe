import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { resolveCurrentUserId } from "@/lib/community/shared";
import { getUploadLocalRoot } from "@/lib/upload/constants";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[mimeType] ?? "bin";
}

export async function POST(request: NextRequest) {
  try {
    await resolveCurrentUserId(request);

    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "请上传图片文件" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
      return NextResponse.json({ message: "仅支持 PNG/JPG/GIF/WebP 格式" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "图片大小不能超过 5MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = randomUUID().replaceAll("-", "");
    const ext = getExtension(file.type);
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const relativePath = `community-images/${yyyy}/${mm}/${id}.${ext}`;
    const absolutePath = path.join(getUploadLocalRoot(), relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);

    return NextResponse.json({
      url: `/api/uploads/${relativePath}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传图片失败";
    if (message === "用户未登录") {
      return NextResponse.json({ message }, { status: 401 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
