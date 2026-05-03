import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { buildUserProfile } from "@/lib/auth/profile";

export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const [userProfile, teacherProfile] = await Promise.all([
    buildUserProfile(userId),
    prisma.teacherProfile.findUnique({
      where: { userId },
      select: {
        teacherName: true,
        avatarUrl: true,
        department: true,
        title: true,
        researchAreas: true,
        office: true,
        description: true,
      },
    }),
  ]);

  if (!userProfile) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    ...userProfile,
    teacherProfile: teacherProfile ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  // Update User fields
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : undefined;
  if (nickname) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: nickname },
    });
  }

  // Update TeacherProfile fields (only if user is TEACHER)
  if (user.role === "TEACHER") {
    const teacherFields: Record<string, unknown> = {};
    if (typeof body.teacherName === "string") teacherFields.teacherName = body.teacherName.trim();
    if (typeof body.department === "string") teacherFields.department = body.department.trim();
    if (typeof body.title === "string") teacherFields.title = body.title.trim();
    if (Array.isArray(body.researchAreas)) teacherFields.researchAreas = body.researchAreas.filter((s: unknown) => typeof s === "string");
    if (typeof body.office === "string") teacherFields.office = body.office.trim();
    if (typeof body.description === "string") teacherFields.description = body.description.trim();

    if (Object.keys(teacherFields).length > 0) {
      const existing = await prisma.teacherProfile.findUnique({ where: { userId } });
      if (existing) {
        await prisma.teacherProfile.update({
          where: { userId },
          data: teacherFields,
        });
      } else {
        // Create TeacherProfile if not exists
        await prisma.teacherProfile.create({
          data: {
            teacherId: userId,
            userId,
            teacherName: (teacherFields.teacherName as string) ?? user.id,
            department: (teacherFields.department as string) ?? "",
            title: (teacherFields.title as string) ?? "",
            researchAreas: (teacherFields.researchAreas as string[]) ?? [],
            office: (teacherFields.office as string) ?? "",
            description: (teacherFields.description as string) ?? "",
            recentOverallScore: 0,
            recentSevenScoresJson: [],
          },
        });
      }

      // Sync search document
      const { syncTeacherSearchDocument } = await import("@/lib/search/sync");
      syncTeacherSearchDocument(userId).catch(() => {});
    }
  }

  // Return updated profile
  const updatedProfile = await buildUserProfile(userId);
  const updatedTeacher = await prisma.teacherProfile.findUnique({
    where: { userId },
    select: {
      teacherName: true,
      avatarUrl: true,
      department: true,
      title: true,
      researchAreas: true,
      office: true,
      description: true,
    },
  });

  return NextResponse.json({
    ...updatedProfile,
    teacherProfile: updatedTeacher ?? null,
    message: "资料已更新",
  });
}
