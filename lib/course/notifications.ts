import { prisma } from "@/lib/prisma";
import { buildDefaultDedupeKey } from "@/lib/notifications/infra/queue";
import { enqueueNotification } from "@/lib/notifications/service/enqueue-service";

async function resolveCourseAudience(courseId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
      status: "ACTIVE",
    },
    select: {
      userId: true,
      courseName: true,
    },
  });

  const receiverIds = [
    ...new Set(enrollments.map((item) => item.userId.trim()).filter((userId): userId is string => userId.length > 0)),
  ];
  const courseName = enrollments.find((item) => item.courseName.trim())?.courseName.trim() || `课程 ${courseId}`;

  return {
    receiverIds,
    courseName,
  };
}

export async function enqueueCourseAnnouncementPublishedNotification(input: {
  courseId: string;
  announcementId: string;
  announcementTitle: string;
  actorId: string;
}) {
  const { receiverIds, courseName } = await resolveCourseAudience(input.courseId);
  if (receiverIds.length === 0) {
    return;
  }

  const payload = {
    courseId: input.courseId,
    courseName,
    announcementId: input.announcementId,
    announcementTitle: input.announcementTitle,
    href: `/course/${input.courseId}?tab=announcement`,
    title: `《${courseName}》发布了新公告`,
    summary: input.announcementTitle,
  };

  await enqueueNotification({
    eventType: "course.announcement.published",
    bizId: input.announcementId,
    actorId: input.actorId,
    receiverIds,
    payload,
    dedupeKey: buildDefaultDedupeKey({
      eventType: "course.announcement.published",
      bizId: input.announcementId,
      actorId: input.actorId,
      receiverIds,
      payload,
    }),
  });
}

export async function enqueueCourseAnnouncementUpdatedNotification(input: {
  courseId: string;
  announcementId: string;
  announcementTitle: string;
  actorId: string;
  updatedAtIso: string;
}) {
  const { receiverIds, courseName } = await resolveCourseAudience(input.courseId);
  if (receiverIds.length === 0) {
    return;
  }

  const updateBizId = `${input.announcementId}:${input.updatedAtIso}`;
  const payload = {
    courseId: input.courseId,
    courseName,
    announcementId: input.announcementId,
    announcementTitle: input.announcementTitle,
    href: `/course/${input.courseId}?tab=announcement`,
    title: `《${courseName}》更新了课程公告`,
    summary: input.announcementTitle,
  };

  await enqueueNotification({
    eventType: "course.announcement.updated",
    bizId: updateBizId,
    actorId: input.actorId,
    receiverIds,
    payload,
    dedupeKey: buildDefaultDedupeKey({
      eventType: "course.announcement.updated",
      bizId: updateBizId,
      actorId: input.actorId,
      receiverIds,
      payload,
    }),
  });
}

export async function enqueueCourseResourceUploadedNotification(input: {
  courseId: string;
  resourceId: string;
  resourceName: string;
  actorId: string;
}) {
  const { receiverIds, courseName } = await resolveCourseAudience(input.courseId);
  if (receiverIds.length === 0) {
    return;
  }

  const payload = {
    courseId: input.courseId,
    courseName,
    resourceId: input.resourceId,
    resourceName: input.resourceName,
    href: `/course/${input.courseId}?tab=resource`,
    title: `《${courseName}》上传了新课程资源`,
    summary: input.resourceName,
  };

  await enqueueNotification({
    eventType: "course.resource.uploaded",
    bizId: input.resourceId,
    actorId: input.actorId,
    receiverIds,
    payload,
    dedupeKey: buildDefaultDedupeKey({
      eventType: "course.resource.uploaded",
      bizId: input.resourceId,
      actorId: input.actorId,
      receiverIds,
      payload,
    }),
  });
}
