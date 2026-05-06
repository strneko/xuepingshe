"use client";

import * as React from "react";
import { Loader2, Pause, Play, RefreshCw, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CourseResourceUploadProps {
  courseId: string;
  onUploaded: (item: { id: string; name: string; type: string; updatedAt: string }) => void;
}

type UploadStatus = "hashing" | "uploading" | "paused" | "merging" | "completed" | "failed";

interface UploadTask {
  taskId: string;
  file: File;
  fileName: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
  wholeFileHash?: string;
  uploadId?: string;
  uploadedParts: number[];
  progress: number;
  status: UploadStatus;
  error?: string;
  concurrency: number;
  retryCount: number;
}

interface PersistedUploadSession {
  taskId: string;
  courseId: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
  chunkSize: number;
  totalChunks: number;
  wholeFileHash?: string;
  uploadId?: string;
  uploadedParts: number[];
  concurrency: number;
  status: "uploading" | "paused" | "failed";
  updatedAt: number;
}

interface InitUploadResponse {
  code: "INSTANT_SUCCESS" | "UPLOAD_REQUIRED";
  resourceId?: string;
  uploadId?: string;
  uploadedParts?: number[];
  concurrencyHint?: number;
}

interface PartUploadResponse {
  etag?: string;
}

interface UploadStatusResponse {
  status?: string;
  resourceId?: string;
}

const SESSION_KEY = "course-resource-upload-sessions-v1";
const CHUNK_SIZE = 8 * 1024 * 1024;
const MIN_CONCURRENCY = 1;
const MAX_CONCURRENCY = 6;
const INITIAL_CONCURRENCY = 3;
const MAX_RETRY_PER_CHUNK = 5;

function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function extensionToType(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return "附件";
  if (["pdf", "ppt", "pptx", "doc", "docx", "txt"].includes(ext)) return "讲义";
  if (["mp4", "mov", "mkv"].includes(ext)) return "视频";
  if (["zip", "rar", "7z"].includes(ext)) return "压缩包";
  if (["xlsx", "xls", "csv"].includes(ext)) return "表格";
  return "附件";
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

async function sha256Hex(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeParts(parts: number[]) {
  return Array.from(new Set(parts)).sort((a, b) => a - b);
}

function loadSessions(): PersistedUploadSession[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as PersistedUploadSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: PersistedUploadSession[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
}

function mergeSession(session: PersistedUploadSession) {
  const sessions = loadSessions();
  const next = sessions.filter((item) => item.taskId !== session.taskId);
  next.push(session);
  saveSessions(next);
}

function removeSession(taskId: string) {
  const sessions = loadSessions();
  saveSessions(sessions.filter((item) => item.taskId !== taskId));
}

async function initUpload(params: {
  courseId: string;
  file: File;
  chunkSize: number;
  totalChunks: number;
  wholeFileHash: string;
}): Promise<InitUploadResponse> {
  const response = await fetch("/api/resources/upload/init", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      courseId: params.courseId,
      fileName: params.file.name,
      fileSize: params.file.size,
      mimeType: params.file.type || "application/octet-stream",
      wholeFileHash: params.wholeFileHash,
      chunkSize: params.chunkSize,
      totalChunks: params.totalChunks,
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("上传接口未就绪，请先实现 /api/resources/upload/init");
    }
    throw new Error(`初始化上传失败(${response.status})`);
  }

  return (await response.json()) as InitUploadResponse;
}

async function uploadPart(params: {
  uploadId: string;
  partNumber: number;
  chunkHash: string;
  chunk: Blob;
  signal: AbortSignal;
}): Promise<PartUploadResponse> {
  const response = await fetch("/api/resources/upload/part", {
    method: "POST",
    headers: {
      "Upload-Id": params.uploadId,
      "Part-Number": String(params.partNumber),
      "Chunk-Hash": params.chunkHash,
      "Content-Length": String(params.chunk.size),
    },
    body: params.chunk,
    signal: params.signal,
  });

  if (!response.ok) {
    const message = `分片 ${params.partNumber} 上传失败(${response.status})`;
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as PartUploadResponse;
}

async function completeUpload(uploadId: string, uploadedPartsMeta: Array<{ partNumber: number; chunkHash: string }>) {
  const response = await fetch(`/api/resources/upload/${uploadId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uploadedPartsMeta }),
  });

  if (!response.ok) {
    throw new Error(`提交合并失败(${response.status})`);
  }
}

async function getUploadStatus(uploadId: string): Promise<UploadStatusResponse> {
  const response = await fetch(`/api/resources/upload/${uploadId}/status`, {
    method: "GET",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return { status: "MERGING" };
    }
    throw new Error(`查询上传状态失败(${response.status})`);
  }

  return (await response.json()) as UploadStatusResponse;
}

export default function CourseResourceUpload({ courseId, onUploaded }: CourseResourceUploadProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const controlsRef = React.useRef<Record<string, { paused: boolean; canceled: boolean }>>({});
  const tasksRef = React.useRef<UploadTask[]>([]);

  const [tasks, setTasks] = React.useState<UploadTask[]>([]);
  const [hint, setHint] = React.useState<string>("支持切片上传、断点续传和秒传，弱网下会自动重试。");

  React.useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const updateTask = React.useCallback((taskId: string, updater: (task: UploadTask) => UploadTask) => {
    setTasks((current) => {
      const next = current.map((task) => (task.taskId === taskId ? updater(task) : task));
      tasksRef.current = next;
      return next;
    });
  }, []);

  const persistTask = React.useCallback(
    (task: UploadTask) => {
      if (!task.uploadId || task.status === "completed") {
        removeSession(task.taskId);
        return;
      }

      if (task.status !== "uploading" && task.status !== "paused" && task.status !== "failed") {
        return;
      }

      mergeSession({
        taskId: task.taskId,
        courseId,
        fileName: task.fileName,
        fileSize: task.fileSize,
        lastModified: task.file.lastModified,
        chunkSize: task.chunkSize,
        totalChunks: task.totalChunks,
        wholeFileHash: task.wholeFileHash,
        uploadId: task.uploadId,
        uploadedParts: task.uploadedParts,
        concurrency: task.concurrency,
        status: task.status,
        updatedAt: Date.now(),
      });
    },
    [courseId],
  );

  const runWithRetry = React.useCallback(
    async <T,>(taskId: string, action: () => Promise<T>) => {
      let attempt = 0;

      while (attempt < MAX_RETRY_PER_CHUNK) {
        try {
          return await action();
        } catch (error) {
          const status = (error as { status?: number }).status;
          attempt += 1;

          if (status !== undefined && !isRetryableStatus(status)) {
            throw error;
          }

          if (attempt >= MAX_RETRY_PER_CHUNK) {
            throw error;
          }

          const delay = Math.min(1000 * 2 ** (attempt - 1) + Math.round(Math.random() * 300), 8000);
          updateTask(taskId, (task) => ({ ...task, retryCount: attempt }));
          await new Promise((resolve) => window.setTimeout(resolve, delay));
        }
      }

      throw new Error("重试次数已达上限");
    },
    [updateTask],
  );

  const finalizeTask = React.useCallback(
    async (task: UploadTask, chunkHashes: Record<number, string>) => {
      if (!task.uploadId) {
        throw new Error("uploadId 缺失，无法合并分片");
      }

      updateTask(task.taskId, (current) => ({ ...current, status: "merging", error: undefined }));

      await completeUpload(
        task.uploadId,
        Array.from({ length: task.totalChunks }, (_, index) => {
          const partNumber = index + 1;
          return { partNumber, chunkHash: chunkHashes[partNumber] ?? "" };
        }),
      );

      for (let attempt = 0; attempt < 30; attempt += 1) {
        const status = await getUploadStatus(task.uploadId);
        if (status.status === "COMPLETED") {
          updateTask(task.taskId, (current) => ({ ...current, status: "completed", progress: 100 }));
          removeSession(task.taskId);
          onUploaded({
            id: status.resourceId ?? `local-${task.taskId}`,
            name: task.fileName,
            type: extensionToType(task.fileName),
            updatedAt: formatDate(),
          });
          return;
        }

        if (status.status === "FAILED") {
          throw new Error("后端合并失败，请重试上传");
        }

        await new Promise((resolve) => window.setTimeout(resolve, 2000));
      }

      throw new Error("已提交合并任务，状态查询超时，请稍后刷新资源列表确认");
    },
    [onUploaded, updateTask],
  );

  const startTask = React.useCallback(
    async (taskId: string, bootstrapTask?: UploadTask) => {
      const getTask = () => tasksRef.current.find((item) => item.taskId === taskId) ?? bootstrapTask;
      const task = getTask();

      if (!task) {
        return;
      }

      const baseTask = task;

      controlsRef.current[taskId] = { paused: false, canceled: false };

      try {
        updateTask(taskId, (current) => ({ ...current, status: "hashing", error: undefined, retryCount: 0 }));

        const wholeFileHash = await sha256Hex(await baseTask.file.arrayBuffer());
        if (controlsRef.current[taskId]?.paused || controlsRef.current[taskId]?.canceled) {
          return;
        }

        const sessions = loadSessions();
        const matchedSession = sessions.find(
          (session) =>
            session.courseId === courseId &&
            session.fileName === baseTask.file.name &&
            session.fileSize === baseTask.file.size &&
            session.lastModified === baseTask.file.lastModified,
        );

        const initResult = await initUpload({
          courseId,
          file: baseTask.file,
          chunkSize: baseTask.chunkSize,
          totalChunks: baseTask.totalChunks,
          wholeFileHash,
        });

        if (initResult.code === "INSTANT_SUCCESS") {
          updateTask(taskId, (current) => ({
            ...current,
            status: "completed",
            wholeFileHash,
            progress: 100,
          }));
          onUploaded({
            id: initResult.resourceId ?? `instant-${taskId}`,
            name: baseTask.fileName,
            type: extensionToType(baseTask.fileName),
            updatedAt: formatDate(),
          });
          removeSession(taskId);
          return;
        }

        const uploadId = initResult.uploadId ?? matchedSession?.uploadId;
        if (!uploadId) {
          throw new Error("初始化上传未返回 uploadId");
        }

        const initialUploadedParts = normalizeParts([
          ...(initResult.uploadedParts ?? []),
          ...(matchedSession?.uploadedParts ?? []),
        ]);

        updateTask(taskId, (current) => {
          const next = {
            ...current,
            status: "uploading" as const,
            uploadId,
            wholeFileHash,
            uploadedParts: initialUploadedParts,
            progress: Math.round((initialUploadedParts.length / current.totalChunks) * 100),
            concurrency: Math.min(
              Math.max(initResult.concurrencyHint ?? current.concurrency, MIN_CONCURRENCY),
              MAX_CONCURRENCY,
            ),
            error: undefined,
          };
          persistTask(next);
          return next;
        });

        const uploadedSet = new Set<number>(initialUploadedParts);
        const pendingParts = Array.from({ length: baseTask.totalChunks }, (_, index) => index + 1).filter(
          (partNumber) => !uploadedSet.has(partNumber),
        );

        const chunkHashes: Record<number, string> = {};
        const abortController = new AbortController();

        while (pendingParts.length > 0) {
          const control = controlsRef.current[taskId];
          if (!control || control.paused || control.canceled) {
            updateTask(taskId, (current) => {
              const next = { ...current, status: "paused" as const };
              persistTask(next);
              return next;
            });
            abortController.abort();
            return;
          }

          const beforeBatch = performance.now();
          const currentTask = getTask();
          const concurrency = currentTask?.concurrency ?? INITIAL_CONCURRENCY;
          const batch = pendingParts.splice(0, concurrency);

          let failedInBatch = 0;

          await Promise.all(
            batch.map(async (partNumber) => {
              const start = (partNumber - 1) * baseTask.chunkSize;
              const end = Math.min(start + baseTask.chunkSize, baseTask.fileSize);
              const chunk = baseTask.file.slice(start, end);
              const chunkHash = await sha256Hex(await chunk.arrayBuffer());
              chunkHashes[partNumber] = chunkHash;

              try {
                await runWithRetry(taskId, () =>
                  uploadPart({
                    uploadId,
                    partNumber,
                    chunkHash,
                    chunk,
                    signal: abortController.signal,
                  }),
                );

                uploadedSet.add(partNumber);
                updateTask(taskId, (current) => {
                  const nextUploaded = normalizeParts([...current.uploadedParts, partNumber]);
                  const next = {
                    ...current,
                    uploadedParts: nextUploaded,
                    progress: Math.round((nextUploaded.length / current.totalChunks) * 100),
                    status: "uploading" as const,
                    retryCount: 0,
                  };
                  persistTask(next);
                  return next;
                });
              } catch (error) {
                failedInBatch += 1;
                pendingParts.push(partNumber);
                const message = error instanceof Error ? error.message : "分片上传失败";
                updateTask(taskId, (current) => ({ ...current, error: message }));
              }
            }),
          );

          const elapsed = performance.now() - beforeBatch;
          updateTask(taskId, (current) => {
            let nextConcurrency = current.concurrency;
            if (failedInBatch === 0 && elapsed < 2000) {
              nextConcurrency = Math.min(MAX_CONCURRENCY, current.concurrency + 1);
            } else if (failedInBatch > 0 || elapsed > 5000) {
              nextConcurrency = Math.max(MIN_CONCURRENCY, current.concurrency - 1);
            }
            const next = { ...current, concurrency: nextConcurrency };
            persistTask(next);
            return next;
          });
        }

        const finalTask = getTask();
        if (!finalTask) {
          return;
        }

        await finalizeTask(
          {
            ...finalTask,
            uploadId,
            wholeFileHash,
          },
          chunkHashes,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "上传失败";
        updateTask(taskId, (current) => {
          const next = { ...current, status: "failed" as const, error: message };
          persistTask(next);
          return next;
        });
      }
    },
    [courseId, finalizeTask, onUploaded, persistTask, runWithRetry, tasks, updateTask],
  );

  const handleFilesSelected = React.useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }

      const nextTasks: UploadTask[] = Array.from(files).map((file) => {
        const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
        return {
          taskId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          file,
          fileName: file.name,
          fileSize: file.size,
          chunkSize: CHUNK_SIZE,
          totalChunks,
          uploadedParts: [],
          progress: 0,
          status: "hashing",
          concurrency: INITIAL_CONCURRENCY,
          retryCount: 0,
        };
      });

      setTasks((current) => {
        const next = [...nextTasks, ...current];
        tasksRef.current = next;
        return next;
      });
      setHint("已加入上传队列，正在按切片并发上传。");

      for (const task of nextTasks) {
        void startTask(task.taskId, task);
      }
    },
    [startTask],
  );

  const pauseTask = React.useCallback(
    (taskId: string) => {
      const control = controlsRef.current[taskId];
      if (control) {
        control.paused = true;
      }

      updateTask(taskId, (task) => {
        const next = { ...task, status: "paused" as const };
        persistTask(next);
        return next;
      });
    },
    [persistTask, updateTask],
  );

  const resumeTask = React.useCallback(
    (taskId: string) => {
      controlsRef.current[taskId] = { paused: false, canceled: false };
      updateTask(taskId, (task) => ({ ...task, status: "uploading", error: undefined }));
      void startTask(taskId);
    },
    [startTask, updateTask],
  );

  const retryTask = React.useCallback(
    (taskId: string) => {
      controlsRef.current[taskId] = { paused: false, canceled: false };
      updateTask(taskId, (task) => ({ ...task, status: "uploading", error: undefined, retryCount: 0 }));
      void startTask(taskId);
    },
    [startTask, updateTask],
  );

  const removeTaskById = React.useCallback((taskId: string) => {
    const control = controlsRef.current[taskId];
    if (control) {
      control.canceled = true;
    }
    removeSession(taskId);
    setTasks((current) => {
      const next = current.filter((task) => task.taskId !== taskId);
      tasksRef.current = next;
      return next;
    });
  }, []);

  const openPicker = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  const activeTasks = tasks.filter((task) => task.status !== "completed").length;

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">课程资源上传</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            onChange={(event) => {
              void handleFilesSelected(event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <Button type="button" size="sm" onClick={openPicker}>
            <Upload className="size-4" />
            上传文件
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground">暂无上传任务，支持一次选择多个文件。</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.taskId} className="space-y-2 rounded-lg border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{task.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.ceil(task.fileSize / 1024 / 1024)} MB · 分片 {task.totalChunks} · 并发 {task.concurrency}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {task.status === "uploading" || task.status === "hashing" || task.status === "merging" ? (
                    <Button type="button" size="icon-xs" variant="ghost" onClick={() => pauseTask(task.taskId)}>
                      <Pause className="size-4" />
                    </Button>
                  ) : null}
                  {task.status === "paused" ? (
                    <Button type="button" size="icon-xs" variant="ghost" onClick={() => resumeTask(task.taskId)}>
                      <Play className="size-4" />
                    </Button>
                  ) : null}
                  {task.status === "failed" ? (
                    <Button type="button" size="icon-xs" variant="ghost" onClick={() => retryTask(task.taskId)}>
                      <RefreshCw className="size-4" />
                    </Button>
                  ) : null}
                  <Button type="button" size="icon-xs" variant="ghost" onClick={() => removeTaskById(task.taskId)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${task.progress}%` }} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                    task.status === "completed" && "bg-primary/10 text-primary",
                    task.status === "failed" && "bg-destructive/10 text-destructive",
                    task.status === "uploading" && "bg-blue-100/60 text-blue-700",
                    task.status === "hashing" && "bg-amber-100/60 text-amber-700",
                    task.status === "paused" && "bg-muted text-muted-foreground",
                    task.status === "merging" && "bg-violet-100/60 text-violet-700",
                  )}
                >
                  {(task.status === "hashing" || task.status === "uploading" || task.status === "merging") && (
                    <Loader2 className="size-3 animate-spin" />
                  )}
                  {task.status === "hashing" && "计算文件指纹"}
                  {task.status === "uploading" && `上传中 ${task.progress}%`}
                  {task.status === "paused" && "已暂停"}
                  {task.status === "merging" && "合并处理中"}
                  {task.status === "completed" && "上传完成"}
                  {task.status === "failed" && "上传失败"}
                </span>
                <span className="text-muted-foreground">
                  已完成分片 {task.uploadedParts.length}/{task.totalChunks}
                </span>
              </div>

              {task.error ? <p className="text-xs text-destructive">{task.error}</p> : null}
            </div>
          ))}

          {activeTasks > 0 ? <p className="text-xs text-muted-foreground">当前活跃任务：{activeTasks}</p> : null}
        </div>
      )}
    </div>
  );
}
