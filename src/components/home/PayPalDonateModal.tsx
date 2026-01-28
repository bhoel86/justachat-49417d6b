import { useEffect, useRef } from "react";
import { Heart, X } from "lucide-react";
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
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!open || scriptLoaded.current) return;

    // Load PayPal SDK script
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=BAAfdN-Qpyz2Uxu733U-e9cNqvPfjxw-i2jMzk0zWSFICd4gCcnWts5Iqoy2X-GrVeg1cppMCjARbnj6lw&components=hosted-buttons&enable-funding=venmo&currency=USD";
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
      // Render PayPal button after script loads
      if (containerRef.current && (window as any).paypal) {
        (window as any).paypal.HostedButtons({
          hostedButtonId: "WNQPVMMUAPGL2",
        }).render(containerRef.current);
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [open]);

  // Re-render button when modal opens and script is already loaded
  useEffect(() => {
    if (open && scriptLoaded.current && containerRef.current) {
      containerRef.current.innerHTML = "";
      if ((window as any).paypal) {
        (window as any).paypal.HostedButtons({
          hostedButtonId: "WNQPVMMUAPGL2",
        }).render(containerRef.current);
      }
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" fill="currentColor" />
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
            id="paypal-container-WNQPVMMUAPGL2"
            className="w-full flex justify-center min-h-[50px]"
          />
          
          <p className="text-xs text-muted-foreground text-center">
            Payments processed securely via PayPal
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayPalDonateModal;
