import { CourseCardProps } from "../page";
import { CourseCard } from "./course-item";
interface CourseListProps {
  courses: CourseCardProps[];
}
export default function CoursesList({ courses: classes }: CourseListProps) {
  return (
    <div className="flex flex-col items-center space-y-6 py-8">
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
        />
      ))}
    </div>
  );
}
