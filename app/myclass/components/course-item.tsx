"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { CourseCardProps } from "../page";
import EvaluationDialog from "./evaluation-dialog";
import SearchResultCard from "@/components/search-result-card";

interface MyClassCourseCardProps extends CourseCardProps {
  keyword?: string;
}

export function CourseCard({
  courseId,
  courseName,
  teacher,
  location,
  time,
  imageUrl: _imageUrl,
  deadline,
  isEvaluated,
  onEvaluate,
  description = "本课程旨在培养学生掌握核心专业知识，通过理论与实践相结合的方式，提升学生的综合应用能力。",
  credits: _credits = "3.0 学分",
  keyword = "",
}: MyClassCourseCardProps) {
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);

  const openEvaluation = () => {
    if (isEvaluated) {
      return;
    }
    onEvaluate?.();
    setIsEvaluationOpen(true);
  };

  return (
    <>
      <SearchResultCard
        href={`/course/${courseId}`}
        type="course"
        title={courseName}
        subtitle={`授课教师：${teacher}`}
        department={`${location} · ${time}`}
        snippet={description}
        keyword={keyword}
        actionSlot={
          <div className="flex w-32 flex-col items-center gap-2">
            {isEvaluated ? (
              <Button disabled variant="secondary" className="w-full grayscale opacity-70 cursor-not-allowed">
                已评教
              </Button>
            ) : (
              <Button onClick={openEvaluation} className="w-full">
                去评教
              </Button>
            )}

            <p className="inline-flex items-center gap-1 text-center text-xs text-muted-foreground">
              <Calendar className="size-3" />
              截止：{deadline}
            </p>
          </div>
        }
      />

      <EvaluationDialog
        open={isEvaluationOpen}
        onOpenChange={setIsEvaluationOpen}
        courseName={courseName}
        teacher={teacher}
        deadline={deadline}
      />
    </>
  );
}
