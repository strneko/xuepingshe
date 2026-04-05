export type NotificationItem = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  isRead: boolean;
  href?: string;
};

export const notificationsMock: NotificationItem[] = [
  {
    id: "n1",
    title: "你关注的课程新增了 3 条评价",
    summary: "高等数学（李老师）今日新增 3 条新评价，快去看看最新反馈。",
    createdAt: "2026-03-07T08:30:00+08:00",
    isRead: false,
    href: "/course/math-001",
  },
  {
    id: "n2",
    title: "你的评价收到了点赞",
    summary: "你在《大学英语》中的评价被 12 人点赞。",
    createdAt: "2026-03-07T07:10:00+08:00",
    isRead: false,
    href: "/profile?tab=review",
  },
  {
    id: "n3",
    title: "课程评分趋势更新",
    summary: "《计算机基础》最近一周评分波动较大，建议查看趋势图。",
    createdAt: "2026-03-06T21:45:00+08:00",
    isRead: true,
    href: "/course/cs-101",
  },
  {
    id: "n4",
    title: "系统公告",
    summary: "本周末 22:00-23:00 将进行系统维护，期间部分功能可能不可用。",
    createdAt: "2026-03-06T17:30:00+08:00",
    isRead: true,
    href: "/notifications",
  },
  {
    id: "n5",
    title: "你收藏的教师上榜",
    summary: "王老师进入本周热门教师榜单前十。",
    createdAt: "2026-03-06T10:00:00+08:00",
    isRead: false,
    href: "/teacher/teacher-42",
  },
  {
    id: "n6",
    title: "课程提醒",
    summary: "《数据结构》评教将于 3 天后截止。",
    createdAt: "2026-03-05T13:20:00+08:00",
    isRead: true,
    href: "/myclass?unevaluated=true",
  },
];

export function formatRelativeTime(dateString: string): string {
  const target = new Date(dateString).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - target);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "刚刚";
  }
  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)} 分钟前`;
  }
  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)} 小时前`;
  }
  if (diffMs < 7 * day) {
    return `${Math.floor(diffMs / day)} 天前`;
  }

  const date = new Date(dateString);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const dayOfMonth = `${date.getDate()}`.padStart(2, "0");
  return `${month}-${dayOfMonth}`;
}
