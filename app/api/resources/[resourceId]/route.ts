import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/upload/errors";
import { getResourceDetail } from "@/lib/upload/service/resource-query-service";
import { deleteResource } from "@/lib/upload/service/resource-delete-service";

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { resourceId } = await context.params;
    const result = await getResourceDetail(resourceId);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { resourceId } = await context.params;
    const result = await deleteResource(resourceId);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
