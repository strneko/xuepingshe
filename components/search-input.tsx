"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string;
}

export default function SearchInput({ className, inputClassName, ...props }: SearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //搜索联想
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") {
      return;
    }
    const value = e.currentTarget.value;
    alert(`搜索：${value}，跳转搜索结果页`); // TODO: 跳转搜索结果页
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
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  );
}
