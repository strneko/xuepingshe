"use client";
import * as React from "react";
import { MyCardCarousel } from "./mycard-carousel";
import RecommendedList from "./recommended-list";

export default function Recommendations() {
  const [items, setItems] = React.useState<number[]>(() => Array.from({ length: 6 }, (_, index) => index));
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const isRefreshingRef = React.useRef(false);

  const handleRefresh = React.useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      // TODO: replace with backend API call.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setItems(Array.from({ length: 6 }, (_, index) => Date.now() + index));
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] gap-20 justify-between ">
      <MyCardCarousel className="flex-1" />
      <RecommendedList className="flex-2" items={items} onRefresh={handleRefresh} isRefreshing={isRefreshing} />
    </div>
  );
}
