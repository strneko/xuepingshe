import { NextRequest, NextResponse } from "next/server";
import { toNotificationErrorResponse, NotificationError } from "@/lib/notifications/errors";
import { markNotificationRead } from "@/lib/notifications/service/read-service";
import { resolveCurrentUserId } from "@/lib/notifications/service/shared";

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request);
    const body = (await request.json()) as { notificationId?: string };
    const notificationId = String(body.notificationId ?? "").trim();

    if (!notificationId) {
      throw new NotificationError("notificationId 不能为空", 400, "INVALID_PAYLOAD");
    }

    const result = await markNotificationRead({
      userId,
      notificationId,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toNotificationErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
