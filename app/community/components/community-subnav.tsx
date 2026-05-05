"use client";

import { SquarePen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CommunitySortTab } from "@/app/community/_types";
import { cn } from "@/lib/utils";

type CommunitySubnavProps = {
  activeTab: CommunitySortTab;
  onTabChange: (tab: CommunitySortTab) => void;
  isAdmin?: boolean;
  onNewAnnouncement?: () => void;
};

const tabItems: Array<{ key: CommunitySortTab; label: string }> = [
  { key: "latest-post", label: "最新发帖" },
  { key: "latest-reply", label: "最新回复" },
  { key: "hot", label: "热门" },
];

export default function CommunitySubnav({ activeTab, onTabChange, isAdmin = false, onNewAnnouncement }: CommunitySubnavProps) {
  return (
    <section className="flex items-center justify-between gap-3  bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        {tabItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onTabChange(item.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === item.key ? "bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isAdmin ? (
        <Button onClick={onNewAnnouncement} className="inline-flex items-center gap-2">
          <SquarePen className="size-4" />
          发布公告
        </Button>
      ) : (
        <Button asChild>
          <Link href="/community/new" className="inline-flex items-center gap-2">
            <SquarePen className="size-4" />
            发布帖子
          </Link>
        </Button>
      )}
    </section>
  );
}
