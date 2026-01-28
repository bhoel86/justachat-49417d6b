import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

declare global {
  interface Window {
    paypal?: any;
    __paypalHostedButtonsSdkPromise?: Promise<void>;
  }
}

const PAYPAL_HOSTED_BUTTON_ID = "LGBCRRXBZ9M5E";
const PAYPAL_SDK_SRC =
  "https://www.paypal.com/sdk/js?client-id=BAAfdN-Qpyz2Uxu733U-e9cNqvPfjxw-i2jMzk0zWSFICd4gCcnWts5Iqoy2X-GrVeg1cppMCjARbnj6lw&components=hosted-buttons&enable-funding=venmo&currency=USD";
const PAYPAL_SDK_SCRIPT_ID = "paypal-hosted-buttons-sdk";
const PAYPAL_POLL_INTERVAL_MS = 250;
const PAYPAL_MAX_WAIT_MS = 15000;

const loadPayPalHostedButtonsSdk = () => {
  if (window.paypal?.HostedButtons) return Promise.resolve();

  if (!window.__paypalHostedButtonsSdkPromise) {
    window.__paypalHostedButtonsSdkPromise = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById(PAYPAL_SDK_SCRIPT_ID) as
        | HTMLScriptElement
        | null;

      if (existing) {
        // If it already loaded successfully but HostedButtons isn't attached yet, polling will handle it.
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("PayPal SDK failed to load")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.id = PAYPAL_SDK_SCRIPT_ID;
      script.src = PAYPAL_SDK_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("PayPal SDK failed to load"));
      document.head.appendChild(script);
    });
  }

  return window.__paypalHostedButtonsSdkPromise;
};

interface PayPalDonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PayPalDonateModal = ({ open, onOpenChange }: PayPalDonateModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      renderedRef.current = false;
      return;
    }

    // Clear container when opening
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
    renderedRef.current = false;
    
    setStatus("loading");

    let cancelled = false;
    let pollId: number | undefined;
    let timeoutId: number | undefined;

    const cleanup = () => {
      if (pollId) window.clearInterval(pollId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };

    const tryRender = () => {
      const paypal = window.paypal;
      if (!paypal?.HostedButtons || !containerRef.current || renderedRef.current) return false;

      try {
        paypal
          .HostedButtons({
            hostedButtonId: PAYPAL_HOSTED_BUTTON_ID,
          })
          .render(containerRef.current);
        renderedRef.current = true;
        setStatus("ready");
        console.info("[PayPal] Hosted button rendered");
        return true;
      } catch (e) {
        console.error("[PayPal] Render error:", e);
        setStatus("error");
        return false;
      }
    };

    // Start polling immediately; SDK load + HostedButtons attach can be slightly delayed.
    pollId = window.setInterval(() => {
      if (cancelled) return;
      if (tryRender()) cleanup();
    }, PAYPAL_POLL_INTERVAL_MS);

    timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      if (!renderedRef.current) {
        console.error("[PayPal] Timed out waiting for HostedButtons");
        setStatus("error");
      }
      cleanup();
    }, PAYPAL_MAX_WAIT_MS);

    // Ensure the correct SDK is present (only injected once per app session).
    loadPayPalHostedButtonsSdk()
      .then(() => {
        if (cancelled) return;
        // Try immediately after load, without waiting for next interval tick.
        tryRender();
      })
      .catch((e) => {
        console.error("[PayPal] SDK load error:", e);
        if (!cancelled) setStatus("error");
        cleanup();
      });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-primary" fill="currentColor" />
            Support Justachat™
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Your donation helps keep Justachat running and ad-free. Thank you for your support! ❤️
          </p>
          
          {/* PayPal Button Container - pass element directly, not selector */}
          <div ref={containerRef} style={{ minWidth: 250, minHeight: 50 }} />

          {status === "loading" && (
            <p className="text-xs text-muted-foreground">Loading PayPal…</p>
          )}
          {status === "error" && (
            <p className="text-xs text-destructive">
              PayPal failed to load. Please disable ad-blockers and try again.
            </p>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            Payments processed securely via PayPal
          </p>
          
          {status === "ready" && (
            <a
              href="https://www.paypal.com/signout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary underline"
              onClick={() => {
                // Close modal so user can re-open after signing out
                onOpenChange(false);
              }}
            >
              Use a different PayPal account
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayPalDonateModal;
