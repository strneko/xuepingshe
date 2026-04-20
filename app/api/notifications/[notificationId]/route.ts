import { NextResponse } from "next/server";
import { NotificationError, toNotificationErrorResponse } from "@/lib/notifications/errors";
import { deleteNotification } from "@/lib/notifications/service/delete-service";
import { resolveCurrentUserId } from "@/lib/notifications/service/shared";

interface RouteContext {
  params: Promise<{
    notificationId: string;
  }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userId = await resolveCurrentUserId(request);
    const { notificationId } = await context.params;

    if (!notificationId.trim()) {
      throw new NotificationError("notificationId 不能为空", 400, "INVALID_PAYLOAD");
    }

    const result = await deleteNotification({
      userId,
      notificationId,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toNotificationErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
