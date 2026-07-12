import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname !== "/app") {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent") || "";
  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);

  if (!isMobile) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/mobile";

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/app"],
};