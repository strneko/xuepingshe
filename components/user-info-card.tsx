"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserProfile, useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "next/navigation";

interface UserInfoCardProps {
  user: UserProfile | null;
}

export default function UserInfoCard({ user }: UserInfoCardProps) {
  const router = useRouter();
  const clearUser = useAuthStore((state) => state.clearUser);

  const handleProfileClick = () => {
    router.push("/account");
  };

  const handleLogoutClick = () => {
    clearUser();
    router.push("/");
  };

  return (
    <Card className="w-64 shadow-lg">
      <CardContent className="flex flex-col items-center gap-3 p-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={user?.avatarUrl ?? ""} alt={user?.nickname ?? "用户头像"} />
          <AvatarFallback>{user?.nickname?.slice(0, 2) ?? "游客"}</AvatarFallback>
        </Avatar>

        <p className="text-sm font-medium text-foreground">{user?.nickname ?? "未登录"}</p>
        <div className="flex justify-between w-full px-[15%]">
          <p className="text-xs text-muted-foreground">评价数：{user?.reviewCount ?? 0}</p>
          <p className="text-xs text-muted-foreground">被点赞数：{user?.likedCount ?? 0}</p>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={handleProfileClick}>
          账户资料
        </Button>
        <Button type="button" variant="destructive" className="w-full" onClick={handleLogoutClick}>
          退出登录
        </Button>
      </CardContent>
    </Card>
  );
}
