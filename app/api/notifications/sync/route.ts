import { NextRequest, NextResponse } from "next/server";
import { toNotificationErrorResponse } from "@/lib/notifications/errors";
import { resolveCurrentUserId, parseLimit, parseEventId } from "@/lib/notifications/service/shared";
import { syncNotifications } from "@/lib/notifications/service/sync-service";

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request);

    const sinceEventId = parseEventId(request.nextUrl.searchParams.get("sinceEventId"), "INVALID_SINCE_EVENT_ID");
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"), {
      defaultValue: 100,
      maxValue: 500,
    });

    const result = await syncNotifications({
      userId,
      sinceEventId,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toNotificationErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
