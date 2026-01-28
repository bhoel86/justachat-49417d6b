import { useEffect, useRef, useState } from "react";
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
    
    setStatus("loading");

    const renderButton = () => {
      const paypal = (window as any).paypal;
      if (!paypal?.HostedButtons || !containerRef.current || renderedRef.current) return false;
      
      try {
        paypal.HostedButtons({
          hostedButtonId: "LGBCRRXBZ9M5E",
        }).render(containerRef.current);
        renderedRef.current = true;
        setStatus("ready");
        return true;
      } catch (e) {
        console.error("[PayPal] Render error:", e);
        setStatus("error");
        return false;
      }
    };

    // Check if SDK already loaded
    if ((window as any).paypal?.HostedButtons) {
      renderButton();
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (existingScript) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if ((window as any).paypal?.HostedButtons) {
          clearInterval(checkInterval);
          renderButton();
        }
      }, 100);
      setTimeout(() => clearInterval(checkInterval), 10000);
      return;
    }

    // Load the SDK
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=BAAfdN-Qpyz2Uxu733U-e9cNqvPfjxw-i2jMzk0zWSFICd4gCcnWts5Iqoy2X-GrVeg1cppMCjARbnj6lw&components=hosted-buttons&enable-funding=venmo&currency=USD";
    script.async = true;
    script.onload = () => {
      setTimeout(renderButton, 100);
    };
    script.onerror = () => {
      setStatus("error");
    };
    document.head.appendChild(script);
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayPalDonateModal;
