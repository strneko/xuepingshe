"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string;
}

export default function SearchInput({ className, inputClassName, onChange, onKeyDown, ...props }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = React.useState("");

  React.useEffect(() => {
    const nextKeyword = searchParams.get("keyword") ?? "";
    setKeyword(nextKeyword);
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.currentTarget.value);
    onChange?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) {
      return;
    }

    if (e.key !== "Enter") {
      return;
    }

    const value = e.currentTarget.value.trim();
    const params = new URLSearchParams(pathname === "/search_result" ? searchParams.toString() : "");

    if (value) {
      params.set("keyword", value);
    } else {
      params.delete("keyword");
    }

    params.delete("page");

    const query = params.toString();
    router.push(query ? `/search_result?${query}` : "/search_result");
  };

  return (
    <div className={cn("relative w-[30vw]", className)}>
      <Search
        className="
        absolute 
        left-3 
        top-1/2 
        transform 
        -translate-y-1/2 
        text-gray-400 
        h-4 w-4
        pointer-events-none
      "
      />
      <Input
        type="search"
        placeholder="搜索教师姓名、课程名或院系..."
        className={cn("pl-10", inputClassName)}
        value={keyword}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  );
}
