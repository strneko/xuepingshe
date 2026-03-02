"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, Calendar, Clock, User, BookOpen, Info } from "lucide-react";
import { CourseCardProps } from "../page";

export function CourseCard({
  courseName,
  teacher,
  location,
  time,
  imageUrl,
  deadline,
  isEvaluated,
  onEvaluate,
  description = "本课程旨在培养学生掌握核心专业知识，通过理论与实践相结合的方式，提升学生的综合应用能力。", // 默认描述
  credits = "3.0 学分",
}: CourseCardProps) {
  // ✨ 新增：控制弹窗显示的状态
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <>
      {/* 主卡片 */}
      <Card className="w-[80vw] max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-600">
        {/* --- 左侧：课程图片 --- */}
        <div className="w-full md:w-48 h-48 md:h-auto relative shrink-0">
          <img src={imageUrl} alt={courseName} className="w-full h-full object-cover" />
        </div>

        {/* --- 中间：课程详细信息 (可点击区域) --- */}
        {/* ✨ 修改：添加 onClick 事件和 cursor-pointer 样式，让用户知道这里能点 */}
        <div
          className="flex-1 p-6 flex flex-col justify-center space-y-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
          onClick={() => setIsDetailOpen(true)} // ✨ 点击时打开弹窗
        >
          <div className="flex items-start justify-between">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{courseName}</h3>
            {/* 一个小提示图标，暗示可点击 */}
            <Info className="w-5 h-5 text-gray-400 hidden md:block" />
          </div>

          <div className="space-y-2 text-sm md:text-base text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              <span>{teacher}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span>{time}</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md inline-block">
              点击查看详情
            </span>
          </div>
        </div>

        {/* --- 右侧：操作区 --- */}
        {/* 注意：给右侧也加个 onClick={(e) => e.stopPropagation()}，防止点击按钮时也触发弹窗 */}
        <div
          className="w-full md:w-48 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l bg-gray-50/50 gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          {isEvaluated ? (
            <Button disabled variant="secondary" className="w-full grayscale opacity-70 cursor-not-allowed">
              已评教
            </Button>
          ) : (
            <Button
              onClick={onEvaluate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 shadow-md"
            >
              去评教
            </Button>
          )}

          <div className="text-xs text-center text-gray-500 flex flex-col items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>截止：{deadline}</span>
          </div>
        </div>
      </Card>

      {/* ✨ 新增：详情弹窗组件 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">{courseName}</DialogTitle>
            <DialogDescription>课程详细信息与评教说明</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* 弹窗内的布局：左边图，右边文字 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <img src={imageUrl} alt={courseName} className="w-full sm:w-1/3 h-48 object-cover rounded-lg shadow-sm" />
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold">学分：</span>
                    <span>{credits}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold">教师：</span>
                    <span>{teacher}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="font-semibold">地点：</span>
                    <span>{location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="font-semibold">时间：</span>
                    <span>{time}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-semibold mb-1">课程简介</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                </div>
              </div>
            </div>

            {/* 弹窗底部的操作区 */}
            <div className="bg-gray-50 p-4 rounded-md border flex justify-between items-center">
              <div className="text-sm text-gray-600">
                评教截止日期：<span className="font-bold text-red-500">{deadline}</span>
              </div>
              {isEvaluated ? (
                <Button disabled variant="outline" className="grayscale">
                  已完成评教
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    onEvaluate?.();
                    setIsDetailOpen(false); // 点击评教后关闭弹窗
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  立即评教
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>{/* 通常 Dialog 会自动处理关闭，这里可以放一些次要操作，或者留空 */}</DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
