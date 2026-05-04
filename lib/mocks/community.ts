import { CommunityAnnouncement, CommunityPost } from "@/app/community/_types";

export const communityAnnouncements: CommunityAnnouncement[] = [
  {
    id: "a1",
    title: "关于课程评价规范的公告：禁止发布人身攻击内容",
    href: "/community/notice/1",
    pinned: true,
  },
  {
    id: "a2",
    title: "本周热门课程榜单已更新，欢迎参与讨论",
    href: "/community/notice/2",
    pinned: true,
  },
  {
    id: "a3",
    title: "社区功能升级：支持帖子带图与话题标签",
    href: "/community/notice/3",
    pinned: true,
  },
];

export const communityPosts: CommunityPost[] = [
  {
    id: "p1",
    title: "高数复习节奏怎么安排更高效？",
    authorId: "mock-u1",
    author: { nickname: "小陈", avatarUrl: "" },
    createdAt: "2026-03-07T10:22:40+08:00",
    updatedAt: "2026-03-07T10:22:40+08:00",
    lastReplyAt: "2026-03-07T10:40:12+08:00",
    contentHtml:
      "<p>这学期《高等数学》课堂节奏很快，我整理了一份每周复习思路。前两章建议先把定义和典型例题吃透，再做综合题，真的会轻松很多。</p>",
    content:
      "这学期《高等数学》课堂节奏很快，我整理了一份每周复习思路。前两章建议先把定义和典型例题吃透，再做综合题，真的会轻松很多。",
    images: ["https://picsum.photos/seed/community-1/600/400", "https://picsum.photos/seed/community-2/600/400"],
    tags: ["高等数学", "学习方法", "课程经验"],
    likesCount: 38,
    isLiked: false,
    commentsCount: 12,
    hotScore: 86,
  },
  {
    id: "p2",
    title: "数据结构实验课准备经验求助",
    authorId: "mock-u2",
    author: { nickname: "Yuki", avatarUrl: "" },
    createdAt: "2026-03-07T09:58:15+08:00",
    updatedAt: "2026-03-07T09:58:15+08:00",
    lastReplyAt: "2026-03-07T10:46:20+08:00",
    contentHtml: "<p>想问问大家《数据结构》实验课到底怎么准备会更高效？老师讲得很细，但我每次写代码还是容易卡在边界条件。</p>",
    content: "想问问大家《数据结构》实验课到底怎么准备会更高效？老师讲得很细，但我每次写代码还是容易卡在边界条件。",
    images: ["https://picsum.photos/seed/community-3/600/400"],
    tags: ["数据结构", "实验课", "求助"],
    likesCount: 24,
    isLiked: false,
    commentsCount: 19,
    hotScore: 72,
  },
  {
    id: "p3",
    title: "大学英语口语平时分提升建议",
    authorId: "mock-u3",
    author: { nickname: "阿泽", avatarUrl: "" },
    createdAt: "2026-03-07T07:14:03+08:00",
    updatedAt: "2026-03-07T07:14:03+08:00",
    lastReplyAt: "2026-03-07T08:12:11+08:00",
    contentHtml:
      "<p>给准备选《大学英语口语》的同学一个建议：平时分里课堂参与度比你想象中更重要，提前准备一个话题模板非常有用。</p>",
    content:
      "给准备选《大学英语口语》的同学一个建议：平时分里课堂参与度比你想象中更重要，提前准备一个话题模板非常有用。",
    images: [],
    tags: ["大学英语", "选课建议", "平时分"],
    likesCount: 42,
    isLiked: false,
    commentsCount: 16,
    hotScore: 90,
  },
  {
    id: "p4",
    title: "计算机基础脑图模板分享",
    authorId: "mock-u4",
    author: { nickname: "Kira", avatarUrl: "" },
    createdAt: "2026-03-06T20:26:49+08:00",
    updatedAt: "2026-03-06T20:26:49+08:00",
    lastReplyAt: "2026-03-07T09:12:01+08:00",
    contentHtml: "<p>最近把计算机基础课程知识点做成了脑图，配色版和极简版都整理好了，放几张截图给大家参考。</p>",
    content: "最近把计算机基础课程知识点做成了脑图，配色版和极简版都整理好了，放几张截图给大家参考。",
    images: [
      "https://picsum.photos/seed/community-4/600/400",
      "https://picsum.photos/seed/community-5/600/400",
      "https://picsum.photos/seed/community-6/600/400",
    ],
    tags: ["计算机基础", "笔记分享", "脑图"],
    likesCount: 57,
    isLiked: false,
    commentsCount: 28,
    hotScore: 95,
  },
  {
    id: "p5",
    title: "体育课总评提升小技巧",
    authorId: "mock-u5",
    author: { nickname: "小林", avatarUrl: "" },
    createdAt: "2026-03-05T16:05:10+08:00",
    updatedAt: "2026-03-05T16:05:10+08:00",
    lastReplyAt: "2026-03-06T08:20:33+08:00",
    contentHtml: "<p>关于体育课考核，我发现不少同学会忽略过程分。其实只要按时打卡并提交训练记录，最后总评会好看很多。</p>",
    content: "关于体育课考核，我发现不少同学会忽略过程分。其实只要按时打卡并提交训练记录，最后总评会好看很多。",
    images: [],
    tags: ["体育课", "考核", "经验贴"],
    likesCount: 15,
    isLiked: false,
    commentsCount: 7,
    hotScore: 64,
  },
  ...Array.from({ length: 18 }, (_, index) => {
    const id = index + 6;
    const createdAt = new Date(Date.parse("2026-03-05T12:00:00+08:00") - index * 1000 * 60 * 73).toISOString();
    const lastReplyAt = new Date(Date.parse(createdAt) + 1000 * 60 * ((index % 5) + 1)).toISOString();
    const hasImage = index % 3 !== 0;

    return {
      id: `p${id}`,
      title: `社区测试帖子 ${id}`,
      authorId: `mock-u${id}`,
      author: {
        nickname: `同学${id}`,
        avatarUrl: "",
      },
      createdAt,
      updatedAt: createdAt,
      lastReplyAt,
      contentHtml: `<p>这是社区测试帖子 ${id}。主要用于验证列表滚动增量刷新、排序切换和分隔线展示效果。第 ${id} 条内容会稍长一些，以便观察省略号是否正常。</p>`,
      content: `这是社区测试帖子 ${id}。主要用于验证列表滚动增量刷新、排序切换和分隔线展示效果。第 ${id} 条内容会稍长一些，以便观察省略号是否正常。`,
      images: hasImage ? [`https://picsum.photos/seed/community-extra-${id}/600/400`] : [],
      tags: ["社区测试", id % 2 === 0 ? "课程讨论" : "经验分享", id % 4 === 0 ? "答疑" : "日常"],
      likesCount: 8 + (index % 9) * 4,
      isLiked: false,
      commentsCount: 2 + (index % 7) * 3,
      hotScore: 40 + (index % 10) * 6,
    } satisfies CommunityPost;
  }),
];
