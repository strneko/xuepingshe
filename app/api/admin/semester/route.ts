import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import {
  advanceToNextSemester,
  retreatToPreviousSemester,
  getCurrentSemesterKey,
  getSemesterSequence,
  setSemesterSequence,
} from "@/lib/course-offerings";

async function requireAdmin(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return { authorized: false as const, response: NextResponse.json({ message: "请先登录" }, { status: 401 }) };
  }
  if (!isAdmin(userId)) {
    return { authorized: false as const, response: NextResponse.json({ message: "无权限" }, { status: 403 }) };
  }
  return { authorized: true as const, userId };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const [semesterSequence, currentSemester] = await Promise.all([
    getSemesterSequence(),
    getCurrentSemesterKey(),
  ]);

  return NextResponse.json({ semesterSequence, currentSemester });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";

  if (action === "advance") {
    const next = await advanceToNextSemester();
    if (!next) {
      return NextResponse.json({ message: "已在最后一个学期，无法推进" }, { status: 400 });
    }
    return NextResponse.json({ currentSemester: next, message: `已切换到学期 ${next}` });
  }

  if (action === "retreat") {
    const prev = await retreatToPreviousSemester();
    if (!prev) {
      return NextResponse.json({ message: "已在第一个学期，无法回退" }, { status: 400 });
    }
    return NextResponse.json({ currentSemester: prev, message: `已回退到学期 ${prev}` });
  }

  if (action === "set_sequence") {
    const sequence = Array.isArray(body.sequence) ? body.sequence.filter((v): v is string => typeof v === "string") : [];
    if (sequence.length === 0) {
      return NextResponse.json({ message: "学期序列不能为空" }, { status: 400 });
    }
    await setSemesterSequence(sequence);
    const current = await getCurrentSemesterKey();
    return NextResponse.json({ semesterSequence: sequence, currentSemester: current });
  }

  return NextResponse.json({ message: "无效操作" }, { status: 400 });
}
