"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ShopProduct = {
  id: string;
  name: string;
  needPoints: number;
  cover: string;
};

const myPoints = 380;

const products: ShopProduct[] = [
  { id: "p1", name: "校园文创帆布袋", needPoints: 120, cover: "帆布袋" },
  { id: "p2", name: "联名马克杯", needPoints: 180, cover: "马克杯" },
  { id: "p3", name: "学评社限定徽章", needPoints: 80, cover: "徽章" },
  { id: "p4", name: "无线鼠标", needPoints: 420, cover: "无线鼠标" },
  { id: "p5", name: "便携保温杯", needPoints: 260, cover: "保温杯" },
  { id: "p6", name: "机械键盘", needPoints: 680, cover: "机械键盘" },
  { id: "p7", name: "课程资料礼包", needPoints: 300, cover: "资料礼包" },
  { id: "p8", name: "降噪耳机", needPoints: 980, cover: "降噪耳机" },
];

export default function ShopPage() {
  const [onlyExchangeable, setOnlyExchangeable] = useState(false);

  const visibleProducts = useMemo(() => {
    if (!onlyExchangeable) {
      return products;
    }
    return products.filter((item) => item.needPoints <= myPoints);
  }, [onlyExchangeable]);

  return (
    <main className="p-[10vw] pt-8">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-xl">积分兑换中心</CardTitle>
            <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              我的积分: {myPoints}
            </div>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <Checkbox checked={onlyExchangeable} onCheckedChange={(value) => setOnlyExchangeable(Boolean(value))} />
              我能兑换的商品
            </label>
          </div>
        </CardHeader>
      </Card>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visibleProducts.map((product) => {
          const canExchange = myPoints >= product.needPoints;

          return (
            <Card key={product.id} className="py-0 overflow-hidden">
              <CardContent className="p-4">
                <div className="relative rounded-lg  bg-muted/30 p-3">
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                    {product.needPoints} 积分
                  </span>
                  <div className="mx-auto mt-8 flex aspect-square w-full max-w-45 items-center justify-center rounded-md bg-linear-to-br from-slate-100 to-slate-200 text-sm font-medium text-slate-700">
                    {product.cover}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
                  <Button className="w-full" disabled={!canExchange}>
                    {canExchange ? "立即兑换" : "积分不足"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {visibleProducts.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          当前积分下暂无可兑换商品
        </div>
      ) : null}
    </main>
  );
}
