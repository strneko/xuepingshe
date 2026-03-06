"use client";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useRouter, usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";

type CategoryValue = "0" | "1" | "2";

const CATEGORY_OPTIONS: { value: CategoryValue; label: string }[] = [
  { value: "0", label: "全部" },
  { value: "1", label: "课程" },
  { value: "2", label: "教师" },
];

export default function CategoriesBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawCategory = searchParams.get("category");
  const category: CategoryValue = rawCategory === "1" || rawCategory === "2" ? rawCategory : "0";

  const handleCategoryChange = (nextCategory: CategoryValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", nextCategory);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-start px-1">
      <ButtonGroup>
        {CATEGORY_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={category === option.value ? "default" : "outline"}
            onClick={() => handleCategoryChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
}
