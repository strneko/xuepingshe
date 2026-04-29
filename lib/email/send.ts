import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`;
  let from = "学评社 <noreply@xuepingshe.com>";
  if (process.env.NODE_ENV === "development") {
    to = "1058704069@qq.com";
    from = "onboarding@resend.dev";
  }
  if (resend) {
    await resend.emails.send({
      from,
      to,
      subject: "请验证你的学评社账号邮箱",
      html: `
        <p>感谢注册学评社！</p>
        <p>请点击下方链接验证你的邮箱地址（24小时内有效）：</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>如果这不是你发起的注册，请忽略此邮件。</p>
      `,
    });
  } else {
    console.log(`\n[DEV] 验证链接 for ${to}: ${verifyUrl}\n`);
  }
}
