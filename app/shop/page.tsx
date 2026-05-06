"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ShopProduct = {
  id: string;
  name: string;
  needPoints: number;
  cover: string;
  imageUrl: string | null;
  stock: number | null;
  isActive: boolean;
};

type ProductFormState = {
  name: string;
  needPoints: number;
  coverText: string;
  imageUrl: string;
  stock: string;
  isActive: boolean;
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

const initialProductForm: ProductFormState = {
  name: "",
  needPoints: 100,
  coverText: "",
  imageUrl: "",
  stock: "",
  isActive: true,
};

export default function ShopPage() {
  const router = useRouter();
  const [myPoints, setMyPoints] = useState(0);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [onlyExchangeable, setOnlyExchangeable] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<ShopProduct | null>(null);
  const [redeemForm, setRedeemForm] = useState<RedeemFormState>(initialRedeemForm);

  // Admin states
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(initialProductForm);
  const [productFormSubmitting, setProductFormSubmitting] = useState(false);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<ShopProduct | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

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
        isAdmin?: boolean;
      };

      if (!response.ok) {
        toast.error(payload.message ?? "加载积分商城失败");
        setProducts([]);
        return;
      }

      setMyPoints(payload.myPoints ?? 0);
      setProducts(payload.products ?? []);
      setIsAdminUser(Boolean(payload.isAdmin));
    } catch {
      toast.error("网络异常，请稍后重试");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleProducts = useMemo(() => {
    if (!onlyExchangeable) {
      return products;
    }
    return products.filter((item) => item.needPoints <= myPoints);
  }, [myPoints, onlyExchangeable, products]);

  // --- Redeem flow ---

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

  // --- Admin product management ---

  const openCreateProductForm = () => {
    setEditingProduct(null);
    setProductForm(initialProductForm);
    setProductFormOpen(true);
  };

  const openEditProductForm = (product: ShopProduct) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      needPoints: product.needPoints,
      coverText: product.cover !== product.name ? product.cover : "",
      imageUrl: product.imageUrl ?? "",
      stock: product.stock === null ? "" : String(product.stock),
      isActive: product.isActive,
    });
    setProductFormOpen(true);
  };

  const submitProductForm = async () => {
    const name = productForm.name.trim();
    const needPoints = productForm.needPoints;
    const coverText = productForm.coverText.trim() || undefined;
    const stockRaw = productForm.stock.trim();
    const stock = stockRaw ? Number(stockRaw) : undefined;
    const { isActive } = productForm;

    if (!name || !needPoints || needPoints <= 0) {
      toast.error("请完整填写名称和所需积分");
      return;
    }

    if (stockRaw && (!Number.isFinite(Number(stockRaw)) || Number(stockRaw) < 0)) {
      toast.error("库存需为非负整数");
      return;
    }

    setProductFormSubmitting(true);
    try {
      const isEdit = editingProduct !== null;
      const url = isEdit ? `/api/shop/products/${editingProduct!.id}` : "/api/shop/products";
      const method = isEdit ? "PATCH" : "POST";

      const body: Record<string, unknown> = { name, needPoints, isActive };
      if (coverText) {
        body.coverText = coverText;
      }
      const imageUrl = productForm.imageUrl.trim() || undefined;
      if (imageUrl) {
        body.imageUrl = imageUrl;
      }
      if (stock !== undefined && Number.isFinite(stock)) {
        body.stock = stock;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? (isEdit ? "更新失败" : "创建失败"));
        return;
      }

      toast.success(isEdit ? "商品已更新" : "商品已创建");
      setProductFormOpen(false);
      setEditingProduct(null);
      await loadShop();
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setProductFormSubmitting(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirmProduct || deletingProductId) {
      return;
    }

    setDeletingProductId(deleteConfirmProduct.id);
    try {
      const response = await fetch(`/api/shop/products/${deleteConfirmProduct.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "删除失败");
        return;
      }

      toast.success("商品已删除");
      setDeleteConfirmProduct(null);
      await loadShop();
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <main className="p-[10vw] pt-8">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-xl">积分兑换中心</CardTitle>
            {!isAdminUser ? (
              <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                我的积分: {myPoints}
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Checkbox checked={onlyExchangeable} onCheckedChange={(value) => setOnlyExchangeable(Boolean(value))} />
                我能兑换的商品
              </label>
              {isAdminUser ? (
                <Button type="button" size="sm" onClick={openCreateProductForm}>
                  <Plus className="size-4 mr-1" />
                  新增商品
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => router.push("/shop/history")}>
                  兑换记录
                </Button>
              )}
            </div>
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
          const canExchange = myPoints >= product.needPoints && stockAvailable && product.isActive;
          const isRedeeming = redeemingId === product.id;

          return (
            <Card key={product.id} className="py-0 overflow-hidden relative">
              <CardContent className="p-4">
                <div className="relative rounded-lg bg-muted/30 p-3">
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                    {product.needPoints} 积分
                  </span>
                  {!product.isActive ? (
                    <span className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] text-destructive-foreground">
                      已下架
                    </span>
                  ) : null}
                  <div className="mx-auto mt-8 flex aspect-square w-full max-w-45 items-center justify-center rounded-md bg-linear-to-br from-muted/50 to-muted overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-foreground/60">{product.cover}</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    库存：{product.stock === null ? "不限" : product.stock}
                  </p>
                  {isAdminUser ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditProductForm(product)}
                      >
                        <Pencil className="size-3.5 mr-1" />
                        编辑
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setDeleteConfirmProduct(product)}
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        删除
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      disabled={!canExchange || isRedeeming}
                      onClick={() => openRedeemConfirm(product)}
                    >
                      {isRedeeming ? "兑换中..." : canExchange ? "立即兑换" : !product.isActive ? "已下架" : stockAvailable ? "积分不足" : "已售罄"}
                    </Button>
                  )}
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

      {/* Redeem confirm dialog */}
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

      {/* Redeem form dialog */}
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

      {/* Product form dialog (admin) */}
      <Dialog
        open={productFormOpen}
        onOpenChange={(open) => {
          if (productFormSubmitting) {
            return;
          }
          setProductFormOpen(open);
          if (!open) {
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "编辑商品" : "新增商品"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "修改商品信息" : "添加一个新的兑换商品"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor="prod-name" className="text-xs">名称</Label>
              <Input
                id="prod-name"
                value={productForm.name}
                onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="商品名称"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prod-points" className="text-xs">所需积分</Label>
              <Input
                id="prod-points"
                type="number"
                value={productForm.needPoints}
                onChange={(e) => setProductForm((prev) => ({ ...prev, needPoints: Number(e.target.value) }))}
                min={1}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prod-cover" className="text-xs">封面文字（无图片时显示）</Label>
              <Input
                id="prod-cover"
                value={productForm.coverText}
                onChange={(e) => setProductForm((prev) => ({ ...prev, coverText: e.target.value }))}
                placeholder="显示在商品卡片上的文字"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prod-image" className="text-xs">封面图片 URL</Label>
              <Input
                id="prod-image"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.png"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prod-stock" className="text-xs">库存（留空表示不限）</Label>
              <Input
                id="prod-stock"
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm((prev) => ({ ...prev, stock: e.target.value }))}
                placeholder="留空为不限库存"
                min={0}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="prod-active"
                checked={productForm.isActive}
                onCheckedChange={(value) =>
                  setProductForm((prev) => ({ ...prev, isActive: Boolean(value) }))
                }
              />
              <Label htmlFor="prod-active" className="text-sm cursor-pointer">上架</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setProductFormOpen(false);
                setEditingProduct(null);
              }}
              disabled={productFormSubmitting}
            >
              取消
            </Button>
            <Button onClick={() => void submitProductForm()} disabled={productFormSubmitting}>
              {productFormSubmitting ? "提交中..." : editingProduct ? "保存修改" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog (admin) */}
      <Dialog open={Boolean(deleteConfirmProduct)} onOpenChange={(open) => !open && setDeleteConfirmProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确认要删除商品「{deleteConfirmProduct?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmProduct(null)}
              disabled={Boolean(deletingProductId)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDeleteProduct()}
              disabled={Boolean(deletingProductId)}
            >
              {deletingProductId ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
