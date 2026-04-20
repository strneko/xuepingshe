"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserProfile, useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

type SubmitState = {
  email: string;
};

export default function AuthDialog() {
  const authDialogOpen = useAuthStore((state) => state.authDialogOpen);
  const closeAuthDialog = useAuthStore((state) => state.closeAuthDialog);
  const setUser = useAuthStore((state) => state.setUser);

  const [formState, setFormState] = React.useState<SubmitState>({ email: "" });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!authDialogOpen) {
      setFormState({ email: "" });
    }
  }, [authDialogOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const data = (await response.json()) as { user?: UserProfile; message?: string };

      if (!response.ok) {
        toast.error(data.message ?? "认证失败");
        return;
      }

      if (data.user) {
        setUser(data.user);
        closeAuthDialog();
        toast.success("登录成功");
      }
    } catch {
      toast.error("网络请求失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={authDialogOpen} onOpenChange={(open) => (open ? undefined : closeAuthDialog())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>邮箱登录</DialogTitle>
          <DialogDescription>未注册邮箱会自动创建账号并登录。</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="邮箱"
            value={formState.email}
            onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
            required
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "处理中..." : "登录"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
