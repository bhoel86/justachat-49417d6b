import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ProxyMethod = "GET" | "POST" | "DELETE";

interface ProxyAdminRequest {
  proxyUrl: string;
  adminToken?: string;
  path: string;
  method?: ProxyMethod;
  body?: unknown;
  timeoutMs?: number;
}

const ALLOWED_PATH =
  /^\/(status|connections|bans|geoip|allowlist|ban|unban|broadcast|kick|logs)(\/\d+)?(\?.*)?$/;

function normalizeProxyBase(proxyUrl: string): string {
  const url = new URL(proxyUrl);

  if (url.username || url.password) {
    throw new Error("Proxy URL must not include credentials");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Proxy URL must be http or https");
  }
  // Reduce SSRF surface: only allow common public ports.
  // We support:
  // - direct admin API on :6680
  // - HTTPS reverse proxy on :443 (e.g., Caddy/Nginx fronting :6680)
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  const allowedPorts = new Set(["443", "80", "6680"]);
  if (!allowedPorts.has(port)) {
    throw new Error("Proxy URL must use port 443, 80, or 6680");
  }

  // Block obvious local/private targets when the user provides an IP literal.
  // (If a hostname resolves to private IP via DNS, we can't reliably detect that
  // here without DNS resolution; this still blocks the most dangerous cases.)
  const host = url.hostname.toLowerCase();
  if (host === "localhost") {
    throw new Error("Proxy URL hostname must not be localhost");
  }
  const isIpv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  if (isIpv4) {
    const parts = host.split(".").map((n) => Number(n));
    const [a, b] = parts;
    const invalid = parts.some((n) => Number.isNaN(n) || n < 0 || n > 255);
    if (invalid) throw new Error("Invalid IP address in proxyUrl");
    const isPrivate =
      a === 10 ||
      a === 127 ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 169 && b === 254);
    if (isPrivate) {
      throw new Error("Proxy URL must not target private or loopback IPs");
    }
  }
  const isIpv6 = host.includes(":");
  if (isIpv6) {
    // Extremely conservative: reject common private/link-local/loopback prefixes.
    if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
      throw new Error("Proxy URL must not target private or loopback IPv6");
    }
  }

  if (url.pathname && url.pathname !== "/") {
    throw new Error("Proxy URL must not include a path");
  }
  if (url.hash || url.search) {
    throw new Error("Proxy URL must not include query/hash");
  }

  // Rebuild host with an explicit port only when it's non-default.
  const defaultPort = url.protocol === "https:" ? "443" : "80";
  const hostWithPort = port === defaultPort ? url.hostname : `${url.hostname}:${port}`;
  return `${url.protocol}//${hostWithPort}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isOwner } = await serviceClient.rpc("is_owner", { _user_id: user.id });
    const { data: isAdmin } = await serviceClient.rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ProxyAdminRequest = await req.json();
    const proxyUrl = (body.proxyUrl || "").trim();
    const path = (body.path || "").trim();
    const method = (body.method || "GET").toUpperCase() as ProxyMethod;
    const timeoutMs = Math.min(Math.max(body.timeoutMs ?? 8000, 1000), 20000);

    if (!proxyUrl) {
      return new Response(JSON.stringify({ error: "proxyUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!path.startsWith("/")) {
      return new Response(JSON.stringify({ error: "path must start with /" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_PATH.test(path)) {
      return new Response(JSON.stringify({ error: "path not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!(["GET", "POST", "DELETE"] as ProxyMethod[]).includes(method)) {
      return new Response(JSON.stringify({ error: "method not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base = normalizeProxyBase(proxyUrl);
    const url = `${base}${path}`;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {};
      if (body.adminToken) headers.Authorization = `Bearer ${body.adminToken}`;

      let fetchBody: string | undefined;
      if (body.body !== undefined && method !== "GET") {
        headers["Content-Type"] = "application/json";
        fetchBody = JSON.stringify(body.body);
      }

      const upstream = await fetch(url, {
        method,
        headers,
        body: fetchBody,
        signal: controller.signal,
      });

      const contentType = upstream.headers.get("content-type") || "";
      const text = await upstream.text();
      let data: unknown = text;
      if (contentType.includes("application/json")) {
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }
      }

      return new Response(
        JSON.stringify({
          ok: upstream.ok,
          status: upstream.status,
          statusText: upstream.statusText,
          data,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } finally {
      clearTimeout(t);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
