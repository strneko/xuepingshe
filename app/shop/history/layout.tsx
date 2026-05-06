import { Suspense } from "react";

export default function ShopHistoryLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="px-[10vw] py-8 text-sm text-muted-foreground">加载中...</div>}>{children}</Suspense>;
}
