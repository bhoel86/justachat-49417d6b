import { supabase } from "@/integrations/supabase/client";

export type ProxyAdminMethod = "GET" | "POST" | "DELETE";

export interface ProxyAdminRelayResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText?: string;
  data?: T;
  error?: string;
}

export async function proxyAdminRequest<T = unknown>(args: {
  proxyUrl: string;
  adminToken?: string;
  path: string;
  method?: ProxyAdminMethod;
  body?: unknown;
  timeoutMs?: number;
}): Promise<ProxyAdminRelayResponse<T>> {
  // Always use the backend relay when running in the browser.
  // Many hosted previews run inside an iframe / strict CSP that can block
  // cross-origin fetches (which shows up as "NetworkError" / "Failed to fetch").
  // The relay keeps the frontend stable and avoids CSP/CORS/mixed-content issues.
  const isBrowser = typeof window !== "undefined";
  if (!isBrowser) {
    // Non-browser environments (tests/tools) can still attempt direct calls.
    try {
      const u = new URL(args.proxyUrl);
      if (u.protocol === "https:") {
        const base = args.proxyUrl.replace(/\/+$/, "");
        const url = `${base}${args.path}`;
        const method = (args.method ?? "GET") as ProxyAdminMethod;

        const headers: Record<string, string> = {};
        if (args.adminToken) headers.Authorization = `Bearer ${args.adminToken}`;

        let body: string | undefined;
        if (args.body !== undefined && method !== "GET") {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify(args.body);
        }

        const res = await fetch(url, { method, headers, body });
        const contentType = res.headers.get("content-type") || "";
        const text = await res.text();
        const data = contentType.includes("application/json")
          ? (text ? (JSON.parse(text) as T) : (null as unknown as T))
          : ((text as unknown) as T);

        return {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          data,
        };
      }
    } catch {
      // fall through to relay
    }
  }

  const { data, error } = await supabase.functions.invoke("irc-proxy-admin", {
    body: {
      proxyUrl: args.proxyUrl,
      adminToken: args.adminToken,
      path: args.path,
      method: args.method ?? "GET",
      body: args.body,
      timeoutMs: args.timeoutMs,
    },
  });

  if (error) {
    const anyErr = error as unknown as {
      message?: string;
      status?: number;
      context?: { status?: number; statusText?: string; body?: unknown };
    };
    return {
      ok: false,
      status: anyErr.status ?? anyErr.context?.status ?? 0,
      statusText: anyErr.context?.statusText,
      data: anyErr.context?.body as T | undefined,
      error: anyErr.message ?? "Request failed",
    };
  }

  return data as ProxyAdminRelayResponse<T>;
}
