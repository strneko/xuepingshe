import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/upload/errors";
import { getUploadSessionStatus } from "@/lib/upload/service/upload-status-service";

interface RouteContext {
  params: Promise<{ uploadId: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { uploadId } = await context.params;
    const result = await getUploadSessionStatus(uploadId);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
