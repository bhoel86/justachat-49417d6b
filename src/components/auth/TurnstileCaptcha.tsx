import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

// Public site key - safe to include in frontend code
const TURNSTILE_SITE_KEY = "0x4AAAAAACOiFpPhbwbXyjHK";

const TurnstileCaptcha = ({ onVerify, onError, onExpire }: TurnstileCaptchaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: onVerify,
      "error-callback": onError,
      "expired-callback": onExpire,
      theme: "dark",
      size: "normal",
    });
  }, [onVerify, onError, onExpire]);

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        renderWidget();
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    } else {
      // Script is loading, wait for it
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          renderWidget();
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  if (!TURNSTILE_SITE_KEY) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        CAPTCHA not configured
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
    </div>
  );
};

export default TurnstileCaptcha;
