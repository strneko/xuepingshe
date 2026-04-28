import { CourseCardProps } from "../page";
import { CourseCard } from "./course-item";
import { Separator } from "@/components/ui/separator";
interface CourseListProps {
  courses: CourseCardProps[];
  keyword?: string;
}
export default function CoursesList({ courses: classes, keyword = "" }: CourseListProps) {
  if (classes.length === 0) {
    return (
      <div className="px-[10vw] py-10">
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          {keyword ? `没有找到与“${keyword}”相关的课程或教师` : "暂无课程数据"}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-[10vw]">
      <div className="overflow-hidden rounded-xl border bg-card">
        {classes.map((course, index) => (
          <div key={course.offeringId}>
            <CourseCard
              enrollmentId={course.enrollmentId}
              offeringId={course.offeringId}
              courseId={course.courseId}
              courseName={course.courseName}
              viewerRole={course.viewerRole}
              teacher={course.teacher}
              term={course.term}
              offeringStatus={course.offeringStatus}
              location={course.location}
              time={course.time}
              imageUrl={course.imageUrl}
              deadline={course.deadline}
              isEvaluated={course.isEvaluated}
              description={course.description}
              credits={course.credits}
              inviteCode={course.inviteCode}
              recentScore={course.recentScore}
              reviewCount={course.reviewCount}
              keyword={keyword}
            />
            {index < classes.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
