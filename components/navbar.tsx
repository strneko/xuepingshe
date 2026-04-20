"use client";

import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Store } from "lucide-react";
import { usePathname } from "next/navigation";
import NotificationBell from "./notification-bell";
import UserHover from "./user-hover";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";

const SearchInput = dynamic(() => import("./search-input"), {
  ssr: false,
  loading: () => <Skeleton className="h-4 w-[30vw]" />,
});

export default function Navbar() {
  const pathname = usePathname();
  const showSearch = pathname !== "/" && pathname !== "/myclass";
  const user = useAuthStore((state) => state.user);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const openAuthDialog = useAuthStore((state) => state.openAuthDialog);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

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
        {user ? (
          <>
            <NotificationBell />
            <UserHover />
          </>
        ) : (
          <Button type="button" onClick={openAuthDialog}>
            登录
          </Button>
        )}
      </div>
    </nav>
  );
}
