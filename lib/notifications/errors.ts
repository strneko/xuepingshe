export class NotificationError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status = 400, code = "NOTIFICATION_ERROR") {
    super(message);
    this.name = "NotificationError";
    this.status = status;
    this.code = code;
  }
}

export function toNotificationErrorResponse(error: unknown) {
  if (error instanceof NotificationError) {
    return {
      status: error.status,
      body: {
        code: error.code,
        message: error.message,
      },
    };
  }

  return {
    status: 500,
    body: {
      code: "INTERNAL_SERVER_ERROR",
      message: "服务器内部错误",
    },
  };
}
