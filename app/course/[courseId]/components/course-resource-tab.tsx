"use client";

import { Download, Trash2 } from "lucide-react";

import Pagination from "@/components/pagination";
import { Separator } from "@/components/ui/separator";

import CourseResourceUpload from "./course-resource-upload";
import { ResourceItem } from "../_types";

interface CourseResourceTabProps {
  courseId: string;
  pagedResources: ResourceItem[];
  totalResourcePages: number;
  currentPage: number;
  onUploaded: (item: ResourceItem) => void;
  onOpenResourceDownload: (resourceId: string) => void;
  onDeleteResourceItem: (resourceId: string) => void;
}

export default function CourseResourceTab({
  courseId,
  pagedResources,
  totalResourcePages,
  currentPage,
  onUploaded,
  onOpenResourceDownload,
  onDeleteResourceItem,
}: CourseResourceTabProps) {
  return (
    <section id="course-resources" className="space-y-3">
      <CourseResourceUpload courseId={courseId} onUploaded={onUploaded} />

      {pagedResources.map((item, index) => (
        <div key={item.id} className="space-y-2">
          <div className="group flex items-start gap-3 rounded-lg border border-transparent px-3 py-2 transition-all duration-200 hover:border-border hover:bg-muted/60 hover:shadow-sm">
            <button
              type="button"
              onClick={() => onOpenResourceDownload(item.id)}
              className="flex min-w-0 flex-1 items-start justify-between gap-4 text-left focus-visible:outline-none"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="break-all text-sm font-medium leading-6 transition-colors group-hover:text-primary">
                    {item.name}
                  </p>
                  <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>
                <p className="text-xs text-muted-foreground">{item.type}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                {item.updatedAt}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteResourceItem(item.id)}
              className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              aria-label={`删除资源 ${item.name}`}
              title="删除资源"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {index < pagedResources.length - 1 ? <Separator className="mt-3" /> : null}
        </div>
      ))}

      {totalResourcePages > 1 ? (
        <Pagination currentPage={currentPage} totalPages={totalResourcePages} pageParam="page" />
      ) : null}
    </section>
  );
}
