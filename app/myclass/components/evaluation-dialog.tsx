"use client";

import { useMemo, useState } from "react";
import { ChevronDown, CircleSlash2, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import ScoreBox from "@/components/score-box";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ReviewScoreItem } from "@/app/course/[courseId]/_types";

interface EvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName: string;
  teacher: string;
  deadline: string;
  onSubmit?: (payload: EvaluationSubmitPayload) => Promise<void> | void;
}

export interface EvaluationSubmitPayload {
  overallScore: number;
  summary: string;
  detailedScores: ReviewScoreItem[];
}
type Score = number | null;

interface SubItem {
  id: string;
  name: string;
  score: Score;
  weight: number;
  isExcluded: boolean;
}

interface Category {
  id: string;
  title: string;
  standard: string;
  score: Score;
  weight: number;
  isExcluded: boolean;
  expanded: boolean;
  subItems: SubItem[];
}

const makeInitialCategories = (): Category[] => [
  {
    id: "attitude",
    title: "教师教学态度与师德",
    standard: "责任心强、尊重学生、公平公正，持续投入教学改进。",
    score: null,
    weight: 1,
    isExcluded: false,
    expanded: false,
    subItems: [
      { id: "attitude-1", name: "教学责任心", score: null, weight: 1, isExcluded: false },
      { id: "attitude-2", name: "师德师风", score: null, weight: 1, isExcluded: false },
      { id: "attitude-3", name: "教学投入度", score: null, weight: 1, isExcluded: false },
    ],
  },
  {
    id: "content",
    title: "教学内容与设计",
    standard: "目标清晰，内容科学且结构合理，与教学大纲保持一致。",
    score: null,
    weight: 1,
    isExcluded: false,
    expanded: false,
    subItems: [
      { id: "content-1", name: "教学目标明确性", score: null, weight: 1, isExcluded: false },
      { id: "content-2", name: "内容科学性", score: null, weight: 1, isExcluded: false },
      { id: "content-3", name: "内容组织逻辑性", score: null, weight: 1, isExcluded: false },
      { id: "content-4", name: "课程内容与大纲一致性", score: null, weight: 1, isExcluded: false },
    ],
  },
  {
    id: "method",
    title: "教学方法与技巧",
    standard: "方法多样有效，课堂组织有序，表达清晰且富有感染力。",
    score: null,
    weight: 1,
    isExcluded: false,
    expanded: false,
    subItems: [
      { id: "method-1", name: "教学方法有效性", score: null, weight: 1, isExcluded: false },
      { id: "method-2", name: "课堂组织能力", score: null, weight: 1, isExcluded: false },
      { id: "method-3", name: "教学基本功", score: null, weight: 1, isExcluded: false },
    ],
  },
  {
    id: "effect",
    title: "教学效果与学习成果",
    standard: "学生掌握知识并提升能力，达到课程目标且满意度较高。",
    score: null,
    weight: 1,
    isExcluded: false,
    expanded: false,
    subItems: [
      { id: "effect-1", name: "学生学习效果", score: null, weight: 1, isExcluded: false },
      { id: "effect-2", name: "学习目标达成度", score: null, weight: 1, isExcluded: false },
      { id: "effect-3", name: "学生反馈与满意度", score: null, weight: 1, isExcluded: false },
    ],
  },
  {
    id: "interaction",
    title: "师生互动与课堂氛围",
    standard: "课堂参与积极，互动高质量，学习氛围开放且鼓励创新。",
    score: null,
    weight: 1,
    isExcluded: false,
    expanded: false,
    subItems: [
      { id: "interaction-1", name: "学生参与度", score: null, weight: 1, isExcluded: false },
      { id: "interaction-2", name: "师生互动质量", score: null, weight: 1, isExcluded: false },
      { id: "interaction-3", name: "课堂氛围", score: null, weight: 1, isExcluded: false },
    ],
  },
  {
    id: "resource",
    title: "课程资源与评价",
    standard: "资源充足适配，任务设计合理，评价方式多元且公平。",
    score: null,
    weight: 1,
    isExcluded: false,
    expanded: false,
    subItems: [
      { id: "resource-1", name: "教学资源质量", score: null, weight: 1, isExcluded: false },
      { id: "resource-2", name: "学习任务设计", score: null, weight: 1, isExcluded: false },
      { id: "resource-3", name: "评价方式科学性", score: null, weight: 1, isExcluded: false },
    ],
  },
  {
    id: "improve",
    title: "教学创新与持续改进",
    standard: "积极尝试创新方法，持续反思并根据反馈优化课程。",
    score: null,
    weight: 1,
    isExcluded: false,
    expanded: false,
    subItems: [
      { id: "improve-1", name: "教学创新性", score: null, weight: 1, isExcluded: false },
      { id: "improve-2", name: "教学反思能力", score: null, weight: 1, isExcluded: false },
      { id: "improve-3", name: "课程持续优化", score: null, weight: 1, isExcluded: false },
    ],
  },
];

