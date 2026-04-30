import { ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ScoreBox from "@/components/score-box";
import { ReviewItem } from "@/app/course/[courseId]/_types";
import { cn } from "@/lib/utils";

interface ReviewBriefCardProps {
  review: ReviewItem;
  showCourse?: boolean;
  showTeacher?: boolean;
  fallbackCourseName?: string;
  fallbackTeacherName?: string;
  className?: string;
}

export default function ReviewBriefCard({
  review,
  showCourse = false,
  showTeacher = false,
  fallbackCourseName,
  fallbackTeacherName,
  className,
}: ReviewBriefCardProps) {
  const sourceCourse = review.sourceCourseName ?? fallbackCourseName;
  const sourceTeacher = review.sourceTeacherName ?? fallbackTeacherName;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage src={review.avatarUrl} alt={review.nickname} />
            <AvatarFallback>{review.nickname.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{review.nickname}</p>
            <p className="text-xs text-muted-foreground">{review.createdAt.slice(0, 10)}</p>
            {showCourse && sourceCourse && <p className="text-xs text-muted-foreground">课程：{sourceCourse}</p>}
            {showTeacher && sourceTeacher && <p className="text-xs text-muted-foreground">教师：{sourceTeacher}</p>}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ThumbsUp className="size-3.5" />
          {review.likesCount}
        </span>
      </div>
      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        综合评分：
        <ScoreBox score={review.overallScore} digits={review.detailedScores?.length ? 2 : 0} />
      </p>
      <p className="text-sm text-muted-foreground">{review.summary}</p>
    </div>
  );
}
