import { enqueueNotification } from "@/lib/notifications/service/enqueue-service";
import { buildDefaultDedupeKey } from "@/lib/notifications/infra/queue";

type CommunityPostNotificationBase = {
  postId: string;
  postTitle: string;
  actorId: string;
  actorNickname: string | null;
  postAuthorId: string;
};

function normalizeNickname(value: string | null | undefined) {
  return value?.trim() || "匿名同学";
}

function uniqueReceiverIds(values: Array<string | null | undefined>, actorId: string) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))].filter(
    (userId) => userId !== actorId,
  );
}

async function enqueueCommunityPostNotification(input: {
  eventType: string;
  bizId: string;
  actorId: string;
  actorNickname: string | null;
  receiverIds: string[];
  title: string;
  summary: string;
  href: string;
  payload: Record<string, unknown>;
}) {
  if (input.receiverIds.length === 0) {
    return;
  }

  await enqueueNotification({
    eventType: input.eventType,
    bizId: input.bizId,
    actorId: input.actorId,
    receiverIds: input.receiverIds,
    payload: {
      ...input.payload,
      actorNickname: normalizeNickname(input.actorNickname),
      href: input.href,
      title: input.title,
      summary: input.summary,
    },
    dedupeKey: buildDefaultDedupeKey({
      eventType: input.eventType,
      bizId: input.bizId,
      actorId: input.actorId,
      receiverIds: input.receiverIds,
      payload: input.payload,
    }),
  });
}

export async function enqueueCommunityPostLikeNotification(input: CommunityPostNotificationBase) {
  const receiverIds = uniqueReceiverIds([input.postAuthorId], input.actorId);
  await enqueueCommunityPostNotification({
    eventType: "community.post.like",
    bizId: input.postId,
    actorId: input.actorId,
    actorNickname: input.actorNickname,
    receiverIds,
    title: `${normalizeNickname(input.actorNickname)} 点赞了你的帖子`,
    summary: `《${input.postTitle}》收到了一次点赞。`,
    href: `/community/${input.postId}`,
    payload: {
      postId: input.postId,
      postTitle: input.postTitle,
      action: "like",
    },
  });
}

export async function enqueueCommunityPostCommentNotification(
  input: CommunityPostNotificationBase & {
    commentId: string;
    replyToAuthorId?: string | null;
  },
) {
  const receiverIds = uniqueReceiverIds([input.postAuthorId, input.replyToAuthorId], input.actorId);
  await enqueueCommunityPostNotification({
    eventType: "community.post.comment",
    bizId: input.commentId,
    actorId: input.actorId,
    actorNickname: input.actorNickname,
    receiverIds,
    title: `${normalizeNickname(input.actorNickname)} 评论了你的帖子`,
    summary: `《${input.postTitle}》收到了新评论。`,
    href: `/community/${input.postId}`,
    payload: {
      postId: input.postId,
      postTitle: input.postTitle,
      commentId: input.commentId,
      replyToAuthorId: input.replyToAuthorId ?? null,
      action: "comment",
    },
  });
}
