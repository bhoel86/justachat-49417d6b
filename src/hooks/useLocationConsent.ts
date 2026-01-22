import { useState, useEffect, useCallback } from "react";

const CONSENT_KEY = "location_consent";
const CONSENT_TIMESTAMP_KEY = "location_consent_timestamp";

type ConsentStatus = "pending" | "granted" | "denied";

export const useLocationConsent = () => {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>("pending");
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  // Check stored consent on mount
  useEffect(() => {
    const storedConsent = localStorage.getItem(CONSENT_KEY);
    const consentTimestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY);
    
    if (storedConsent === "granted" || storedConsent === "denied") {
      // Check if consent is older than 365 days (re-prompt annually)
      if (consentTimestamp) {
        const consentDate = new Date(consentTimestamp);
        const now = new Date();
        const daysSinceConsent = (now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceConsent > 365) {
          // Consent expired, need to re-prompt
          setConsentStatus("pending");
          return;
        }
      }
      
      setConsentStatus(storedConsent as ConsentStatus);
    }
  }, []);

  const promptForConsent = useCallback(() => {
    if (consentStatus === "pending") {
      setShowConsentDialog(true);
    }
  }, [consentStatus]);

  const grantConsent = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "granted");
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());
    setConsentStatus("granted");
    setShowConsentDialog(false);
  }, []);

  const denyConsent = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "denied");
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());
    setConsentStatus("denied");
    setShowConsentDialog(false);
  }, []);

  const resetConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
    setConsentStatus("pending");
  }, []);

  return {
    consentStatus,
    showConsentDialog,
    promptForConsent,
    grantConsent,
    denyConsent,
    resetConsent,
    hasConsent: consentStatus === "granted",
  };
};
