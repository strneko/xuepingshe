import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { toErrorResponse } from "@/lib/upload/errors";
import { getResourceDownloadPayload } from "@/lib/upload/service/resource-download-service";

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

export const runtime = "nodejs";

export async function GET(_: Request, context: RouteContext) {
  try {
    const { resourceId } = await context.params;
    const payload = await getResourceDownloadPayload(resourceId);

    return new NextResponse(Readable.toWeb(payload.stream) as unknown as BodyInit, {
      headers: payload.headers,
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
