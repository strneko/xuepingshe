import { notificationSseManager } from "../infra/sse-connection-manager";

const encoder = new TextEncoder();

function serializeEvent(params: { event: string; data: unknown; id?: string }) {
  const chunks = [] as string[];
  if (params.id) {
    chunks.push(`id: ${params.id}`);
  }
  chunks.push(`event: ${params.event}`);
  chunks.push(`data: ${JSON.stringify(params.data)}`);
  chunks.push("\n");
  return encoder.encode(chunks.join("\n"));
}

export function createNotificationEventStream(userId: string) {
  let unsubscribe: (() => void) | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      unsubscribe = notificationSseManager.subscribe(userId, (packet) => {
        controller.enqueue(
          serializeEvent({
            id: packet.event === "notification" ? packet.id : undefined,
            event: packet.event,
            data: packet.data,
          }),
        );
      });

      controller.enqueue(
        serializeEvent({
          event: "connected",
          data: {
            ok: true,
            ts: new Date().toISOString(),
          },
        }),
      );

      heartbeatTimer = setInterval(() => {
        controller.enqueue(
          serializeEvent({
            event: "heartbeat",
            data: { ts: new Date().toISOString() },
          }),
        );
      }, 15000);
    },
    cancel() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }

      if (unsubscribe) {
        unsubscribe();
      }

      return;
    },
  });
}
