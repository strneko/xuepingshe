import { NextRequest, NextResponse } from "next/server";
import { completeUploadSession } from "@/lib/upload/service/upload-complete-service";
import { toErrorResponse } from "@/lib/upload/errors";

interface RouteContext {
  params: Promise<{ uploadId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { uploadId } = await context.params;
    const body = (await request.json()) as {
      uploadedPartsMeta?: Array<{ partNumber?: number; chunkHash?: string }>;
    };

    const result = await completeUploadSession({
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
