"use client";

import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ShopProduct = {
  id: string;
  name: string;
  needPoints: number;
  cover: string;
  stock: number | null;
};

type RedeemFormState = {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  remark: string;
};

const initialRedeemForm: RedeemFormState = {
  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
  remark: "",
};

export default function ShopPage() {
  const [myPoints, setMyPoints] = useState(0);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [onlyExchangeable, setOnlyExchangeable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<ShopProduct | null>(null);
  const [redeemForm, setRedeemForm] = useState<RedeemFormState>(initialRedeemForm);

  useEffect(() => {
    const loadShop = async () => {
      setLoading(true);

      try {
        const response = await fetch("/api/shop/products", {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
          myPoints?: number;
          products?: ShopProduct[];
        };

        if (!response.ok) {
          toast.error(payload.message ?? "加载积分商城失败");
          setProducts([]);
          return;
        }

        setMyPoints(payload.myPoints ?? 0);
        setProducts(payload.products ?? []);
      } catch {
        toast.error("网络异常，请稍后重试");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void loadShop();
  }, []);

  const visibleProducts = useMemo(() => {
    if (!onlyExchangeable) {
      return products;
    }
    return products.filter((item) => item.needPoints <= myPoints);
  }, [myPoints, onlyExchangeable, products]);

  const openRedeemConfirm = (product: ShopProduct) => {
    if (redeemingId) {
      return;
    }

    setPendingProduct(product);
    setConfirmDialogOpen(true);
  };

  const proceedToRedeemForm = () => {
    if (!pendingProduct) {
      return;
    }

    setConfirmDialogOpen(false);
    setFormDialogOpen(true);
  };

  const redeemProduct = async (product: ShopProduct, form: RedeemFormState) => {
    if (redeemingId) {
      return;
    }

    setRedeemingId(product.id);

    try {
      const response = await fetch("/api/shop/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          receiverName: form.receiverName,
          receiverPhone: form.receiverPhone,
          receiverAddress: form.receiverAddress,
          remark: form.remark,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        myPoints?: number;
        productId?: string;
        stock?: number | null;
      };

      if (!response.ok) {
        toast.error(payload.message ?? "兑换失败，请稍后重试");
        return;
      }

      setMyPoints(payload.myPoints ?? myPoints);
      setProducts((previous) =>
        previous.map((item) =>
          item.id === payload.productId
            ? { ...item, stock: typeof payload.stock === "number" ? payload.stock : null }
            : item,
        ),
      );
      toast.success(payload.message ?? "兑换成功");
      setFormDialogOpen(false);
      setPendingProduct(null);
      setRedeemForm(initialRedeemForm);
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setRedeemingId(null);
    }
  };

  const submitRedeemForm = async () => {
    if (!pendingProduct) {
      return;
    }

    const normalizedForm: RedeemFormState = {
      receiverName: redeemForm.receiverName.trim(),
      receiverPhone: redeemForm.receiverPhone.trim(),
      receiverAddress: redeemForm.receiverAddress.trim(),
      remark: redeemForm.remark.trim(),
    };

    if (!normalizedForm.receiverName || !normalizedForm.receiverPhone || !normalizedForm.receiverAddress) {
      toast.error("请完整填写收件人、手机号码和收件地");
      return;
    }

    const phonePattern = /^1\d{10}$/;
    if (!phonePattern.test(normalizedForm.receiverPhone)) {
      toast.error("请输入正确的 11 位手机号");
      return;
    }

    await redeemProduct(pendingProduct, normalizedForm);
  };

  const closeRedeemForm = () => {
    if (redeemingId) {
      return;
    }

    setFormDialogOpen(false);
    setPendingProduct(null);
    setRedeemForm(initialRedeemForm);
  };

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

      {loading ? (
        <div className="mt-6 rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          加载中...
        </div>
      ) : null}

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visibleProducts.map((product) => {
          const stockAvailable = product.stock === null || product.stock > 0;
          const canExchange = myPoints >= product.needPoints && stockAvailable;
          const isRedeeming = redeemingId === product.id;

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
                  <p className="text-xs text-muted-foreground">
                    库存：{product.stock === null ? "不限" : product.stock}
                  </p>
                  <Button
                    className="w-full"
                    disabled={!canExchange || isRedeeming}
                    onClick={() => openRedeemConfirm(product)}
                  >
                    {isRedeeming ? "兑换中..." : canExchange ? "立即兑换" : stockAvailable ? "积分不足" : "已售罄"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {!loading && visibleProducts.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          当前积分下暂无可兑换商品
        </div>
      ) : null}

      <Dialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          if (redeemingId) {
            return;
          }
          setConfirmDialogOpen(open);
          if (!open) {
            setPendingProduct(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认兑换</DialogTitle>
            <DialogDescription>
              确认要兑换 {pendingProduct?.name ?? "该商品"} 吗？将消耗 {pendingProduct?.needPoints ?? 0} 积分。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={Boolean(redeemingId)}>
              取消
            </Button>
            <Button onClick={proceedToRedeemForm} disabled={Boolean(redeemingId)}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          if (redeemingId) {
            return;
          }
          if (!open) {
            closeRedeemForm();
            return;
          }
          setFormDialogOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>填写收件信息</DialogTitle>
            <DialogDescription>请填写兑换商品的收件信息，提交后将立即扣除积分。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span>收件人</span>
              <Input
                value={redeemForm.receiverName}
                onChange={(event) => setRedeemForm((prev) => ({ ...prev, receiverName: event.target.value }))}
                placeholder="请输入收件人姓名"
                maxLength={30}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>手机号码</span>
              <Input
                value={redeemForm.receiverPhone}
                onChange={(event) => setRedeemForm((prev) => ({ ...prev, receiverPhone: event.target.value }))}
                placeholder="请输入 11 位手机号"
                maxLength={11}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>收件地</span>
              <Input
                value={redeemForm.receiverAddress}
                onChange={(event) => setRedeemForm((prev) => ({ ...prev, receiverAddress: event.target.value }))}
                placeholder="例如：广东省深圳市南山区..."
                maxLength={120}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>备注</span>
              <Textarea
                value={redeemForm.remark}
                onChange={(event) => setRedeemForm((prev) => ({ ...prev, remark: event.target.value }))}
                placeholder="可选填写配送时间偏好等"
                maxLength={300}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRedeemForm} disabled={Boolean(redeemingId)}>
              取消
            </Button>
            <Button onClick={() => void submitRedeemForm()} disabled={Boolean(redeemingId)}>
              {redeemingId ? "提交中..." : "提交兑换"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
