import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse, UploadError } from "@/lib/upload/errors";
import { uploadPartToSession } from "@/lib/upload/service/upload-part-service";
import { checkUploadPartRateLimit } from "@/lib/upload/service/upload-rate-limit";

export async function POST(request: NextRequest) {
  try {
    const uploadId = request.headers.get("Upload-Id") ?? "";
    const partNumberRaw = request.headers.get("Part-Number") ?? "";
    const chunkHash = request.headers.get("Chunk-Hash") ?? "";
    const partNumber = Number(partNumberRaw);

    if (!Number.isFinite(partNumber)) {
      throw new UploadError("Part-Number 非法", 400, "INVALID_PART_NUMBER");
    }

    await checkUploadPartRateLimit(uploadId);

    const data = Buffer.from(await request.arrayBuffer());
    const result = await uploadPartToSession({
      uploadId,
      partNumber,
      chunkHash,
      data,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
