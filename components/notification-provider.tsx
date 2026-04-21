"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useNotificationStore } from "@/lib/notifications/store";

export default function NotificationProvider() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const initialize = useNotificationStore((state) => state.initialize);
  const connectStream = useNotificationStore((state) => state.connectStream);
  const disconnectStream = useNotificationStore((state) => state.disconnectStream);

  useEffect(() => {
    if (!userId) {
      disconnectStream();
      return;
    }

    void initialize(50);
    connectStream();

    return () => {
      disconnectStream();
    };
  }, [connectStream, disconnectStream, initialize, userId]);

  return null;
}
