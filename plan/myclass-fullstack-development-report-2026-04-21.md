# 我的课程页前后端开发报告（2026-04-21）

## 1. 开发目标

将“我的课程页”从前端硬编码 mock 数据改造为真实后端数据驱动，完成：

- 后端：提供可复用的课程查询能力（筛选、排序、分页）。
- 前端：页面接入后端数据并保持现有交互体验。
- 评教链路：评教提交优先绑定真实登录用户，未登录保留 demo 兜底。

## 2. 改造前现状

- `app/myclass/page.tsx` 使用本地 `allCourses` 数组模拟数据。
- 页面逻辑虽然具备 `unevaluated/sort/keyword/page` 参数，但仅作用于本地 mock。
- 评教接口 `app/api/courses/[courseId]/reviews/route.ts` 固定写入 `DEMO_USER_ID`，无法正确反映当前登录用户是否已评教。

## 3. 方案设计

### 3.1 后端分层

新增服务层：`lib/myclass/service.ts`

- 统一封装我的课程查询逻辑。
- 接收查询参数：
  - `userId`
  - `unevaluated`
  - `sort`
  - `keyword`
  - `page`
  - `pageSize`
- 返回标准分页结果：`items/total/currentPage/totalPages`。

新增 API：`app/api/myclass/courses/route.ts`

- 从 URL 读取查询参数。
- 从会话读取用户 ID。
- 调用服务层并返回 JSON。

### 3.2 数据来源策略

由于当前 schema 尚无独立“选课关系”表，本次采用“可用数据拼接”策略：

- 基础课程池：`SearchDocument(docType=COURSE)`。
- 用户课程补集：
  - `CourseReview`（用户评教）
  - `TeacherReview.sourceCourseId`
  - `CourseResource`（用户上传资源）
  - `ResourceUploadSession`

并以 `CourseReview(status != DELETED)` 计算 `isEvaluated`。

### 3.3 前端接入

改造 `app/myclass/page.tsx`：

- 删除本地 mock 查询函数。
- 改为调用 `getMyClassCourses()`。
- 保留现有筛选、搜索、排序、分页交互。

## 4. 实际改动清单

1. 新增 `lib/myclass/service.ts`

- 新增我的课程查询服务。
- 实现参数规范化、关键词过滤、截止时间排序、分页切片。
- 兼容无会话场景。

2. 新增 `app/api/myclass/courses/route.ts`

- 对外提供课程查询 API。
- 读取会话并注入 `userId` 到服务层。

3. 修改 `app/myclass/page.tsx`

- `CourseCardProps.courseId` 从 `number` 调整为 `string`，与路由参数一致。
- 页面改为真实数据驱动，移除硬编码数据。

4. 修改 `app/api/courses/[courseId]/reviews/route.ts`

- 评教写入用户从“固定 demo”调整为“优先当前会话用户”。
- 未登录时仍自动回落到 demo 用户，避免破坏现有可用性。

## 5. 验证情况

已对本次变更文件执行静态错误检查，结果：无 TypeScript/语法错误。

检查文件：

- `lib/myclass/service.ts`
- `app/api/myclass/courses/route.ts`
- `app/myclass/page.tsx`
- `app/api/courses/[courseId]/reviews/route.ts`

## 6. 已知限制与后续建议

1. 课程主数据仍不完整

- 目前无正式课程实体，`location/time/credits` 等字段暂为占位值。
- 建议新增 `Course` 与 `Enrollment`（或 `UserCourse`）模型，建立标准“我的课程”关系。

2. 截止日期为规则生成值

- 当前 `deadline` 基于课程 ID 生成，用于支持排序与演示。
- 建议后续接入真实教学周期/评教截止字段。

3. 评教提交对匿名昵称仍允许前端透传

- 可在后续统一昵称策略（会话昵称优先、前端昵称受控）。

## 7. 结论

“我的课程页”已完成从 mock 到真实后端驱动的核心改造，并补齐 API 能力与评教用户归属逻辑。当前版本可满足基本可用的全链路功能，后续可在课程主数据建模与选课关系建模后进一步提升数据真实性与稳定性。
