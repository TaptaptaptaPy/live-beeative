import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /owner routes (except /owner/login)
  if (pathname.startsWith("/owner") && pathname !== "/owner/login") {
    const token = request.cookies.get("session")?.value;
    const session = await decrypt(token);

    if (!session || session.role !== "OWNER") {
      return NextResponse.redirect(new URL("/owner/login", request.url));
    }
  }

  // Protect /entry route - need employee session
  if (pathname === "/entry") {
    const token = request.cookies.get("session")?.value;
    const session = await decrypt(token);

    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/entry"],
};
