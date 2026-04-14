import CourseHero from "./components/course-hero";
import CourseReviewCompose from "./components/course-review-compose";
import CourseTabs from "./components/course-tabs";
import CourseReviewSection from "./components/course-review-section";
import ScoreOverviewCard from "./components/score-overview-card";
import TopReviewsCarouselPanel from "@/components/top-reviews-carousel-panel";
import { getCourseDetail } from "./_data/get-course-detail";

interface CourseDetailPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  const detail = await getCourseDetail(courseId);

  return (
    <main className="mx-auto w-full max-w-350 px-4 py-6 md:px-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <CourseHero
            title={detail.courseName}
            teacher={detail.teacher}
            intro={detail.intro}
            location={detail.location}
            time={detail.time}
          />
          <CourseTabs courseId={detail.courseId} announcements={detail.announcements} resources={detail.resources} />
          <CourseReviewCompose courseId={detail.courseId} courseName={detail.courseName} teacher={detail.teacher} />
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
