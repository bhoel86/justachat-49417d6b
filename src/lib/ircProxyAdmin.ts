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
