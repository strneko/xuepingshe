import CourseReviewSection from "../../course/[courseId]/components/course-review-section";
import ScoreOverviewCard from "../../course/[courseId]/components/score-overview-card";
import TopReviewsCarouselPanel from "@/components/top-reviews-carousel-panel";
import { getTeacherDetail } from "./_data/get-teacher-detail";
import TeacherHero from "./components/teacher-hero";
import TeacherHistoryCourses from "./components/teacher-history-courses";
import { headers } from "next/headers";
import { getSessionUserId } from "@/lib/auth/session";
import { recordBrowseHistory } from "@/lib/profile/browse-history";

interface TeacherDetailPageProps {
  params: Promise<{
    teacherId: string;
  }>;
}

export default async function TeacherDetailPage({ params }: TeacherDetailPageProps) {
  const { teacherId } = await params;
  const detail = await getTeacherDetail(teacherId);
  const userId = getSessionUserId(await headers());

  if (userId) {
    await recordBrowseHistory({
      userId,
      kind: "TEACHER",
      targetId: detail.teacherId,
      title: detail.teacherName,
      href: `/teacher/${detail.teacherId}`,
    });
  }

  return (
    <main className="mx-auto w-full max-w-350 px-4 py-6 md:px-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <TeacherHero
            teacherName={detail.teacherName}
            avatarUrl={detail.avatarUrl}
            department={detail.department}
            title={detail.title}
            researchAreas={detail.researchAreas}
            office={detail.office}
            description={detail.description}
          />

          <TeacherHistoryCourses teacherId={detail.teacherId} initialHistoryScores={detail.initialHistoryScores} />

          <CourseReviewSection
            courseId={detail.teacherId}
            initialReviews={detail.initialReviews}
            showSourceCourse
            fetchBasePath="/api/teachers"
          />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <ScoreOverviewCard overallScore={detail.recentOverallScore} dimensions={detail.recentSevenScores} />
          <TopReviewsCarouselPanel
            fetchUrl={`/api/teachers/${detail.teacherId}/top-reviews`}
            showSourceCourse
            showSourceTeacher
          />
        </aside>
      </div>
    </main>
  );
}
