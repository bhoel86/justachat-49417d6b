import { useEffect, useMemo, useRef, useState } from "react";
import { Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PayPalDonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PayPalDonateModal = ({ open, onOpenChange }: PayPalDonateModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const hostedButtonId = "LGBCRRXBZ9M5E";
  const containerId = useMemo(() => `paypal-container-${hostedButtonId}`, [hostedButtonId]);
  const sdkSrc =
    "https://www.paypal.com/sdk/js?client-id=BAAfdN-Qpyz2Uxu733U-e9cNqvPfjxw-i2jMzk0zWSFICd4gCcnWts5Iqoy2X-GrVeg1cppMCjARbnj6lw&components=hosted-buttons&enable-funding=venmo&currency=USD";

  const renderHostedButton = async () => {
    const paypal = (window as any).paypal;
    if (!paypal?.HostedButtons) {
      throw new Error("PayPal SDK not ready");
    }
    // PayPal's HostedButtons expects a selector string like "#paypal-container-..."
    // (matches the code snippet from PayPal's button embed).
    await paypal
      .HostedButtons({ hostedButtonId })
      .render(`#${containerId}`);
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setStatus("loading");

    const logPrefix = "[PayPalDonateModal]";
    const ensureAndRender = async () => {
      try {
        // Clear old content first (PayPal renders inside the container)
        if (containerRef.current) containerRef.current.innerHTML = "";

        // If SDK already present, render immediately.
        if ((window as any).paypal?.HostedButtons) {
          console.log(logPrefix, "SDK already present; rendering hosted button...");
          await renderHostedButton();
          if (!cancelled) setStatus("ready");
          return;
        }

        // Load SDK once (persist it globally; don't remove it on close)
        const existing = document.querySelector<HTMLScriptElement>(
          `script[data-paypal-sdk="hosted-buttons"]`
        );

        const handleLoaded = async () => {
          try {
            console.log(logPrefix, "SDK loaded; rendering hosted button...");
            await renderHostedButton();
            if (!cancelled) setStatus("ready");
          } catch (e) {
            console.error(logPrefix, "Render failed", e);
            if (!cancelled) setStatus("error");
          }
        };

        if (existing) {
          console.log(logPrefix, "SDK script tag exists; waiting for SDK...");
          // If the script exists but window.paypal isn't ready yet, wait a moment.
          const start = Date.now();
          const timer = window.setInterval(() => {
            if ((window as any).paypal?.HostedButtons) {
              window.clearInterval(timer);
              void handleLoaded();
              return;
            }
            if (Date.now() - start > 8000) {
              window.clearInterval(timer);
              console.error(logPrefix, "Timed out waiting for SDK");
              if (!cancelled) setStatus("error");
            }
          }, 200);
          return;
        }

        console.log(logPrefix, "Injecting SDK script...");
        const script = document.createElement("script");
        script.setAttribute("data-paypal-sdk", "hosted-buttons");
        script.src = sdkSrc;
        script.async = true;
        script.onload = () => {
          void handleLoaded();
        };
        script.onerror = (e) => {
          console.error(logPrefix, "SDK failed to load", e);
          if (!cancelled) setStatus("error");
        };
        document.head.appendChild(script);
      } catch (e) {
        console.error(logPrefix, "Unexpected error", e);
        if (!cancelled) setStatus("error");
      }
    };

    void ensureAndRender();

    return () => {
      cancelled = true;
    };
  }, [open, sdkSrc, containerId]);

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
          
          {/* PayPal Button Container */}
          <div 
            ref={containerRef} 
            id={containerId}
            className="w-full flex justify-center min-h-[50px]"
          />

          {status === "loading" && (
            <p className="text-xs text-muted-foreground text-center">Loading PayPal…</p>
          )}
          {status === "error" && (
            <p className="text-xs text-muted-foreground text-center">
              PayPal didn’t load in this popup. Please disable any ad-blocker for PayPal and try again.
            </p>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            Payments processed securely via PayPal
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayPalDonateModal;
