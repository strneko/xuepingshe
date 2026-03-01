"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
//鼠标悬浮时显示遮罩层，点击卡片进入详情页
export function DefaultCard({ className }: { className?: string }) {
  return (
    <Dialog>
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
          <DialogTrigger asChild>
            <Button className="w-full">查看详情</Button>
          </DialogTrigger>
        </CardFooter>
      </Card>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>教师或者课程名</DialogTitle>
          <DialogDescription>教师主页或者课程主页</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>这里展示该教师/课程的详细信息，例如简介、评分、评价数量等。</p>
          <p>后续接入后端接口后，可在打开弹窗时按卡片 ID 拉取并渲染真实详情数据。</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
