"use client";

import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Store } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import NotificationBell from "./notification-bell";
import UserHover from "./user-hover";

const SearchInput = dynamic(() => import("./search-input"), {
  ssr: false,
  loading: () => <Skeleton className="h-4 w-[30vw]" />,
});

export default function Navbar() {
  const [showSearch, setShowSearch] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/") {
      if (pathname === "/myclass") {
        setShowSearch(false);
      } else {
        setShowSearch(true);
      }
      return;
    }
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
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 flex w-full h-16 px-[10vw] border-b shadow-sm items-center justify-between bg-background">
      <div className="justify-start items-center flex flex-row gap-6">
        <div>logo</div>
        <Link href="/">首页</Link>
        <Link href="/community">社区</Link>
        <Link href="/myclass?unevaluated=true">我的课程</Link>
        <Link href="/profile">个人中心</Link>
      </div>
      {showSearch ? <SearchInput /> : <div />}

      <div className="flex items-center gap-3">
        <Link
          href="/shop"
          aria-label="商店"
          className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
        >
          <Store className="size-5" />
        </Link>
        <NotificationBell />
        <UserHover />
      </div>
    </nav>
  );
}
