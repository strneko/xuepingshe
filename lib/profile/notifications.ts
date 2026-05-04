import { enqueueNotification } from "@/lib/notifications/service/enqueue-service";
import { buildDefaultDedupeKey } from "@/lib/notifications/infra/queue";

function normalizeNickname(value: string | null | undefined) {
  return value?.trim() || "匿名同学";
}

export async function enqueueProfileFollowNotification(input: {
  followId: string;
  actorId: string;
  actorNickname: string | null;
  targetUserId: string;
}) {
  const payload = {
    followId: input.followId,
    href: "/profile",
    title: `${normalizeNickname(input.actorNickname)} 关注了你`,
    summary: "你有新的关注者",
  };

  await enqueueNotification({
    eventType: "profile.follow",
    bizId: input.followId,
    actorId: input.actorId,
    receiverIds: [input.targetUserId],
    payload,
    dedupeKey: buildDefaultDedupeKey({
      eventType: "profile.follow",
      bizId: input.followId,
      actorId: input.actorId,
      receiverIds: [input.targetUserId],
      payload,
    }),
  });
}
