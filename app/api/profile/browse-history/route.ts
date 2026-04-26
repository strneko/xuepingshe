import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { recordBrowseHistory } from "@/lib/profile/browse-history";

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const kind = body.kind;
  const targetId = typeof body.targetId === "string" ? body.targetId : "";
  const title = typeof body.title === "string" ? body.title : "";
  const href = typeof body.href === "string" ? body.href : "";

  if (kind !== "COURSE" && kind !== "TEACHER" && kind !== "COMMUNITY_POST") {
    return NextResponse.json({ message: "浏览记录类型无效" }, { status: 400 });
  }

  await recordBrowseHistory({
    userId,
    kind,
    targetId,
    title,
    href,
  });

  return NextResponse.json({ success: true });
}
