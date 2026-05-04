"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Pagination from "@/components/pagination";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type RedeemOrderItem = {
  id: string;
  productName: string;
  pointsSpent: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  status: "SUCCESS" | "CANCELED";
  createdAt: string;
};

type HistoryResult = {
  items?: RedeemOrderItem[];
  total?: number;
  currentPage?: number;
  totalPages?: number;
  message?: string;
};

export default function ShopHistoryPage() {
  const searchParams = useSearchParams();
  const rawPage = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;

  const [data, setData] = useState<{
    items: RedeemOrderItem[];
    total: number;
    totalPages: number;
  }>({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/shop/history?page=${currentPage}&pageSize=10`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setData({ items: [], total: 0, totalPages: 1 });
          return;
        }

        const result = (await response.json()) as HistoryResult;
        setData({
          items: result.items ?? [],
          total: result.total ?? 0,
          totalPages: result.totalPages ?? 1,
        });
      } catch {
        if (!controller.signal.aborted) {
          toast.error("加载兑换记录失败");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [currentPage]);

  return (
    <main className="px-[10vw] py-8">
      <div className="mb-4 flex items-center gap-4">
        <Link href="/shop">
          <Button type="button" variant="ghost" size="sm">
            <ArrowLeft className="size-4 mr-1" />
            返回积分商城
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">兑换记录</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border px-4 py-3">
                  <Skeleton className="size-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              暂无兑换记录
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.pointsSpent} 积分 · 收件人：{item.receiverName} · {item.receiverPhone}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">地址：{item.receiverAddress}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <Badge variant={item.status === "SUCCESS" ? "default" : "secondary"} className="shrink-0">
                    {item.status === "SUCCESS" ? "已兑换" : "已取消"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <Pagination currentPage={currentPage} totalPages={data.totalPages} />
        </CardContent>
      </Card>
    </main>
  );
}
