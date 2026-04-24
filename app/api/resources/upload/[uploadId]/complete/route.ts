import { NextRequest, NextResponse } from "next/server";
import { completeUploadSession } from "@/lib/upload/service/upload-complete-service";
import { toErrorResponse } from "@/lib/upload/errors";
import { getSessionUserId } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ uploadId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = getSessionUserId(request.headers);
    if (!userId) {
      return NextResponse.json({ message: "请先登录后再上传资源" }, { status: 401 });
    }

    const { uploadId } = await context.params;
    const body = (await request.json()) as {
      uploadedPartsMeta?: Array<{ partNumber?: number; chunkHash?: string }>;
    };

    const result = await completeUploadSession({
      userId,
      uploadId,
      uploadedPartsMeta: Array.isArray(body.uploadedPartsMeta)
        ? body.uploadedPartsMeta.map((item) => ({
            partNumber: Number(item.partNumber ?? 0),
            chunkHash: String(item.chunkHash ?? ""),
          }))
        : [],
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
