import { type NextRequest, NextResponse } from "next/server";

/**
 * Hurtig, optimistisk tjek: uden sessionscookie sendes man direkte til login.
 * Den rigtige kontrol (gyldig session, rolle, adgang til sagen) sker på serveren i hver side.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("l360_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/raadgiver/:path*"],
};
