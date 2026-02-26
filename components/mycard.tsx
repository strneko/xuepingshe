import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
//鼠标悬浮时显示遮罩层，点击卡片进入详情页
export function MyCard({ className }: { className?: string }) {
  return (
    <Card className={cn("relative mx-auto w-full max-w-sm pt-0", className)}>
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src="#"
        alt="Card Image"
        className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
      />
      <CardHeader>
        <CardAction>
          <Badge variant="default">种类</Badge>
        </CardAction>
        <CardTitle>教师或者课程名</CardTitle>
        <CardDescription>教师主页或者课程主页</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full">查看详情</Button>
      </CardFooter>
    </Card>
  );
}
