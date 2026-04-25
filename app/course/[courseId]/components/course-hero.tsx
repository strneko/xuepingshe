import { MapPin, User, Clock3 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface CourseHeroProps {
  title: string;
  teacherId?: string | null;
  teacher: string;
  intro: string;
  location: string;
  time: string;
}

export default function CourseHero({ title, teacherId, teacher, intro, location, time }: CourseHeroProps) {
  const teacherHref = teacherId ? `/teacher/${teacherId}` : null;

  return (
    <Card id="course-intro">
      <CardContent className="space-y-4 pt-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {teacherHref ? (
            <Link
              href={teacherHref}
              className="group inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-all duration-200 hover:bg-muted/40 hover:text-foreground hover:shadow-[0_6px_16px_rgba(120,120,120,0.16)]"
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
        <p className="text-sm leading-6 text-muted-foreground">{intro}</p>
      </CardContent>
    </Card>
  );
}
