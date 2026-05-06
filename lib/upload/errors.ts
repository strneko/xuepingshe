export class UploadError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status = 400, code = "UPLOAD_ERROR") {
    super(message);
    this.name = "UploadError";
    this.status = status;
    this.code = code;
  }
}

interface RateLimitLikeError extends Error {
  code: string;
  status: number;
}

function isRateLimitLike(err: unknown): err is RateLimitLikeError {
  return err instanceof Error && "code" in err && "status" in err;
}

export function toErrorResponse(error: unknown) {
  if (error instanceof UploadError) {
    return {
      status: error.status,
      body: { code: error.code, message: error.message },
    };
  }

  if (isRateLimitLike(error)) {
    return {
      status: error.status,
      body: { code: error.code, message: error.message },
    };
  }

  return {
    status: 500,
    body: { code: "INTERNAL_SERVER_ERROR", message: "服务器内部错误" },
  };
}
