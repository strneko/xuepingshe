import { DimensionScore } from "../../../course/[courseId]/_types";
import { prisma } from "@/lib/prisma";

export interface TeacherProfileRecord {
  teacherId: string;
  teacherName: string;
  avatarUrl?: string;
  department: string;
  title: string;
  researchAreas: string[];
  office: string;
  description: string;
  recentOverallScore: number;
  recentSevenScores: DimensionScore[];
}

const DEFAULT_TEACHER_PROFILE: TeacherProfileRecord = {
  teacherId: "1",
  teacherName: "张教授",
  avatarUrl: "",
  department: "数学与统计学院",
  title: "教授 / 博导",
  researchAreas: ["偏微分方程", "最优化理论", "数学建模"],
  office: "理科楼 B-512",
  description:
    "长期从事高等数学与数学建模教学，注重基础概念与应用能力结合。主持多项教学改革项目，致力于提升课堂互动与学习反馈质量。",
  recentOverallScore: 4.82,
  recentSevenScores: [
    { key: "attitude", label: "教学态度与师德", score: 4.9 },
    { key: "content", label: "教学内容与设计", score: 4.8 },
    { key: "method", label: "教学方法与技巧", score: 4.8 },
    { key: "effect", label: "教学效果与成果", score: 4.7 },
    { key: "interaction", label: "师生互动与氛围", score: 4.9 },
    { key: "resource", label: "课程资源与评价", score: 4.7 },
    { key: "improve", label: "教学创新与改进", score: 4.9 },
  ],
};

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDimensionScoreItem(value: unknown): value is DimensionScore {
  if (!isRecordLike(value)) {
    return false;
  }

  return typeof value.key === "string" && typeof value.label === "string" && typeof value.score === "number";
}

function parseDimensionScores(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter(isDimensionScoreItem);
  return items.length > 0 ? items : undefined;
}

function mapTeacherProfileRowToRecord(row: {
  teacherId: string;
  teacherName: string;
  avatarUrl: string | null;
  department: string;
  title: string;
  researchAreas: string[];
  office: string;
  description: string;
  recentOverallScore: number;
  recentSevenScoresJson: unknown;
}): TeacherProfileRecord {
  return {
    teacherId: row.teacherId,
    teacherName: row.teacherName,
    avatarUrl: row.avatarUrl ?? undefined,
    department: row.department,
    title: row.title,
    researchAreas: row.researchAreas,
    office: row.office,
    description: row.description,
    recentOverallScore: row.recentOverallScore,
    recentSevenScores: parseDimensionScores(row.recentSevenScoresJson) ?? DEFAULT_TEACHER_PROFILE.recentSevenScores,
  };
}

export async function getTeacherSource(teacherId: string): Promise<TeacherProfileRecord> {
  const row = await prisma.teacherProfile.findUnique({
    where: {
      teacherId,
    },
  });

  if (row) {
    return mapTeacherProfileRowToRecord(row);
  }

  return {
    ...DEFAULT_TEACHER_PROFILE,
    teacherId,
    teacherName: `教师 ${teacherId}`,
  };
}
