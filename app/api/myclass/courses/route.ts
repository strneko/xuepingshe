import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getMyClassCourses } from "@/lib/myclass/service";

function parseBoolean(value: string | null) {
  if (!value) {
    return false;
  }

  return value === "1" || value.toLowerCase() === "true";
}

function parseNumber(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = getSessionUserId(request.headers);

  const result = await getMyClassCourses({
    userId,
    unevaluated: parseBoolean(searchParams.get("unevaluated")),
    sort: searchParams.get("sort") === "desc" ? "desc" : "asc",
    keyword: searchParams.get("keyword") ?? "",
    page: parseNumber(searchParams.get("page"), 1),
    pageSize: parseNumber(searchParams.get("pageSize"), 6),
  });

  return NextResponse.json(result);
}
