import { UploadError } from "../errors";
import { findSessionByUploadId, updateSession } from "../repositories/upload-session-repo";
import { getStorageDriver } from "../storage";

export async function cancelUploadSession(uploadId: string) {
  const session = await findSessionByUploadId(uploadId);
  if (!session) {
    throw new UploadError("上传会话不存在", 404, "SESSION_NOT_FOUND");
  }

  if (session.status === "MERGING") {
    throw new UploadError("上传正在合并，无法取消", 409, "SESSION_MERGING");
  }

  if (session.status === "COMPLETED") {
    throw new UploadError("上传已完成，无法取消", 409, "SESSION_COMPLETED");
  }

  if (session.status !== "CANCELED") {
    await updateSession(uploadId, { status: "CANCELED" });
    await getStorageDriver().deletePrefix(session.tempObjectPrefix);
  }

  return { canceled: true };
}
