import { MapPin, User, Clock3 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface CourseHeroProps {
  title: string;
  teacherId?: string | null;
  teacher: string;
  intro: string;
  location: string;
  time: string;
  rightSlot?: ReactNode;
}

export default function CourseHero({ title, teacherId, teacher, intro, location, time, rightSlot }: CourseHeroProps) {
  const teacherHref = teacherId ? `/teacher/${teacherId}` : null;

  return (
    <Card id="course-intro">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {teacherHref ? (
                <Link
                  href={teacherHref}
                  className="group inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-all duration-200 hover:bg-accent/40 hover:text-foreground hover:shadow-md"
                  aria-label={`查看教师 ${teacher} 的主页`}
                  title="查看教师主页"
                >
                  <User className="size-4 transition-colors group-hover:text-primary" />
                  <span className="transition-colors group-hover:text-primary">{teacher}</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <User className="size-4" />
                  {teacher}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" />
                {location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4" />
                {time}
              </span>
            </div>
          </div>

          {rightSlot ? <div className="md:pl-4">{rightSlot}</div> : null}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{intro}</p>
      </CardContent>
    </Card>
  );
}
