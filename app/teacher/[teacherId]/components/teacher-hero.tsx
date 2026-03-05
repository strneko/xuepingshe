import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeacherHeroProps {
  teacherName: string;
  avatarUrl?: string;
  department: string;
  title: string;
  researchAreas: string[];
  office: string;
  description: string;
}

export default function TeacherHero({
  teacherName,
  avatarUrl,
  department,
  title,
  researchAreas,
  office,
  description,
}: TeacherHeroProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">教师介绍</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-16">
            <AvatarImage src={avatarUrl} alt={teacherName} />
            <AvatarFallback>{teacherName.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <p className="text-base font-semibold">{teacherName}</p>
            <p className="text-sm text-muted-foreground">院系：{department}</p>
            <p className="text-sm text-muted-foreground">职位：{title}</p>
          </div>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm text-muted-foreground">研究方向：{researchAreas.join("、")}</p>
          <p className="text-sm text-muted-foreground">办公室地点：{office}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
