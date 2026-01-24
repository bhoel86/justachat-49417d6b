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
    return { ok: false, status: 0, error: error.message };
  }

  return data as ProxyAdminRelayResponse<T>;
}
