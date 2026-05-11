import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD_HASH = bcrypt.hashSync("123456", 10);

// ─── Semester constants ───
const SEMESTER_CURRENT = "2025-2026-2";
const SEMESTER_PREV = "2025-2026-1";
const SEMESTER_NEXT = "2026-2027-1";

// ─── User IDs (deterministic for easy reference) ───
const U = {
  admin: "u_admin_01",
  teacher_zhang: "u_teacher_zhang",
  teacher_li: "u_teacher_li",
  teacher_wang: "u_teacher_wang",
  stu_xm: "u_stu_xiaoming",
  stu_xh: "u_stu_xiaohong",
  stu_xg: "u_stu_xiaogang",
  stu_xl: "u_stu_xiaoli",
  stu_xw: "u_stu_xiaowang",
  stu_xj: "u_stu_xiaojing",
};

// ─── Course IDs ───
const C = {
  math: "c_advanced_math",
  physics: "c_college_physics",
  english: "c_college_english",
  ds: "c_data_structure",
  os: "c_operating_system",
  db: "c_database_systems",
};

// ─── Offering IDs ───
const OFF = {
  math_prev: "off_math_prev",
  math_curr: "off_math_curr",
  physics_curr: "off_physics_curr",
  english_curr: "off_english_curr",
  ds_curr: "off_ds_curr",
  os_prev: "off_os_prev",
  os_curr: "off_os_curr",
  db_curr: "off_db_curr",
};

// ─── Round IDs ───
const ROUND = {
  math_prev_r1: "round_math_prev_1",
  math_curr_r1: "round_math_curr_1",
  physics_curr_r1: "round_physics_curr_1",
  english_curr_r1: "round_english_curr_1",
  ds_curr_r1: "round_ds_curr_1",
  os_prev_r1: "round_os_prev_1",
  os_curr_r1: "round_os_curr_1",
  db_curr_r1: "round_db_curr_1",
};

function futureDate(dayOffset) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d;
}

function pastDate(dayOffset) {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  return d;
}

