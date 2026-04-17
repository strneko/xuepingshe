import { NextRequest, NextResponse } from "next/server";
import { toNotificationErrorResponse } from "@/lib/notifications/errors";
import { getNotificationList } from "@/lib/notifications/service/list-service";
import {
  parseBoolean,
  parseLimit,
  parseOptionalCursor,
  resolveCurrentUserId,
} from "@/lib/notifications/service/shared";

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request.headers.get("x-user-id"));

    const cursor = parseOptionalCursor(request.nextUrl.searchParams.get("cursor"));
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"), {
      defaultValue: 20,
      maxValue: 100,
    });
    const onlyUnread = parseBoolean(request.nextUrl.searchParams.get("onlyUnread"));

    const result = await getNotificationList({
      userId,
      cursor,
      limit,
      onlyUnread,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toNotificationErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
