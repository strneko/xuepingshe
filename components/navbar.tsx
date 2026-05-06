"use client";

import { useEffect, useCallback } from "react";
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

function DoodleStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2 L14.5 9 L22 9.5 L16 14.5 L17.5 22 L12 17.5 L6.5 22 L8 14.5 L2 9.5 L9.5 9 Z" filter="url(#doodle-sketch)" />
    </svg>
  );
}

function NavLink({ href, children, active, onClick }: { href: string; children: string; active?: boolean; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative px-1 py-0.5 text-sm font-medium transition-colors hover:text-foreground ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
      {active && (
        <svg
          viewBox="0 0 40 6"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-full h-1.5 text-amber-500/60"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <path
            d="M0 4 Q10 0 20 4 Q30 8 40 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
                     />
        </svg>
      )}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const showSearch = pathname !== "/" && pathname !== "/myclass";
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const openAuthDialog = useAuthStore((state) => state.openAuthDialog);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  const handleAuthGate = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isLoggedIn) {
        e.preventDefault();
        openAuthDialog();
      }
    },
    [isLoggedIn, openAuthDialog],
  );

  return (
    <nav className="sticky top-0 z-50 flex w-full h-16 px-[10vw] border-b-2 shadow-none items-center justify-between bg-background">
      {/* Left: Logo + Nav links */}
      <div className="justify-start items-center flex flex-row gap-6">
        {/* Doodle logo */}
        <Link href="/" className="flex items-center gap-1.5 select-none">
          <DoodleStar className="size-4 text-amber-500/70" />
          <span
            className="text-lg font-bold tracking-wide"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            学评社
          </span>
          <DoodleStar className="size-3 text-amber-500/50" />
        </Link>

        <NavLink href="/" active={pathname === "/"}>首页</NavLink>
        <NavLink href="/community" active={pathname.startsWith("/community")}>社区</NavLink>
        <NavLink href="/myclass?unevaluated=true" active={pathname.startsWith("/myclass")} onClick={handleAuthGate}>我的课程</NavLink>
        <NavLink href="/profile" active={pathname.startsWith("/profile")} onClick={handleAuthGate}>个人中心</NavLink>
      </div>

      {/* Center: Search */}
      {showSearch ? <SearchInput /> : <div />}

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/shop"
          aria-label="商店"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-transparent hover:border-border hover:bg-accent/40 transition-all doodle-tilt"
        >
          <Store className="size-4" />
        </Link>
        {user ? (
          <>
            <NotificationBell />
            <UserHover />
          </>
        ) : (
          <Button type="button" variant="doodle" size="sm" onClick={openAuthDialog}>
            登录
          </Button>
        )}
      </div>
    </nav>
  );
}
