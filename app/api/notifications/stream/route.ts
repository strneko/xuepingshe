import { NextRequest } from "next/server";
import { NotificationError } from "@/lib/notifications/errors";
import { resolveCurrentUserId } from "@/lib/notifications/service/shared";
import { createNotificationEventStream } from "@/lib/notifications/service/stream-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request);

    const stream = createNotificationEventStream(userId);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof NotificationError) {
      return new Response(
        JSON.stringify({
          code: error.code,
          message: error.message,
        }),
        {
          status: error.status,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        code: "INTERNAL_SERVER_ERROR",
        message: "服务器内部错误",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
