import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    const r2Base = (process.env.R2_PUBLIC_BASE_URL || "https://pub-c5285a8590b045beb5f478d2bb3247aa.r2.dev").replace(/\/+$/, "");
    return [
      { source: "/media/:path*", destination: `${r2Base}/:path*` },
      { source: "/gorsel/partner/:file", destination: `${r2Base}/tml-motors/ads/:file` },
    ];
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
