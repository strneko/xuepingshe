import { NextRequest, NextResponse } from "next/server";
import { toNotificationErrorResponse } from "@/lib/notifications/errors";
import { markAllNotificationsRead } from "@/lib/notifications/service/read-all-service";
import { resolveCurrentUserId } from "@/lib/notifications/service/shared";

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request.headers.get("x-user-id"));
    const result = await markAllNotificationsRead(userId);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toNotificationErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
