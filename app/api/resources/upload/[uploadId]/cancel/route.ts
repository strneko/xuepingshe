import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/upload/errors";
import { cancelUploadSession } from "@/lib/upload/service/upload-cancel-service";

interface RouteContext {
  params: Promise<{ uploadId: string }>;
}

export async function POST(_: Request, context: RouteContext) {
  try {
    const { uploadId } = await context.params;
    const result = await cancelUploadSession(uploadId);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
