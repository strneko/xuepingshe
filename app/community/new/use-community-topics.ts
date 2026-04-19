import * as React from "react";

const DEFAULT_TOPICS = [
  "课程体验",
  "学习方法",
  "校园生活",
  "考试攻略",
  "选课建议",
  "社团活动",
  "宿舍日常",
  "保研经验",
  "实习分享",
  "资源整理",
];

type TopicApiItem = {
  name: string;
};

export function useCommunityTopics() {
  const [topicKeyword, setTopicKeyword] = React.useState("");
  const [debouncedTopicKeyword, setDebouncedTopicKeyword] = React.useState("");
  const [recommendedTopics, setRecommendedTopics] = React.useState<string[]>(DEFAULT_TOPICS.slice(0, 5));
  const [searchTopicOptions, setSearchTopicOptions] = React.useState<string[]>(DEFAULT_TOPICS);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTopicKeyword(topicKeyword.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [topicKeyword]);

  React.useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        const response = await fetch("/api/community/topics?limit=5", {
          signal: controller.signal,
        });

        if (!response.ok || controller.signal.aborted) {
          return;
        }

        const data = (await response.json()) as { items?: TopicApiItem[] };
        if (controller.signal.aborted) {
          return;
        }

        const names = (data.items ?? []).map((item) => item.name);
        if (names.length > 0) {
          setRecommendedTopics(names.slice(0, 5));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    };

    void run();

    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        const query = new URLSearchParams();
        if (debouncedTopicKeyword) {
          query.set("keyword", debouncedTopicKeyword);
        }
        query.set("limit", "12");

        const response = await fetch(`/api/community/topics?${query.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok || controller.signal.aborted) {
          return;
        }

        const data = (await response.json()) as { items?: TopicApiItem[] };
        if (controller.signal.aborted) {
          return;
        }

        const names = (data.items ?? []).map((item) => item.name);
        setSearchTopicOptions(names);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    };

    void run();

    return () => controller.abort();
  }, [debouncedTopicKeyword]);

  const dropdownOptions = React.useMemo(() => {
    if (debouncedTopicKeyword) {
      return searchTopicOptions;
    }

    return recommendedTopics;
  }, [debouncedTopicKeyword, recommendedTopics, searchTopicOptions]);

  return {
    topicKeyword,
    setTopicKeyword,
    recommendedTopics,
    dropdownOptions,
  };
}
