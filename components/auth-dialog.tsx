"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserProfile, useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

type AuthMode = "login" | "register" | "registered";

interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

const initialLoginForm: LoginFormState = {
  email: "",
  password: "",
  rememberMe: false,
};

const initialRegisterForm: RegisterFormState = {
  email: "",
  password: "",
  confirmPassword: "",
};

export default function AuthDialog() {
  const authDialogOpen = useAuthStore((state) => state.authDialogOpen);
  const closeAuthDialog = useAuthStore((state) => state.closeAuthDialog);
  const setUser = useAuthStore((state) => state.setUser);

  const [mode, setMode] = React.useState<AuthMode>("login");
  const [loginForm, setLoginForm] = React.useState<LoginFormState>(initialLoginForm);
  const [registerForm, setRegisterForm] = React.useState<RegisterFormState>(initialRegisterForm);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState("");

  const resetForms = React.useCallback(() => {
    setLoginForm(initialLoginForm);
    setRegisterForm(initialRegisterForm);
    setRegisteredEmail("");
  }, []);

  React.useEffect(() => {
    if (!authDialogOpen) {
      resetForms();
      setMode("login");
    }
  }, [authDialogOpen, resetForms]);

  const switchToRegister = () => {
    setMode("register");
    setIsSubmitting(false);
  };

  const switchToLogin = () => {
    setMode("login");
    setIsSubmitting(false);
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!loginForm.email || !loginForm.password) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
          rememberMe: loginForm.rememberMe,
        }),
      });

      const data = (await response.json()) as { user?: UserProfile; message?: string };

      if (!response.ok) {
        toast.error(data.message ?? "登录失败");
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

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
      return;
    }

    if (registerForm.password.length < 6) {
      toast.error("密码至少需要 6 位");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
        }),
      });

      const data = (await response.json()) as { message?: string; email?: string };

      if (!response.ok) {
        toast.error(data.message ?? "注册失败");
        return;
      }

      setRegisteredEmail(data.email ?? registerForm.email);
      setMode("registered");
      toast.success("注册成功");
    } catch {
      toast.error("网络请求失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={authDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeAuthDialog();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {mode === "registered" ? (
          <>
            <DialogHeader>
              <DialogTitle>注册成功</DialogTitle>
              <DialogDescription>
                验证邮件已发送至 <span className="font-medium text-foreground">{registeredEmail}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                请查收邮件并点击验证链接完成注册。验证后即可登录。
              </p>
              <p className="text-xs text-muted-foreground">
                开发环境请查看终端控制台中的验证链接。
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  closeAuthDialog();
                }}
              >
                关闭
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{mode === "login" ? "邮箱登录" : "注册账号"}</DialogTitle>
              <DialogDescription>
                {mode === "login" ? "登录后即可评价课程和参与社区讨论" : "注册后即可评价课程和参与社区讨论"}
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={mode === "login" ? handleLoginSubmit : handleRegisterSubmit}
            >
              <div className="space-y-2">
                <Label htmlFor="auth-email">邮箱</Label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="请输入邮箱"
                  autoComplete="email"
                  value={mode === "login" ? loginForm.email : registerForm.email}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (mode === "login") {
                      setLoginForm((prev) => ({ ...prev, email: value }));
                    } else {
                      setRegisterForm((prev) => ({ ...prev, email: value }));
                    }
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-password">密码</Label>
                <Input
                  id="auth-password"
                  type="password"
                  placeholder={mode === "register" ? "至少 6 位" : "请输入密码"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={mode === "login" ? loginForm.password : registerForm.password}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (mode === "login") {
                      setLoginForm((prev) => ({ ...prev, password: value }));
                    } else {
                      setRegisterForm((prev) => ({ ...prev, password: value }));
                    }
                  }}
                  required
                />
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="auth-confirm-password">确认密码</Label>
                  <Input
                    id="auth-confirm-password"
                    type="password"
                    placeholder="请再次输入密码"
                    autoComplete="new-password"
                    value={registerForm.confirmPassword}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                    }
                    required
                  />
                </div>
              )}

              {mode === "login" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="auth-remember-me"
                    checked={loginForm.rememberMe}
                    onCheckedChange={(checked) =>
                      setLoginForm((prev) => ({ ...prev, rememberMe: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="auth-remember-me" className="text-sm font-normal cursor-pointer">
                    记住我（30 天内免登录）
                  </Label>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? "处理中..."
                  : mode === "login"
                    ? "登录"
                    : "注册"}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <p>
                  没有账号？{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-4"
                    onClick={switchToRegister}
                  >
                    去注册
                  </button>
                </p>
              ) : (
                <p>
                  已有账号？{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-4"
                    onClick={switchToLogin}
                  >
                    去登录
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
