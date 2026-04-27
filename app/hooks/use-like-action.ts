"use client";

import * as React from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/stores/auth-store";

type LikeMode = "key" | "global";

type RunLikeTask<TRollback, TResult> = {
  optimistic: () => TRollback;
  request: (rollbackContext: TRollback) => Promise<TResult>;
  confirm: (result: TResult, rollbackContext: TRollback) => void;
  rollback: (rollbackContext: TRollback) => void;
  errorMessage?: string;
};

type UseLikeActionOptions = {
  mode?: LikeMode;
};

export function useLikeAction({ mode = "key" }: UseLikeActionOptions = {}) {
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set());
  const pendingIdsRef = React.useRef<Set<string>>(new Set());
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const openAuthDialog = useAuthStore((state) => state.openAuthDialog);

  const setPendingState = React.useCallback((next: Set<string>) => {
    pendingIdsRef.current = next;
    setPendingIds(next);
  }, []);

  const runLikeAction = React.useCallback(
    async <TRollback, TResult>(targetId: string, task: RunLikeTask<TRollback, TResult>) => {
      if (mode === "global" && pendingIdsRef.current.size > 0) {
        return false;
      }

      if (pendingIdsRef.current.has(targetId)) {
        return false;
      }

      if (!isLoggedIn) {
        openAuthDialog();
        return false;
      }

      const rollbackContext = task.optimistic();

      setPendingState(new Set(pendingIdsRef.current).add(targetId));

      try {
        const result = await task.request(rollbackContext);
        task.confirm(result, rollbackContext);
        return true;
      } catch {
        task.rollback(rollbackContext);
        toast.error(task.errorMessage ?? "点赞失败，请稍后重试");
        return false;
      } finally {
        const next = new Set(pendingIdsRef.current);
        next.delete(targetId);
        setPendingState(next);
      }
    },
    [isLoggedIn, mode, openAuthDialog, setPendingState],
  );

  const isLiking = React.useCallback(
    (targetId: string) => {
      return pendingIds.has(targetId);
    },
    [pendingIds],
  );

  const likingId = pendingIds.size > 0 ? (pendingIds.values().next().value ?? null) : null;

  return {
    pendingIds,
    likingId,
    isLiking,
    runLikeAction,
  };
}
