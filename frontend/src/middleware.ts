// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper to decode JWT and extract role (works for simple JWTs, not encrypted)
function getUserRoleFromToken(token?: string): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
    return decoded.role || null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const { pathname } = req.nextUrl;
  const role = getUserRoleFromToken(token);

  // Not logged in, block all protected pages
  if (!token && (pathname.startsWith("/brand") || pathname.startsWith("/influencer") || pathname.startsWith("/manager"))) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  // Prevent users from accessing other roles' pages
  if (token) {
    if (pathname.startsWith("/brand") && role !== "brand") {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
    }
    if (pathname.startsWith("/influencer") && role !== "influencer") {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
    }
    if (pathname.startsWith("/manager") && role !== "manager") {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
    }
  }

  // Logged in and trying to access signin/signup => redirect to their dashboard
  if (token && (pathname === "/signin" || pathname === "/signup/")) {
    if (role === "brand") return NextResponse.redirect(new URL("/brand/dashboard", req.url));
    if (role === "influencer") return NextResponse.redirect(new URL("/influencer/dashboard", req.url));
    if (role === "manager") return NextResponse.redirect(new URL("/manager/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/brand/:path*",
    "/influencer/:path*",
    "/manager/:path*",
    "/signin",
    "/signup/:path*",
  ],
};