function average(values: number[]): Score {
  if (values.length === 0) {
    return null;
  }
  const total = values.reduce((sum, current) => sum + current, 0);
  return Number((total / values.length).toFixed(2));
}

function weightedAverage(items: Array<{ score: number; weight: number }>): Score {
  if (items.length === 0) {
    return null;
  }

  const { weightedSum, totalWeight } = items.reduce(
    (accumulator, item) => {
      const weight = Math.max(0, item.weight);
      return {
        weightedSum: accumulator.weightedSum + item.score * weight,
        totalWeight: accumulator.totalWeight + weight,
      };
    },
    { weightedSum: 0, totalWeight: 0 },
  );

  if (totalWeight === 0) {
    return null;
  }

  return Number((weightedSum / totalWeight).toFixed(2));
}

function isWeightOutOfRange(weight: number) {
  return weight < 0 || weight > 100;
}

function normalizeWeight(rawWeight: number) {
  if (Number.isNaN(rawWeight)) {
    return 0;
  }
  return Math.trunc(rawWeight);
}

function clampWeight(weight: number) {
  return Math.min(100, Math.max(0, weight));
}

function toReviewScoreItems(categories: Category[]): ReviewScoreItem[] {
  return categories.map((category) => ({
    key: category.id,
    label: category.title,
    score: category.score,
    weight: category.weight,
    subItems: category.subItems.map((subItem) => ({
      key: subItem.id,
      label: subItem.name,
      score: subItem.score,
      weight: subItem.weight,
    })),
  }));
}

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: Score;
  onChange: (score: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = value !== null && value >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            className={cn(
              "rounded-sm p-0.5 transition-colors",
              disabled ? "cursor-not-allowed opacity-50" : "hover:bg-accent",
            )}
            onClick={() => onChange(star)}
          >
            <Star className={cn("size-5", active ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
          </button>
        );
      })}
    </div>
  );
}

