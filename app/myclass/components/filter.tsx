"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Filter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onlyUnevaluated = searchParams.get("unevaluated") === "true";
  const sort = searchParams.get("sort") === "desc" ? "desc" : "asc";
  const keywordParam = searchParams.get("keyword") ?? "";
  const [keyword, setKeyword] = useState(keywordParam);

  useEffect(() => {
    setKeyword(keywordParam);
  }, [keywordParam]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
        return;
      }
      params.set(key, value);
    });

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const applyKeyword = () => {
    const trimmedKeyword = keyword.trim();
    updateParams({ keyword: trimmedKeyword ? trimmedKeyword : null, page: null });
  };

  return (
    <div className="flex w-full items-center gap-4 py-4 px-[10vw]">
      <div className="relative w-[20vw]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="搜索课程名称"
          className="pl-9"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyKeyword();
            }
          }}
        />
      </div>
      <div className="ml-auto flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <Checkbox
            checked={onlyUnevaluated}
            onCheckedChange={(checked) => updateParams({ unevaluated: checked === true ? "true" : null, page: null })}
          />
          仅看未评教
        </label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => updateParams({ sort: sort === "asc" ? "desc" : "asc", page: null })}
        >
          截止时间：{sort === "asc" ? "最近" : "最远"}
        </Button>
      </div>
    </div>
  );
}
