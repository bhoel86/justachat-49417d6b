-- Remove the INSERT policy that allows any user to create audit logs
DROP POLICY IF EXISTS "Users can create audit logs" ON public.audit_logs;

-- Create a policy that only allows service role to insert audit logs
-- This ensures audit logs can only be created through trusted backend functions
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also add a policy so admins/owners can view all audit logs (currently exists but let's ensure it's correct)
DROP POLICY IF EXISTS "Owners can view audit logs" ON public.audit_logs;
CREATE POLICY "Owners can view audit logs"
ON public.audit_logs
FOR SELECT
USING (is_owner(auth.uid()));