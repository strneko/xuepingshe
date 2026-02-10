"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SearchInput = dynamic(() => import("./search-input"), {
  ssr: false,
  loading: () => <Skeleton className="h-4 w-[30vw]" />,
});

export default function Navbar() {
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const target = document.getElementById("hero-search");
    if (!target) {
      setShowSearch(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSearch(!entry.isIntersecting);
      },
      { root: null, threshold: 0.6, rootMargin: "64px 0px 0px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="sticky top-0 z-50 flex w-full h-16 px-4 border-b shadow-sm items-center justify-between bg-background">
      <div className="justify-start items-center flex flex-row gap-6">
        <div>logo</div>
        <Link href="/">首页</Link>
        <Link href="/myclass">我的课程</Link>
        <Link href="/profile">个人中心</Link>
      </div>
      {showSearch ? <SearchInput /> : <div />}
      <Avatar className="justify-end items-center">
        {/* TODO: 用户头像悬浮卡片 */}
        <AvatarImage src="#" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    </nav>
  );
}
