import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //  启用严格模式 (开发环境)
  reactStrictMode: true,

  // 编译器优化
  compiler: {
    // 移除 console.log (生产环境)
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
