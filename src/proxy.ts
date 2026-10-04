import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000/api";
const AUTH_PAGES = ["/login", "/register"];
const PUBLIC_PAGES = [...AUTH_PAGES, "/verify-otp", "/forgot-password", "/reset-password", "/invite"];

const isPublic = (p: string) => PUBLIC_PAGES.some((x) => p === x || p.startsWith(`${x}/`));

type Refreshed = { setCookies: string[] } | null;
const inflight = new Map<string, Promise<Refreshed>>();

function refreshTokens(refreshToken: string, cookieHeader: string): Promise<Refreshed> {
  let p = inflight.get(refreshToken);
  if (!p) {
    p = fetch(`${API_URL}/v1/auth/refresh`, {
      method: "POST",
      headers: { cookie: cookieHeader },
      cache: "no-store",
    })
      .then((res) => (res.ok ? { setCookies: res.headers.getSetCookie() } : null))
      .catch(() => null)
      .finally(() => {
        setTimeout(() => inflight.delete(refreshToken), 5000);
      });
    inflight.set(refreshToken, p);
  }
  return p;
}

// rebuild the Cookie header with the freshly issued values
function mergeCookies(header: string, setCookies: string[]) {
  const jar = new Map<string, string>();
  for (const pair of header.split(/;\s*/)) {
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  for (const raw of setCookies) {
    const [pair] = raw.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1));
  }
  return Array.from(jar, ([k, v]) => `${k}=${v}`).join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const access = request.cookies.get("access_token")?.value;
  const refresh = request.cookies.get("refresh_token")?.value;

  if (isPublic(pathname)) {
    if (AUTH_PAGES.includes(pathname) && (access || refresh)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (access) return NextResponse.next();

  if (refresh) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const refreshed = await refreshTokens(refresh, cookieHeader);
    if (refreshed) {
      const headers = new Headers(request.headers);
      headers.set("cookie", mergeCookies(cookieHeader, refreshed.setCookies));
      const response = NextResponse.next({ request: { headers } });
      for (const c of refreshed.setCookies) response.headers.append("set-cookie", c);
      return response;
    }
  }

  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  return response;
}

export const config = {
  // skip /api (Nest guards it), Next internals and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
