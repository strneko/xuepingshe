"use client";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";

export default function CategoriesBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const category = parseInt(searchParams.get("category") || "0");
  const handleCategoryChange = (category: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", category.toString());
    router.push(pathname + `?${params.toString()}`);
  };
  return (
    <div className="flex gap-4">
      <Button variant={category === 0 ? "default" : "outline"} onClick={() => handleCategoryChange(0)}>
        全部
      </Button>
      <Button variant={category === 1 ? "default" : "outline"} onClick={() => handleCategoryChange(1)}>
        课程
      </Button>
      <Button variant={category === 2 ? "default" : "outline"} onClick={() => handleCategoryChange(2)}>
        教师
      </Button>
      {/* //TODO:筛选 */}
    </div>
  );
}
