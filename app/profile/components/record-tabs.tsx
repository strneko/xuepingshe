"use client";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type UserRecordTab = "view" | "review" | "post" | "comment" | "liked" | "following" | "followers";

interface RecordTabsProps {
  activeTab: UserRecordTab;
}

const TAB_OPTIONS: { key: UserRecordTab; label: string }[] = [
  { key: "view", label: "浏览记录" },
  { key: "review", label: "我的评价" },
  { key: "post", label: "我的发帖" },
  { key: "comment", label: "我的评论" },
  { key: "liked", label: "我的点赞" },
  { key: "following", label: "我的关注" },
  { key: "followers", label: "我的粉丝" },
];

export default function RecordTabs({ activeTab }: RecordTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const changeTab = (tab: UserRecordTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex items-center gap-2">
      {TAB_OPTIONS.map((tabOption) => (
        <Button
          key={tabOption.key}
          type="button"
          variant={activeTab === tabOption.key ? "default" : "outline"}
          size="sm"
          onClick={() => changeTab(tabOption.key)}
        >
          {tabOption.label}
        </Button>
      ))}
    </div>
  );
}
