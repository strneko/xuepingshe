import { NextRequest, NextResponse } from "next/server";
import { aggregateAllEndedRounds } from "@/lib/score-history/aggregator";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: "无权执行定时聚合" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "未配置定时任务令牌" }, { status: 403 });
  }

  const count = await aggregateAllEndedRounds();

  return NextResponse.json({
    trigger: "cron",
    rounds: count,
  });
}
