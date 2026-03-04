import { MapPin, User, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CourseHeroProps {
  title: string;
  teacher: string;
  intro: string;
  location: string;
  time: string;
}

export default function CourseHero({ title, teacher, intro, location, time }: CourseHeroProps) {
  return (
    <Card id="course-intro">
      <CardContent className="space-y-4 pt-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <User className="size-4" />
            {teacher}
          </span>
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
