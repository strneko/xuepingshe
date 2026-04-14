import { listUploadedPartNumbers } from "../repositories/upload-part-repo";
import { findSessionByUploadId } from "../repositories/upload-session-repo";
import { UploadError } from "../errors";

export async function getUploadSessionStatus(uploadId: string) {
  const session = await findSessionByUploadId(uploadId);
  if (!session) {
    throw new UploadError("上传会话不存在", 404, "SESSION_NOT_FOUND");
  }

  const uploadedParts = (await listUploadedPartNumbers(uploadId)).map((item) => item.partNumber);
  const progress = session.totalChunks > 0 ? Math.round((uploadedParts.length / session.totalChunks) * 100) : 0;

  return {
    uploadId,
    status: session.status,
    uploadedParts,
    progress,
    resourceId: session.resourceId ?? undefined,
  };
}
