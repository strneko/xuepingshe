import CourseHero from "./components/course-hero";
import CourseReviewCompose from "./components/course-review-compose";
import CourseTabs from "./components/course-tabs";
import CourseReviewSection from "./components/course-review-section";
import ScoreOverviewCard from "./components/score-overview-card";
import TopReviewsCarouselPanel from "@/components/top-reviews-carousel-panel";
import { getCourseDetail } from "./_data/get-course-detail";
import { headers } from "next/headers";
import { getSessionUserId } from "@/lib/auth/session";
import { recordBrowseHistory } from "@/lib/profile/browse-history";
import { prisma } from "@/lib/prisma";
import CourseManagementCard from "./components/course-management-card";

interface CourseDetailPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  const detail = await getCourseDetail(courseId);
  const userId = getSessionUserId(await headers());

  const currentUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true },
      })
    : null;

  const teacherName = currentUser?.name?.trim() ?? "";
  const isCourseTeacher = currentUser?.role === "TEACHER" && teacherName.length > 0;
  const isStudent = currentUser?.role === "STUDENT";

  const inviteCode = isCourseTeacher
    ? await prisma.courseInviteCode.findFirst({
        where: {
          courseId: detail.courseId,
          isActive: true,
          offering: {
            teacherName,
          },
        },
        orderBy: [{ updatedAt: "desc" }],
        select: {
          code: true,
        },
      })
    : null;

  if (userId) {
    await recordBrowseHistory({
      userId,
      kind: "COURSE",
      targetId: detail.courseId,
      title: detail.courseName,
      href: `/course/${detail.courseId}`,
    });
  }

  return (
    <main className="mx-auto w-full max-w-350 px-4 py-6 md:px-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <CourseHero
            title={detail.courseName}
            teacherId={detail.teacherId ?? null}
            teacher={detail.teacher}
            intro={detail.intro}
            location={detail.location}
            time={detail.time}
            rightSlot={
              isCourseTeacher ? (
                <CourseManagementCard
                  courseId={detail.courseId}
                  inviteCode={inviteCode?.code ?? null}
                  initialCourseName={detail.courseName}
                  initialTeacherName={detail.teacher}
                  initialIntro={detail.intro}
                  initialLocation={detail.location}
                  initialSchedule={detail.time}
                />
              ) : null
            }
          />
          <CourseTabs courseId={detail.courseId} announcements={detail.announcements} resources={detail.resources} />
          {isStudent ? (
            <CourseReviewCompose courseId={detail.courseId} courseName={detail.courseName} teacher={detail.teacher} />
          ) : null}
          <CourseReviewSection courseId={detail.courseId} initialReviews={detail.initialReviews} />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <ScoreOverviewCard overallScore={detail.recentOverallScore} dimensions={detail.recentSevenScores} />
          <TopReviewsCarouselPanel fetchUrl={`/api/courses/${detail.courseId}/top-reviews`} />
        </aside>
      </div>
    </main>
  );
}
