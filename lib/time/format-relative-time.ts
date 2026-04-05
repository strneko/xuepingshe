function pad(num: number): string {
  return `${num}`.padStart(2, "0");
}

function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function formatRelativeTime(dateString: string): string {
  const targetTime = new Date(dateString).getTime();

  if (Number.isNaN(targetTime)) {
    return dateString;
  }

  const diffMs = Date.now() - targetTime;

  if (diffMs < 0) {
    return "刚刚";
  }

  const second = 1000;
  const minute = 60 * second;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    const value = Math.max(1, Math.floor(diffMs / second));
    return `${value}秒前`;
  }

  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)}分钟前`;
  }

  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}小时前`;
  }

  return formatDateTime(new Date(targetTime));
}
