import { MyCard } from "@/components/mycard";

export default function Recommendations({ className }: { className?: string }) {
  return (
    <div className={className}>
      推荐内容
      <MyCard />
    </div>
  );
  //轮播卡片 + 推荐卡片
  //热门评价
  // 热门课程
  // 热门教师
}
