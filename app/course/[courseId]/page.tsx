import CourseHero from "./components/course-hero";
import CourseTabs from "./components/course-tabs";
import CourseReviewSection from "./components/course-review-section";
import ScoreOverviewCard from "./components/score-overview-card";
import TopReviewsCard from "./components/top-reviews-card";
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
          <CourseTabs announcements={detail.announcements} resources={detail.resources} />
          <CourseReviewSection reviews={detail.reviews} />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <ScoreOverviewCard overallScore={detail.recentOverallScore} dimensions={detail.recentSevenScores} />
          <TopReviewsCard reviews={detail.topReviews} />
        </aside>
      </div>
    </main>
  );
}
