import { Resend } from "resend";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`;
  const resend = getResend();

  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "学评社 <noreply@xuepingshe.com>",
        to,
        subject: "请验证你的学评社账号邮箱",
        html: `
          <p>感谢注册学评社！</p>
          <p>请点击下方链接验证你的邮箱地址（24小时内有效）：</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>如果这不是你发起的注册，请忽略此邮件。</p>
        `,
      });
    } catch (err) {
      console.error("邮件发送失败:", (err as Error).message);
      console.log(`\n[FALLBACK] 验证链接 for ${to}: ${verifyUrl}\n`);
    }
  } else {
    console.log(`\n[DEV] 验证链接 for ${to}: ${verifyUrl}\n`);
  }
}
