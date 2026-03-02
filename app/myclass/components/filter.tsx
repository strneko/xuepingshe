"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export default function Filter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onlyUnevaluated = searchParams.get("unevaluated") === "true";
  const sort = searchParams.get("sort") === "desc" ? "desc" : "asc";

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

  return (
    <div className="flex items-center justify-end gap-4 py-4">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <Checkbox
          checked={onlyUnevaluated}
          onCheckedChange={(checked) => updateParams({ unevaluated: checked === true ? "true" : null })}
        />
        仅看未评教
      </label>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => updateParams({ sort: sort === "asc" ? "desc" : "asc" })}
      >
        截止时间：{sort === "asc" ? "最近" : "最远"}
      </Button>
    </div>
  );
}
