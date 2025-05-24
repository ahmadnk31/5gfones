import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Handle locale routing first
  const response = handleI18nRouting(request);

  // Then update session on the response
  const supabaseResponse = await updateSession(request);

  // Copy cookies from supabase response to locale routing response
  if (response) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/(nl|en)/:path*"],
};
