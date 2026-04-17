export interface NotificationEnqueuePayload {
  eventType: string;
  bizId: string;
  actorId: string;
  receiverIds: string[];
  payload: Record<string, unknown>;
  dedupeKey?: string;
}

export function buildDefaultDedupeKey(input: NotificationEnqueuePayload) {
  return `${input.eventType}:${input.bizId}:${input.receiverIds.slice().sort().join(",")}`;
}
