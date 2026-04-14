import { NextRequest, NextResponse } from "next/server";
import { initUploadSession } from "@/lib/upload/service/upload-session-service";
import { toErrorResponse } from "@/lib/upload/errors";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      courseId?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      wholeFileHash?: string;
      chunkSize?: number;
      totalChunks?: number;
    };

    const result = await initUploadSession({
      courseId: String(body.courseId ?? ""),
      fileName: String(body.fileName ?? ""),
      fileSize: Number(body.fileSize ?? 0),
      mimeType: String(body.mimeType ?? "application/octet-stream"),
      wholeFileHash: String(body.wholeFileHash ?? ""),
      chunkSize: Number(body.chunkSize ?? 0),
      totalChunks: Number(body.totalChunks ?? 0),
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
