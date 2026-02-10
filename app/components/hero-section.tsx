"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
//动态标语区（Hero Section）
// 占屏高约 40%~50%
// 背景：浅色渐变 or 校园风格插画（可用免费图库如 Undraw）
// 中央大字标语（示例）：
// “发现好老师，分享真评价”
// 交互特效：
// 鼠标移动时，背景中的图形元素（如书本、灯泡、评分星）轻微跟随位移（Parallax 效果）
// 可用 Rellax.js 或纯 CSS transform: translate() 实现

export default function HeroSection() {
  const SearchInput = dynamic(() => import("@globalComponents/search-input"), {
    ssr: false,
    loading: () => <Skeleton className="h-4 w-[30vw]" />,
  });

  return (
    <section id="hero-search" className="flex flex-col items-center h-[60vh] justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">欢迎来到学评社</h1>
      <p className="text-lg text-gray-600 mb-8">发现好老师，分享真评价</p>
      <div id="hero-search">
        <SearchInput inputClassName="h-18  placeholder:text-base" />
      </div>
    </section>
  );
}
