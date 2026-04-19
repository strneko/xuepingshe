import * as React from "react";
import { Check, Hash, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

type CommunityTopicSelectorProps = {
  topicKeyword: string;
  onTopicKeywordChange: (value: string) => void;
  dropdownOptions: string[];
  recommendedTopics: string[];
  selectedTopics: string[];
  onToggleTopic: (topic: string) => void;
};

export default function CommunityTopicSelector({
  topicKeyword,
  onTopicKeywordChange,
  dropdownOptions,
  recommendedTopics,
  selectedTopics,
  onToggleTopic,
}: CommunityTopicSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <section className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)] md:items-start">
      <div className="pt-2">
        <div className="text-sm font-medium text-foreground">话题:</div>
      </div>

      <div className="space-y-4">
        <div ref={containerRef} className="relative max-w-md">
          <Command shouldFilter={false} className="rounded-lg border">
            <CommandInput
              value={topicKeyword}
              onValueChange={(value) => {
                onTopicKeywordChange(value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="搜索并选择话题"
              className="h-11"
            />

            {open ? (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
                <CommandList className="max-h-56">
                  <CommandEmpty>暂无匹配话题</CommandEmpty>
                  <CommandGroup heading={topicKeyword.trim() ? "搜索结果" : "推荐候选"}>
                    {dropdownOptions.map((topic) => {
                      const active = selectedTopics.includes(topic);

                      return (
                        <CommandItem
                          key={topic}
                          value={topic}
                          onSelect={() => {
                            onToggleTopic(topic);
                            onTopicKeywordChange("");
                            setOpen(false);
                          }}
                        >
                          <Check className={cn("size-4", active ? "opacity-100" : "opacity-0")} />
                          <span>{topic}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </div>
            ) : null}
          </Command>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">推荐话题</div>
          <div className="flex flex-wrap gap-2">
            {recommendedTopics.map((topic) => {
              const active = selectedTopics.includes(topic);

              return (
                <Button
                  key={topic}
                  type="button"
                  size="sm"
                  variant={active ? "secondary" : "outline"}
                  className={cn("rounded-full px-3 text-xs", active && "border-primary/30 bg-primary/10 text-primary")}
                  onClick={() => onToggleTopic(topic)}
                >
                  {active ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                  {topic}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">已选话题</div>
          {selectedTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedTopics.map((topic) => (
                <Button
                  key={topic}
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-full px-3 text-xs"
                  onClick={() => onToggleTopic(topic)}
                >
                  <Hash className="size-3.5" />
                  {topic}
                  <X className="size-3.5" />
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">还没有选择话题，发帖时建议至少选 1 个。</p>
          )}
        </div>
      </div>
    </section>
  );
}