async function main() {
  console.log("🌱 Seeding 学评社 database...\n");

  // ═══════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════
  console.log("Creating users...");
  const users = [
    { id: U.admin, email: "admin@xuepingshe.cn", name: "管理员", role: "STUDENT", points: 9999, passwordHash: PASSWORD_HASH, emailVerified: true },
    { id: U.teacher_zhang, email: "zhangwei@xuepingshe.cn", name: "张教授", role: "TEACHER", points: 800, passwordHash: PASSWORD_HASH, emailVerified: true },
    { id: U.teacher_li, email: "liming@xuepingshe.cn", name: "李老师", role: "TEACHER", points: 650, passwordHash: PASSWORD_HASH, emailVerified: true },
    { id: U.teacher_wang, email: "wangfang@xuepingshe.cn", name: "王教授", role: "TEACHER", points: 720, passwordHash: PASSWORD_HASH, emailVerified: true },
    { id: U.stu_xm, email: "xiaoming@xuepingshe.cn", name: "小明", role: "STUDENT", points: 320, passwordHash: PASSWORD_HASH, emailVerified: true },
    { id: U.stu_xh, email: "xiaohong@xuepingshe.cn", name: "小红", role: "STUDENT", points: 480, passwordHash: PASSWORD_HASH, emailVerified: true },
    { id: U.stu_xg, email: "xiaogang@xuepingshe.cn", name: "小刚", role: "STUDENT", points: 150, passwordHash: PASSWORD_HASH, emailVerified: true },
    { id: U.stu_xl, email: "xiaoli@xuepingshe.cn", name: "小丽", role: "STUDENT", points: 600, passwordHash: PASSWORD_HASH, emailVerified: true },
    { id: U.stu_xw, email: "xiaowang@xuepingshe.cn", name: "小王", role: "STUDENT", points: 280, passwordHash: PASSWORD_HASH, emailVerified: true },
    { id: U.stu_xj, email: "xiaojing@xuepingshe.cn", name: "小静", role: "STUDENT", points: 900, passwordHash: PASSWORD_HASH, emailVerified: true },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { id: u.id }, update: {}, create: u });
  }

  // ═══════════════════════════════════════════
  // 2. TEACHER PROFILES
  // ═══════════════════════════════════════════
  console.log("Creating teacher profiles...");
  await prisma.teacherProfile.upsert({
    where: { teacherId: U.teacher_zhang },
    update: {},
    create: {
      teacherId: U.teacher_zhang,
      userId: U.teacher_zhang,
      teacherName: "张伟",
      avatarUrl: null,
      department: "数学与统计学院",
      title: "教授",
      researchAreas: ["应用数学", "数值计算", "微分方程"],
      office: "数统楼301",
      description: "从事数学教学与研究20年，主要研究方向为应用数学与数值计算。主讲《高等数学》、《线性代数》等课程。",
      recentOverallScore: 4.5,
      recentSevenScoresJson: { attitude: 4.6, content: 4.5, method: 4.3, effect: 4.4, interaction: 4.2, resource: 4.1, improve: 4.5 },
    },
  });
  await prisma.teacherProfile.upsert({
    where: { teacherId: U.teacher_li },
    update: {},
    create: {
      teacherId: U.teacher_li,
      userId: U.teacher_li,
      teacherName: "李明",
      avatarUrl: null,
      department: "计算机科学与技术学院",
      title: "副教授",
      researchAreas: ["数据结构", "算法设计", "人工智能"],
      office: "计算机楼205",
      description: "专注计算机基础教育，主讲《数据结构》、《操作系统》等核心课程。注重理论与实践结合。",
      recentOverallScore: 4.8,
      recentSevenScoresJson: { attitude: 4.9, content: 4.8, method: 4.7, effect: 4.8, interaction: 4.6, resource: 4.5, improve: 4.7 },
    },
  });
  await prisma.teacherProfile.upsert({
    where: { teacherId: U.teacher_wang },
    update: {},
    create: {
      teacherId: U.teacher_wang,
      userId: U.teacher_wang,
      teacherName: "王芳",
      avatarUrl: null,
      department: "外国语学院",
      title: "教授",
      researchAreas: ["英语教学", "翻译学", "跨文化交际"],
      office: "外语楼108",
      description: "英语教学与研究领域资深教授，主讲《大学英语》系列课程。善于激发学生学习兴趣。",
      recentOverallScore: 4.3,
      recentSevenScoresJson: { attitude: 4.4, content: 4.3, method: 4.1, effect: 4.2, interaction: 4.5, resource: 4.0, improve: 4.3 },
    },
  });

  // ═══════════════════════════════════════════
  // 3. COURSE PROFILES
  // ═══════════════════════════════════════════
  console.log("Creating course profiles...");
  const courses = [
    { courseId: C.math, courseName: "高等数学（下）", teacherName: "张伟", intro: "本课程是大学理工科必修基础课，涵盖多元函数微积分、无穷级数、常微分方程等内容。", location: "教一楼 101", schedule: "周一 8:00-9:40, 周三 10:00-11:40" },
    { courseId: C.physics, courseName: "大学物理（上）", teacherName: "张伟", intro: "经典力学、热学与电磁学基础，培养学生科学思维和实验能力。", location: "教二楼 203", schedule: "周二 8:00-9:40, 周四 14:00-15:40" },
    { courseId: C.english, courseName: "大学英语（4）", teacherName: "王芳", intro: "强化英语听说读写综合能力，为后续学术英语和专业英语学习打下基础。", location: "外语楼 302", schedule: "周一 14:00-15:40, 周三 14:00-15:40" },
    { courseId: C.ds, courseName: "数据结构", teacherName: "李明", intro: "学习常用数据结构（线性表、树、图）及其算法，培养程序设计能力。", location: "计算机楼 401", schedule: "周二 10:00-11:40, 周五 8:00-9:40" },
    { courseId: C.os, courseName: "操作系统", teacherName: "李明", intro: "操作系统原理与实践，涵盖进程管理、内存管理、文件系统和I/O系统。", location: "计算机楼 405", schedule: "周三 8:00-9:40, 周五 10:00-11:40" },
    { courseId: C.db, courseName: "数据库系统概论", teacherName: "张伟", intro: "关系数据库基本原理、SQL语言、数据库设计与规范化理论。", location: "教一楼 305", schedule: "周四 8:00-9:40, 周五 14:00-15:40" },
  ];
  for (const c of courses) {
    await prisma.courseProfile.upsert({ where: { courseId: c.courseId }, update: {}, create: c });
  }

  // ═══════════════════════════════════════════
  // 4. COURSE OFFERINGS
  // ═══════════════════════════════════════════
  console.log("Creating course offerings...");
  const offerings = [
    { id: OFF.math_prev, courseId: C.math, courseName: "高等数学（下）", teacherName: "张伟", semesterKey: SEMESTER_PREV, status: "CLOSED", startAt: pastDate(120), endAt: pastDate(20), forceClosedAt: pastDate(10) },
    { id: OFF.math_curr, courseId: C.math, courseName: "高等数学（下）", teacherName: "张伟", semesterKey: SEMESTER_CURRENT, status: "OPEN" },
    { id: OFF.physics_curr, courseId: C.physics, courseName: "大学物理（上）", teacherName: "张伟", semesterKey: SEMESTER_CURRENT, status: "OPEN" },
    { id: OFF.english_curr, courseId: C.english, courseName: "大学英语（4）", teacherName: "王芳", semesterKey: SEMESTER_CURRENT, status: "OPEN" },
    { id: OFF.ds_curr, courseId: C.ds, courseName: "数据结构", teacherName: "李明", semesterKey: SEMESTER_CURRENT, status: "OPEN" },
    { id: OFF.os_prev, courseId: C.os, courseName: "操作系统", teacherName: "李明", semesterKey: SEMESTER_PREV, status: "CLOSED", startAt: pastDate(120), endAt: pastDate(20), forceClosedAt: pastDate(10) },
    { id: OFF.os_curr, courseId: C.os, courseName: "操作系统", teacherName: "李明", semesterKey: SEMESTER_CURRENT, status: "OPEN" },
    { id: OFF.db_curr, courseId: C.db, courseName: "数据库系统概论", teacherName: "张伟", semesterKey: SEMESTER_CURRENT, status: "OPEN" },
  ];
  for (const o of offerings) {
    await prisma.courseOffering.upsert({ where: { id: o.id }, update: {}, create: o });
  }

  // ═══════════════════════════════════════════
  // 5. ENROLLMENTS
  // ═══════════════════════════════════════════
  console.log("Creating enrollments...");
  const enrollments = [
    { userId: U.stu_xm, offeringId: OFF.math_curr, courseId: C.math, courseName: "高等数学（下）", teacherName: "张伟", term: "2025-2026-2", classTime: "周一 8:00-9:40, 周三 10:00-11:40", location: "教一楼 101", status: "ACTIVE" },
    { userId: U.stu_xm, offeringId: OFF.ds_curr, courseId: C.ds, courseName: "数据结构", teacherName: "李明", term: "2025-2026-2", classTime: "周二 10:00-11:40, 周五 8:00-9:40", location: "计算机楼 401", status: "ACTIVE" },
    { userId: U.stu_xh, offeringId: OFF.math_curr, courseId: C.math, courseName: "高等数学（下）", teacherName: "张伟", term: "2025-2026-2", classTime: "周一 8:00-9:40, 周三 10:00-11:40", location: "教一楼 101", status: "ACTIVE" },
    { userId: U.stu_xh, offeringId: OFF.english_curr, courseId: C.english, courseName: "大学英语（4）", teacherName: "王芳", term: "2025-2026-2", classTime: "周一 14:00-15:40, 周三 14:00-15:40", location: "外语楼 302", status: "ACTIVE" },
    { userId: U.stu_xh, offeringId: OFF.db_curr, courseId: C.db, courseName: "数据库系统概论", teacherName: "张伟", term: "2025-2026-2", classTime: "周四 8:00-9:40, 周五 14:00-15:40", location: "教一楼 305", status: "ACTIVE" },
    { userId: U.stu_xg, offeringId: OFF.math_curr, courseId: C.math, courseName: "高等数学（下）", teacherName: "张伟", term: "2025-2026-2", classTime: "周一 8:00-9:40, 周三 10:00-11:40", location: "教一楼 101", status: "ACTIVE" },
    { userId: U.stu_xg, offeringId: OFF.ds_curr, courseId: C.ds, courseName: "数据结构", teacherName: "李明", term: "2025-2026-2", classTime: "周二 10:00-11:40, 周五 8:00-9:40", location: "计算机楼 401", status: "ACTIVE" },
    { userId: U.stu_xg, offeringId: OFF.os_curr, courseId: C.os, courseName: "操作系统", teacherName: "李明", term: "2025-2026-2", classTime: "周三 8:00-9:40, 周五 10:00-11:40", location: "计算机楼 405", status: "ACTIVE" },
    { userId: U.stu_xl, offeringId: OFF.os_curr, courseId: C.os, courseName: "操作系统", teacherName: "李明", term: "2025-2026-2", classTime: "周三 8:00-9:40, 周五 10:00-11:40", location: "计算机楼 405", status: "ACTIVE" },
    { userId: U.stu_xl, offeringId: OFF.english_curr, courseId: C.english, courseName: "大学英语（4）", teacherName: "王芳", term: "2025-2026-2", classTime: "周一 14:00-15:40, 周三 14:00-15:40", location: "外语楼 302", status: "ACTIVE" },
    { userId: U.stu_xl, offeringId: OFF.physics_curr, courseId: C.physics, courseName: "大学物理（上）", teacherName: "张伟", term: "2025-2026-2", classTime: "周二 8:00-9:40, 周四 14:00-15:40", location: "教二楼 203", status: "ACTIVE" },
    { userId: U.stu_xw, offeringId: OFF.math_curr, courseId: C.math, courseName: "高等数学（下）", teacherName: "张伟", term: "2025-2026-2", classTime: "周一 8:00-9:40, 周三 10:00-11:40", location: "教一楼 101", status: "ACTIVE" },
    { userId: U.stu_xw, offeringId: OFF.os_curr, courseId: C.os, courseName: "操作系统", teacherName: "李明", term: "2025-2026-2", classTime: "周三 8:00-9:40, 周五 10:00-11:40", location: "计算机楼 405", status: "ACTIVE" },
    { userId: U.stu_xj, offeringId: OFF.math_curr, courseId: C.math, courseName: "高等数学（下）", teacherName: "张伟", term: "2025-2026-2", classTime: "周一 8:00-9:40, 周三 10:00-11:40", location: "教一楼 101", status: "ACTIVE" },
    { userId: U.stu_xj, offeringId: OFF.ds_curr, courseId: C.ds, courseName: "数据结构", teacherName: "李明", term: "2025-2026-2", classTime: "周二 10:00-11:40, 周五 8:00-9:40", location: "计算机楼 401", status: "ACTIVE" },
    { userId: U.stu_xj, offeringId: OFF.english_curr, courseId: C.english, courseName: "大学英语（4）", teacherName: "王芳", term: "2025-2026-2", classTime: "周一 14:00-15:40, 周三 14:00-15:40", location: "外语楼 302", status: "ACTIVE" },
  ];
  for (const e of enrollments) {
    await prisma.enrollment.upsert({
      where: { userId_offeringId: { userId: e.userId, offeringId: e.offeringId } },
      update: {},
      create: e,
    });
  }

  // ═══════════════════════════════════════════
  // 6. REVIEW ROUNDS
  // ═══════════════════════════════════════════
  console.log("Creating review rounds...");
  const rounds = [
    { id: ROUND.math_prev_r1, offeringId: OFF.math_prev, courseId: C.math, label: "期中评教", startsAt: pastDate(100), endsAt: pastDate(80), aggregated: true },
    { id: ROUND.math_curr_r1, offeringId: OFF.math_curr, courseId: C.math, label: "期中评教", startsAt: pastDate(30), endsAt: futureDate(30), aggregated: false },
    { id: ROUND.physics_curr_r1, offeringId: OFF.physics_curr, courseId: C.physics, label: "期中评教", startsAt: pastDate(30), endsAt: futureDate(30), aggregated: false },
    { id: ROUND.english_curr_r1, offeringId: OFF.english_curr, courseId: C.english, label: "期中评教", startsAt: pastDate(30), endsAt: futureDate(30), aggregated: false },
    { id: ROUND.ds_curr_r1, offeringId: OFF.ds_curr, courseId: C.ds, label: "期中评教", startsAt: pastDate(30), endsAt: futureDate(30), aggregated: false },
    { id: ROUND.os_prev_r1, offeringId: OFF.os_prev, courseId: C.os, label: "期末评教", startsAt: pastDate(90), endsAt: pastDate(60), aggregated: true },
    { id: ROUND.os_curr_r1, offeringId: OFF.os_curr, courseId: C.os, label: "期中评教", startsAt: pastDate(30), endsAt: futureDate(30), aggregated: false },
    { id: ROUND.db_curr_r1, offeringId: OFF.db_curr, courseId: C.db, label: "期中评教", startsAt: pastDate(30), endsAt: futureDate(30), aggregated: false },
  ];
  for (const r of rounds) {
    await prisma.reviewRound.upsert({ where: { id: r.id }, update: {}, create: r });
  }

  // ═══════════════════════════════════════════
  // 7. COURSE REVIEWS
  // ═══════════════════════════════════════════
  console.log("Creating course reviews...");
  const reviewScores = (att, cont, meth, eff, inter, res, impr) => ({
    attitude: att, content: cont, method: meth, effect: eff, interaction: inter, resource: res, improve: impr,
    overall: Math.round(((att + cont + meth + eff + inter + res + impr) / 7) * 10) / 10,
  });

  const courseReviews = [
    // 高等数学 reviews
    { userId: U.stu_xm, courseId: C.math, roundId: ROUND.math_curr_r1, nickname: "小明", summary: "张老师讲课深入浅出，板书工整，课堂氛围很好。课后作业量适中，能有效巩固所学知识。", scores: reviewScores(5, 5, 4, 4, 4, 4, 5), likesCount: 3 },
    { userId: U.stu_xh, courseId: C.math, roundId: ROUND.math_curr_r1, nickname: "小红", summary: "内容充实，但对基础薄弱的同学来说节奏稍快。建议增加一些课前预习资料。", scores: reviewScores(4, 4, 3, 3, 3, 3, 4), likesCount: 1 },
    { userId: U.stu_xg, courseId: C.math, roundId: ROUND.math_curr_r1, nickname: "小刚", summary: "非常好的一门课！老师耐心解答问题，课堂互动多。期末成绩也给了合理的评分。", scores: reviewScores(5, 4, 5, 5, 5, 4, 4), likesCount: 5 },
    { userId: U.stu_xw, courseId: C.math, roundId: ROUND.math_curr_r1, nickname: "小王", summary: "讲课逻辑清晰，数学推导过程详尽。希望增加一些实际应用案例。", scores: reviewScores(4, 5, 4, 4, 3, 3, 4), likesCount: 2 },
    // 数据结构 reviews
    { userId: U.stu_xm, courseId: C.ds, roundId: ROUND.ds_curr_r1, nickname: "小明", summary: "李老师的代码演示环节非常棒，每节课都有实际的编程练习，学到很多。", scores: reviewScores(5, 5, 5, 5, 5, 4, 5), likesCount: 4 },
    { userId: U.stu_xg, courseId: C.ds, roundId: ROUND.ds_curr_r1, nickname: "小刚", summary: "课程内容丰富，但实验课多一点就好了。老师很负责，作业批改仔细。", scores: reviewScores(4, 4, 5, 4, 4, 4, 4), likesCount: 2 },
    { userId: U.stu_xj, courseId: C.ds, roundId: ROUND.ds_curr_r1, nickname: "小静", summary: "最喜欢的一门专业课！讲链表、树、图的部分尤其清晰。推荐给学弟学妹。", scores: reviewScores(5, 5, 5, 5, 4, 5, 5), likesCount: 6 },
    // 操作系统 reviews
    { userId: U.stu_xg, courseId: C.os, roundId: ROUND.os_curr_r1, nickname: "小刚", summary: "操作系统概念比较抽象，但李老师用生动的比喻帮助理解。实验环节很有趣。", scores: reviewScores(4, 4, 4, 4, 3, 4, 4), likesCount: 2 },
    { userId: U.stu_xl, courseId: C.os, roundId: ROUND.os_curr_r1, nickname: "小丽", summary: "课程难度较大，需要投入较多时间。老师提供了丰富的学习资源，很感激。", scores: reviewScores(5, 4, 4, 3, 4, 5, 3), likesCount: 1 },
    { userId: U.stu_xw, courseId: C.os, roundId: ROUND.os_curr_r1, nickname: "小王", summary: "对进程调度和内存管理讲得很透彻，课后作业设计精良。", scores: reviewScores(4, 5, 4, 4, 3, 4, 4), likesCount: 3 },
    // 大学英语 reviews
    { userId: U.stu_xh, courseId: C.english, roundId: ROUND.english_curr_r1, nickname: "小红", summary: "课堂气氛活跃，王老师经常组织小组讨论和角色扮演，口语提升明显。", scores: reviewScores(5, 4, 4, 4, 5, 3, 4), likesCount: 2 },
    { userId: U.stu_xl, courseId: C.english, roundId: ROUND.english_curr_r1, nickname: "小丽", summary: "王老师人很好，课堂氛围轻松。但感觉阅读部分的讲解可以再深入一些。", scores: reviewScores(4, 3, 4, 3, 5, 3, 3), likesCount: 1 },
    { userId: U.stu_xj, courseId: C.english, roundId: ROUND.english_curr_r1, nickname: "小静", summary: "英语课是我每周最期待的课！老师总是能找到有趣的素材，写作指导也很实用。", scores: reviewScores(5, 4, 5, 5, 5, 4, 4), likesCount: 4 },
    // 大学物理 reviews
    { userId: U.stu_xl, courseId: C.physics, roundId: ROUND.physics_curr_r1, nickname: "小丽", summary: "物理实验课很有意思，理论课部分老师演示实验也很直观。", scores: reviewScores(4, 4, 4, 4, 3, 4, 4), likesCount: 1 },
    // 数据库 reviews
    { userId: U.stu_xh, courseId: C.db, roundId: ROUND.db_curr_r1, nickname: "小红", summary: "SQL实操环节很多，真正锻炼了数据库设计能力。期末大项目很有挑战性。", scores: reviewScores(5, 4, 5, 5, 4, 5, 5), likesCount: 3 },
  ];

  for (const r of courseReviews) {
    const { scores, ...rest } = r;
    await prisma.courseReview.create({
      data: {
        ...rest,
        overallScore: scores.overall,
        detailedScoresJson: {
          attitude: scores.attitude,
          content: scores.content,
          method: scores.method,
          effect: scores.effect,
          interaction: scores.interaction,
          resource: scores.resource,
          improve: scores.improve,
        },
      },
    }).catch(() => {}); // skip if already exists on re-run
  }

  // ═══════════════════════════════════════════
  // 8. COURSE REVIEW LIKES
  // ═══════════════════════════════════════════
  console.log("Creating course review likes...");
  const allCourseReviews = await prisma.courseReview.findMany({ select: { id: true, userId: true } });
  const studentIds = [U.stu_xm, U.stu_xh, U.stu_xg, U.stu_xl, U.stu_xw, U.stu_xj];
  for (const review of allCourseReviews) {
    // Each review gets 1-3 random likes from students who didn't write it
    const otherStudents = studentIds.filter((id) => id !== review.userId);
    const likers = otherStudents.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
    for (const likerId of likers) {
      await prisma.courseReviewLike.create({
        data: { reviewId: review.id, userId: likerId },
      }).catch(() => { /* duplicate ok */ });
    }
  }

  // ═══════════════════════════════════════════
  // 9. TEACHER REVIEWS
  // ═══════════════════════════════════════════
  console.log("Creating teacher reviews...");
  const teacherReviews = [
    { teacherId: U.teacher_zhang, userId: U.stu_xm, nickname: "小明", summary: "张教授治学严谨，对学生要求高但很公平。在他的课上能学到真东西。", overallScore: 4.6, likesCount: 2, detailedScoresJson: { attitude: 4.5, content: 4.8, method: 4.3, effect: 4.5, interaction: 4.2, resource: 4.0, improve: 4.6 } },
    { teacherId: U.teacher_li, userId: U.stu_xg, nickname: "小刚", summary: "李老师是我遇到的最负责的老师之一，代码能力特别强，讲解通俗易懂。", overallScore: 4.9, likesCount: 4, detailedScoresJson: { attitude: 5, content: 5, method: 4.8, effect: 4.9, interaction: 4.7, resource: 4.5, improve: 4.8 } },
    { teacherId: U.teacher_wang, userId: U.stu_xj, nickname: "小静", summary: "王老师亲切和蔼，课堂活动设计丰富多样。英语课不再枯燥了。", overallScore: 4.4, likesCount: 3, detailedScoresJson: { attitude: 4.8, content: 4.2, method: 4.3, effect: 4.2, interaction: 4.8, resource: 3.8, improve: 4.0 } },
  ];
  for (const r of teacherReviews) {
    await prisma.teacherReview.create({ data: r }).catch(() => {});
  }

  // ═══════════════════════════════════════════
  // 10. COMMUNITY TOPICS
  // ═══════════════════════════════════════════
  console.log("Creating community topics...");
  const topics = [
    { name: "课程讨论", isRecommended: true, postCount: 0, followerCount: 10 },
    { name: "学习经验", isRecommended: true, postCount: 0, followerCount: 8 },
    { name: "选课建议", isRecommended: true, postCount: 0, followerCount: 6 },
    { name: "考研交流", isRecommended: false, postCount: 0, followerCount: 4 },
    { name: "校园生活", isRecommended: false, postCount: 0, followerCount: 5 },
  ];
  const createdTopics = [];
  for (const t of topics) {
    const topic = await prisma.communityTopic.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    });
    createdTopics.push(topic);
  }

  // ═══════════════════════════════════════════
  // 11. COMMUNITY POSTS
  // ═══════════════════════════════════════════
  console.log("Creating community posts...");
  const posts = [
    {
      id: "post_001",
      authorId: U.stu_xm,
      title: "高等数学期末复习攻略",
      contentHtml: "<p>分享一下我的高数复习方法：</p><ol><li><strong>整理笔记</strong>：把一学期的笔记重新梳理一遍，重点关注定理的推导过程</li><li><strong>刷真题</strong>：找近三年的期末考试题做一遍，了解出题风格</li><li><strong>小组讨论</strong>：和同学一起讨论难题，互相答疑</li></ol><p>希望对大家有帮助！</p>",
      topicNames: ["课程讨论", "学习经验"],
      likeCount: 8,
      commentCount: 4,
      hotScore: 42,
      lastReplyAt: pastDate(1),
      createdAt: pastDate(7),
    },
    {
      id: "post_002",
      authorId: U.stu_xh,
      title: "数据结构该怎么学？求建议",
      contentHtml: "<p>刚上完前两周的课，感觉链表部分还能跟上，但到了树和图就有点吃力了。有没有学长学姐分享一下数据结构的学习方法？</p>",
      topicNames: ["课程讨论", "学习经验"],
      likeCount: 5,
      commentCount: 3,
      hotScore: 28,
      lastReplyAt: pastDate(2),
      createdAt: pastDate(5),
    },
    {
      id: "post_003",
      authorId: U.stu_xj,
      title: "推荐一下王芳老师的大学英语课",
      contentHtml: "<p>这学期选了王老师的英语课，真的太惊喜了！</p><p>课堂活动特别丰富，经常有小组讨论、角色扮演、英语小游戏。最重要的是，王老师会认真批改每一篇作文，给出很多实用的建议。</p><p>相比之下，之前的英语课就是照本宣科，很难提起兴趣。强烈推荐！</p>",
      topicNames: ["选课建议", "课程讨论"],
      likeCount: 12,
      commentCount: 5,
      hotScore: 58,
      lastReplyAt: pastDate(0),
      createdAt: pastDate(10),
    },
    {
      id: "post_004",
      authorId: U.stu_xg,
      title: "操作系统实验踩坑记录",
      contentHtml: "<p>分享一些做OS实验时遇到的问题和解决方案：</p><h3>1. 进程创建失败</h3><p>检查fork()的返回值是否正确处理。父进程返回子进程PID，子进程返回0。</p><h3>2. 死锁问题</h3><p>注意资源的申请顺序，使用银行家算法可以避免。</p><p>欢迎补充！</p>",
      topicNames: ["课程讨论"],
      likeCount: 6,
      commentCount: 2,
      hotScore: 22,
      lastReplyAt: pastDate(4),
      createdAt: pastDate(14),
    },
    {
      id: "post_005",
      authorId: U.stu_xl,
      title: "大三下学期选课推荐汇总",
      contentHtml: "<p>整理了一些热门课程的选课建议，供大家参考：</p><ul><li><strong>数据结构（李明）</strong>：必选！讲课清晰，实验丰富</li><li><strong>大学英语（王芳）</strong>：课堂有趣，适合想提升口语的同学</li><li><strong>数据库系统（张伟）</strong>：SQL实操多，大项目有挑战</li></ul><p>欢迎补充其他课程体验~</p>",
      topicNames: ["选课建议", "课程讨论"],
      likeCount: 15,
      commentCount: 6,
      hotScore: 72,
      lastReplyAt: pastDate(0),
      createdAt: pastDate(20),
    },
    {
      id: "post_006",
      authorId: U.stu_xw,
      title: "考研数学一复习经验",
      contentHtml: "<p>今年刚考完研，分享一些数学一的复习心得：</p><ol><li>基础阶段（3-6月）：跟着教材过一遍，做课后习题</li><li>强化阶段（7-9月）：刷《复习全书》，整理错题本</li><li>冲刺阶段（10-12月）：真题+模拟题交替练习</li></ol><p>关键是要坚持每天做题，保持手感！</p>",
      topicNames: ["考研交流", "学习经验"],
      likeCount: 20,
      commentCount: 8,
      hotScore: 95,
      lastReplyAt: pastDate(1),
      createdAt: pastDate(30),
    },
    {
      id: "post_007",
      authorId: U.stu_xm,
      title: "校园网又炸了？",
      contentHtml: "<p>今天下午图书馆的校园网好像又出问题了，好多同学反映连不上。有人知道是什么情况吗？</p>",
      topicNames: ["校园生活"],
      likeCount: 3,
      commentCount: 2,
      hotScore: 10,
      lastReplyAt: pastDate(3),
      createdAt: pastDate(3),
    },
    {
      id: "post_008",
      authorId: U.stu_xj,
      title: "数据库大项目组队",
      contentHtml: "<p>张老师的数据库课期末需要组队做一个完整的数据库应用系统。有没有同学想一起组队的？我可以负责后端，希望找一位负责前端的同学。</p><p>感兴趣的同学在评论区留个联系方式~</p>",
      topicNames: ["课程讨论"],
      likeCount: 4,
      commentCount: 4,
      hotScore: 18,
      lastReplyAt: pastDate(2),
      createdAt: pastDate(4),
    },
  ];

  for (const p of posts) {
    const { topicNames, ...postData } = p;
    await prisma.communityPost.upsert({
      where: { id: p.id },
      update: {},
      create: {
        ...postData,
        topics: {
          create: topicNames.map((name) => {
            const topic = createdTopics.find((t) => t.name === name);
            return { topicId: topic.id };
          }),
        },
      },
    });
  }

  // Sync updatedAt with createdAt — seed posts haven't been edited
  for (const p of posts) {
    await prisma.communityPost.update({
      where: { id: p.id },
      data: { updatedAt: p.createdAt },
    });
  }

  // ═══════════════════════════════════════════
  // 12. COMMUNITY POST COMMENTS
  // ═══════════════════════════════════════════
  console.log("Creating community comments...");
  const comments = [
    // Comments on post_001
    { id: "cmt_001", postId: "post_001", authorId: U.stu_xh, content: "谢谢分享！整理笔记那一步真的很重要，我就是靠这个过的期末。", createdAt: pastDate(6) },
    { id: "cmt_002", postId: "post_001", authorId: U.stu_xg, content: "补充一点：可以去找学长学姐要往年真题，比网上找的靠谱。", createdAt: pastDate(5) },
    { id: "cmt_003", postId: "post_001", authorId: U.stu_xj, content: "赞同！小组讨论效率真的高。", createdAt: pastDate(4), replyToCommentId: "cmt_001" },
    { id: "cmt_004", postId: "post_001", authorId: U.stu_xl, content: "已经收藏了，期末复习再来看看。", createdAt: pastDate(3) },
    // Comments on post_002
    { id: "cmt_005", postId: "post_002", authorId: U.stu_xm, content: "建议多看可视化演示，比如 visualgo.net，对理解数据结构的操作很有帮助。", createdAt: pastDate(4) },
    { id: "cmt_006", postId: "post_002", authorId: U.stu_xg, content: "可以先从二叉树开始，理解了递归之后，树和图就容易了。", createdAt: pastDate(3) },
    { id: "cmt_007", postId: "post_002", authorId: U.stu_xj, content: "李老师推荐的那本《算法导论》虽然厚，但讲得很清楚，可以看看。", createdAt: pastDate(2) },
    // Comments on post_003
    { id: "cmt_008", postId: "post_003", authorId: U.stu_xm, content: "看到推荐果断选了，希望这学期能遇到好老师！", createdAt: pastDate(9) },
    { id: "cmt_009", postId: "post_003", authorId: U.stu_xh, content: "同选过王老师的课，期末给了很多写作反馈，对提高英语写作帮助很大。", createdAt: pastDate(8) },
    { id: "cmt_010", postId: "post_003", authorId: U.stu_xl, content: "听说王老师还会在课上分享一些有趣的英语视频，期待！", createdAt: pastDate(7) },
    { id: "cmt_011", postId: "post_003", authorId: U.stu_xw, content: "请问考核方式是什么样的？平时成绩占比大吗？", createdAt: pastDate(6) },
    { id: "cmt_012", postId: "post_003", authorId: U.stu_xj, content: "平时50%+期末50%，平时主要是课堂表现+作业+小组项目。", createdAt: pastDate(5), replyToCommentId: "cmt_011" },
    // Comments on post_005
    { id: "cmt_013", postId: "post_005", authorId: U.stu_xm, content: "数据库课确实不错，SQL写熟练了对找工作也有帮助。", createdAt: pastDate(19) },
    { id: "cmt_014", postId: "post_005", authorId: U.stu_xg, content: "加一个：操作系统课虽然难但收获大，建议有一定编程基础再选。", createdAt: pastDate(18) },
    { id: "cmt_015", postId: "post_005", authorId: U.stu_xh, content: "感谢这么详细的整理！已经收藏。", createdAt: pastDate(17) },
    { id: "cmt_016", postId: "post_005", authorId: U.stu_xw, content: "大一新生想问：这些课有前置课程要求吗？", createdAt: pastDate(16) },
    { id: "cmt_017", postId: "post_005", authorId: U.stu_xl, content: "数据结构需要先修C语言，数据库和操作系统需要数据结构基础。", createdAt: pastDate(15), replyToCommentId: "cmt_016" },
    { id: "cmt_018", postId: "post_005", authorId: U.stu_xj, content: "帮大忙了，正在纠结下学期的选课呢！", createdAt: pastDate(14) },
    // Comments on post_006
    { id: "cmt_019", postId: "post_006", authorId: U.stu_xg, content: "学长能说一下每天大概花多少时间复习数学吗？", createdAt: pastDate(28) },
    { id: "cmt_020", postId: "post_006", authorId: U.stu_xw, content: "我基础阶段每天2-3小时，强化阶段4小时左右。关键是要持续，不要三天打鱼两天晒网。", createdAt: pastDate(27), replyToCommentId: "cmt_019" },
    { id: "cmt_021", postId: "post_006", authorId: U.stu_xm, content: "已经上岸了吗？恭喜！可以分享一下复试经验吗？", createdAt: pastDate(26) },
    { id: "cmt_022", postId: "post_006", authorId: U.stu_xj, content: "收藏！明年考研用。", createdAt: pastDate(25) },
  ];
  for (const c of comments) {
    await prisma.communityPostComment.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  // Sync updatedAt with createdAt for unedited comments
  for (const c of comments) {
    await prisma.communityPostComment.update({
      where: { id: c.id },
      data: { updatedAt: c.createdAt },
    });
  }

  // ═══════════════════════════════════════════
  // 13. COMMUNITY POST LIKES
  // ═══════════════════════════════════════════
  console.log("Creating community post likes...");
  const likePairs = [
    ["post_001", U.stu_xh], ["post_001", U.stu_xg], ["post_001", U.stu_xj], ["post_001", U.stu_xl],
    ["post_002", U.stu_xm], ["post_002", U.stu_xj], ["post_002", U.stu_xl],
    ["post_003", U.stu_xm], ["post_003", U.stu_xg], ["post_003", U.stu_xh], ["post_003", U.stu_xw], ["post_003", U.stu_xl],
    ["post_004", U.stu_xm], ["post_004", U.stu_xl], ["post_004", U.stu_xw],
    ["post_005", U.stu_xm], ["post_005", U.stu_xg], ["post_005", U.stu_xh], ["post_005", U.stu_xw], ["post_005", U.stu_xj],
    ["post_006", U.stu_xm], ["post_006", U.stu_xg], ["post_006", U.stu_xh], ["post_006", U.stu_xl], ["post_006", U.stu_xj], ["post_006", U.stu_xw],
    ["post_007", U.stu_xm], ["post_007", U.stu_xh],
    ["post_008", U.stu_xm], ["post_008", U.stu_xh], ["post_008", U.stu_xg],
  ];
  for (const [postId, userId] of likePairs) {
    await prisma.communityPostLike.create({ data: { postId, userId } }).catch(() => {});
  }

  // ═══════════════════════════════════════════
  // 14. COMMUNITY ANNOUNCEMENTS
  // ═══════════════════════════════════════════
  console.log("Creating community announcements...");
  await prisma.communityAnnouncement.upsert({
    where: { id: "ann_welcome" },
    update: {},
    create: {
      id: "ann_welcome",
      title: "欢迎来到学评社社区！",
      href: "/community",
      pinned: true,
      sortOrder: 0,
      status: "PUBLISHED",
    },
  });
  await prisma.communityAnnouncement.upsert({
    where: { id: "ann_rules" },
    update: {},
    create: {
      id: "ann_rules",
      title: "社区发言规范 - 请大家文明讨论",
      href: "/community",
      pinned: true,
      sortOrder: 1,
      status: "PUBLISHED",
    },
  });

  // ═══════════════════════════════════════════
  // 15. SHOP PRODUCTS
  // ═══════════════════════════════════════════
  console.log("Creating shop products...");
  const products = [
    { name: "学评社定制笔记本", needPoints: 100, coverText: "精装A5笔记本", stock: 50, isActive: true },
    { name: "校园文创帆布袋", needPoints: 200, coverText: "环保帆布袋", stock: 30, isActive: true },
    { name: "图书馆打印卡（10元）", needPoints: 150, coverText: "可打印100页", stock: 100, isActive: true },
    { name: "咖啡券（一杯）", needPoints: 80, coverText: "校内咖啡厅通用", stock: 200, isActive: true },
    { name: "优先选课特权", needPoints: 500, coverText: "一次优先选课机会", stock: 10, isActive: true },
    { name: "学霸笔记合集", needPoints: 300, coverText: "各科重点汇总", stock: 20, isActive: true },
  ];
  const createdProducts = [];
  for (const p of products) {
    const product = await prisma.shopProduct.create({ data: p }).catch(() => null);
    if (product) createdProducts.push(product);
  }

  // ═══════════════════════════════════════════
  // 16. SHOP REDEEM ORDERS
  // ═══════════════════════════════════════════
  console.log("Creating redeem orders...");
  // Fallback: query existing products if already seeded
  if (createdProducts.length === 0) {
    createdProducts.push(...await prisma.shopProduct.findMany({ take: 6 }));
  }
  if (createdProducts.length >= 5) {
    await prisma.shopRedeemOrder.create({
      data: {
        userId: U.stu_xm,
        productId: createdProducts[3].id,
        productSnapshotName: "咖啡券（一杯）",
        pointsSpent: 80,
        receiverName: "小明",
        receiverPhone: "13800001111",
        receiverAddress: "学生宿舍1号楼101",
        status: "SUCCESS",
      },
    }).catch(() => {});
    await prisma.shopRedeemOrder.create({
      data: {
        userId: U.stu_xj,
        productId: createdProducts[0].id,
        productSnapshotName: "学评社定制笔记本",
        pointsSpent: 100,
        receiverName: "小静",
        receiverPhone: "13800002222",
        receiverAddress: "学生宿舍3号楼302",
        status: "SUCCESS",
      },
    }).catch(() => {});
    await prisma.shopRedeemOrder.create({
      data: {
        userId: U.stu_xh,
        productId: createdProducts[4].id,
        productSnapshotName: "优先选课特权",
        pointsSpent: 500,
        receiverName: "小红",
        receiverPhone: "13800003333",
        receiverAddress: "学生宿舍2号楼205",
        status: "SUCCESS",
      },
    }).catch(() => {});
  }

  // ═══════════════════════════════════════════
  // 17. SEARCH DOCUMENTS
  // ═══════════════════════════════════════════
  console.log("Creating search documents...");
  const searchDocs = [
    { docType: "COURSE", docId: C.math, title: "高等数学（下）", subtitle: "张伟", department: "数学与统计学院", scoreSnapshot: 4.3, reviewCountSnapshot: 4, snippet: "张老师讲课深入浅出，板书工整，课堂氛围很好。" },
    { docType: "COURSE", docId: C.physics, title: "大学物理（上）", subtitle: "张伟", department: "数学与统计学院", scoreSnapshot: 4.0, reviewCountSnapshot: 1, snippet: "物理实验课很有意思，理论课部分老师演示实验也很直观。" },
    { docType: "COURSE", docId: C.english, title: "大学英语（4）", subtitle: "王芳", department: "外国语学院", scoreSnapshot: 4.3, reviewCountSnapshot: 3, snippet: "课堂气氛活跃，王老师经常组织小组讨论和角色扮演。" },
    { docType: "COURSE", docId: C.ds, title: "数据结构", subtitle: "李明", department: "计算机科学与技术学院", scoreSnapshot: 4.7, reviewCountSnapshot: 3, snippet: "李老师的代码演示环节非常棒，每节课都有实际的编程练习。" },
    { docType: "COURSE", docId: C.os, title: "操作系统", subtitle: "李明", department: "计算机科学与技术学院", scoreSnapshot: 4.1, reviewCountSnapshot: 3, snippet: "对进程调度和内存管理讲得很透彻，课后作业设计精良。" },
    { docType: "COURSE", docId: C.db, title: "数据库系统概论", subtitle: "张伟", department: "数学与统计学院", scoreSnapshot: 4.6, reviewCountSnapshot: 1, snippet: "SQL实操环节很多，真正锻炼了数据库设计能力。" },
    { docType: "TEACHER", docId: U.teacher_zhang, title: "张伟", subtitle: "教授", department: "数学与统计学院", scoreSnapshot: 4.5, reviewCountSnapshot: 1, snippet: "张教授治学严谨，对学生要求高但很公平。" },
    { docType: "TEACHER", docId: U.teacher_li, title: "李明", subtitle: "副教授", department: "计算机科学与技术学院", scoreSnapshot: 4.8, reviewCountSnapshot: 1, snippet: "李老师是我遇到的最负责的老师之一，代码能力特别强。" },
    { docType: "TEACHER", docId: U.teacher_wang, title: "王芳", subtitle: "教授", department: "外国语学院", scoreSnapshot: 4.3, reviewCountSnapshot: 1, snippet: "王老师亲切和蔼，课堂活动设计丰富多样。" },
  ];
  for (const d of searchDocs) {
    await prisma.searchDocument.upsert({
      where: { docType_docId: { docType: d.docType, docId: d.docId } },
      update: {},
      create: { ...d, searchableText: `${d.title} ${d.subtitle} ${d.department}` },
    });
  }

  // ═══════════════════════════════════════════
  // 18. RECOMMENDED REVIEWS
  // ═══════════════════════════════════════════
  console.log("Creating recommended reviews...");
  const topReviews = await prisma.courseReview.findMany({
    orderBy: { likesCount: "desc" },
    take: 8,
  });

  // Enrich reviews with teacher reference, course name, and detailed scores
  const courseMetaMap = {
    [C.math]: { teacherId: U.teacher_zhang, teacherName: "张伟", courseName: "高等数学（下）" },
    [C.physics]: { teacherId: U.teacher_zhang, teacherName: "张伟", courseName: "大学物理（上）" },
    [C.english]: { teacherId: U.teacher_wang, teacherName: "王芳", courseName: "大学英语（4）" },
    [C.ds]: { teacherId: U.teacher_li, teacherName: "李明", courseName: "数据结构" },
    [C.os]: { teacherId: U.teacher_li, teacherName: "李明", courseName: "操作系统" },
    [C.db]: { teacherId: U.teacher_zhang, teacherName: "张伟", courseName: "数据库系统概论" },
  };

  for (let i = 0; i < topReviews.length; i++) {
    const r = topReviews[i];
    const meta = courseMetaMap[r.courseId] ?? {};
    await prisma.recommendedReview.upsert({
      where: { reviewId: r.id },
      update: {
        sourceCourseName: meta.courseName,
        sourceTeacherId: meta.teacherId,
        sourceTeacherName: meta.teacherName,
        detailedScoresJson: r.detailedScoresJson,
        rankScore: (topReviews.length - i) * 10,
        isActive: true,
      },
      create: {
        reviewId: r.id,
        nickname: r.nickname,
        sourceCourseId: r.courseId,
        sourceCourseName: meta.courseName,
        sourceTeacherId: meta.teacherId,
        sourceTeacherName: meta.teacherName,
        overallScore: r.overallScore,
        likesCount: r.likesCount,
        summary: r.summary,
        detailedScoresJson: r.detailedScoresJson,
        rankScore: (topReviews.length - i) * 10,
        isActive: true,
      },
    });
  }

  // ═══════════════════════════════════════════
  // 19. FOLLOWS
  // ═══════════════════════════════════════════
  console.log("Creating follows...");
  const followPairs = [
    [U.stu_xm, U.stu_xj], [U.stu_xm, U.stu_xh],
    [U.stu_xh, U.stu_xm], [U.stu_xh, U.stu_xj], [U.stu_xh, U.stu_xl],
    [U.stu_xg, U.stu_xm], [U.stu_xg, U.stu_xw],
    [U.stu_xl, U.stu_xj], [U.stu_xl, U.stu_xh],
    [U.stu_xj, U.stu_xm], [U.stu_xj, U.stu_xh], [U.stu_xj, U.stu_xl], [U.stu_xj, U.stu_xw],
    [U.stu_xw, U.stu_xj],
    [U.stu_xm, U.teacher_li], [U.stu_xh, U.teacher_zhang], [U.stu_xj, U.teacher_wang],
  ];
  for (const [followerId, followingId] of followPairs) {
    await prisma.follow.create({ data: { followerId, followingId } }).catch(() => {});
  }

  // ═══════════════════════════════════════════
  // 20. BROWSE HISTORY
  // ═══════════════════════════════════════════
  console.log("Creating browse history...");
  const historyItems = [
    { userId: U.stu_xm, kind: "COURSE", targetId: C.math, title: "高等数学（下）", href: `/course/${C.math}` },
    { userId: U.stu_xm, kind: "COURSE", targetId: C.ds, title: "数据结构", href: `/course/${C.ds}` },
    { userId: U.stu_xm, kind: "TEACHER", targetId: U.teacher_li, title: "李明", href: `/teacher/${U.teacher_li}` },
    { userId: U.stu_xh, kind: "COURSE", targetId: C.math, title: "高等数学（下）", href: `/course/${C.math}` },
    { userId: U.stu_xh, kind: "COURSE", targetId: C.english, title: "大学英语（4）", href: `/course/${C.english}` },
    { userId: U.stu_xh, kind: "COMMUNITY_POST", targetId: "post_005", title: "大三下学期选课推荐汇总", href: "/community/post_005" },
    { userId: U.stu_xj, kind: "COURSE", targetId: C.ds, title: "数据结构", href: `/course/${C.ds}` },
    { userId: U.stu_xj, kind: "TEACHER", targetId: U.teacher_wang, title: "王芳", href: `/teacher/${U.teacher_wang}` },
    { userId: U.stu_xg, kind: "COURSE", targetId: C.os, title: "操作系统", href: `/course/${C.os}` },
  ];
  for (const h of historyItems) {
    await prisma.browseHistory.upsert({
      where: { userId_kind_targetId: { userId: h.userId, kind: h.kind, targetId: h.targetId } },
      update: {},
      create: h,
    });
  }

  // ═══════════════════════════════════════════
  // 21. COURSE ANNOUNCEMENTS
  // ═══════════════════════════════════════════
  console.log("Creating course announcements...");
  await prisma.courseAnnouncement.create({
    data: {
      courseId: C.math,
      authorId: U.teacher_zhang,
      title: "关于期中考试安排的通知",
      content: "高等数学期中考试将于第10周周一进行，考试范围：第一至第六章。请同学们做好复习准备。",
      status: "PUBLISHED",
      publishAt: pastDate(14),
    },
  }).catch(() => {});
  await prisma.courseAnnouncement.create({
    data: {
      courseId: C.ds,
      authorId: U.teacher_li,
      title: "实验课时间调整",
      content: "因机房维护，本周五的实验课调整到周六上午9:00-11:00，地点不变。请相互转告。",
      status: "PUBLISHED",
      publishAt: pastDate(3),
    },
  }).catch(() => {});

  // ═══════════════════════════════════════════
  // 22. APP CONFIG
  // ═══════════════════════════════════════════
  console.log("Creating app config...");
  await prisma.appConfig.upsert({
    where: { key: "semester_sequence" },
    update: {},
    create: { key: "semester_sequence", value: JSON.stringify([SEMESTER_PREV, SEMESTER_CURRENT, SEMESTER_NEXT]) },
  });
  await prisma.appConfig.upsert({
    where: { key: "current_semester" },
    update: {},
    create: { key: "current_semester", value: SEMESTER_CURRENT },
  });

  // ═══════════════════════════════════════════
  // 23. COURSE SCORE HISTORY (for trend chart & detail pages)
  // ═══════════════════════════════════════════
  console.log("Creating course score history...");
  const semesterLabels = ["2023-2024-1", "2023-2024-2", "2024-2025-1", "2024-2025-2", "2025-2026-1", "2025-2026-2"];
  const allCourses = Object.values(C);
  for (const courseId of allCourses) {
    for (let i = 0; i < semesterLabels.length; i++) {
      const label = semesterLabels[i];
      // Deterministic-ish score based on course + semester index
      const seed = courseId.length + i * 7;
      const base = 3.6 + ((seed % 13) / 10);
      const jitter = () => Math.min(5, Math.max(2, base + ((Math.random() - 0.5) * 0.6)));
      await prisma.courseScoreHistory.upsert({
        where: { courseId_granularity_cursorKey: { courseId, granularity: "SEMESTER", cursorKey: label } },
        update: {},
        create: {
          courseId,
          granularity: "SEMESTER",
          cursorKey: label,
          timeLabel: label,
          sortOrder: i,
          overallScore: Number(jitter().toFixed(2)),
          attitude: Number(jitter().toFixed(2)),
          content: Number(jitter().toFixed(2)),
          method: Number(jitter().toFixed(2)),
          effect: Number(jitter().toFixed(2)),
          interaction: Number(jitter().toFixed(2)),
          resource: Number(jitter().toFixed(2)),
          improve: Number(jitter().toFixed(2)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════
  // 24. TEACHER SCORE HISTORY (for teacher trend chart)
  // ═══════════════════════════════════════════
  console.log("Creating teacher score history...");
  // Map: teacherId -> courseIds they teach
  const teacherCourseMap = {
    [U.teacher_zhang]: [C.math, C.physics, C.db],
    [U.teacher_li]: [C.ds, C.os],
    [U.teacher_wang]: [C.english],
  };

  // Pre-build course score lookup: courseId -> label -> scores
  const courseScoreLookup = {};
  for (const courseId of allCourses) {
    courseScoreLookup[courseId] = {};
    for (const label of semesterLabels) {
      const seed = courseId.length + semesterLabels.indexOf(label) * 7;
      const base = 3.6 + ((seed % 13) / 10);
      const jitter = () => Math.min(5, Math.max(2, base + ((Math.random() - 0.5) * 0.6)));
      courseScoreLookup[courseId][label] = {
        overallScore: Number(jitter().toFixed(2)),
        attitude: Number(jitter().toFixed(2)),
        content: Number(jitter().toFixed(2)),
        method: Number(jitter().toFixed(2)),
        effect: Number(jitter().toFixed(2)),
        interaction: Number(jitter().toFixed(2)),
        resource: Number(jitter().toFixed(2)),
        improve: Number(jitter().toFixed(2)),
      };
    }
  }

  for (const [teacherId, courseIds] of Object.entries(teacherCourseMap)) {
    for (let i = 0; i < semesterLabels.length; i++) {
      const label = semesterLabels[i];
      // Average scores across all courses taught by this teacher for this semester
      const courseScores = courseIds.map((cid) => courseScoreLookup[cid]?.[label]).filter(Boolean);
      if (courseScores.length === 0) continue;

      const avg = (key) => {
        const vals = courseScores.map((s) => s[key]).filter((v) => v != null);
        return vals.length > 0 ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;
      };

      await prisma.teacherScoreHistory.upsert({
        where: { teacherId_granularity_cursorKey: { teacherId, granularity: "SEMESTER", cursorKey: label } },
        update: {},
        create: {
          teacherId,
          granularity: "SEMESTER",
          cursorKey: label,
          timeLabel: label,
          sortOrder: i,
          overallScore: avg("overallScore"),
          attitude: avg("attitude"),
          content: avg("content"),
          method: avg("method"),
          effect: avg("effect"),
          interaction: avg("interaction"),
          resource: avg("resource"),
          improve: avg("improve"),
        },
      });
    }
  }

  // ═══════════════════════════════════════════
  // 25. TEACHER COURSES (for teacher-detail page)
  // ═══════════════════════════════════════════
  console.log("Creating teacher-course links...");
  const teacherCourses = [
    { teacherId: U.teacher_zhang, courseId: C.math, courseName: "高等数学（下）", sortOrder: 1 },
    { teacherId: U.teacher_zhang, courseId: C.physics, courseName: "大学物理（上）", sortOrder: 2 },
    { teacherId: U.teacher_zhang, courseId: C.db, courseName: "数据库系统概论", sortOrder: 3 },
    { teacherId: U.teacher_li, courseId: C.ds, courseName: "数据结构", sortOrder: 1 },
    { teacherId: U.teacher_li, courseId: C.os, courseName: "操作系统", sortOrder: 2 },
    { teacherId: U.teacher_wang, courseId: C.english, courseName: "大学英语（4）", sortOrder: 1 },
  ];
  for (const tc of teacherCourses) {
    await prisma.teacherCourse.upsert({
      where: { teacherId_courseId: { teacherId: tc.teacherId, courseId: tc.courseId } },
      update: {},
      create: tc,
    });
  }

  // ═══════════════════════════════════════════
  // 26. SAMPLE NOTIFICATIONS
  // ═══════════════════════════════════════════
  console.log("Creating sample notifications...");
  const notificationData = [
    { eventType: "community.post.like", title: "小明 点赞了你的帖子", summary: "《数据结构该怎么学？求建议》收到了一次点赞。", href: "/community/post_002", receiverIds: [U.stu_xh], payload: { postId: "post_002", action: "like" } },
    { eventType: "community.post.comment", title: "小静 评论了你的帖子", summary: "《推荐一下王芳老师的大学英语课》收到了新评论。", href: "/community/post_003", receiverIds: [U.stu_xj], payload: { postId: "post_003", action: "comment" } },
    { eventType: "community.post.like", title: "小刚 点赞了你的帖子", summary: "《大三下学期选课推荐汇总》收到了一次点赞。", href: "/community/post_005", receiverIds: [U.stu_xl], payload: { postId: "post_005", action: "like" } },
    { eventType: "course.review.like", title: "小红 点赞了你的评价", summary: "你对《高等数学（下）》的评价收到了一次点赞。", href: `/course/${C.math}`, receiverIds: [U.stu_xm], payload: { courseId: C.math, action: "like" } },
    { eventType: "follow", title: "小静 关注了你", summary: "你多了一个新粉丝！", href: "/profile", receiverIds: [U.stu_xm], payload: {} },
    { eventType: "community.announcement.published", title: "社区发布了新公告", summary: "欢迎来到学评社社区！", href: "/community", receiverIds: [U.stu_xm, U.stu_xh, U.stu_xg], payload: {} },
  ];

  for (const n of notificationData) {
    try {
      const notif = await prisma.notification.create({
        data: {
          eventType: n.eventType,
          title: n.title,
          summary: n.summary,
          href: n.href,
          payload: n.payload,
        },
      });
      const createdNotif = await prisma.notification.findUnique({ where: { id: notif.id }, select: { eventId: true } });
      if (createdNotif) {
        for (const userId of n.receiverIds) {
          await prisma.userNotification.create({
            data: {
              userId,
              notificationId: notif.id,
              eventId: createdNotif.eventId,
            },
          }).catch(() => {});
        }
      }
    } catch {
      // skip duplicates on re-run
    }
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("   Default password for all users: 123456");
  console.log(`   Admin user ID (add to ADMIN_USER_IDS): ${U.admin}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
