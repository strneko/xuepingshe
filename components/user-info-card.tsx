"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserProfile, useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UserInfoCardProps {
  user: UserProfile | null;
  hideActions?: boolean;
  hidePoints?: boolean;
  showFollowButton?: boolean;
  showMessageButton?: boolean;
  initialFollowing?: boolean;
}

export default function UserInfoCard({
  user,
  hideActions = false,
  hidePoints = false,
  showFollowButton = false,
  showMessageButton = false,
  initialFollowing = false,
}: UserInfoCardProps) {
  const router = useRouter();
  const openAuthDialog = useAuthStore((state) => state.openAuthDialog);
  const clearUser = useAuthStore((state) => state.clearUser);
  const currentUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isFollowing, setIsFollowing] = React.useState(initialFollowing);
  const [followerCount, setFollowerCount] = React.useState(user?.followerCount ?? 0);
  const [followLoading, setFollowLoading] = React.useState(false);

  React.useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  React.useEffect(() => {
    setFollowerCount(user?.followerCount ?? 0);
  }, [user?.followerCount]);

  const handleProfileClick = () => {
    router.push("/profile");
  };

  const handleLogoutClick = () => {
    void (async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      clearUser();
      router.push("/");
    })();
  };

  const handleLoginClick = () => {
    openAuthDialog();
  };

  const handleFollowToggle = async () => {
    if (!user?.id) {
      return;
    }

    if (!currentUser) {
      openAuthDialog();
      return;
    }

    if (currentUser.id === user.id || followLoading) {
      return;
    }

    setFollowLoading(true);
    try {
      const response = await fetch("/api/profile/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId: user.id }),
      });

      const data = (await response.json()) as {
        isFollowing?: boolean;
        followerCount?: number;
        followingCount?: number;
        message?: string;
      };

      if (!response.ok) {
        toast.error(data.message ?? "关注操作失败");
        return;
      }

      setIsFollowing(Boolean(data.isFollowing));
      if (typeof data.followerCount === "number") {
        setFollowerCount(data.followerCount);
      }

      if (currentUser && typeof data.followingCount === "number") {
        setUser({
          ...currentUser,
          followingCount: data.followingCount,
        });
      }
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <Card className="w-64 shadow-lg">
      <CardContent className="flex flex-col items-center gap-3 p-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={user?.avatarUrl ?? ""} alt={user?.nickname ?? "用户头像"} />
          <AvatarFallback>{user?.nickname?.slice(0, 2) ?? "游客"}</AvatarFallback>
        </Avatar>

        <p className="text-sm font-medium text-foreground">{user?.nickname ?? "未登录"}</p>
        {user ? (
          <>
            <div className="grid w-full grid-cols-2 gap-2 px-[10%] text-center">
              <div>
                <p className="text-sm font-medium">
                  {user.reviewCount}
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">评价</span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {user.likedCount}
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">被点赞</span>
                </p>
              </div>
              {typeof user?.followingCount === "number" ? (
                <div>
                  <p className="text-sm font-medium">
                    {user.followingCount}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">关注</span>
                  </p>
                </div>
              ) : null}
              {typeof user?.followerCount === "number" ? (
                <div>
                  <p className="text-sm font-medium">
                    {followerCount}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">粉丝</span>
                  </p>
                </div>
              ) : null}
            </div>
            {!hidePoints ? <p className="text-xs text-muted-foreground">积分: {user.points}</p> : null}
            {showFollowButton && user && currentUser?.id !== user.id ? (
              <div className="w-full space-y-2">
                <Button
                  type="button"
                  variant={isFollowing ? "outline" : "default"}
                  className="w-full"
                  onClick={() => void handleFollowToggle()}
                  disabled={followLoading}
                >
                  {followLoading ? "处理中..." : isFollowing ? "已关注" : "+ 关注"}
                </Button>
                {showMessageButton ? (
                  <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/community")}>
                    私信
                  </Button>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className="w-full">
            <Button type="button" className="w-full" onClick={handleLoginClick}>
              登录
            </Button>
          </div>
        )}
        {!hideActions && user ? (
          <>
            <Button type="button" variant="outline" className="w-full" onClick={handleProfileClick}>
              账户资料
            </Button>
            <Button type="button" variant="destructive" className="w-full" onClick={handleLogoutClick}>
              退出登录
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
