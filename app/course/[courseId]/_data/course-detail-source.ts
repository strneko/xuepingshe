import { CourseDetailData } from "../_types";

interface CourseDetailRecord extends Omit<CourseDetailData, "initialReviews" | "topReviews"> {
  reviews: CourseDetailData["initialReviews"]["items"];
}

const fakeCourseDetails: Record<string, CourseDetailRecord> = {
  "1": {
    courseId: "1",
    courseName: "高等数学",
    teacher: "张教授",
    intro: "本课程聚焦极限、导数、积分与微分方程，帮助学生建立严谨的数学建模思维。",
    location: "A-101",
    time: "周一 08:00",
    recentOverallScore: 4.78,
    recentSevenScores: [
      { key: "attitude", label: "教学态度与师德", score: 4.9 },
      { key: "content", label: "教学内容与设计", score: 4.7 },
      { key: "method", label: "教学方法与技巧", score: 4.8 },
      { key: "effect", label: "教学效果与成果", score: 4.6 },
      { key: "interaction", label: "师生互动与氛围", score: 4.8 },
      { key: "resource", label: "课程资源与评价", score: 4.7 },
      { key: "improve", label: "教学创新与改进", score: 4.9 },
    ],
    announcements: [
      {
        id: "a1",
        title: "第 5 周作业已发布",
        content: "请于本周日 22:00 前提交，题目覆盖导数应用与不定积分。",
        publishAt: "2026-03-01",
      },
      {
        id: "a2",
        title: "课堂测验安排",
        content: "下周一课程开始前进行 15 分钟随堂测验，范围为上两章重点内容。",
        publishAt: "2026-02-27",
      },
      {
        id: "a3",
        title: "助教答疑时段更新",
        content: "本周答疑调整至周三 19:00，地点为线上会议室。",
        publishAt: "2026-02-24",
      },
      {
        id: "a4",
        title: "期中复习建议",
        content: "建议优先复习极限证明与积分技巧，课堂例题需二次整理。",
        publishAt: "2026-02-20",
      },
      {
        id: "a5",
        title: "课堂签到说明",
        content: "签到于上课前 10 分钟开启，迟到超过 15 分钟视作缺勤。",
        publishAt: "2026-02-18",
      },
    ],
    resources: [
      { id: "r1", name: "第五章讲义.pdf", type: "讲义", updatedAt: "2026-03-01" },
      { id: "r2", name: "习题课录播.mp4", type: "视频", updatedAt: "2026-02-28" },
      { id: "r3", name: "章节练习题.docx", type: "作业", updatedAt: "2026-02-26" },
      { id: "r4", name: "典型错题解析.pdf", type: "资料", updatedAt: "2026-02-22" },
      { id: "r5", name: "历年真题精选.pdf", type: "题库", updatedAt: "2026-02-18" },
      { id: "r6", name: "课堂板书照片.zip", type: "附件", updatedAt: "2026-02-15" },
    ],
    reviews: [
      {
        id: "rv1",
        nickname: "匿名同学A",
        avatarUrl: "",
        createdAt: "2026-03-02",
        overallScore: 5,
        likesCount: 126,
        summary: "讲解非常清晰，重难点拆解到位，例题与作业衔接自然。",
        detailedScores: [
          {
            key: "attitude",
            label: "教学态度与师德",
            score: 4.9,
            subItems: [
              { key: "attitude-1", label: "教学责任心", score: 5.0 },
              { key: "attitude-2", label: "师德师风", score: 4.8 },
              { key: "attitude-3", label: "教学投入度", score: 4.9 },
            ],
          },
          { key: "content", label: "教学内容与设计", score: 4.8 },
          { key: "method", label: "教学方法与技巧", score: 5.0 },
          { key: "effect", label: "教学效果与成果", score: 4.7 },
          { key: "interaction", label: "师生互动与氛围", score: 4.8 },
          { key: "resource", label: "课程资源与评价", score: 4.6 },
          { key: "improve", label: "教学创新与改进", score: 4.9 },
        ],
      },
      {
        id: "rv2",
        nickname: "匿名同学B",
        avatarUrl: "",
        createdAt: "2026-02-26",
        overallScore: 4.5,
        likesCount: 92,
        summary: "课堂互动很多，节奏偏快，但课后资料完整，复习很方便。",
        detailedScores: [
          { key: "attitude", label: "教学态度与师德", score: 4.6 },
          { key: "content", label: "教学内容与设计", score: 4.4 },
          {
            key: "method",
            label: "教学方法与技巧",
            score: 4.3,
            subItems: [
              { key: "method-1", label: "教学方法有效性", score: 4.1 },
              { key: "method-2", label: "课堂组织能力", score: null },
              { key: "method-3", label: "教学基本功", score: 4.5 },
            ],
          },
          { key: "effect", label: "教学效果与成果", score: 4.2 },
          { key: "interaction", label: "师生互动与氛围", score: 4.7 },
          { key: "resource", label: "课程资源与评价", score: 4.5 },
          { key: "improve", label: "教学创新与改进", score: 4.1 },
        ],
      },
      {
        id: "rv3",
        nickname: "匿名同学C",
        avatarUrl: "",
        createdAt: "2026-02-20",
        overallScore: 4.8,
        likesCount: 75,
        summary: "每节课前都有回顾，知识点串联得很好，适合跟着做笔记。",
        detailedScores: [
          { key: "attitude", label: "教学态度与师德", score: 4.8 },
          { key: "content", label: "教学内容与设计", score: 4.9 },
          { key: "method", label: "教学方法与技巧", score: 4.8 },
          { key: "effect", label: "教学效果与成果", score: 4.7 },
          {
            key: "interaction",
            label: "师生互动与氛围",
            score: 4.9,
            subItems: [
              { key: "interaction-1", label: "学生参与度", score: 4.9 },
              { key: "interaction-2", label: "师生互动质量", score: 5.0 },
              { key: "interaction-3", label: "课堂氛围", score: 4.8 },
            ],
          },
          { key: "resource", label: "课程资源与评价", score: 4.6 },
          { key: "improve", label: "教学创新与改进", score: 4.7 },
        ],
      },
      {
        id: "rv4",
        nickname: "匿名同学D",
        avatarUrl: "",
        createdAt: "2026-02-14",
        overallScore: 4.2,
        likesCount: 43,
        summary: "希望增加更多分层习题，基础和提高题分开会更友好。",
        detailedScores: [
          {
            key: "attitude",
            label: "教学态度与师德",
            score: 4.3,
            subItems: [
              { key: "attitude-1", label: "教学责任心", score: 4.2 },
              { key: "attitude-2", label: "师德师风", score: null },
              { key: "attitude-3", label: "教学投入度", score: 4.4 },
            ],
          },
          { key: "content", label: "教学内容与设计", score: 4.1 },
          { key: "method", label: "教学方法与技巧", score: 3.9 },
          { key: "effect", label: "教学效果与成果", score: null },
          { key: "interaction", label: "师生互动与氛围", score: 4.4 },
          { key: "resource", label: "课程资源与评价", score: 4.2 },
          { key: "improve", label: "教学创新与改进", score: 3.8 },
        ],
      },
    ],
    topReviews: [
      {
        id: "rv1",
        nickname: "匿名同学A",
        avatarUrl: "",
        createdAt: "2026-03-02",
        overallScore: 5,
        likesCount: 126,
        summary: "讲解非常清晰，重难点拆解到位，例题与作业衔接自然。",
      },
      {
        id: "rv2",
        nickname: "匿名同学B",
        avatarUrl: "",
        createdAt: "2026-02-26",
        overallScore: 4.5,
        likesCount: 92,
        summary: "课堂互动很多，节奏偏快，但课后资料完整，复习很方便。",
      },
    ],
  },
};

export function getCourseSource(courseId: string): CourseDetailRecord {
  return (
    fakeCourseDetails[courseId] ?? {
      ...fakeCourseDetails["1"],
      courseId,
      courseName: `课程 ${courseId}`,
    }
  );
}
