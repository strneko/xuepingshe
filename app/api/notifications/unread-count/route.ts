import { NextRequest, NextResponse } from "next/server";
import { toNotificationErrorResponse } from "@/lib/notifications/errors";
import { resolveCurrentUserId } from "@/lib/notifications/service/shared";
import { getUnreadCount } from "@/lib/notifications/service/unread-count-service";

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request.headers.get("x-user-id"));
    const result = await getUnreadCount(userId);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toNotificationErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
