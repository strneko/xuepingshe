import nodemailer from "nodemailer";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

function createTransport() {
  // QQ / 163 / Gmail etc. — configure via env vars
  const host = process.env.SMTP_HOST ?? "smtp.qq.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`;
  const transport = createTransport();

  if (transport) {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER!,
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
