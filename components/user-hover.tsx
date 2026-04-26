"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useAuthStore } from "@/lib/stores/auth-store";
import UserInfoCard from "./user-info-card";

export default function UserHover() {
  const user = useAuthStore((state) => state.user);

  return (
    <HoverCard openDelay={120} closeDelay={120}>
      <HoverCardTrigger asChild>
        <Link href="/profile" aria-label="个人中心" className="rounded-full">
          <Avatar className="justify-end items-center cursor-pointer">
            <AvatarImage src={user?.avatarUrl ?? ""} alt={user?.nickname ?? "用户头像"} />
            <AvatarFallback>{user?.nickname?.slice(0, 2) ?? "游客"}</AvatarFallback>
          </Avatar>
        </Link>
      </HoverCardTrigger>
      <HoverCardContent align="center" sideOffset={8} className="w-auto border-none bg-transparent p-0 shadow-none">
        <UserInfoCard user={user} />
      </HoverCardContent>
    </HoverCard>
  );
}
