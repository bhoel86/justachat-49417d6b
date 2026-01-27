import { useState, useEffect, useCallback } from 'react';
import { supabaseUntyped } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MinorStatus {
  isMinor: boolean;
  hasParentConsent: boolean;
  parentEmail: string | null;
  age: number | null;
}

export const useMinorRestrictions = (userId: string | null) => {
  const [minorStatus, setMinorStatus] = useState<MinorStatus>({
    isMinor: false,
    hasParentConsent: true,
    parentEmail: null,
    age: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchMinorStatus = async () => {
      try {
        const { data, error } = await supabaseUntyped
          .from('profiles')
          .select('is_minor, parent_consent_verified, parent_email, age')
          .eq('user_id', userId)
          .single();

        if (error) throw error;

        setMinorStatus({
          isMinor: data?.is_minor || false,
          hasParentConsent: data?.parent_consent_verified || false,
          parentEmail: data?.parent_email || null,
          age: data?.age || null,
        });
      } catch (error) {
        console.error('Error fetching minor status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMinorStatus();
  }, [userId]);

  // Check if user can access a restricted feature
  const canAccessFeature = useCallback((featureName: string): boolean => {
    // If not a minor, allow everything
    if (!minorStatus.isMinor) return true;
    
    // If minor with consent, allow everything
    if (minorStatus.hasParentConsent) return true;
    
    // Minor without consent - restricted
    return false;
  }, [minorStatus.isMinor, minorStatus.hasParentConsent]);

  // Show restriction message
  const showRestrictionMessage = useCallback((featureName: string) => {
    toast.error('Feature Restricted', {
      description: `${featureName} requires parental consent for users under 18. Please ask your parent/guardian to verify their email.`,
      duration: 5000,
    });
  }, []);

  // Check and notify if restricted
  const checkAndNotify = useCallback((featureName: string): boolean => {
    const allowed = canAccessFeature(featureName);
    if (!allowed) {
      showRestrictionMessage(featureName);
    }
    return allowed;
  }, [canAccessFeature, showRestrictionMessage]);

  return {
    ...minorStatus,
    loading,
    canAccessFeature,
    showRestrictionMessage,
    checkAndNotify,
    isRestricted: minorStatus.isMinor && !minorStatus.hasParentConsent,
  };
};
