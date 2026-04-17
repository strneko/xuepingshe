import { NextRequest, NextResponse } from "next/server";
import { NotificationError, toNotificationErrorResponse } from "@/lib/notifications/errors";
import { enqueueNotification } from "@/lib/notifications/service/enqueue-service";

const INTERNAL_SECRET_HEADER = "x-notification-secret";

function assertInternalAccess(request: NextRequest) {
  const configured = process.env.NOTIFICATION_INTERNAL_SECRET?.trim();
  if (!configured) {
    return;
  }

  const incoming = request.headers.get(INTERNAL_SECRET_HEADER)?.trim();
  if (!incoming || incoming !== configured) {
    throw new NotificationError("无权访问内部接口", 403, "FORBIDDEN");
  }
}

export async function POST(request: NextRequest) {
  try {
    assertInternalAccess(request);

    const body = (await request.json()) as {
      eventType?: string;
      bizId?: string;
      actorId?: string;
      receiverIds?: string[];
      payload?: Record<string, unknown>;
      dedupeKey?: string;
    };

    const result = await enqueueNotification({
      eventType: String(body.eventType ?? "").trim(),
      bizId: String(body.bizId ?? "").trim(),
      actorId: String(body.actorId ?? "").trim(),
      receiverIds: Array.isArray(body.receiverIds) ? body.receiverIds : [],
      payload: body.payload && typeof body.payload === "object" ? body.payload : {},
      dedupeKey: typeof body.dedupeKey === "string" ? body.dedupeKey : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toNotificationErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
