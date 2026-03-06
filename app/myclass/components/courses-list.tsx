import { CourseCardProps } from "../page";
import { CourseCard } from "./course-item";
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
    <div className="flex flex-col items-center space-y-6 py-8 px-[10vw]">
      {classes.map((course) => (
        <CourseCard
          key={course.courseId}
          courseId={course.courseId}
          courseName={course.courseName}
          teacher={course.teacher}
          location={course.location}
          time={course.time}
          imageUrl={course.imageUrl}
          deadline={course.deadline}
          isEvaluated={course.isEvaluated}
          description={course.description}
          credits={course.credits}
          keyword={keyword}
        />
      ))}
    </div>
  );
}
