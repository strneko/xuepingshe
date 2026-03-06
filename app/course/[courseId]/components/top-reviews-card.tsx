import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ReviewBriefCard from "@/components/review-brief-card";
import { ReviewItem } from "../_types";

interface TopReviewsCardProps {
  reviews: ReviewItem[];
  showSourceCourse?: boolean;
  showSourceTeacher?: boolean;
  fallbackCourseName?: string;
  fallbackTeacherName?: string;
}

export default function TopReviewsCard({
  reviews,
  showSourceCourse = false,
  showSourceTeacher = false,
  fallbackCourseName,
  fallbackTeacherName,
}: TopReviewsCardProps) {
  return (
    <Card id="course-reviews">
      <CardHeader>
        <CardTitle className="text-base">高赞评价</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.map((review, index) => (
          <div key={review.id} className="space-y-1">
            <ReviewBriefCard
              review={review}
              showCourse={showSourceCourse}
              showTeacher={showSourceTeacher}
              fallbackCourseName={fallbackCourseName}
              fallbackTeacherName={fallbackTeacherName}
            />
            {index < reviews.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
