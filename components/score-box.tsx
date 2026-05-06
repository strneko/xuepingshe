import { CircleSlash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreBoxProps {
  score: number | null;
  className?: string;
  digits?: number;
  placeholder?: string;
}

function getScoreClass(score: number | null) {
  if (score === null) {
    return "bg-muted text-muted-foreground";
  }

  if (score < 3) {
    return "bg-red-100/50 text-red-700";
  }

  if (score < 4) {
    return "bg-amber-100/60 text-amber-700";
  }

  return "bg-emerald-100/60 text-emerald-700";
}

export default function ScoreBox({ score, className, digits = 1, placeholder = "暂无评分" }: ScoreBoxProps) {
  if (score === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium",
          getScoreClass(score),
          className,
        )}
      >
        <CircleSlash2 className="size-3.5" />
        <span>{placeholder}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium tabular-nums",
        getScoreClass(score),
        className,
      )}
    >
      {Number(score.toFixed(digits))}
    </span>
  );
}