export default function EvaluationDialog({
  open,
  onOpenChange,
  courseName,
  teacher,
  deadline,
  onSubmit,
}: EvaluationDialogProps) {
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [manualScore, setManualScore] = useState<Score>(null);
  const [comment, setComment] = useState("");
  const [activeWeightField, setActiveWeightField] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(makeInitialCategories);

  const categoryScores = useMemo(() => {
    return categories.map((category) => {
      if (category.isExcluded) {
        return null;
      }
      if (category.expanded) {
        const subScoreItems = category.subItems
          .filter((subItem) => !subItem.isExcluded && subItem.score !== null)
          .map((subItem) => ({
            score: subItem.score as number,
            weight: subItem.weight,
          }));
        return weightedAverage(subScoreItems);
      }
      return category.score;
    });
  }, [categories]);

  const overallAutoScore = useMemo(() => {
    const scoreItems = categories
      .map((category, index) => ({
        isExcluded: category.isExcluded,
        score: categoryScores[index],
        weight: category.weight,
      }))
      .filter((item) => !item.isExcluded && item.score !== null)
      .map((item) => ({
        score: item.score as number,
        weight: item.weight,
      }));
    return weightedAverage(scoreItems);
  }, [categories, categoryScores]);

  const overallScore = mode === "manual" ? manualScore : overallAutoScore;
  const reviewPayload = useMemo<EvaluationSubmitPayload | null>(() => {
    if (overallScore === null) {
      return null;
    }

    return {
      overallScore,
      summary: comment.trim(),
      detailedScores: toReviewScoreItems(categories),
    };
  }, [categories, comment, overallScore]);

  const updateCategory = (categoryId: string, updater: (category: Category) => Category) => {
    setCategories((previous) => previous.map((item) => (item.id === categoryId ? updater(item) : item)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl p-0 sm:max-w-4xl">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>课程评教</DialogTitle>
          <DialogDescription>
            {courseName} · {teacher} · 截止日期 {deadline}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          <Card className="supports-backdrop-filter:bg-background/90 sticky top-0 z-20 border bg-background/95 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setMode((previous) => (previous === "auto" ? "manual" : "auto"))}
                >
                  <ChevronDown className={cn("size-4 transition-transform", mode === "manual" && "rotate-180")} />
                </Button>

                <CardTitle className="flex flex-1 items-center justify-between text-base">
                  <span>综合评分</span>
                  <div className="flex items-center gap-2">
                    <StarRating
                      value={overallScore}
                      disabled={mode === "auto"}
                      onChange={(score) => {
                        if (mode === "manual") {
                          setManualScore(score);
                        }
                      }}
                    />
                    <ScoreBox
                      score={overallScore}
                      digits={mode === "manual" ? 0 : 2}
                      className="inline-flex min-w-16 justify-end text-xl font-bold"
                    />
                  </div>
                </CardTitle>
              </div>
            </CardHeader>
          </Card>

          {mode === "auto" && (
            <div className="mt-4 space-y-3 flex flex-col">
              {categories.map((category, categoryIndex) => {
                const currentScore = categoryScores[categoryIndex];

                return (
                  <Card key={category.id} className="py-2">
                    <CardContent>
                      <div className="flex gap-2 items-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 self-center"
                          onClick={() => updateCategory(category.id, (item) => ({ ...item, expanded: !item.expanded }))}
                        >
                          <ChevronDown
                            className={cn("size-4 transition-transform", category.expanded && "rotate-180")}
                          />
                        </Button>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center justify-between gap-3 rounded-md  p-3">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{category.title}</p>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <button type="button" className="text-muted-foreground hover:text-foreground">
                                    <Info className="size-4" />
                                  </button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-72 text-sm leading-relaxed">
                                  {category.standard}
                                </HoverCardContent>
                              </HoverCard>
                              <button
                                type="button"
                                className={cn(
                                  "rounded-md p-1.5 transition-colors",
                                  category.isExcluded
                                    ? "bg-accent text-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                )}
                                onClick={() =>
                                  updateCategory(category.id, (item) => ({
                                    ...item,
                                    isExcluded: !item.isExcluded,
                                    weight: item.isExcluded ? (item.weight === 0 ? 1 : item.weight) : 0,
                                    score: null,
                                  }))
                                }
                              >
                                <CircleSlash2 className="size-5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              {!category.expanded && !category.isExcluded && currentScore !== null && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">权重</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    placeholder="0-100"
                                    className={cn(
                                      "h-8 w-16 p-0 text-right",
                                      isWeightOutOfRange(category.weight) && "border-destructive",
                                    )}
                                    value={category.weight}
                                    onFocus={() => setActiveWeightField(`cat-${category.id}`)}
                                    onBlur={() => {
                                      setActiveWeightField(null);
                                      updateCategory(category.id, (item) => ({
                                        ...item,
                                        weight: clampWeight(item.weight),
                                      }));
                                    }}
                                    onChange={(event) => {
                                      const nextWeight = normalizeWeight(Number.parseFloat(event.target.value));
                                      updateCategory(category.id, (item) => ({
                                        ...item,
                                        weight: nextWeight,
                                      }));
                                    }}
                                    aria-label={`${category.title}权重`}
                                  />
                                </div>
                              )}
                              <StarRating
                                value={currentScore}
                                disabled={category.expanded || category.isExcluded}
                                onChange={(score) =>
                                  updateCategory(category.id, (item) => ({
                                    ...item,
                                    isExcluded: false,
                                    weight: item.weight === 0 ? 1 : item.weight,
                                    score,
                                  }))
                                }
                              />
                              <ScoreBox score={currentScore} digits={2} className="inline-flex min-w-16 justify-end" />
                            </div>
                          </div>
                          {!category.expanded &&
                            !category.isExcluded &&
                            currentScore !== null &&
                            activeWeightField === `cat-${category.id}` &&
                            !isWeightOutOfRange(category.weight) && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                权重范围 0-100，不支持小数；0 表示不参与计算。
                              </p>
                            )}
                          {!category.expanded &&
                            !category.isExcluded &&
                            currentScore !== null &&
                            isWeightOutOfRange(category.weight) && (
                              <p className="mt-1 text-xs text-destructive">权重需在 0-100 之间，失焦后会自动修正。</p>
                            )}
                          {category.expanded && (
                            <p className="mt-2 text-xs text-muted-foreground">当前为细则评分模式，大项分数自动计算。</p>
                          )}
                        </div>
                      </div>

                      {category.expanded && (
                        <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                          {category.subItems.map((subItem, subIndex) => (
                            <div key={subItem.id}>
                              <div className="flex items-center justify-between gap-3 py-1">
                                <p className="text-sm">{subItem.name}</p>
                                <div className="flex items-center gap-3">
                                  {!subItem.isExcluded && subItem.score !== null && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-muted-foreground">权重</span>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        placeholder="0-100"
                                        className={cn(
                                          "h-8 w-16 p-0 text-right",
                                          isWeightOutOfRange(subItem.weight) && "border-destructive",
                                        )}
                                        value={subItem.weight}
                                        onFocus={() => setActiveWeightField(`sub-${subItem.id}`)}
                                        onBlur={() => {
                                          setActiveWeightField(null);
                                          updateCategory(category.id, (item) => ({
                                            ...item,
                                            subItems: item.subItems.map((row) =>
                                              row.id === subItem.id ? { ...row, weight: clampWeight(row.weight) } : row,
                                            ),
                                          }));
                                        }}
                                        onChange={(event) => {
                                          const nextWeight = normalizeWeight(Number.parseFloat(event.target.value));
                                          updateCategory(category.id, (item) => ({
                                            ...item,
                                            subItems: item.subItems.map((row) =>
                                              row.id === subItem.id ? { ...row, weight: nextWeight } : row,
                                            ),
                                          }));
                                        }}
                                        aria-label={`${subItem.name}权重`}
                                      />
                                    </div>
                                  )}
                                  <StarRating
                                    value={subItem.score}
                                    disabled={subItem.isExcluded}
                                    onChange={(score) =>
                                      updateCategory(category.id, (item) => ({
                                        ...item,
                                        isExcluded: false,
                                        subItems: item.subItems.map((row) =>
                                          row.id === subItem.id
                                            ? {
                                                ...row,
                                                score,
                                                isExcluded: false,
                                                weight: row.weight === 0 ? 1 : row.weight,
                                              }
                                            : row,
                                        ),
                                      }))
                                    }
                                  />
                                  <button
                                    type="button"
                                    className={cn(
                                      "rounded-md p-1.5 transition-colors",
                                      subItem.isExcluded
                                        ? "bg-accent text-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                    )}
                                    onClick={() =>
                                      updateCategory(category.id, (item) => ({
                                        ...item,
                                        subItems: item.subItems.map((row) =>
                                          row.id === subItem.id
                                            ? {
                                                ...row,
                                                isExcluded: !row.isExcluded,
                                                score: null,
                                                weight: row.isExcluded ? (row.weight === 0 ? 1 : row.weight) : 0,
                                              }
                                            : row,
                                        ),
                                      }))
                                    }
                                  >
                                    <CircleSlash2 className="size-5" />
                                  </button>
                                </div>
                              </div>
                              {!subItem.isExcluded &&
                                subItem.score !== null &&
                                activeWeightField === `sub-${subItem.id}` &&
                                !isWeightOutOfRange(subItem.weight) && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    权重范围 0-100，不支持小数；0 表示不参与计算。
                                  </p>
                                )}
                              {!subItem.isExcluded && subItem.score !== null && isWeightOutOfRange(subItem.weight) && (
                                <p className="mt-1 text-xs text-destructive">权重需在 0-100 之间，失焦后会自动修正。</p>
                              )}
                              {subIndex < category.subItems.length - 1 && <Separator className="my-1" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="mt-4">
            <CardContent className="space-y-2 pt-6">
              <p className="text-sm font-medium">评语</p>
              <Textarea
                placeholder="请输入你对本课程的评语（选填）"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <p className="text-right text-xs text-muted-foreground">{comment.length} 字</p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            disabled={overallScore === null}
            onClick={async () => {
              if (!reviewPayload) {
                return;
              }

              await onSubmit?.(reviewPayload);
              onOpenChange(false);
            }}
          >
            提交评教
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
